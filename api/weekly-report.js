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

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify Supabase JWT
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const { data: { user }, error: authError } = await supabase.auth.getUser(token)
  if (authError || !user) return res.status(401).json({ error: 'Unauthorized' })

  const { weekStats } = req.body
  if (!weekStats) return res.status(400).json({ error: 'weekStats required' })

  const { tasksCompleted, tasksTotal, xpEarned, streakHeld, arenaBreakdown } = weekStats

  const safeBreakdown = (typeof arenaBreakdown === 'object' && arenaBreakdown !== null && !Array.isArray(arenaBreakdown))
    ? arenaBreakdown
    : {}

  const arenaLines = Object.entries(safeBreakdown).map(
    ([name, s]) => `  - ${sanitize(name)}: ${Number(s.completed) || 0}/${Number(s.total) || 0} tasks, ${Number(s.xp) || 0} XP`
  ).join('\n')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are an honest, encouraging performance coach reviewing a user's week. Here are their stats:

Tasks: ${Number(tasksCompleted) || 0}/${Number(tasksTotal) || 0} completed
XP earned: ${Number(xpEarned) || 0}
Streak held: ${streakHeld ? 'Yes' : 'No'}
Arena breakdown:
${arenaLines}

Write a 3-4 sentence summary. Be honest — call out weak arenas if relevant. End with one forward-looking encouragement. Second person, direct, no fluff.`
      }]
    })

    const summary = message.content[0]?.text?.trim() ?? 'Great effort this week. Keep showing up.'
    return res.status(200).json({ summary })
  } catch (err) {
    console.error('weekly-report error:', err)
    return res.status(500).json({ error: 'AI unavailable', summary: 'Great effort this week. Keep showing up.' })
  }
}
