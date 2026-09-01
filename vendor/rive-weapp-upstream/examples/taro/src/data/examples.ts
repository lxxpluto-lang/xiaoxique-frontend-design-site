export interface RiveExample {
  file: string
  title: string
  subtitle: string
  tags: string[]
}

// .riv files live in the pkgRive subpackage; the player resolves
// /pkgRive/assets/riv/<file> at runtime.
export const EXAMPLES: RiveExample[] = [
  { file: 'vehicles.riv', title: 'Vehicles', subtitle: '状态机 · 点击切换', tags: ['状态机', '交互'] },
  { file: 'off_road_car.riv', title: 'Off-Road Car', subtitle: '状态机 · 触发弹跳', tags: ['状态机', '交互'] },
  { file: 'skills.riv', title: 'Skills', subtitle: '数字输入 · 监听器', tags: ['状态机', '输入'] },
  { file: 'little_machine.riv', title: 'Little Machine', subtitle: '状态机 · 触摸', tags: ['状态机', '交互'] },
  { file: 'marty.riv', title: 'Marty', subtitle: '角色循环动画', tags: ['动画'] },
  { file: 'rocket.riv', title: 'Rocket', subtitle: '轻量循环动画', tags: ['动画'] }
]
