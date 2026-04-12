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

function sanitize(str, maxLen = 80) {
  if (typeof str !== 'string') return ''
  return str.replace(/[\n\r`]/g, ' ').slice(0, maxLen).trim()
}

const SYSTEM_PROMPT = `You are a performance coach. Analyze this arena's weekly performance with brutal honesty. Identify patterns — not just this week in isolation. Give a concrete 3-step action plan.

Respond ONLY with valid JSON. No markdown, no code fences, no preamble. Just the raw JSON object:
{"pattern":"1-2 sentences identifying the underlying pattern or habit causing these results","actionPlan":["Specific action","Specific action","Specific action"],"trend":"up|down|flat"}`

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { arenaName, weekStats, weekStart, previousWeekStats } = req.body
  if (!arenaName || !weekStats) return res.status(400).json({ error: 'arenaName and weekStats required' })

  const safeName = sanitize(arenaName)
  const completionRate = weekStats.total > 0
    ? Math.round((weekStats.completed / weekStats.total) * 100)
    : 0
  const missed = Math.max(0, (weekStats.total || 0) - (weekStats.completed || 0))

  let trendLine = ''
  if (previousWeekStats && previousWeekStats.total > 0) {
    const prevRate = Math.round((previousWeekStats.completed / previousWeekStats.total) * 100)
    const delta = completionRate - prevRate
    trendLine = `\nPrevious week: ${previousWeekStats.completed}/${previousWeekStats.total} (${prevRate}%). Change: ${delta > 0 ? '+' : ''}${delta}%.`
  }

  const userPrompt = `Arena: ${safeName}
This week: ${weekStats.completed || 0}/${weekStats.total || 0} tasks completed (${completionRate}%), ${weekStats.xpEarned || 0} XP earned, ${missed} tasks missed.${trendLine}

What's the pattern and what should they do about it?`

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 400,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userPrompt }],
    })

    const raw = message.content[0]?.text?.trim() ?? ''
    // Strip markdown code fences if present (```json ... ``` or ``` ... ```)
    const cleaned = raw.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '').trim()
    let parsed
    try {
      parsed = JSON.parse(cleaned)
    } catch {
      parsed = {
        pattern: 'Inconsistent execution. The tasks exist but completion is sporadic.',
        actionPlan: ['Schedule these tasks at a fixed time each day.', 'Remove one barrier that prevents starting.', 'Track completion daily — what gets measured gets done.'],
        trend: 'flat',
      }
    }

    return res.status(200).json({
      pattern: parsed.pattern ?? '',
      actionPlan: Array.isArray(parsed.actionPlan) ? parsed.actionPlan : [],
      trend: ['up', 'down', 'flat'].includes(parsed.trend) ? parsed.trend : 'flat',
    })
  } catch (err) {
    console.error('arena-deep-dive error:', err)
    return res.status(500).json({
      error: 'AI unavailable',
      pattern: 'Analysis unavailable.',
      actionPlan: [],
      trend: 'flat',
    })
  }
}
