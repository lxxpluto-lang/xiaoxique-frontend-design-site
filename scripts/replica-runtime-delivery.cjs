// Creates a new, independent runtime copy. Never edits/deletes source or builds.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict')
const root=path.resolve(__dirname,'..'),staticRoot=path.join(root,'src/static')
const evidence=path.join(root,'docs/visual-acceptance/latest')
const walk=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>{
 if(e.isSymbolicLink())throw Error('Symlink requires explicit review: '+path.join(dir,e.name))
 return e.isDirectory()?walk(path.join(dir,e.name)):e.isFile()?[path.join(dir,e.name)]:[]
})
const digest=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex')
const textFile=p=>/\.(vue|ts|js|json|scss|css|html|wxml|wxss|svg)$/.test(p)
const rel=p=>path.relative(root,p).split(path.sep).join('/')
const sourceFiles=walk(path.join(root,'src')).filter(p=>!p.startsWith(staticRoot+path.sep))
const buildRun=JSON.parse(fs.readFileSync(path.join(evidence,'build-run.json'),'utf8'))
assert.equal(buildRun.length,5,'Run the full build checks first')
assert.ok(buildRun.every(x=>x.code===0),'Build checks must pass first')
const sourceSnapshot=sourceFiles.map(file=>({file:rel(file),sha256:digest(file)}))
for(const platform of ['h5','mp-weixin','app']){
 const run=buildRun.find(x=>x.script==='build:'+platform);assert.ok(run)
 assert.ok(sourceFiles.every(p=>fs.statSync(p).mtimeMs<=Date.parse(run.started)),platform+' build predates source changes; rebuild')
}
const references=new Map(),prefixes=new Map()
const add=(map,url,from)=>{if(!map.has(url))map.set(url,new Set());map.get(url).add(from)}
const scan=(file,from)=>{
 const content=fs.readFileSync(file,'utf8')
 for(const m of content.matchAll(/\/?static\/[A-Za-z0-9_./-]+/g)){
  const url='/'+m[0].replace(/^\//,'')
  assert.ok(!url.split('/').includes('..'),'Out-of-scope static reference '+url)
  const suffix=content.slice(m.index+m[0].length)
  add(/\.[a-z0-9]+$/i.test(url)&&!suffix.startsWith('${')?references:prefixes,url,from)
 }
}
sourceFiles.filter(textFile).forEach(p=>scan(p,rel(p)))
const buildFiles={}
for(const platform of ['h5','mp-weixin','app']){
 const base=path.join(root,'dist/build',platform)
 buildFiles[platform]=walk(base).map(file=>({file,relative:path.relative(base,file).split(path.sep).join('/'),bytes:fs.statSync(file).size,sha256:digest(file)}))
 buildFiles[platform].filter(x=>!x.relative.startsWith('static/')&&textFile(x.file)).forEach(x=>scan(x.file,rel(x.file)))
}
const {activities}=require('../src/lib/rive-motion.ts')
const disabledRive=new Map(activities.filter(x=>x.rive.enabled===false).map(x=>[x.rive.src,x.id]))
const assets=walk(staticRoot).map(file=>({file,url:'/static/'+path.relative(staticRoot,file).split(path.sep).join('/'),bytes:fs.statSync(file).size,sha256:digest(file)}))
const existing=new Set(assets.map(x=>x.url)),missing=[]
const resolveMissing=()=>{for(const url of references.keys())if(!existing.has(url)){
 assert.ok(disabledRive.has(url),'Unresolved runtime asset '+url)
 if(!missing.some(x=>x.url===url))missing.push({url,reason:'existing enabled:false Rive declaration; original MP4 fallback preserved',activity:disabledRive.get(url)})
}}
// Conservatively retain entire dynamic path prefixes; no inferred icon deletion.
const needed=a=>references.has(a.url)||[...prefixes.keys()].some(p=>a.url.startsWith(p))
const scanned=new Set()
for(let changed=true;changed;){changed=false;for(const a of assets.filter(needed))if(textFile(a.file)&&!scanned.has(a.url)){
 scanned.add(a.url);scan(a.file,rel(a.file));changed=true
 // SVG/CSS relative local dependencies must be present and join the closure.
 const content=fs.readFileSync(a.file,'utf8')
 for(const m of content.matchAll(/(?:\b(?:href|src)\s*=\s*["']|url\(\s*["']?)([^\s"'<>)]*)/g)){
  const value=m[1];if(!value||/^(#|data:|https?:|\/\/)/.test(value))continue
  const target=path.resolve(path.dirname(a.file),value.split(/[?#]/)[0])
  assert.ok(target.startsWith(staticRoot+path.sep),'Relative asset leaves static tree: '+value)
  add(references,'/static/'+path.relative(staticRoot,target).split(path.sep).join('/'),rel(a.file))
 }
}}
resolveMissing()
const selected=assets.filter(needed),excluded=assets.filter(a=>!needed(a))
assert.ok(selected.length>0&&selected.length<assets.length)
for(const activity of activities){assert.ok(selected.some(a=>a.url===activity.video));assert.ok(selected.some(a=>a.url===activity.poster))}
const base=path.join(root,'dist/runtime-delivery');fs.mkdirSync(base,{recursive:true})
const runDir=fs.mkdtempSync(path.join(base,'run-'))
const manifest={
 generatedAt:new Date().toISOString(),runDir,
 scope:'Independent copy; no deletion, re-encoding, external hosting, business or original build changes',
 sourceSnapshot,buildRun,disabledMissingRive:missing,
 dynamicPrefixes:[...prefixes].map(([prefix,from])=>({prefix,from:[...from]})),
 selectedAssets:selected.map(({file,...a})=>({...a,reasons:[
  ...(references.get(a.url)||[]),
  ...[...prefixes].filter(([p])=>a.url.startsWith(p)).map(([p])=>'dynamic-prefix:'+p)
 ]})),
 excludedAssets:excluded.map(({file,...a})=>({...a,reason:'not selected by source+compiled reference closure; preserved in source and full builds'})),
 platforms:[],notProven:['WeChat/App device runtime','platform upload size/approval','all possible future dynamic paths','pixel-identical visual acceptance']
}
for(const platform of ['h5','mp-weixin','app']){
 const files=buildFiles[platform],target=path.join(runDir,platform),allow=new Set(selected.map(a=>a.url.slice(1)))
 const kept=files.filter(x=>!x.relative.startsWith('static/')||allow.has(x.relative))
 for(const a of selected){const built=files.find(x=>x.relative===a.url.slice(1));assert.ok(built,platform+' missing selected '+a.url);assert.equal(built.sha256,a.sha256,platform+' asset differs from source '+a.url)}
 for(const f of kept){const dest=path.join(target,f.relative);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(f.file,dest,fs.constants.COPYFILE_EXCL);assert.equal(digest(dest),f.sha256)}
 manifest.platforms.push({platform,target,beforeFiles:files.length,afterFiles:kept.length,beforeBytes:files.reduce((n,x)=>n+x.bytes,0),afterBytes:kept.reduce((n,x)=>n+x.bytes,0),kept:kept.map(({file,...x})=>x),excluded:files.filter(x=>!kept.includes(x)).map(({file,...x})=>x)})
}
for(const p of manifest.platforms)for(const f of buildFiles[p.platform])assert.equal(digest(f.file),f.sha256,'Original build changed')
for(const a of assets)assert.equal(digest(a.file),a.sha256,'Source asset changed')
for(const s of sourceSnapshot)assert.equal(digest(path.join(root,s.file)),s.sha256,'Source changed during packaging')
fs.writeFileSync(path.join(runDir,'manifest.json'),JSON.stringify(manifest,null,2))
fs.writeFileSync(path.join(evidence,'runtime-delivery.json'),JSON.stringify(manifest,null,2))
const mib=n=>(n/1024/1024).toFixed(2)
fs.writeFileSync(path.join(evidence,'runtime-delivery.md'),['# 独立运行分发副本','','状态：REVIEW_COMPLETE_WITH_GAPS。仅文件闭包与逐文件hash验证，浏览器与平台证据另列。','','| 平台 | 原始MiB | 分发MiB | 减少MiB | 文件数 |','|---|---:|---:|---:|---:|',...manifest.platforms.map(p=>`| ${p.platform} | ${mib(p.beforeBytes)} | ${mib(p.afterBytes)} | ${mib(p.beforeBytes-p.afterBytes)} | ${p.beforeFiles}→${p.afterFiles} |`),'',`输出：${runDir}`,'',`保留${selected.length}项静态资产；${excluded.length}项未纳入本次分发，但仍完整保留在源目录和原始编译产物。所有非static代码/配置/平台组件原样复制。`,'','来源与编译代码的字面引用取并集，动态前缀全部保留；选中SVG/CSS本地依赖继续递归。三个enabled:false的未落盘Rive声明仍走原MP4回退。未转码、未更换图片格式/视频内容、未上传CDN、未改业务或manifest配置。','','这不是微信可上传包、真机运行或完整分包方案证明。后续新增动态引用须重新生成并复测。','','[逐文件白名单、排除记录和校验值](runtime-delivery.json)',''].join('\n'))
console.log(JSON.stringify({runDir,selected:selected.length,excluded:excluded.length,platforms:manifest.platforms.map(({kept,excluded,...p})=>p)},null,2))
