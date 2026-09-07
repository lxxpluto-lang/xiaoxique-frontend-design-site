/** Structural recovery only. Valid baseline data and business rules stay unchanged. */
export function sanitizePrototypeState(raw: unknown): { state?: Record<string, any>; repaired: boolean } {
  const object = (value: unknown): value is Record<string, any> => Boolean(value) && typeof value === 'object' && !Array.isArray(value)
  if (!object(raw)) return { repaired: false }
  const state = { ...raw }
  let repaired = false
  const replace = (key: string, value: unknown) => { state[key] = value; repaired = true }
  for (const key of ['wallet','mem','teamState','buddyState','rewardLedger','publishedPolicy','policyDraft','publicHealthProfile']) {
    if (state[key] !== undefined && !object(state[key])) { delete state[key]; repaired = true }
  }
  for (const key of ['sessions','checkIns','dailyStepRecords','redemptions','doctorReviews']) {
    if (state[key] === undefined) continue
    if (!Array.isArray(state[key])) { replace(key, []); continue }
    const rows = state[key].filter((row: unknown) => {
      if (!object(row)) return false
      if (key === 'sessions') return typeof row.id === 'string' && typeof row.createdAt === 'string' && Number.isFinite(Date.parse(row.createdAt)) && typeof row.title === 'string' && Number.isFinite(row.durationSeconds)
      if (key === 'checkIns' || key === 'dailyStepRecords') return typeof row.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(row.date)
      return typeof row.id === 'string'
    })
    if (rows.length !== state[key].length) replace(key, rows)
  }
  for (const key of ['publishedPolicy','policyDraft']) {
    if (!object(state[key])) continue
    const policy = { ...state[key] }
    let changed = false
    for (const phase of ['preMode','postMode']) if (policy[phase] !== undefined && !['off','optional','required'].includes(policy[phase])) { delete policy[phase]; changed = true }
    if (policy.fields !== undefined && !object(policy.fields)) { delete policy.fields; changed = true }
    else if (object(policy.fields)) {
      const fields = Object.fromEntries(Object.entries(policy.fields).filter(([,value]) => typeof value === 'boolean'))
      if (Object.keys(fields).length !== Object.keys(policy.fields).length) { policy.fields = fields; changed = true }
    }
    if (policy.sourcePriority !== undefined && !Array.isArray(policy.sourcePriority)) { delete policy.sourcePriority; changed = true }
    if (changed) replace(key, policy)
  }
  if (object(state.rewardLedger) && !Array.isArray(state.rewardLedger.exerciseIds)) replace('rewardLedger', { ...state.rewardLedger, exerciseIds: [] })
  return { state, repaired }
}
