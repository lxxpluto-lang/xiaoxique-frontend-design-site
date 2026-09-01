export type ActivityId = 'baduanjin' | 'resistance' | 'singing'

export interface RiveMotionAsset {
  src: string
  artboard: string
  stateMachine: 'Motion Machine'
  fit: 'contain' | 'cover'
  placement: 'card' | 'page'
  enabled: boolean
}

export interface Activity {
  id: ActivityId
  title: string
  shortTitle: string
  icon: string
  duration: string
  durationSeconds: number
  cue: string
  video: string
  poster: string
  rive: RiveMotionAsset
}

/**
 * Rive V3 runtime contract.
 *
 * Keep `enabled` false until the corresponding binary has been exported from
 * Rive Desktop and validated. This prevents a missing or placeholder .riv
 * from silently replacing the working MP4 preview.
 */
export const activities: Activity[] = [
  {
    id: 'baduanjin',
    title: '八段锦完整跟练',
    shortTitle: '八段锦',
    icon: '伸',
    duration: '12 分 08 秒',
    durationSeconds: 728,
    cue: '跟随示范和呼吸口令完成八式，过程中不要憋气',
    video: '/static/videos/baduanjin-full-course-mobile.mp4',
    poster: '/static/previews/baduanjin-full-course-poster.jpg',
    rive: {
      src: '/static/rive/magpie-baduanjin-v3.riv',
      artboard: 'Baduanjin',
      stateMachine: 'Motion Machine',
      fit: 'contain',
      placement: 'card',
      enabled: false,
    },
  },
  {
    id: 'resistance',
    title: '小喜鹊托举',
    shortTitle: '抗阻训练',
    icon: '蹲',
    duration: '3 分钟',
    durationSeconds: 180,
    cue: '稳稳浅蹲，托住小喜鹊起跳和落下',
    video: '/static/videos/magpie-resistance-continuous-v3.mp4',
    poster: '/static/previews/continuous-v3/resistance-poster-v3.png',
    rive: {
      src: '/static/rive/magpie-resistance-v3.riv',
      artboard: 'Resistance',
      stateMachine: 'Motion Machine',
      fit: 'contain',
      placement: 'card',
      enabled: false,
    },
  },
  {
    id: 'singing',
    title: '音乐节拍律动',
    shortTitle: '音乐律动',
    icon: '♪',
    duration: '3 分钟',
    durationSeconds: 180,
    cue: '跟着节拍轻轻点击，让肩膀和心情一起放松',
    video: '/static/videos/magpie-singing-continuous-v3.mp4',
    poster: '/static/previews/continuous-v3/singing-poster-v3.png',
    rive: {
      src: '/static/rive/magpie-singing-v3.riv',
      artboard: 'SingingScreenBreak',
      stateMachine: 'Motion Machine',
      fit: 'cover',
      placement: 'page',
      enabled: false,
    },
  },
]

export const riveInputs = {
  play: 'play',
  replay: 'replay',
  celebrate: 'celebrate',
  reducedMotion: 'reducedMotion',
} as const
