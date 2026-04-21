import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

if (!process.env.ANTHROPIC_API_KEY) throw new Error('Missing ANTHROPIC_API_KEY')
if (!process.env.VITE_SUPABASE_URL) throw new Error('Missing VITE_SUPABASE_URL')
if (!process.env.VITE_SUPABASE_ANON_KEY) throw new Error('Missing VITE_SUPABASE_ANON_KEY')

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase  = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

function sanitize(str, maxLen = 50) {
  if (typeof str !== 'string') return ''
  return str.replace(/[\n\r`]/g, ' ').slice(0, maxLen).trim()
}

const SYSTEM_PROMPT = `You are an elite performance coach reviewing a user's week. Your job is brutal honesty delivered with precision — not cruelty, not softness.

Rules:
- If completion rate < 70%: call out exactly which arenas underperformed and by how much. Be specific — say "You completed 1/5 Career tasks" not "Career needs work".
- Show the compounding cost: missed tasks are missed reps, missed reps are missed results.
- If completion > 85%: still find something to push on. Complacency kills momentum. Identify the next ceiling to break.
- End with exactly 3 numbered action items for next week — each one sentence, specific and measurable.
- Tone: halftime locker room. Direct. No filler phrases.

Respond ONLY with raw JSON. No markdown code fences, no backticks, no preamble. Exact format:
{
  "summary": "2-3 sentences of honest analysis",
  "focusAreas": ["area 1", "area 2"],
  "nextWeekCommitments": ["1. Specific measurable action", "2. Specific measurable action", "3. Specific measurable action"]
}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { weekStats } = req.body
  if (!weekStats) return res.status(400).json({ error: 'weekStats required' })

  const { tasksCompleted, tasksTotal, xpEarned, streakHeld, arenaBreakdown } = weekStats

  const safeBreakdown = (typeof arenaBreakdown === 'object' && arenaBreakdown !== null && !Array.isArray(arenaBreakdown))
    ? arenaBreakdown : {}

  const completionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0

  const arenaLines = Object.entries(safeBreakdown).map(([name, s]) => {
    const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
    return `  - ${sanitize(name)}: ${Number(s.completed) || 0}/${Number(s.total) || 0} tasks (${pct}%), ${Number(s.xp) || 0} XP`
  }).join('\n')

  const userPrompt = `Week stats:
Tasks: ${Number(tasksCompleted) || 0}/${Number(tasksTotal) || 0} completed (${completionRate}%)
XP earned: ${Number(xpEarned) || 0}
Streak held: ${streakHeld ? 'Yes' : 'No'}

Arena breakdown:
${arenaLines}

Analyze this week and give 3 specific commitments for next week.`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 600,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }]
    })

    const raw = message.content[0]?.text?.trim() ?? ''
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()

    // Parse JSON response
    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      // Fallback if AI doesn't return valid JSON
      parsed = {
        summary: raw || 'Great effort this week. Keep showing up.',
        focusAreas: [],
        nextWeekCommitments: ['1. Review your task list and prioritize ruthlessly.', '2. Complete all high-priority tasks before touching optional ones.', '3. Check in daily to stay on track.'],
      }
    }

    return res.status(200).json({
      summary: parsed.summary ?? raw,
      focusAreas: parsed.focusAreas ?? [],
      nextWeekCommitments: parsed.nextWeekCommitments ?? [],
    })
  } catch (err) {
    console.error('weekly-report error:', err)
    return res.status(500).json({
      error: 'AI unavailable',
      summary: 'Great effort this week. Keep showing up.',
      focusAreas: [],
      nextWeekCommitments: [],
    })
  }
}
