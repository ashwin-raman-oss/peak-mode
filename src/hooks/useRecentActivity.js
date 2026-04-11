import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

export function useRecentActivity(userId) {
  const [activity, setActivity] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!userId) { setLoading(false); return }

    async function fetchActivity() {
      const { data, error } = await supabase
        .from('task_completions')
        .select('id, completed_at, tasks(id, title, arenas(slug, name))')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(5)

      if (!error && data) {
        setActivity(data.map(row => ({
          id: row.id,
          completedAt: row.completed_at,
          timeAgo: timeAgo(row.completed_at),
          taskTitle: row.tasks?.title ?? 'Unknown task',
          arenaSlug: row.tasks?.arenas?.slug ?? 'misc',
          arenaName: row.tasks?.arenas?.name ?? '',
        })))
      }
      setLoading(false)
    }

    fetchActivity()
  }, [userId])

  return { activity, loading }
}
