// Verifies this exact independent artifact, not the source development server.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict')
const {root,baseUrl}=require('./replica-qa-config.cjs')
const out=path.join(root,'docs/visual-acceptance/latest'),m=JSON.parse(fs.readFileSync(path.join(out,'runtime-delivery.json'),'utf8'))
const hash=b=>crypto.createHash('sha256').update(b).digest('hex')
const fileHash=p=>hash(fs.readFileSync(p)),results=[],requests=[]
const check=async(name,fn)=>{try{const actual=await fn();results.push({name,status:'PASS',actual});console.log('PASS '+name)}catch(e){results.push({name,status:'FAIL',actual:e.stack});console.log('FAIL '+name+' '+e.message)}}
async function main(){
 await check('三端分发所有保留文件与原编译逐字节一致',async()=>{
  let count=0
  for(const p of m.platforms)for(const f of p.kept){assert.equal(fileHash(path.join(p.target,f.relative)),f.sha256);assert.equal(fileHash(path.join(root,'dist/build',p.platform,f.relative)),f.sha256);count++}
  return {files:count,platforms:m.platforms.map(p=>p.platform)}
 })
 await check('原素材与未纳入分发的历史文件仍完整',async()=>{
  for(const a of [...m.selectedAssets,...m.excludedAssets])assert.equal(fileHash(path.join(root,'src',a.url.slice(1))),a.sha256)
  for(const p of m.platforms)for(const f of p.excluded){assert.equal(fileHash(path.join(root,'dist/build',p.platform,f.relative)),f.sha256);assert.equal(fs.existsSync(path.join(p.target,f.relative)),false)}
  for(const s of m.sourceSnapshot)assert.equal(fileHash(path.join(root,s.file)),s.sha256)
  return {sourceAssets:m.selectedAssets.length+m.excludedAssets.length,notDistributedButPreserved:m.excludedAssets.length,sourceFiles:m.sourceSnapshot.length}
 })
 await check('精简H5每个文件HTTP返回与白名单hash一致',async()=>{
  const p=m.platforms.find(p=>p.platform==='h5')
  // Sequential requests limit memory; content equality catches HTML SPA fallbacks.
  for(const f of p.kept){const url=new URL(f.relative,baseUrl).href,r=await fetch(url),b=Buffer.from(await r.arrayBuffer());requests.push({file:f.relative,status:r.status,bytes:b.length,sha256:hash(b)});assert.equal(r.status,200,f.relative);assert.equal(hash(b),f.sha256,f.relative+' response is not the packaged bytes')}
  return {url:baseUrl,files:p.kept.length,bytes:p.afterBytes}
 })
 await check('六个原视频可Range读取且内容未变',async()=>{
  const videos=m.selectedAssets.filter(a=>a.url.endsWith('.mp4'))
  assert.equal(videos.length,6)
  for(const v of videos){const response=await fetch(new URL(v.url,baseUrl),{headers:{Range:'bytes=0-1023'}});assert.equal(response.status,206,v.url);const bytes=Buffer.from(await response.arrayBuffer());assert.deepEqual(bytes,fs.readFileSync(path.join(root,'src',v.url.slice(1))).subarray(0,1024));assert.equal(response.headers.get('content-range'),'bytes 0-1023/'+v.bytes)}
  return {videos:videos.map(v=>v.url),range:'0-1023',note:'Byte/Range check, not proof of full-duration viewing; browser playback separately tested'}
 })
 await check('服务没有回落到全量历史素材目录',async()=>{
  const samples=m.excludedAssets.filter(a=>a.url.endsWith('.png')).slice(0,2);assert.equal(samples.length,2)
  const index=m.platforms.find(p=>p.platform==='h5').kept.find(f=>f.relative==='index.html'),probes=[]
  for(const a of samples){
   const r=await fetch(new URL(a.url,baseUrl)),b=Buffer.from(await r.arrayBuffer()),sha256=hash(b)
   assert.notEqual(sha256,a.sha256,'Excluded asset unexpectedly served: '+a.url)
   // Vite preview may serve index.html for an unknown URL. Require exactly the
   // known HTML bytes/type, not just a nonmatching digest or successful status.
   if(r.status!==404){assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/text\/html/);assert.equal(sha256,index.sha256)}
   probes.push({url:a.url,status:r.status,result:r.status===404?'not found':'exact packaged HTML fallback, not historical image'})
  }
  return {probes,note:'Deliberate exclusion probes; every retained file separately requires exact asset hash'}
 })
}
main().catch(e=>results.push({name:'runner',status:'FAIL',actual:e.stack})).finally(()=>{
 const data={generatedAt:new Date().toISOString(),baseUrl,runDir:m.runDir,manifestSha256:fileHash(path.join(m.runDir,'manifest.json')),results,requests,notProven:m.notProven}
 fs.writeFileSync(path.join(out,'runtime-delivery-validation.json'),JSON.stringify(data,null,2))
 console.log(JSON.stringify({pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length}))
 process.exitCode=results.some(r=>r.status==='FAIL')?1:0
})
