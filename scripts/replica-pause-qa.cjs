const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict'),{createRequire}=require('node:module')
const {chromium}=createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright')
const {out,baseUrl,readPrototypeState,writePrototypeState}=require('./replica-qa-config.cjs')
const {exerciseGames,exerciseCategories}=require('../src/lib/prototype-data.ts')
const {auditReadability}=require('./replica-readability-audit.cjs')
const results=[],errors=[];let browser,page,baseline
const id=s=>page.getByTestId(s)
async function main(){
 await fs.mkdir(out,{recursive:true});browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-fake-device-for-media-stream']})
 page=await browser.newPage({viewport:{width:390,height:844},permissions:['camera'],timezoneId:'Asia/Shanghai'});page.setDefaultTimeout(6000)
 page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text())})
 await page.goto(baseUrl,{waitUntil:'networkidle'});await id('choose-public').click();baseline=await readPrototypeState(page)
 for(const gameId of ['taichi','resistance','music']){
  const game=exerciseGames.find(x=>x.id===gameId),measurements=[]
  try{
   const prior=errors.length;await writePrototypeState(page,baseline);await page.reload({waitUntil:'networkidle'})
   await id('home-exercises').click();await id('selection-category').nth(exerciseCategories.findIndex(c=>c.id===game.categoryId)).click();await id('selection-exercise').filter({hasText:game.title}).click()
   if(game.interaction==='camera-score'){await page.locator('[data-action="ACT-CAMERA-ENABLE"]').click();await page.locator('.camera-preview[data-state="ready"]').waitFor()}
   if(game.interaction==='rep-game')await page.locator('.game-action').click()
   if(game.interaction==='rhythm-game')await page.locator('.beat-button').click()
   await id('toggle-training').click();await id('training-paused').waitFor()
   const timer=await page.locator('.training-timer').innerText();await page.waitForTimeout(1200);assert.equal(await page.locator('.training-timer').innerText(),timer)
   assert.match(await page.locator('.detail-header').innerText(),/训练已暂停/)
   assert.equal(await page.locator('.paused-exercise-name').innerText(),game.title)
   assert.equal(await id('toggle-training').innerText(),'继续训练')
   const img=id('paused-magpie-art').locator('img');await img.evaluate(i=>i.decode());assert.match(await img.getAttribute('src'),/magpie-resting-v1\.png$/)
   for(const [width,height]of[[360,800],[390,844],[430,932]]){
    await page.setViewportSize({width,height});await page.locator('.uni-scroll-view').evaluateAll(es=>es.forEach(e=>e.scrollTop=0));await page.waitForTimeout(100)
    const cards=await page.locator('.exercise-controls--paused>uni-button').evaluateAll(es=>es.map(e=>{const r=e.getBoundingClientRect();return{text:e.textContent.trim(),x:r.x,y:r.y,width:r.width,height:r.height,right:r.right}}))
    assert.equal(cards.length,3);assert.ok(cards.every(r=>r.height>=44&&r.x>=0&&r.right<=width));assert.ok(cards[0].width>cards[1].width*1.8,'Continue must be full-width primary action');assert.ok(cards[1].y>cards[0].y);assert.equal(Math.round(cards[1].y),Math.round(cards[2].y))
    const audit=await page.evaluate(auditReadability);assert.equal(audit.smallText.length,0);assert.equal(audit.smallTargets.length,0);assert.equal(audit.lowPlainContrast.length,0)
    measurements.push({width,height,buttons:cards,readability:audit});await page.screenshot({path:path.join(out,`PAUSE-${gameId}-${width}.png`)})
   }
   const countSelector=game.interaction==='rep-game'?'.rep-count':game.interaction==='rhythm-game'?'.rhythm-stats':null
   if(countSelector){const count=await page.locator(countSelector).innerText();assert.equal(await page.locator(game.interaction==='rep-game'?'.game-action':'.beat-button').getAttribute('disabled'),'true');await page.waitForTimeout(150);assert.equal(await page.locator(countSelector).innerText(),count)}
   await id('toggle-training').click();assert.equal(await id('training-paused').count(),0);assert.equal(await page.locator('.prototype-shell').getAttribute('data-state'),'active');await page.waitForTimeout(1100);assert.notEqual(await page.locator('.training-timer').innerText(),timer)
   await id('toggle-training').click();await id('training-discomfort').click();await id('stop-modal').waitFor();await id('return-to-training').click();assert.equal(await page.locator('.prototype-shell').getAttribute('data-state'),'paused')
   await id('training-discomfort').click();await id('stop-immediately').click();await id('session-report-screen').waitFor();const after=await readPrototypeState(page);assert.equal(after.sessions[0].status,'stopped');assert.equal(after.sessions[0].exerciseId,gameId);assert.equal(after.wallet.healthPoints,baseline.wallet.healthPoints);assert.equal(after.checkIns.length,baseline.checkIns.length);assert.equal(errors.length,prior)
   const completionPaths=[]
   for(const [action,demo]of[['end-paused-training',false],['demo-complete',true]]){
    await writePrototypeState(page,baseline);await page.reload({waitUntil:'networkidle'});await id('home-exercises').click();await id('selection-category').nth(exerciseCategories.findIndex(c=>c.id===game.categoryId)).click();await id('selection-exercise').filter({hasText:game.title}).click();await id('toggle-training').click();await id(action).click();await id('session-report-screen').waitFor()
    const completed=await readPrototypeState(page);assert.equal(completed.sessions[0].status,'completed');assert.equal(completed.sessions[0].exerciseId,gameId);assert.equal(Boolean(completed.sessions[0].demoCompleted),demo);assert.equal(completed.sessions.length,baseline.sessions.length+1);assert.ok(completed.wallet.healthPoints>=baseline.wallet.healthPoints);completionPaths.push({action,status:completed.sessions[0].status,demoCompleted:Boolean(completed.sessions[0].demoCompleted),pointsDelta:completed.wallet.healthPoints-baseline.wallet.healthPoints})
   }
   assert.equal(errors.length,prior)
   results.push({name:gameId,status:'PASS',measurements,completionPaths,actual:'Three sizes: resting purple art, primary continue, original completion/demo actions preserved. Timer freezes/resumes; discomfort cancel stays paused; explicit safety stop adds no rewards. Ordinary and demo completion still use baseline completed semantics.'});console.log('PASS '+gameId)
  }catch(e){results.push({name:gameId,status:'FAIL',actual:e.stack,measurements});console.log('FAIL '+gameId+' '+e.message);await page.screenshot({path:path.join(out,'PAUSE-FAIL-'+gameId+'.png')}).catch(()=>{})}
 }
}
main().catch(e=>results.push({name:'runner',status:'FAIL',actual:e.stack})).finally(async()=>{await fs.writeFile(path.join(out,'pause-run.json'),JSON.stringify({generatedAt:new Date().toISOString(),environment:baseUrl,results,errors,notProven:['real camera or WeChat/App device','full video duration','pixel-identical visual match']},null,2));await browser?.close();console.log(JSON.stringify({pass:results.filter(x=>x.status==='PASS').length,fail:results.filter(x=>x.status==='FAIL').length,errors:errors.length}));process.exitCode=results.some(x=>x.status==='FAIL')||errors.length?1:0})
