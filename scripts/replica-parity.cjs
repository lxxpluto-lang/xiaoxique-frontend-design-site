const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process')
const root=path.resolve(__dirname,'..'),baseline=path.resolve(root,'../小喜鹊精简功能版')
const walk=d=>fs.readdirSync(d,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(d,e.name)):[path.join(d,e.name)])
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const scan=d=>walk(path.join(d,'src')).filter(p=>/\.(vue|ts)$/.test(p)).map(p=>({file:path.relative(d,p),content:fs.readFileSync(p,'utf8')}))
const before=scan(baseline),after=scan(root)
// Include literal render-function props as well as template attributes. This is
// static enumeration only, not proof that an anchor is rendered or actionable.
const anchors=files=>new Set(files.flatMap(f=>{
 const templateStart=f.content.indexOf('<template>'),templateEnd=f.content.lastIndexOf('</template>')
 const template=f.file.endsWith('.vue')&&templateStart>=0&&templateEnd>templateStart?f.content.slice(templateStart,templateEnd):''
 return [
  ...[...template.matchAll(/(?<!:)data-testid="([^"]+)"/g)].map(m=>m[1]),
  ...[...f.content.matchAll(/['"]data-testid['"]\s*:\s*['"]([^'"]+)['"]/g)].map(m=>m[1])
 ]
}))
const oldAnchors=anchors(before),newAnchors=anchors(after),missingAnchors=[...oldAnchors].filter(x=>!newAnchors.has(x))
const missingAssets=walk(path.join(baseline,'src/static')).map(p=>path.relative(baseline,p)).filter(p=>!fs.existsSync(path.join(root,p)))
const changedAssets=walk(path.join(baseline,'src/static')).map(p=>path.relative(baseline,p)).filter(p=>fs.existsSync(path.join(root,p))&&hash(path.join(root,p))!==hash(path.join(baseline,p)))
const ts=require(path.join(root,'node_modules/typescript'))
const functions=project=>{const text=fs.readFileSync(path.join(project,'src/pages/index/index.vue'),'utf8').match(/<script setup lang="ts">([\s\S]*?)<\/script>/)[1];const source=ts.createSourceFile('index.ts',text,ts.ScriptTarget.Latest,true);return new Map(source.statements.filter(s=>ts.isFunctionDeclaration(s)).map(s=>[s.name.text,s.getText(source).replace(/\s+/g,'')]))}
const oldFunctions=functions(baseline),newFunctions=functions(root)
const missingFunctions=[...oldFunctions.keys()].filter(x=>!newFunctions.has(x)),changedFunctions=[...oldFunctions].filter(([key,value])=>newFunctions.get(key)!==value).map(([key])=>key)
const unchangedCore=['src/lib/prototype-data.ts','src/lib/shared-patient.ts','src/lib/rive-motion.ts','src/pages.json','src/manifest.json','package.json'].map(file=>({file,unchanged:hash(path.join(root,file))===hash(path.join(baseline,file))}))
const refs=fs.readdirSync(path.resolve(root,'../output/小喜鹊原型升级-20260906')).filter(n=>/^\d\d-.*\.png$/.test(n)).sort()
const runtimeImages=refs.map(name=>({name,present:fs.existsSync(path.join(root,'docs/visual-acceptance/latest',name))}))
const data={generatedAt:new Date().toISOString(),baselineCommit:cp.execFileSync('git',['-C',baseline,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),baselineWorktree:cp.execFileSync('git',['-C',baseline,'status','--porcelain'],{encoding:'utf8'}).trim()||'clean',oldAnchors:oldAnchors.size,newAnchors:newAnchors.size,missingAnchors,oldFunctionCount:oldFunctions.size,newFunctionCount:newFunctions.size,missingFunctions,changedFunctions,missingAssets,changedAssets,unchangedCore,runtimeImages}
fs.writeFileSync(path.join(root,'docs/visual-acceptance/latest/parity-report.json'),JSON.stringify(data,null,2))
fs.writeFileSync(path.join(root,'docs/visual-acceptance/latest/parity-report.md'),'# 功能静态等价性核对\n\n'+`原项目 ${data.baselineCommit}；工作区 ${data.baselineWorktree}。\n\n静态锚点 ${data.oldAnchors} → ${data.newAnchors}，缺失 ${missingAnchors.length}。主状态文件原函数 ${data.oldFunctionCount} → ${data.newFunctionCount}，缺失 ${missingFunctions.length}。\n\n函数实现有变动：${changedFunctions.join('、')||'无'}。原静态资源缺失 ${missingAssets.length}，原资源内容被改动 ${changedAssets.length}。\n\n`+'| 核心文件 | 完全一致 |\n|---|---|\n'+unchangedCore.map(r=>`| ${r.file} | ${r.unchanged?'是':'否，需审查'} |`).join('\n')+'\n\n静态检查不证明所有动作运行正确；需合并浏览器记录、状态故障注入与视觉对照。\n')
console.log(JSON.stringify(data,null,2))
process.exitCode=missingAnchors.length||missingFunctions.length||missingAssets.length||changedAssets.length?1:0
