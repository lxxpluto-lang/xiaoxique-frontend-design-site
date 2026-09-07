import type { AIAdvice, TrainingSession } from './prototype-data';

function dayNumber(key: string): number {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return NaN;
  const [y,m,d] = key.split('-').map(Number);
  const date = new Date(Date.UTC(y,m-1,d));
  return date.toISOString().slice(0,10) === key ? date.getTime()/86400000 : NaN;
}

/** Describes attendance, never physiological improvement. Does not mutate session data. */
export function buildTrainingInsight(sessions: TrainingSession[], today: string, advice?: AIAdvice) {
  const now = dayNumber(today);
  const age = (session: TrainingSession) => now-dayNumber(session.localDate);
  const eligible = sessions.filter(s=>Number.isFinite(age(s)) && age(s)>=0 && age(s)<14);
  const recent = eligible.filter(s=>age(s)<7 && s.status==='completed');
  const previous = eligible.filter(s=>age(s)>=7 && s.status==='completed');
  const recentDays = new Set(recent.map(s=>s.localDate)).size;
  const previousDays = new Set(previous.map(s=>s.localDate)).size;
  const comparable = previous.length>0;
  const hasRecords = recent.length + previous.length > 0;
  const delta = recent.length-previous.length;
  const risk = advice?.level === 'stop' || advice?.level === 'attention';
  let title = !hasRecords ? '完成运动后，看看自己的变化' : !comparable ? '已记录最近的运动坚持' : delta>0 ? '最近训练坚持度有提升' : delta===0 ? '最近训练次数保持稳定' : '最近训练次数有所减少';
  if(risk) title=advice!.title;
  const summary = risk ? advice!.summary : !hasRecords ? '完成一次运动并记录感受，小喜会在这里整理简短解读。' : comparable ? `近7天完成${recent.length}次，较前7天${delta>0?'增加'+delta+'次':delta<0?'减少'+Math.abs(delta)+'次':'次数相同'}` : `近7天完成${recent.length}次；前一周期记录不足，暂不判断提升。`;
  const change = !hasRecords ? '暂无完成记录，等待积累' : comparable ? `覆盖${recentDays}个训练日，前7天为${previousDays}天` : `覆盖${recentDays}个训练日，继续按状态记录`;
  const exercise = risk ? advice!.actions[0] || '先停止运动，联系医护确认下一步' : '按医生确认的强度完成，不自行加量';
  return { title,summary,change,exercise,hasRecords,level:risk?advice!.level:'insufficient',recentCount:recent.length,previousCount:previous.length,recentDays,previousDays,comparable,source:advice?.sourceSummary || '近14天本地训练记录；本地健康教育规则（RAG演示）' };
}
