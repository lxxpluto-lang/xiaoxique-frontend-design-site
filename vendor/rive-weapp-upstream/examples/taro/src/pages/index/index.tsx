import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { EXAMPLES } from '../../data/examples'
import './index.less'

const GRADIENTS = [
  'linear-gradient(135deg,#ff5b4a,#ff9a3c)',
  'linear-gradient(135deg,#6c8cff,#8f6bff)',
  'linear-gradient(135deg,#27c2a0,#3bb0ff)',
  'linear-gradient(135deg,#ff6bcb,#ff5b6e)',
  'linear-gradient(135deg,#f4c14b,#ff8a3c)',
  'linear-gradient(135deg,#4b9bff,#27d0c2)'
]

export default function Index() {
  const open = (file: string, title: string) => {
    Taro.navigateTo({
      url: `/pkgRive/demo/index?file=${encodeURIComponent(file)}&title=${encodeURIComponent(title)}`
    })
  }

  return (
    <ScrollView scrollY className='page'>
      <View className='hero'>
        <Text className='hero-badge'>RIVE · Taro + React</Text>
        <View className='hero-title'>在小程序里运行 Rive</View>
        <View className='hero-sub'>官方 WASM 运行时 · Canvas 2D · 状态机与触摸交互</View>
      </View>

      <View className='grid'>
        {EXAMPLES.map((ex, i) => (
          <View className='card' key={ex.file} hoverClass='card-hover' onClick={() => open(ex.file, ex.title)}>
            <View className='card-art' style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
              <Text className='card-initial'>{ex.title.slice(0, 1)}</Text>
              <View className='card-play'>▶</View>
            </View>
            <View className='card-body'>
              <View className='card-title'>{ex.title}</View>
              <View className='card-sub'>{ex.subtitle}</View>
              <View className='card-tags'>
                {ex.tags.map((t) => (
                  <Text className='tag' key={t}>{t}</Text>
                ))}
              </View>
            </View>
          </View>
        ))}
      </View>

      <View className='footer'>点击卡片进入播放页 · 共 {EXAMPLES.length} 个官方示例</View>
    </ScrollView>
  )
}
