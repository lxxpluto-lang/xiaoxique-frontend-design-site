# Rive 文件投放位置

把 Rive Desktop 导出的文件放在这里，并在 `src/pages/index/index.vue` 对应动作的
`riv` 字段中填写 `/static/rive/文件名.riv`。字段为空时，组件会自动播放已经生成的
MP4 备用动效。

建议用一个 `magpie-motions.riv`，状态机命名为 `Motion Machine`，或者为三个动作分别
导出 `magpie-baduanjin.riv`、`magpie-horse-stance.riv`、`magpie-singing.riv`。
