export type UserMode = 'cardiac' | 'public'
export type NavId = 'home' | 'knowledge' | 'assistant' | 'reports' | 'growth' | 'profile'
export type ExerciseGameId = 'baduanjin' | 'resistance' | 'music'
export type KnowledgeCategory = 'recommended' | 'guide' | 'tip' | 'video'
export type KnowledgeItemType = 'guide' | 'tip' | 'video'
export type DetailView =
  | 'none'
  | 'precheck'
  | 'training'
  | 'postcheck'
  | 'session-report'
  | 'hospital-report'
  | 'health-archive'
  | 'devices'
  | 'knowledge-article'
  | 'knowledge-video'
  | 'assessment'
  | 'team'
  | 'reward-store'

export interface HealthMetric {
  id: string
  label: string
  value: string
  unit: string
  status: string
  tone: 'good' | 'calm' | 'attention'
  source: string
}

export interface RewardItem {
  id: string
  name: string
  description: string
  cost: number
  icon: string
  audience: 'cardiac' | 'mem' | 'all'
}

export interface KnowledgeItem {
  id: string
  type: KnowledgeItemType
  title: string
  summary: string
  tags: string[]
  audience: 'all' | UserMode
  recommendedFor: UserMode[]
  poster: string
  duration: string
  body: string[]
  video?: string
  reviewStatus: 'prototype-pending-review'
}

export interface ExerciseGame {
  id: ExerciseGameId
  title: string
  subtitle: string
  duration: string
  iconPath: string
  activityId: 'baduanjin' | 'resistance' | 'singing'
  poster: string
  feature: string
  interaction: 'camera-score' | 'rep-game' | 'rhythm-game'
}

export type TrainingStatus = 'idle' | 'checking' | 'active' | 'paused' | 'stopped' | 'completed'

export interface ActivityResult {
  label: string
  value: string
}

export interface TrainingSession {
  id: string
  exerciseId: ExerciseGameId
  title: string
  mode: UserMode
  planType: 'prescription' | 'self-directed'
  status: TrainingStatus
  durationSeconds: number
  demoCompleted: boolean
  stoppedReason?: string
  score: number
  results: ActivityResult[]
  createdAt: string
  pointsAwarded: number
}

export interface RewardLedger {
  date: string
  exerciseIds: ExerciseGameId[]
  prescriptionBonusAwarded: boolean
}

export interface NavItem {
  id: NavId
  label: string
  iconPath: string
  mascotPath?: string
}

export const navItems: NavItem[] = [
  { id: 'home', label: '首页', iconPath: '/static/icons/magpie-line/home.svg' },
  { id: 'knowledge', label: '知识库', iconPath: '/static/icons/magpie-line/knowledge.svg' },
  {
    id: 'assistant',
    label: '小喜',
    iconPath: '/static/icons/magpie-line/assistant.svg',
    mascotPath: '/static/rive-source/v4/master/magpie-neutral-master-v4.png',
  },
  { id: 'reports', label: '报告', iconPath: '/static/icons/magpie-line/report.svg' },
  { id: 'profile', label: '我的', iconPath: '/static/icons/magpie-line/profile.svg' },
]

