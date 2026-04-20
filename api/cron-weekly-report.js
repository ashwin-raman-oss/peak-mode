import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@supabase/supabase-js'

const SYSTEM_PROMPT = `You are an elite performance coach reviewing a user's week. Your job is brutal honesty delivered with precision — not cruelty, not softness.

Rules:
- If completion rate < 70%: call out exactly which arenas underperformed and by how much. Be specific — say "You completed 1/5 Career tasks" not "Career needs work".
- Show the compounding cost: missed tasks are missed reps, missed reps are missed results.
- If completion > 85%: still find something to push on. Complacency kills momentum. Identify the next ceiling to break.
- End with exactly 3 numbered action items for next week — each one sentence, specific and measurable.
- Tone: halftime locker room. Direct. No filler phrases.

Respond ONLY with valid JSON in this exact format:
{
  "summary": "2-3 sentences of honest analysis",
  "focusAreas": ["area 1", "area 2"],
  "nextWeekCommitments": ["1. Specific measurable action", "2. Specific measurable action", "3. Specific measurable action"]
}`

function toDateStr(date) {
  return date.toISOString().slice(0, 10)
}

// Returns the Monday of the week containing the given date (UTC)
function getWeekStart(date) {
  const d = new Date(date)
  const day = d.getUTCDay() // 0=Sun
  const diff = day === 0 ? -6 : 1 - day
  d.setUTCDate(d.getUTCDate() + diff)
  d.setUTCHours(0, 0, 0, 0)
  return d
}

function sanitize(str, maxLen = 50) {
  if (typeof str !== 'string') return ''
  return str.replace(/[\n\r`]/g, ' ').slice(0, maxLen).trim()
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  // Verify cron secret
  const secret = req.headers['x-cron-secret'] ?? req.headers.authorization?.replace('Bearer ', '')
  if (!process.env.CRON_SECRET || secret !== process.env.CRON_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return res.status(500).json({ error: 'Missing SUPABASE_SERVICE_ROLE_KEY' })
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { persistSession: false } }
  )

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

  // The week that just ended is the previous Mon–Sun
  const now = new Date()
  const weekStart = getWeekStart(now)
  // Go back 7 days to get last week's Monday
  const lastWeekStart = new Date(weekStart)
  lastWeekStart.setUTCDate(lastWeekStart.getUTCDate() - 7)
  const lastWeekEnd = new Date(weekStart) // exclusive: this Monday = end of last week
  const weekStartStr = toDateStr(lastWeekStart)
  const weekEndStr   = toDateStr(lastWeekEnd)

  console.log(`[cron-weekly-report] Generating reports for week ${weekStartStr}`)

  // Get all user profiles
  const { data: profiles, error: profilesErr } = await supabase
    .from('profiles')
    .select('id')

  if (profilesErr) {
    console.error('[cron-weekly-report] Failed to fetch profiles:', profilesErr)
    return res.status(500).json({ error: 'Failed to fetch profiles' })
  }

  const results = { success: 0, skipped: 0, failed: 0 }

  for (const profile of profiles ?? []) {
    const userId = profile.id
    try {
      // Check if report already exists
      const { data: existing } = await supabase
        .from('weekly_reports')
        .select('id')
        .eq('user_id', userId)
        .eq('week_start_date', weekStartStr)
        .single()

      if (existing) {
        results.skipped++
        continue
      }

      // Fetch task completions for the week
      const { data: completions } = await supabase
        .from('task_completions')
        .select('id, task_id, xp_earned, completed_at')
        .eq('user_id', userId)
        .gte('completed_at', weekStartStr + 'T00:00:00Z')
        .lt('completed_at', weekEndStr + 'T00:00:00Z')

      // Fetch active tasks with arena info
      const { data: tasks } = await supabase
        .from('tasks')
        .select('id, arena_id, recurrence, arenas(name)')
        .eq('user_id', userId)
        .eq('is_active', true)

      const completedIds = new Set((completions ?? []).map(c => c.task_id))
      const xpEarned = (completions ?? []).reduce((s, c) => s + (c.xp_earned ?? 0), 0)

      // Build arena breakdown
      const arenaMap = {}
      for (const task of tasks ?? []) {
        const arenaName = task.arenas?.name ?? 'Misc'
        if (!arenaMap[arenaName]) arenaMap[arenaName] = { completed: 0, total: 0, xp: 0 }
        arenaMap[arenaName].total++
        if (completedIds.has(task.id)) {
          arenaMap[arenaName].completed++
          const taskXp = (completions ?? []).filter(c => c.task_id === task.id).reduce((s, c) => s + (c.xp_earned ?? 0), 0)
          arenaMap[arenaName].xp += taskXp
        }
      }

      const tasksCompleted = Object.values(arenaMap).reduce((s, a) => s + a.completed, 0)
      const tasksTotal     = Object.values(arenaMap).reduce((s, a) => s + a.total, 0)
      const completionRate = tasksTotal > 0 ? Math.round((tasksCompleted / tasksTotal) * 100) : 0

      // Generate AI summary
      const arenaLines = Object.entries(arenaMap).map(([name, s]) => {
        const pct = s.total > 0 ? Math.round((s.completed / s.total) * 100) : 0
        return `  - ${sanitize(name)}: ${s.completed}/${s.total} tasks (${pct}%), ${s.xp} XP`
      }).join('\n')

      const userPrompt = `Week stats:
Tasks: ${tasksCompleted}/${tasksTotal} completed (${completionRate}%)
XP earned: ${xpEarned}
Streak held: N/A (cron-generated)

Arena breakdown:
${arenaLines}

Analyze this week and give 3 specific commitments for next week.`

      let aiSummary = 'Strong week. Keep the momentum going.'
      let nextWeekCommitments = []

      try {
        const message = await anthropic.messages.create({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 500,
          system: SYSTEM_PROMPT,
          messages: [{ role: 'user', content: userPrompt }],
        })
        const raw = message.content[0]?.text?.trim() ?? ''
        try {
          const parsed = JSON.parse(raw)
          aiSummary = parsed.summary ?? aiSummary
          nextWeekCommitments = parsed.nextWeekCommitments ?? []
        } catch {
          aiSummary = raw || aiSummary
        }
      } catch (aiErr) {
        console.error(`[cron-weekly-report] AI error for user ${userId}:`, aiErr.message)
      }

      // Save report
      const { error: saveErr } = await supabase
        .from('weekly_reports')
        .upsert({
          user_id: userId,
          week_start_date: weekStartStr,
          tasks_completed: tasksCompleted,
          tasks_total: tasksTotal,
          xp_earned: xpEarned,
          streak_held: false,
          arena_breakdown: arenaMap,
          ai_summary: aiSummary,
          next_week_commitments: nextWeekCommitments,
        }, { onConflict: 'user_id,week_start_date' })

      if (saveErr) {
        console.error(`[cron-weekly-report] Save error for user ${userId}:`, saveErr)
        results.failed++
      } else {
        console.log(`[cron-weekly-report] Report saved for user ${userId}`)
        results.success++
      }
    } catch (err) {
      console.error(`[cron-weekly-report] Error for user ${userId}:`, err.message)
      results.failed++
    }
  }

  console.log(`[cron-weekly-report] Done — success: ${results.success}, skipped: ${results.skipped}, failed: ${results.failed}`)
  return res.status(200).json({ week: weekStartStr, ...results })
}
