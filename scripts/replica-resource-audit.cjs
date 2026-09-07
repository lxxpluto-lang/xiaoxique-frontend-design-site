// Read-only resource inventory. No pruning, transcoding, source edits or uploads.
const fs = require('node:fs'), path = require('node:path'), crypto = require('node:crypto')
const root = path.resolve(__dirname, '..'), src = path.join(root, 'src'), out = path.join(root, 'docs/visual-acceptance/latest')
const walk = dir => fs.existsSync(dir) ? fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : e.isFile() ? [path.join(dir, e.name)] : []) : []
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const refs = new Map(), dynamicPrefixes = new Set()
const codeFiles = walk(src).filter(p => !p.startsWith(path.join(src, 'static') + path.sep) && /\.(vue|ts|js|json|scss|css|wxml|wxss)$/.test(p))
for (const file of codeFiles) {
  const content = fs.readFileSync(file, 'utf8')
  for (const [index, line] of content.split('\n').entries()) {
    for (const m of line.matchAll(/\/static\/[A-Za-z0-9_./-]+/g)) {
      if (line.slice(m.index + m[0].length).startsWith('${')) { dynamicPrefixes.add(m[0]); continue }
      if (!/\.[a-z0-9]+$/i.test(m[0])) { dynamicPrefixes.add(m[0]); continue }
      if (!refs.has(m[0])) refs.set(m[0], [])
      refs.get(m[0]).push({ file: path.relative(root, file), line: index + 1 })
    }
  }
}
const assets = walk(path.join(src, 'static')).map(file => {
  const url = '/' + path.relative(src, file).split(path.sep).join('/')
  const direct = refs.get(url) || [], dynamic = [...dynamicPrefixes].filter(prefix => url.startsWith(prefix))
  return { file: path.relative(root, file), url, bytes: fs.statSync(file).size, sha256: hash(file), classification: direct.length ? 'literal-reference' : dynamic.length ? 'dynamic-prefix-candidate' : 'no-literal-reference-found', references: direct, dynamicPrefixes: dynamic }
})
const files = new Set(assets.map(x => x.url))
const absentReferences = [...refs].filter(([url]) => !files.has(url)).map(([url, references]) => ({ url, references, status: /\/rive\/.*\.riv$/.test(url) ? 'declared-rive-source; inspect enabled guard, not automatic missing-runtime failure' : 'needs-inspection' }))
const groups = Object.values(assets.reduce((groups, a) => {
  const name = a.file.split(path.sep)[2]; const g = groups[name] ||= { name, count: 0, bytes: 0, literalBytes: 0, noLiteralBytes: 0, dynamicBytes: 0 }
  g.count++; g.bytes += a.bytes
  if (a.classification === 'literal-reference') g.literalBytes += a.bytes
  else if (a.classification === 'dynamic-prefix-candidate') g.dynamicBytes += a.bytes
  else g.noLiteralBytes += a.bytes
  return groups
}, {})).sort((a, b) => b.bytes - a.bytes)
const tree = relative => { const files = walk(path.join(root, relative)); return { relative, count: files.length, bytes: files.reduce((n, p) => n + fs.statSync(p).size, 0) } }
const summary = { generatedAt: new Date().toISOString(), scope: 'Read-only lexical references and logical byte sizes; includes inactive branches/comments, does not prove dynamic reachability or platform upload size. No files removed or re-encoded.', totals: [tree('src/static'), tree('src/wxcomponents'), tree('dist/build/mp-weixin')], codeFiles: codeFiles.length, dynamicPrefixes: [...dynamicPrefixes], groups, absentReferences, assets }
fs.mkdirSync(out, { recursive: true }); fs.writeFileSync(path.join(out, 'resource-audit.json'), JSON.stringify(summary, null, 2))
const mib = n => (n / 1024 / 1024).toFixed(2) + ' MiB'
const lines = ['# 本地资源与包体依赖审计', '', '仅生成报告；原项目、副本素材、编译产物均未删除、转码或外传。这里是文件逻辑大小，不是平台压缩上传包测量，也不引用未核验的平台限额。', '', '## 实测总量', '', '| 范围 | 文件数 | 逻辑大小 |', '|---|---:|---:|', ...summary.totals.map(x => `| ${x.relative} | ${x.count} | ${mib(x.bytes)} |`), '', '## 静态资源分组', '', '| 目录 | 文件数 | 总大小 | 有字面引用 | 动态前缀候选 | 未找到字面引用 |', '|---|---:|---:|---:|---:|---:|', ...groups.map(x => `| ${x.name} | ${x.count} | ${mib(x.bytes)} | ${mib(x.literalBytes)} | ${mib(x.dynamicBytes)} | ${mib(x.noLiteralBytes)} |`), '', '## 解释与下一步边界', '', '- “有字面引用”包含注释、不可达分支、禁用配置，不代表每个文件已在浏览器加载；具体行号和hash见JSON。', '- “未找到字面引用”只是待审候选，不能直接删除：动态拼接、运行库内部引用、构建复制规则和历史源资产须逐类核对。', '- rive-motion.ts中的三个.riv路径对应enabled:false；当前使用原MP4回退。不能把缺少尚未启用的.riv描述成训练视频404，也不能擅自开启。', '- pages.json仍声明rive-view；运行库随微信构建复制，需与素材大小分别核对。Rive源图中的紫喜母版仍被界面引用，不能整目录剔除。', '- 先建立分发白名单并在独立产物中验证所有运行请求，再决定排除历史源资产；保留原项目及副本全量素材以便恢复。', '- 训练与知识视频需要保留原时长/内容。远程托管需要用户控制的域名、存储和平台配置，不允许擅自上传、用外部视频替换或为了包体删除课程。', '- 此报告不证明小程序可上传、真机性能、动态资源全部可达或最终分包方案已实现。', '', '## 体积最大的20项静态资源', '', '| 文件 | 大小 | 分类 |', '|---|---:|---|', ...[...assets].sort((a, b) => b.bytes - a.bytes).slice(0, 20).map(a => `| ${a.file} | ${mib(a.bytes)} | ${a.classification} |`), '', '## 未落盘的字面路径', '', ...absentReferences.map(x => `- ${x.url}：${x.status}`), '', '[逐文件hash、来源与大小](resource-audit.json)', '']
if(fs.existsSync(path.join(out,'runtime-delivery.json')))lines.push('## 独立分发证据','', '本审计本身仍只读；独立白名单、保留/排除记录、逐文件验证与生产H5测试已单独生成。来源全量资源未删除；具体当前状态见[分发记录](runtime-delivery.md)及[总验收报告](../../REPLICA-REVIEW.md)，不把约60MiB的运行副本等同平台可发布包。','')
fs.writeFileSync(path.join(out, 'resource-audit.md'), lines.join('\n'))
console.log(JSON.stringify({ totals: summary.totals, groups, absentReferences }, null, 2))