export const knowledgeItems: KnowledgeItem[] = [
  {
    id: 'GUIDE-HOME-SAFETY',
    type: 'guide',
    title: '居家运动安全指南',
    summary: '从运动前检查、环境准备到运动后的恢复，建立一套容易执行的安全流程。',
    tags: ['运动安全', '居家锻炼'],
    audience: 'all',
    recommendedFor: ['cardiac', 'public'],
    poster: '/static/knowledge/posters/guide-home-safety.jpg',
    duration: '4分钟阅读',
    body: [
      '运动前先确认精神、睡眠和身体感受，并准备合适的鞋服、饮水和无障碍活动空间。',
      '从轻量热身开始，运动过程中保持自然呼吸，不要为了完成目标勉强坚持。',
      '如出现胸痛、明显气促、头晕或意识异常，应立即停止运动；症状明显、持续或加重时及时寻求医疗帮助。',
    ],
    reviewStatus: 'prototype-pending-review',
  },
  {
    id: 'GUIDE-CARDIAC-HOME',
    type: 'guide',
    title: '心脏康复日常防护指南',
    summary: '帮助心脏康复用户理解居家阶段的运动记录、主观感受与异常处理。',
    tags: ['心脏康复', '日常防护'],
    audience: 'all',
    recommendedFor: ['cardiac'],
    poster: '/static/knowledge/posters/guide-cardiac.jpg',
    duration: '5分钟阅读',
    body: [
      '患者模式中的计划信息仅用于本课题原型演示，真实运动安排应以医生或康复师给出的处方为准。',
      '运动前后可以记录心率、血氧和Borg主观用力感，观察自身变化，但单次数据不能替代专业判断。',
      '不要自行调整药物、运动强度或处方项目；发现异常或不确定时，应停止运动并联系专业人员。',
    ],
    reviewStatus: 'prototype-pending-review',
  },
  {
    id: 'GUIDE-WEIGHT-START',
    type: 'guide',
    title: '健康减重入门指南',
    summary: '不追求猛练，从能够重复的小目标开始，把运动逐步融入每天的生活。',
    tags: ['健康减重', '运动习惯'],
    audience: 'all',
    recommendedFor: ['public'],
    poster: '/static/knowledge/posters/guide-weight.jpg',
    duration: '4分钟阅读',
    body: [
      '先选择一种愿意开始的3分钟轻运动，建立固定时间和固定场景，比一次完成很大的运动量更容易坚持。',
      '逐步增加日常步行、规律作息和均衡饮食，不使用极端节食或带病坚持运动的方式追求速度。',
      '体重变化需要结合更长周期观察；如有基础疾病或明显不适，应先咨询专业人员。',
    ],
    reviewStatus: 'prototype-pending-review',
  },
  {
    id: 'TIP-BEFORE-CHECK',
    type: 'tip',
    title: '运动前先给身体做一次小检查',
    summary: '睡眠、精神、胸部不适、气促和头晕，都是开始前需要确认的信号。',
    tags: ['运动前', '安全提示'],
    audience: 'all',
    recommendedFor: ['cardiac', 'public'],
    poster: '/static/knowledge/posters/tip-before-check.jpg',
    duration: '2分钟阅读',
    body: ['先停下来感受今天的身体状态，再决定是否开始。', '患者用户应如实完成运动前检查，出现异常症状时不要进入训练。'],
    reviewStatus: 'prototype-pending-review',
  },
  {
    id: 'TIP-BORG',
    type: 'tip',
    title: 'Borg主观用力感怎么看',
    summary: '它记录的是你自己感受到的费力程度，不是越高越好，也不用于鼓励危险坚持。',
    tags: ['Borg', '运动记录'],
    audience: 'all',
    recommendedFor: ['cardiac'],
    poster: '/static/knowledge/posters/tip-borg.jpg',
    duration: '2分钟阅读',
    body: ['按照真实感受记录轻松、适中或明显费力，不必追求某个分数。', '如果感受与平时明显不同，应先暂停并观察，必要时联系专业人员。'],
    reviewStatus: 'prototype-pending-review',
  },
  {
    id: 'TIP-STOP-SYMPTOMS',
    type: 'tip',
    title: '出现这些不适，请立即停止运动',
    summary: '胸痛、明显气促、头晕、意识异常或持续心悸，不应继续完成训练。',
    tags: ['异常症状', '立即停止'],
    audience: 'all',
    recommendedFor: ['cardiac'],
    poster: '/static/knowledge/posters/tip-stop.jpg',
    duration: '1分钟阅读',
    body: ['立即停止运动并坐下或平躺休息，避免继续用力。', '症状明显、持续或加重时及时寻求医疗帮助；紧急情况请呼叫120。'],
    reviewStatus: 'prototype-pending-review',
  },
  {
    id: 'TIP-RECOVERY',
    type: 'tip',
    title: '运动后别急着停，给身体一点恢复时间',
    summary: '慢慢放松、少量补水并记录感受，让一次运动完整结束。',
    tags: ['运动后', '恢复'],
    audience: 'all',
    recommendedFor: ['public', 'cardiac'],
    poster: '/static/knowledge/posters/tip-recovery.jpg',
    duration: '2分钟阅读',
    body: ['结束后先进行缓和活动，不要突然坐下或立即进行高强度工作。', '补充适量水分并记录运动后的身体感受，明显不适时及时处理。'],
    reviewStatus: 'prototype-pending-review',
  },
  {
    id: 'VIDEO-WARM-UP',
    type: 'video',
    title: '小喜带你做好运动前热身',
    summary: '用一段演示短片了解开始运动前的准备步骤。',
    tags: ['热身', '小喜短视频'],
    audience: 'all',
    recommendedFor: ['public', 'cardiac'],
    poster: '/static/knowledge/posters/video-warm-up.jpg',
    duration: '00:12',
    body: ['本视频为可播放的原型演示素材，正式科普内容与动作需经医学专家审核。'],
    video: '/static/knowledge/videos/warm-up-demo.mp4',
    reviewStatus: 'prototype-pending-review',
  },
  {
    id: 'VIDEO-CARDIAC-CHECK',
    type: 'video',
    title: '居家心脏康复前要确认什么',
    summary: '用简短画面提醒用户先看身体状态，再决定是否开始训练。',
    tags: ['心脏康复', '运动前检查'],
    audience: 'all',
    recommendedFor: ['cardiac'],
    poster: '/static/knowledge/posters/video-cardiac-check.jpg',
    duration: '00:12',
    body: ['本视频为可播放的原型演示素材，不构成诊断、治疗或处方调整建议。'],
    video: '/static/knowledge/videos/cardiac-check-demo.mp4',
    reviewStatus: 'prototype-pending-review',
  },
  {
    id: 'VIDEO-HABIT',
    type: 'video',
    title: '把每天运动拆成容易坚持的小目标',
    summary: '从3分钟开始，形成清晰、轻量、能够重复的日常行动。',
    tags: ['运动习惯', '健康减重'],
    audience: 'all',
    recommendedFor: ['public'],
    poster: '/static/knowledge/posters/video-habit.jpg',
    duration: '00:12',
    body: ['本视频为可播放的原型演示素材，正式内容待医学与健康教育专家审核。'],
    video: '/static/knowledge/videos/habit-demo.mp4',
    reviewStatus: 'prototype-pending-review',
  },
]

