import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const supabase  = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
)

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

  const arenaLines = Object.entries(arenaBreakdown || {}).map(
    ([name, s]) => `  - ${name}: ${s.completed}/${s.total} tasks, ${s.xp} XP`
  ).join('\n')

  try {
    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 300,
      messages: [{
        role: 'user',
        content: `You are an honest, encouraging performance coach reviewing a user's week. Here are their stats:

Tasks: ${tasksCompleted}/${tasksTotal} completed
XP earned: ${xpEarned}
Streak held: ${streakHeld ? 'Yes' : 'No'}
Arena breakdown:
${arenaLines}

Write a 3-4 sentence summary. Be honest — call out weak arenas if relevant. End with one forward-looking encouragement. Second person, direct, no fluff.`
      }]
    })

    const summary = message.content[0]?.text?.trim() ?? 'Good work this week. Keep showing up.'
    return res.status(200).json({ summary })
  } catch (err) {
    console.error('weekly-report error:', err)
    return res.status(500).json({ error: 'AI unavailable', summary: 'Great effort this week. Keep showing up.' })
  }
}
