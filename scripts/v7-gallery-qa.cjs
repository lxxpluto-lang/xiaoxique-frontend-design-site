const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url'),{createRequire}=require('node:module');
const {chromium}=createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright');
const out=path.resolve(__dirname,'../docs/visual-acceptance/v7-20260907');
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(pathToFileURL(path.join(out,'全部28页-v7运行与参考对照图册.html')).href,{waitUntil:'load'});
  const images=await page.locator('img').evaluateAll(async es=>Promise.all(es.map(async e=>{e.loading='eager';try{await e.decode();return{src:e.getAttribute('src'),ok:e.naturalWidth>0,width:e.naturalWidth,height:e.naturalHeight}}catch{return{src:e.getAttribute('src'),ok:false}}})));
  assert.equal(await page.locator('section[id^="p"]').count(),28);assert.equal(images.length,84);assert.equal(images.filter(i=>!i.ok).length,0);assert.equal(errors.length,0);
  for(const width of [390,1440]){await page.setViewportSize({width,height:1000});assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth+1),false)}
  await fs.writeFile(path.join(out,'gallery-check.json'),JSON.stringify({generatedAt:new Date().toISOString(),pages:28,images:84,failedImages:0,errors,results:images},null,2));
  console.log({pages:28,images:84,failedImages:0,errors});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