export const exerciseGames: ExerciseGame[] = [
  {
    id: 'baduanjin',
    title: '八段锦',
    subtitle: '舒展呼吸 · 摄像头跟练',
    duration: '3 分钟',
    iconPath: '/static/icons/magpie-line/stretch.svg',
    activityId: 'baduanjin',
    poster: '/static/previews/continuous-v3/baduanjin-poster-v3.png',
    feature: '动作评分',
    interaction: 'camera-score',
  },
  {
    id: 'resistance',
    title: '抗阻训练',
    subtitle: '轻量力量 · 托举小喜鹊',
    duration: '3 分钟',
    iconPath: '/static/icons/magpie-line/resistance.svg',
    activityId: 'resistance',
    poster: '/static/previews/continuous-v3/resistance-poster-v3.png',
    feature: '12 次动作',
    interaction: 'rep-game',
  },
  {
    id: 'music',
    title: '音乐律动',
    subtitle: '节奏放松 · 跟拍互动',
    duration: '3 分钟',
    iconPath: '/static/icons/magpie-line/music.svg',
    activityId: 'singing',
    poster: '/static/previews/continuous-v3/singing-poster-v3.png',
    feature: '3 组节拍',
    interaction: 'rhythm-game',
  },
]

export const patientMetrics: HealthMetric[] = [
  { id: 'METRIC-HR-001', label: '静息心率', value: '68', unit: '次/分', status: '状态佳', tone: 'good', source: '模拟手环' },
  { id: 'METRIC-SPO2-001', label: '血氧', value: '98', unit: '%', status: '正常', tone: 'good', source: '模拟手环' },
  { id: 'METRIC-STEPS-001', label: '今日步数', value: '3,286', unit: '步', status: '目标 6,000', tone: 'calm', source: '模拟设备' },
  { id: 'METRIC-BMI-001', label: 'BMI', value: '23.1', unit: '', status: '平稳', tone: 'calm', source: '健康档案' },
]

export const publicMetrics: HealthMetric[] = [
  { id: 'METRIC-HR-001', label: '平均心率', value: '72', unit: '次/分', status: '状态佳', tone: 'good', source: '模拟设备' },
  { id: 'METRIC-STEPS-001', label: '今日步数', value: '5,420', unit: '步', status: '还差 580', tone: 'calm', source: '模拟设备' },
  { id: 'METRIC-CAL-001', label: '活动消耗', value: '168', unit: '千卡', status: '稳步积累', tone: 'good', source: '模拟设备' },
  { id: 'METRIC-STREAK-001', label: '连续锻炼', value: '6', unit: '天', status: '明天得徽章', tone: 'attention', source: '打卡记录' },
]

export const trendBars = [42, 48, 45, 60, 72, 65, 78]

export const hospitalSessions = [
  { date: '08-28', type: '有氧训练', duration: '30 分钟', before: '68 / 98%', during: '102 / 97%', after: '74 / 98%', borg: '3' },
  { date: '08-26', type: '抗阻训练', duration: '20 分钟', before: '70 / 98%', during: '96 / 97%', after: '76 / 98%', borg: '3' },
  { date: '08-23', type: '功能训练', duration: '25 分钟', before: '66 / 99%', during: '92 / 98%', after: '72 / 99%', borg: '2' },
]

export const assessmentItems = [
  { name: '握力', value: '左 27.4 / 右 29.1 kg', level: '良好' },
  { name: '30 秒椅子站立', value: '13 次', level: '正常' },
  { name: '座椅前屈', value: '8.5 cm', level: '需保持' },
  { name: '单脚站立', value: '左 18 / 右 21 秒', level: '良好' },
  { name: '功能性前伸', value: '24 cm', level: '正常' },
]

export const rewardItems: RewardItem[] = [
  { id: 'REWARD-001', name: '七日守护徽章', description: '完成连续 7 天锻炼后解锁', cost: 50, icon: '章', audience: 'all' },
  { id: 'REWARD-002', name: '艾草健康包', description: '心脏康复活动演示礼品', cost: 120, icon: '艾', audience: 'cardiac' },
  { id: 'REWARD-003', name: '健康谷物礼盒', description: '心脏康复活动演示礼品', cost: 160, icon: '谷', audience: 'cardiac' },
  { id: 'REWARD-004', name: 'MEM 活动纪念章', description: '输入有效活动码后可见', cost: 80, icon: 'M', audience: 'mem' },
]

export const calendarDays = Array.from({ length: 28 }, (_, index) => ({
  day: index + 1,
  done: [1, 2, 3, 5, 6, 7, 9, 10, 12, 13, 14, 18, 19, 20, 21, 25, 26, 27].includes(index + 1),
  today: index + 1 === 28,
}))
