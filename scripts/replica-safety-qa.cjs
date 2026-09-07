// Local disposable states only; original symptom labels/handlers are the oracle.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{createRequire}=require('node:module')
const {chromium}=createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright')
const {root,out,baseUrl,readPrototypeState,writePrototypeState}=require('./replica-qa-config.cjs')
const {exerciseGames,exerciseCategories}=require('../src/lib/prototype-data.ts')
const {auditReadability}=require('./replica-readability-audit.cjs')
const results=[],errors=[];let browser,page
const id=s=>page.getByTestId(s)
async function main(){
 await fs.mkdir(out,{recursive:true});browser=await chromium.launch({headless:true,channel:'chrome'})
 const source=await fs.readFile(path.resolve(root,'../小喜鹊精简功能版/src/pages/index/index.vue'),'utf8')
 const symptomSource=source.match(/const symptomOptions = \[([\s\S]*?)\];/)[1]
 const options=[...symptomSource.matchAll(/value: "([^"]+)", label: "([^"]+)"/g)].slice(0,3).map(m=>({value:m[1],label:m[2]}));assert.equal(options.length,3)
 for(const role of ['public','cardiac']){
  const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai'})
  page=await context.newPage();page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())})
  await page.goto(baseUrl,{waitUntil:'networkidle'});await id(role==='public'?'choose-public':'choose-cardiac').click()
  if(role==='cardiac'){await id('visit-number').locator('input').fill('256572');await id('bind-plan').click();await id('binding-result').waitFor();await id('bind-plan').click()}
  await id('today-screen').waitFor();const baseline=await readPrototypeState(page)
  const fixture={...baseline,publishedPolicy:{...baseline.publishedPolicy,preMode:'off',postMode:'off'}}
  for(const state of ['active','paused']){
   const name=role+'-'+state,measurements=[],branches=[]
   try{
    const priorErrors=errors.length
    for(const [index,option]of [...options,{value:'stop-now',label:'主动停止本次运动'}].entries()){
     await writePrototypeState(page,fixture);await page.reload({waitUntil:'networkidle'})
     if(role==='public'){
      const game=exerciseGames.find(g=>g.id==='music');await id('home-exercises').click();await id('selection-category').nth(exerciseCategories.findIndex(c=>c.id===game.categoryId)).click();await id('selection-exercise').filter({hasText:game.title}).click()
     }else await page.locator('[data-testid="prescription-slide"][aria-hidden="false"] .task-primary').click()
     await id('training-screen').waitFor();if(state==='paused')await id('toggle-training').click()
     await id('training-discomfort').click();await id('stop-modal').waitFor()
     assert.deepEqual(await id('stop-symptom').allTextContents().then(v=>v.map(s=>s.trim())),options.map(o=>o.label))
     await id('stop-symptom').locator('img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())))
     assert.equal(await id('stop-symptom').count(),3)
     if(index===0){
      for(const [width,height]of [[360,800],[390,844],[430,932]]){
       await page.setViewportSize({width,height});await page.waitForTimeout(80)
       const dimensions=await id('stop-modal').evaluate(mask=>{
        const card=mask.querySelector('.danger-modal'),r=card.getBoundingClientRect(),title=card.querySelector('uni-text'),t=title.getBoundingClientRect()
        return {card:{x:r.x,y:r.y,width:r.width,height:r.height,right:r.right,bottom:r.bottom},titleAlign:getComputedStyle(title).textAlign,titleCenter:t.x+t.width/2,buttons:[...card.querySelectorAll('uni-button')].map(b=>{const q=b.getBoundingClientRect();return {label:b.textContent.trim(),x:q.x,y:q.y,width:q.width,height:q.height,right:q.right,bottom:q.bottom}})}
       })
       assert.equal(dimensions.buttons.length,5);assert.equal(dimensions.titleAlign,'center');assert.ok(Math.abs(dimensions.titleCenter-(dimensions.card.x+dimensions.card.width/2))<1)
       assert.ok(dimensions.card.x>=0&&dimensions.card.right<=width&&dimensions.card.y>=0&&dimensions.card.bottom<=height)
       assert.ok(dimensions.buttons.every(b=>b.height>=44&&b.x>=dimensions.card.x&&b.right<=dimensions.card.right&&b.bottom<=dimensions.card.bottom))
       const primaryContrast=await id('stop-immediately').evaluate(e=>{
        const style=getComputedStyle(e),colors=[...style.backgroundImage.matchAll(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/g)].map(m=>m.slice(1).map(Number))
        if(style.color!=='rgb(255, 255, 255)'||colors.length!==2)throw Error('Re-audit changed danger foreground/gradient format')
        const luminance=c=>c.map(v=>v/255).map(v=>v<=.04045?v/12.92:((v+.055)/1.055)**2.4).reduce((sum,v,i)=>sum+v*[.2126,.7152,.0722][i],0)
        // A channel-wise maximum bounds every color in this two-stop sRGB
        // interpolation, including cases where one endpoint has more blue.
        const upperBound=colors[0].map((v,i)=>Math.max(v,colors[1][i]))
        return {foreground:style.color,background:style.backgroundImage,conservativeRatio:1.05/(luminance(upperBound)+.05),ratios:Array.from({length:11},(_,i)=>1.05/(luminance(colors[0].map((v,c)=>v+(colors[1][c]-v)*i/10))+.05))}
       })
       assert.ok(primaryContrast.conservativeRatio>=4.5&&primaryContrast.ratios.every(r=>r>=4.5),'Safety primary white label contrast')
       const readability=await page.evaluate(auditReadability);assert.equal(readability.smallText.length,0);assert.equal(readability.smallTargets.length,0);assert.equal(readability.lowPlainContrast.length,0)
       measurements.push({width,height,dimensions,readability,primaryContrast});await page.screenshot({path:path.join(out,`SAFETY-${name}-${width}.png`)})
      }
      await id('return-to-training').click();assert.equal(await id('stop-modal').count(),0);assert.equal(await page.locator('.prototype-shell').getAttribute('data-state'),state)
      const cancelled=await readPrototypeState(page);assert.deepEqual(cancelled.sessions,baseline.sessions);assert.deepEqual(cancelled.wallet,baseline.wallet);await id('training-discomfort').click()
     }
     const action=option.value==='stop-now'?id('stop-immediately'):id('stop-symptom').filter({hasText:option.label})
     await action.click();await id('session-report-screen').waitFor();const after=await readPrototypeState(page)
     assert.equal(after.sessions.length,baseline.sessions.length+1);assert.equal(after.sessions[0].status,'stopped');assert.equal(after.sessions[0].stoppedReason,option.label);assert.deepEqual(after.wallet,baseline.wallet);assert.deepEqual(after.checkIns,baseline.checkIns)
     await page.reload({waitUntil:'networkidle'});const restored=await readPrototypeState(page);assert.equal(restored.sessions[0].stoppedReason,option.label);assert.equal(restored.sessions[0].status,'stopped')
     branches.push({action:option.value,reason:option.label,status:after.sessions[0].status,rewardDelta:0,persisted:true})
    }
    assert.equal(errors.length,priorErrors);results.push({name,status:'PASS',measurements,branches});console.log('PASS '+name)
   }catch(e){results.push({name,status:'FAIL',actual:e.stack,measurements,branches});console.log('FAIL '+name+' '+e.message);await page.screenshot({path:path.join(out,'SAFETY-FAIL-'+name+'.png')}).catch(()=>{})}
  }
  await context.close()
 }
}
main().catch(e=>results.push({name:'runner',status:'FAIL',actual:e.stack})).finally(async()=>{await fs.writeFile(path.join(out,'safety-run.json'),JSON.stringify({generatedAt:new Date().toISOString(),environment:baseUrl,results,errors,notProven:['WeChat/App native overlays and screen readers','medical correctness or diagnosis','all patient post-assessment policy combinations; existing browser/keyboard tests separately cover required post mode']},null,2));await browser?.close();console.log(JSON.stringify({pass:results.filter(x=>x.status==='PASS').length,fail:results.filter(x=>x.status==='FAIL').length,errors:errors.length}));process.exitCode=results.some(x=>x.status==='FAIL')||errors.length?1:0})
