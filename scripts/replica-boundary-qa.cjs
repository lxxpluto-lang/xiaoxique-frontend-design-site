// Additional bounded, disposable browser tests. Clock acceleration is not real exercise.
const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict')
const {createRequire}=require('node:module'),{chromium}=createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright')
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/visual-acceptance/latest'),results=[],errors=[]
let browser,page,ctx,baseline,completed
const id=s=>page.getByTestId(s),button=s=>page.locator('uni-button').filter({hasText:s}).first()
async function store(){return page.evaluate(()=>uni.getStorageSync('magpie-prototype-state'))}
async function seed(s){await page.evaluate(s=>uni.setStorageSync('magpie-prototype-state',s),s);await page.reload({waitUntil:'networkidle'})}
async function back(){if(await page.locator('.detail-header').count())await page.locator('.detail-header uni-button').first().click()}
async function nav(s){await back();await id('nav-'+s).click()}
async function screen(s){await page.locator('uni-toast').waitFor({state:'hidden',timeout:3500}).catch(()=>{});await page.screenshot({path:path.join(out,'BOUNDARY-'+s+'.png')})}
async function check(name,work){try{const prior=errors.length,actual=await work();assert.equal(errors.length,prior);results.push({name,status:'PASS',actual:actual||'断言通过'});console.log('PASS '+name)}catch(e){results.push({name,status:'FAIL',actual:e.message});console.log('FAIL '+name+' '+e.message.split('\n')[0]);await screen('FAIL-'+name).catch(()=>{})}}
async function reports(){await nav('today');await id('home-mini-report').click();await id('mini-report-records').click()}
async function main(){
 await fs.mkdir(out,{recursive:true});browser=await chromium.launch({headless:true,channel:'chrome'});ctx=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai',locale:'zh-CN'});page=await ctx.newPage();page.setDefaultTimeout(5000);page.on('pageerror',e=>errors.push(e.message));await page.goto('http://127.0.0.1:4173/',{waitUntil:'networkidle'});await id('choose-public').click();baseline=await store()
 await check('ARUN-01-自然计时完成',async()=>{
  await page.clock.install();await id('home-exercises').click();await id('selection-category').nth(2).click();await id('selection-exercise').first().click();await id('training-screen').waitFor();await page.clock.runFor(181000);await id('session-report-screen').waitFor();completed=(await store()).sessions[0];assert.equal(completed.status,'completed');assert.equal(completed.demoCompleted,false);assert.equal(completed.durationSeconds,180);await screen('公众自然结束');return '浏览器时钟加速执行 180 秒计时器，非快速演示按钮；completed 且 demoCompleted=false。不是人体运动或实时 3 分钟验收。'
 })
 await check('ARUN-05-暂停继续单计时器',async()=>{
  await seed(baseline);await id('home-exercises').click();await id('selection-category').nth(2).click();await id('selection-exercise').first().click();await id('toggle-training').click();const before=await page.locator('.training-timer').innerText();await page.clock.runFor(5000);assert.equal(await page.locator('.training-timer').innerText(),before);await id('toggle-training').click();await page.clock.runFor(2000);const after=await page.locator('.training-timer').innerText();assert.match(after,/00:02/);await id('training-discomfort').click();await id('stop-immediately').click();return '暂停 5 秒计时不变；继续后 2 秒只累计 2 秒，没有重复计时器。'
 })
 await check('ARUN-08-空报告与5日门槛',async()=>{
  await seed({...baseline,sessions:[]});await reports();assert.match(await id('daily-report-list').innerText(),/完成运动后/);await id('report-tab-monthly').click();await id('monthly-report-row').first().click();assert.match(await id('training-reports').innerText(),/有效训练日不足/);await screen('阶段不足')
  assert.ok(completed);const month=new Date().toISOString().slice(0,7);const sessions=Array.from({length:5},(_,i)=>({...completed,id:'QA-DAY-'+i,createdAt:month+'-'+String(i+1).padStart(2,'0')+'T10:00:00+08:00',localDate:month+'-'+String(i+1).padStart(2,'0')}));await seed({...baseline,sessions});await reports();assert.equal(await page.locator('.history-bars>uni-view').count(),5);await id('report-tab-monthly').click();await id('monthly-report-row').first().click();assert.match(await id('training-reports').innerText(),/数据完整率/);assert.doesNotMatch(await id('training-reports').innerText(),/有效训练日不足/);await screen('阶段达到5日');return '空状态、0日不足、5个日期合成记录达到门槛；不伪造真实跨日使用。'
 })
 await check('ARUN-10-小队创建邀请码和提醒去重',async()=>{
  await seed(baseline);await nav('profile');await id('preview-team').click();await page.locator('.team-code-form input').fill('BAD-CODE');await id('join-team-code').click();assert.equal((await store()).teamState.joined,false);assert.equal(await page.locator('.team-code-form input').inputValue(),'BAD-CODE');await id('create-team').click();assert.equal((await store()).teamState.joined,true)
  await seed(baseline);await nav('profile');await id('preview-team').click();await page.locator('.team-code-form input').fill('XQ-7DAY');await id('join-team-code').click();await page.locator('.remind-button').first().click();const before=await store();await page.locator('.remind-button').first().click();assert.deepEqual((await store()).teamState.reminderDates,before.teamState.reminderDates);await page.reload({waitUntil:'networkidle'});assert.deepEqual((await store()).teamState.reminderDates,before.teamState.reminderDates)
 })
 await check('ARUN-10-搭子缺卡不解除不扣分',async()=>{
  await nav('profile');await id('preview-buddy').click();await page.locator('.buddy-cycle uni-button').last().click();await id('connect-buddy').click();await page.locator('.buddy-remind').click();const before=await store();await page.locator('.buddy-remind').click();assert.equal((await store()).buddyState.reminderSentDate,before.buddyState.reminderSentDate);await seed({...before,checkIns:[{date:'2020-01-01',source:'legacy-demo',pointsAwarded:0,createdAt:'2020-01-01T00:00:00'}]});const after=await store();assert.equal(after.buddyState.connected,true);assert.equal(after.buddyState.cycleDays,30);assert.equal(after.wallet.healthPoints,before.wallet.healthPoints)
 })
 await check('ARUN-11-不足取消兑换与换币',async()=>{
  await seed({...baseline,wallet:{...baseline.wallet,healthPoints:0,mCoins:0}});await nav('profile');await id('preview-rewards').click();for(const b of await page.locator('.reward-grid uni-button').all())assert.equal(await b.getAttribute('disabled'),'true')
  await seed({...baseline,wallet:{...baseline.wallet,healthPoints:500,mCoins:0}});await nav('profile');await id('preview-rewards').click();await page.locator('.reward-grid uni-button').first().click();await page.locator('.uni-modal__btn').filter({hasText:'取消'}).click()
  // Wait for the actual closing transition and restored background, not a fixed
  // delay or forced fill through an intentionally inert modal background.
  await page.locator('uni-modal').waitFor({state:'hidden'})
  await page.waitForFunction(()=>!document.querySelector('[data-testid="mem-code"]')?.closest('[inert]'))
  assert.equal((await store()).wallet.healthPoints,500)
  await id('mem-code').locator('input').fill('MEM-2026');assert.equal(await id('mem-code').locator('input').inputValue(),'MEM-2026');await id('unlock-mem').click();await page.locator('.convert-button').click();assert.equal((await store()).wallet.healthPoints,400);assert.equal((await store()).wallet.mCoins,5);await page.reload({waitUntil:'networkidle'});assert.equal((await store()).wallet.mCoins,5)
 })
 await check('ARUN-12-四类建议与审核边界',async()=>{
  await seed({...baseline,mode:'cardiac'});for(const [label,level] of [['稳定','stable'],['需关注','attention'],['危险症状','stop'],['数据不足','insufficient']]){await nav('profile');await button(/训练状态策略/).click();await page.locator('.scenario-section uni-button').filter({hasText:label}).click();assert.equal((await store()).sessions[0].advice.level,level)}const before=await store();await nav('profile');await button(/医生审核队列/).click();assert.equal((await store()).planAdjustment,before.planAdjustment);return '四类建议生成正确；未审核时计划调整字段保持原值。同意/维持/驳回实测另见 browser-run.json。'
 })
 await check('ARUN-13-公众过滤与禁用原入口',async()=>{
  await seed(baseline);await id('nav-discover').click();assert.equal(await id('knowledge-team-entry').getAttribute('disabled'),'true');assert.equal(await id('knowledge-buddy-entry').getAttribute('disabled'),'true');await id('nav-profile').click();assert.equal(await id('points-exchange-unavailable').getAttribute('disabled'),'true');return '原社交与积分入口仍禁用，独立本地预览不改变源业务开放状态。'
 })
 await check('CAMERA-拒绝权限安全回退',async()=>{
  await seed(baseline);await id('home-exercises').click();await page.locator('[data-exercise-id="taichi"]').click();await page.locator('[data-action="ACT-CAMERA-ENABLE"]').click();await page.locator('.camera-preview[data-state="denied"]').waitFor();assert.match(await page.locator('.camera-status').innerText(),/无法使用/);await screen('摄像头拒绝回退');await id('training-discomfort').click();await id('stop-immediately').click()
 })
}
main().catch(e=>results.push({name:'runner',status:'FAIL',actual:e.stack})).finally(async()=>{await fs.writeFile(path.join(out,'boundary-run.json'),JSON.stringify({generatedAt:new Date().toISOString(),results,errors},null,2));await browser?.close();console.log(JSON.stringify({pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length,errors:errors.length}));process.exitCode=results.some(r=>r.status==='FAIL')?1:0})
