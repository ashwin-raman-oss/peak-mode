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

  const { taskTitle, arenaName } = req.body
  if (!taskTitle) return res.status(400).json({ error: 'taskTitle required' })

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 60,
      messages: [{
        role: 'user',
        content: `You are a high-energy performance coach. The user just completed this task: "${taskTitle}" (arena: ${arenaName}). Give them a single punchy hype sentence — second person, specific to what they did, under 12 words, no emojis, no exclamation mark spam. Just one clean sentence.`
      }]
    })

    const text = message.content[0]?.text?.trim() ?? 'Keep pushing.'
    return res.status(200).json({ message: text })
  } catch (err) {
    console.error('hype error:', err)
    return res.status(500).json({ error: 'AI unavailable', message: 'Keep pushing.' })
  }
}
