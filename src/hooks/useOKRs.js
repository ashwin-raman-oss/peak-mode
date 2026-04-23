import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useOKRs(userId) {
  const [okrs, setOkrs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOKRs = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)
    const { data } = await supabase
      .from('okrs')
      .select('*, key_results(*)')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .order('created_at', { foreignTable: 'key_results', ascending: true })
    setOkrs(data || [])
    setLoading(false)
  }, [userId])

  useEffect(() => { fetchOKRs() }, [fetchOKRs])

  async function addOKR({ title, why, period }) {
    const { data, error } = await supabase
      .from('okrs')
      .insert({ user_id: userId, title, why: why || null, period })
      .select()
      .single()
    if (error) throw error
    setOkrs(prev => [...prev, { ...data, key_results: [] }])
    return data
  }

  async function addKeyResult(okrId, { title }) {
    const { data, error } = await supabase
      .from('key_results')
      .insert({ user_id: userId, okr_id: okrId, title, progress: 0 })
      .select()
      .single()
    if (error) throw error
    setOkrs(prev => prev.map(o =>
      o.id === okrId ? { ...o, key_results: [...o.key_results, data] } : o
    ))
    return data
  }

  async function updateProgress(krId, progress) {
    const { error } = await supabase
      .from('key_results')
      .update({ progress })
      .eq('id', krId)
    if (error) throw error
    setOkrs(prev => prev.map(o => ({
      ...o,
      key_results: o.key_results.map(kr =>
        kr.id === krId ? { ...kr, progress } : kr
      ),
    })))
  }

  async function deleteOKR(okrId) {
    const { error } = await supabase
      .from('okrs')
      .update({ is_active: false })
      .eq('id', okrId)
    if (error) throw error
    setOkrs(prev => prev.filter(o => o.id !== okrId))
  }

  async function deleteKeyResult(krId) {
    const { error } = await supabase
      .from('key_results')
      .delete()
      .eq('id', krId)
    if (error) throw error
    setOkrs(prev => prev.map(o => ({
      ...o,
      key_results: o.key_results.filter(kr => kr.id !== krId),
    })))
  }

  return { okrs, loading, addOKR, addKeyResult, updateProgress, deleteOKR, deleteKeyResult }
}
