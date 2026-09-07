/** Local-only browser evidence. Never connects to hospitals or real devices. */
const fs = require('node:fs/promises')
const path = require('node:path')
const assert = require('node:assert/strict')
const { auditReadability } = require('./replica-readability-audit.cjs')
const { createRequire } = require('node:module')
const runtimeRequire = createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')
const { chromium } = runtimeRequire('playwright')
const {root,out,baseUrl,readPrototypeState}=require('./replica-qa-config.cjs')
const assetRequests=new Map()
const networkFailures=[],externalRequests=new Set()
function observeNetwork(p){
  p.on('requestfailed',r=>networkFailures.push({url:r.url(),reason:r.failure()?.errorText,resourceType:r.resourceType()}))
  p.on('request',r=>{if(/^https?:/.test(r.url())&&new URL(r.url()).origin!==new URL(baseUrl).origin)externalRequests.add(r.url())})
}
const results = [], errors = [], responses = [], responsive = []
const readability = []
let referenceNames = new Set()
let browser, context, page
const id = value => page.getByTestId(value)
const button = value => page.locator('uni-button').filter({ hasText: value }).first()
async function input(testid,value) { await id(testid).locator('input').fill(value) }
async function waitForArtwork(){
 await page.evaluate(async()=>{await Promise.all(Array.from(document.images).filter(i=>i.getAttribute('src')).map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
 await page.waitForTimeout(150);
}
async function snap(name) {
  await page.locator('uni-toast').waitFor({state:'hidden',timeout:3500}).catch(()=>{})
  await page.locator('.uni-scroll-view').evaluateAll(es => es.forEach(e => { e.scrollTop = 0 }))
  await page.waitForTimeout(550)
  await waitForArtwork()
  await page.screenshot({path:path.join(out,name+'.png')})
  if (/^\d\d-/.test(name)) {
    const original = page.viewportSize()
    try {
      for (const [width,height] of [[360,800],[390,844],[430,932]]) {
        await page.setViewportSize({width,height});await page.waitForTimeout(100)
        const overflow = await page.locator('.prototype-shell,.detail-content').evaluateAll(es => es.filter(e=>e.scrollWidth>e.clientWidth+1).map(e=>({class:e.className,width:e.clientWidth,scrollWidth:e.scrollWidth})))
        responsive.push({page:name,width,height,overflow})
        readability.push({ page: name, width, height, ...await page.evaluate(auditReadability) })
        await page.screenshot({path:path.join(out,'responsive',width+'-'+name+'.png')})
        if (overflow.length) console.log('OVERFLOW '+name+' at '+width)
      }
    } finally { await page.setViewportSize(original) }
  }
  console.log('SCREEN '+name)
}
async function back() { if(await page.locator('.detail-header').count())await page.locator('.detail-header uni-button').first().click() }
async function nav(name) { await back();await id('nav-'+name).click() }
async function saved() { return readPrototypeState(page) }
async function check(name,work) {
  try { const detail=await work();results.push({name,status:'PASS',actual:detail||'操作与断言通过'});console.log('PASS '+name) }
  catch(error) { results.push({name,status:'FAIL',actual:error.message});console.log('FAIL '+name+' '+error.message.split('\n')[0]);await snap('FAIL-'+name).catch(()=>{}) }
}
async function startPrescription() {
  await nav('today');await page.locator('.prescription-card .task-primary').first().click()
}
async function prefill() {
  await id('read-pre-vitals').click()
  await id('discomfort-score').locator('uni-slider').click({position:{x:55,y:15}})
  await id('begin-training').click()
  await id('training-screen').waitFor()
}
async function finishPost() {
  if(await id('postcheck-screen').count()) {
    await button('重新同步').click()
    await button(/^适中$/).click()
    await id('generate-report').click()
  }
  await id('session-report-screen').waitFor()
}
async function main() {
  await fs.mkdir(out,{recursive:true})
  await fs.mkdir(path.join(out,'responsive'),{recursive:true})
  referenceNames = new Set((await fs.readdir(path.resolve(root,'../output/小喜鹊原型升级-20260906'))).filter(n=>/^\d\d-.*\.png$/.test(n)))
  browser=await chromium.launch({headless:true,channel:'chrome',args:['--use-fake-device-for-media-stream']})
  context=await browser.newContext({viewport:{width:390,height:844},deviceScaleFactor:1,timezoneId:'Asia/Shanghai',locale:'zh-CN'})
  page=await context.newPage();page.setDefaultTimeout(5000)
  observeNetwork(page)
  page.on('pageerror',e=>errors.push({type:'pageerror',message:e.message}))
  page.on('console',m=>{if(m.type()==='error')errors.push({type:'console',message:m.text()})})
  page.on('response',r=>{if(r.status()>=400)responses.push({url:r.url(),status:r.status()});if(r.url().includes('/static/'))assetRequests.set(r.url(),{url:r.url(),status:r.status()})})
  await page.goto(baseUrl,{waitUntil:'networkidle'})
  await check('ARUN-03-绑定与错误重试',async()=>{
    await snap('07-选择使用方式');await id('choose-cardiac').click();await snap('08-关联康复计划-初始')
    await input('visit-number','not-valid');await id('bind-plan').click();await id('binding-error').waitFor();assert.equal(await id('visit-number').locator('input').inputValue(),'not-valid');await snap('08-关联康复计划-错误')
    await input('visit-number','P-256572');await id('bind-plan').click();await id('binding-result').waitFor();await snap('08-关联康复计划');await id('bind-plan').click();await id('today-screen').waitFor();await snap('01-今日首页')
    return '错误编号未进入应用且输入保留；P-256572 匹配并进入患者首页。'
  })
  await check('ARUN-02-患者演示训练闭环',async()=>{
    await startPrescription();await snap('02-运动前检查');await prefill();await snap('03-动作跟练-节奏互动')
    await id('toggle-training').click();const before=await page.locator('.training-timer').innerText();await page.waitForTimeout(1200);assert.equal(await page.locator('.training-timer').innerText(),before);await snap('28-训练暂停状态-节奏互动');await id('toggle-training').click()
    await id('demo-complete').click();await snap('10-运动后状态');await finishPost();await snap('04-本次运动报告');const data=await saved();assert.equal(data.sessions[0].status,'completed');assert.equal(data.sessions[0].demoCompleted,true)
    return '患者前检查、暂停计时冻结、继续、快速演示、后检查、报告均可达；沿用源项目快速演示打卡规则，不当作真实训练验收。'
  })
  await check('ARUN-06-不适停止',async()=>{
    const original=await saved();await startPrescription();await prefill();await id('training-discomfort').click();await snap('27-安全停止提示-节奏互动');await id('return-to-training').click();await id('training-discomfort').click();await id('stop-immediately').click();await finishPost();await snap('04-本次运动报告-停止');const data=await saved();assert.equal(data.sessions[0].status,'stopped');assert.equal(data.wallet.healthPoints,original.wallet.healthPoints);assert.equal(data.checkIns.length,original.checkIns.length)
    return '停止原因保存；停止记录保留，已有积分和打卡数不增加。'
  })
  await check('ARUN-04-训练前不适阻断',async()=>{
    const before=await saved();await startPrescription();await id('precheck-danger-entry').click();await id('session-report-screen').waitFor();const after=await saved();assert.equal(after.sessions[0].status,'stopped');assert.equal(after.wallet.healthPoints,before.wallet.healthPoints);await snap('02-运动前检查-阻断结果')
  })
  await check('ARUN-08-报告与数据页面',async()=>{
    await nav('data');await snap('15-训练数据');await nav('profile');await id('profile-reports').click();await id('report-center-mini-entry').click();await snap('05-康复小报告');await id('mini-report-period').nth(1).click();assert.match(await id('hospital-report-screen').innerText(),/30/);await id('mini-report-records').click();await snap('06-训练报告中心');await id('report-tab-monthly').click();await snap('06-训练报告中心-阶段');await id('report-tab-daily').click();await id('daily-report-row').first().click();await snap('06-训练报告中心-单次详情')
  })
  await check('ARUN-09-花园与月历',async()=>{
    await nav('profile');await snap('16-个人中心');await id('profile-garden-growth').click();await snap('20-运动小菜园-成长');await id('garden-section-checkin').click();await snap('21-运动小菜园-打卡');assert.match(await id('garden-checkin-content').innerText(),/2026年9月/)
  })
  await check('UI-09-全部运动分类',async()=>{
    await nav('today');await id('home-exercises').click();let ids=new Set();for(let i=0;i<5;i++){await id('selection-category').nth(i).click();for(const value of await id('selection-exercise').evaluateAll(es=>es.map(e=>e.getAttribute('data-exercise-id'))))ids.add(value)}assert.equal(ids.size,9);await page.locator('.selection-show-all').click();assert.equal(await id('selection-exercise').count(),9);await snap('09-运动选择');await nav('today');await id('home-weekly').click();await snap('19-本周运动路径')
    return '5 个分类可切换，共 9 个运动项目。'
  })
  await check('ARUN-07-设备页面',async()=>{
    await nav('profile');await id('profile-devices').click();await snap('18-设备与数据来源');await page.locator('.device-platforms uni-button').first().click();assert.match(await page.locator('.device-platforms').innerText(),/今日已同步/);await snap('18-设备与数据来源-同步');await nav('profile');await id('profile-archive').click();await snap('17-健康档案')
  })
  await check('UI-11-助手任务和问答',async()=>{
    await nav('assistant');await snap('11-小喜健康助手');assert.equal(await id('assistant-task-question').count(),4);await id('assistant-task-question').first().click();assert.match(await id('assistant-messages').innerText(),/判断依据/);await input('assistant-query','今天运动胸痛怎么办');await id('assistant-send').click();assert.match(await id('assistant-messages').innerText(),/先停止运动/);assert.equal(await id('region-assistant-plan').count(),0);assert.equal(await id('region-assistant-shortcuts').count(),0);assert.equal(await id('region-assistant-advice').count(),1)
  })
  await check('ARUN-13-知识搜索文章视频',async()=>{
    await nav('discover');await snap('12-康复资讯');await input('knowledge-search','不存在的知识abcd');await id('knowledge-empty').waitFor();await input('knowledge-search','');await id('knowledge-featured').click();await snap('13-知识文章');assert.ok((await id('knowledge-body').innerText()).length>80);await id('knowledge-back').click();await id('knowledge-filter').last().click();await id('knowledge-video-entry').first().click();await snap('14-知识视频');assert.equal(await page.locator('video').count(),0);await id('knowledge-static-preview').waitFor();assert.match(await id('knowledge-static-preview').innerText(),/静态原型/);await id('knowledge-back').click();await id('discover-content').waitFor()
  })
  await check('ARUN-10-小队搭子',async()=>{
    await nav('profile');await id('preview-team').click();await id('join-team').click();await page.locator('.team-name').waitFor();await page.waitForTimeout(1800);await snap('22-健康小队');await page.locator('.remind-button').first().click();assert.match(await page.locator('.remind-button').first().innerText(),/已提醒/);await id('knowledge-buddy-entry').click();await id('connect-buddy').click();await page.locator('.buddy-card').waitFor();await page.waitForTimeout(1800);await snap('23-健康搭子');await page.locator('.buddy-cycle uni-button').last().click();await page.locator('.buddy-remind').click();assert.match(await page.locator('.buddy-remind').innerText(),/已温和提醒/)
  })
  await check('ARUN-11-积分权益',async()=>{
    await nav('profile');await id('preview-rewards').click();await snap('24-健康积分与权益');await input('mem-code','MEM-2026');await id('unlock-mem').click();assert.match(await id('mem-entitlement').innerText(),/已解锁/);const before=await saved();await page.locator('.reward-grid uni-button').first().click();await page.locator('.uni-modal__btn').filter({hasText:'确定'}).click();const after=await saved();assert.ok(after.wallet.healthPoints<before.wallet.healthPoints);assert.equal(after.redemptions.length,before.redemptions.length+1);await snap('24-健康积分与权益-已兑换')
  })
  await check('ARUN-12-策略与审核',async()=>{
    await nav('profile');await button(/训练状态策略/).click();await snap('25-训练状态策略');await page.locator('.scenario-section uni-button').filter({hasText:'需关注'}).click();await nav('profile');await button(/医生审核队列/).click();await snap('26-医生审核队列');await button(/维持计划/).click();await button(/同意调整/).click();await button(/驳回/).click();const data=await saved();assert.deepEqual(new Set(data.doctorReviews.map(r=>r.status)),new Set(['maintained','approved','rejected']));await snap('26-医生审核队列-处理后')
  })
  await check('ARUN-14-当前数据刷新恢复',async()=>{
    const before=await saved();await page.reload({waitUntil:'networkidle'});const after=await saved();assert.equal(after.sessions.length,before.sessions.length);assert.equal(after.wallet.healthPoints,before.wallet.healthPoints);assert.equal(after.teamState.name,before.teamState.name);assert.equal(after.buddyState.cycleDays,before.buddyState.cycleDays)
    return '当前 schemaVersion 7 训练/钱包/队伍/搭子刷新恢复通过；兼容 v3 与损坏数据另见 state-run.json。'
  })
  for(const width of [360,390,430]) await check('VIEWPORT-'+width,async()=>{await page.setViewportSize({width,height:width===430?932:width===360?800:844});await nav('profile');await snap('16-个人中心-'+width);const overflow=await page.locator('.prototype-shell').evaluate(e=>e.scrollWidth>e.clientWidth+1);assert.equal(overflow,false)})
  await check('ARUN-01-公众模式与三类训练',async()=>{
    context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai',permissions:['camera']});page=await context.newPage();page.setDefaultTimeout(5000)
    observeNetwork(page)
    page.on('pageerror',e=>errors.push({type:'public-pageerror',message:e.message}));page.on('console',m=>{if(m.type()==='error')errors.push({type:'public-console',message:m.text()})});page.on('response',r=>{if(r.status()>=400)responses.push({url:r.url(),status:r.status()})})
    await page.goto(baseUrl,{waitUntil:'networkidle'});await id('choose-public').click();await snap('01-今日首页-公众');await id('home-exercises').click();await id('selection-exercise').filter({has:page.locator('[data-exercise-id="taichi"]')}).count()
    await page.locator('[data-exercise-id="taichi"]').click();await id('training-screen').waitFor();await page.locator('[data-action="ACT-CAMERA-ENABLE"]').click();await page.locator('.camera-preview[data-state="ready"]').waitFor();await snap('03-动作跟练');await id('training-discomfort').click();await snap('27-安全停止提示');await id('return-to-training').click()
    await id('toggle-training').click();const elapsed=await page.locator('.training-timer').innerText();const video=page.locator('.motion-video video').first();const time=await video.evaluate(v=>v.currentTime);await page.waitForTimeout(1200);assert.equal(await page.locator('.training-timer').innerText(),elapsed);assert.ok(Math.abs(await video.evaluate(v=>v.currentTime)-time)<.3);await snap('28-训练暂停状态');await snap('28-训练暂停状态-动作跟练');await id('toggle-training').click();await id('demo-complete').click();await id('session-report-screen').waitFor();await snap('04-本次运动报告-公众')
    await nav('today');await id('home-exercises').click();await id('selection-category').nth(2).click();await id('selection-exercise').first().click();await page.locator('.game-action').click();assert.match(await page.locator('.rep-count').innerText(),/1/);await snap('03-动作跟练-计次互动');await id('toggle-training').click();assert.equal(await page.locator('.game-action').getAttribute('disabled'),'true');await snap('28-训练暂停状态-计次互动');await id('toggle-training').click();await id('training-discomfort').click();await id('stop-immediately').click();await id('session-report-screen').waitFor();const before=await saved();await page.reload({waitUntil:'networkidle'});assert.equal((await saved()).sessions.length,before.sessions.length)
    return '公众无需绑定；动作跟练使用 Chrome 合成摄像头（未读取真实摄像头）；视频与计时暂停，计次暂停禁用，停止记录刷新恢复。'
  })
}
main().catch(e=>{results.push({name:'runner',status:'FAIL',actual:e.stack});console.error(e)}).finally(async()=>{
  const overflowCases = responsive.filter(r=>r.overflow.length)
  results.push({name:'RESPONSIVE-28页三尺寸',status:overflowCases.length?'FAIL':'PASS',actual:responsive.length+' 个页面尺寸组合；横向溢出 '+overflowCases.length+' 项。'})
  await fs.mkdir(out,{recursive:true})
  await fs.writeFile(path.join(out,'browser-run.json'),JSON.stringify({generatedAt:new Date().toISOString(),environment:'Chrome H5 local '+baseUrl,results,errors,responses,networkFailures,externalRequests:[...externalRequests],assetRequests:[...assetRequests.values()]},null,2))
  await fs.writeFile(path.join(out,'responsive-run.json'),JSON.stringify(responsive,null,2))
  await fs.writeFile(path.join(out,'readability-run.json'),JSON.stringify({ generatedAt:new Date().toISOString(), environment:'Chrome H5 local', measurements:readability },null,2))
  await fs.writeFile(path.join(out,'console-errors.txt'),errors.length?errors.map(e=>e.type+': '+e.message).join('\n'):'0 errors (this browser run)\n')
  await fs.writeFile(path.join(out,'interaction-run.md'),'# 浏览器实测（不等于全量验收）\n\n'+results.map(r=>'## '+r.name+' — '+r.status+'\n\n'+r.actual+'\n').join('\n'))
  const unexpectedNetworkFailures=networkFailures.filter(r=>r.reason!=='net::ERR_ABORTED')
  await browser?.close();console.log(JSON.stringify({passed:results.filter(x=>x.status==='PASS').length,failed:results.filter(x=>x.status==='FAIL').length,errors:errors.length,responses:responses.length,unexpectedNetworkFailures:unexpectedNetworkFailures.length,externalRequests:externalRequests.size}));process.exitCode=results.some(r=>r.status==='FAIL')||errors.length||responses.length||unexpectedNetworkFailures.length||externalRequests.size?1:0
})
