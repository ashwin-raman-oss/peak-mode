import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useOKRs(userId) {
  const [okrs, setOkrs] = useState([])
  const [archivedOKRs, setArchivedOKRs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchOKRs = useCallback(async () => {
    if (!userId) { setLoading(false); return }
    setLoading(true)

    // Try with is_archived filter (requires migration); fall back gracefully if column absent
    const [{ data: activeData, error: activeErr }, { data: archivedData }] = await Promise.all([
      supabase
        .from('okrs')
        .select('*, key_results(*)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_archived', false)
        .order('created_at', { ascending: true })
        .order('created_at', { foreignTable: 'key_results', ascending: true }),
      supabase
        .from('okrs')
        .select('*, key_results(*)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .eq('is_archived', true)
        .order('archived_at', { ascending: false }),
    ])

    if (activeErr) {
      // Column may not exist yet — fall back to unfiltered query
      const { data: fallback } = await supabase
        .from('okrs')
        .select('*, key_results(*)')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })
        .order('created_at', { foreignTable: 'key_results', ascending: true })
      setOkrs(fallback || [])
      setArchivedOKRs([])
    } else {
      setOkrs(activeData || [])
      setArchivedOKRs(archivedData || [])
    }

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

  async function archiveOKR(okrId) {
    const { error } = await supabase
      .from('okrs')
      .update({ is_archived: true, archived_at: new Date().toISOString() })
      .eq('id', okrId)
    if (error) throw error
    const okr = okrs.find(o => o.id === okrId)
    setOkrs(prev => prev.filter(o => o.id !== okrId))
    if (okr) setArchivedOKRs(prev => [{ ...okr, is_archived: true }, ...prev])
  }

  async function restoreOKR(okrId) {
    const { error } = await supabase
      .from('okrs')
      .update({ is_archived: false, archived_at: null })
      .eq('id', okrId)
    if (error) throw error
    const okr = archivedOKRs.find(o => o.id === okrId)
    setArchivedOKRs(prev => prev.filter(o => o.id !== okrId))
    if (okr) setOkrs(prev => [...prev, { ...okr, is_archived: false }])
  }

  async function deleteOKR(okrId) {
    const { error } = await supabase
      .from('okrs')
      .update({ is_active: false })
      .eq('id', okrId)
    if (error) throw error
    setOkrs(prev => prev.filter(o => o.id !== okrId))
    setArchivedOKRs(prev => prev.filter(o => o.id !== okrId))
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

  return {
    okrs, archivedOKRs, loading,
    addOKR, addKeyResult, updateProgress,
    archiveOKR, restoreOKR, deleteOKR, deleteKeyResult,
  }
}
