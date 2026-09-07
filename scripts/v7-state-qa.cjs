const fs=require('node:fs/promises'),path=require('node:path'),assert=require('node:assert/strict');
const {createRequire}=require('node:module');
const {chromium}=createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright');
const {readPrototypeState,writePrototypeState}=require('./replica-qa-config.cjs');
const out=path.resolve(__dirname,'../docs/visual-acceptance/v7-20260907/state');
const url='http://127.0.0.1:4187/';
const results=[],errors=[];let browser,page,baseline;
const id=s=>page.getByTestId(s);
async function waitForArtwork(){
 await page.evaluate(async()=>{await Promise.all(Array.from(document.images).filter(i=>i.getAttribute('src')).map(i=>i.decode()));await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
 await page.waitForTimeout(150);
}
async function capture(options){await waitForArtwork();return page.screenshot(options)}
async function read(){return readPrototypeState(page)}
async function seed(data){await writePrototypeState(page,data);await page.reload({waitUntil:'networkidle'});await id('today-screen').waitFor()}
async function back(){if(await page.locator('.detail-header').count())await page.locator('.detail-header uni-button').first().click()}
async function nav(s){await back();await id('nav-'+s).click()}
async function check(name,work){try{const actual=await work();results.push({name,status:'PASS',actual:actual||'assertions passed'});console.log('PASS '+name)}catch(e){results.push({name,status:'FAIL',actual:e.stack});console.log('FAIL '+name+' '+e.message);await capture({path:path.join(out,'FAIL-'+name+'.png')}).catch(()=>{})}}
async function main(){
 await fs.mkdir(out,{recursive:true});browser=await chromium.launch({channel:'chrome',headless:true});
 page=await browser.newPage({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai'});page.setDefaultTimeout(6000);page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url,{waitUntil:'networkidle'});await id('choose-cardiac').click();await id('visit-number').locator('input').fill('P-256572');await id('bind-plan').click();await id('binding-result').waitFor();await id('bind-plan').click();baseline=await read();
 await check('normal-patient-entry-boundary',async()=>{
  await nav('profile');assert.equal(await id('prototype-demo-tools').count(),0);assert.equal(await id('points-exchange-unavailable').getAttribute('disabled'),'true');await capture({path:path.join(out,'16-normal-patient.png')});await nav('discover');assert.equal(await id('knowledge-team-entry').getAttribute('disabled'),'true');assert.equal(await id('knowledge-buddy-entry').getAttribute('disabled'),'true');
 });
 await check('schema3-roundtrip-and-array-sanitizing',async()=>{
  await seed({...baseline,schemaVersion:3});assert.equal((await read()).schemaVersion,7);
  await seed({...baseline,sessions:[null,{},'bad'],checkIns:[null,{}],dailyStepRecords:[null,{}]});assert.equal((await read()).sessions.length,0);
 });
 await check('missing-stale-denied-steps-not-displayed-as-valid',async()=>{
  const d=new Date(),date=d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
  for(const quality of ['missing','stale','denied']){
   await seed({...baseline,dailyStepRecords:[{date,steps:4321,goal:6000,quality,source:'apple-health',syncedAt:d.toISOString()}]});await nav('data');const text=await id('daily-steps-card').innerText();assert.doesNotMatch(text,/4,321/);assert.match(text,/待同步|未|暂无|过期|授权/);
  }
 });
 await check('manual-validation-and-device-priority',async()=>{
  await seed({...baseline,dailyStepRecords:[]});await nav('profile');await id('profile-devices').click();await id('manual-steps-input').locator('input').fill('100001');await page.waitForTimeout(300);await id('save-manual-steps').click();assert.equal((await read()).dailyStepRecords.length,0);assert.match(await page.locator('uni-toast').innerText(),/步数范围/);
  await page.locator('uni-toast').waitFor({state:'hidden',timeout:4000});await id('manual-steps-input').locator('input').fill('1234');await page.waitForTimeout(300);await id('save-manual-steps').click();await page.waitForFunction(()=>{const raw=localStorage.getItem('magpie-prototype-state');return raw&&JSON.parse(raw).data?.dailyStepRecords?.some(r=>r.steps===1234)});assert.equal((await read()).dailyStepRecords.at(-1).steps,1234);await page.locator('uni-toast').waitFor({state:'hidden',timeout:4000});await page.locator('.device-platforms uni-button').first().click();assert.equal((await read()).dailyStepRecords.at(-1).source,'apple-health');assert.equal(await id('manual-steps-input').locator('input').isDisabled(),true);
 });
 await check('prescription-and-self-selection-association',async()=>{
  await seed({...baseline,publishedPolicy:{...baseline.publishedPolicy,preMode:'off',postMode:'off'}});
  await page.locator('[data-testid="prescription-slide"][aria-hidden="false"] .task-primary').click();await id('training-screen').waitFor();await id('demo-complete').click();await id('session-report-screen').waitFor();assert.ok((await read()).sessions[0].prescriptionItemKey);
  await nav('today');await id('home-exercise-walking').click();await id('training-screen').waitFor();await id('demo-complete').click();await id('session-report-screen').waitFor();assert.equal((await read()).sessions[0].exerciseId,'walking');assert.ok(!(await read()).sessions[0].prescriptionItemKey);
  await nav('assistant');assert.equal(await id('assistant-shortcut-plan').count(),0);assert.equal(await id('region-assistant-plan').count(),0);assert.equal(await id('region-assistant-advice').count(),1);
  return 'Hospital entry keeps prescription association; self-selection does not inherit it. Assistant plan and duplicate shortcuts removed by user request.';
 });
 await check('report-source-details-expand-and-collapse',async()=>{
  await seed(baseline);await page.locator('[data-testid="prescription-slide"][aria-hidden="false"] .task-primary').click();await id('read-pre-vitals').click();await id('discomfort-score').locator('uni-slider').click({position:{x:55,y:15}});await id('begin-training').click();await id('training-screen').waitFor();await id('demo-complete').click();await id('postcheck-screen').waitFor();await page.locator('uni-button').filter({hasText:'重新同步'}).first().click();await page.locator('uni-button').filter({hasText:/^适中$/}).first().click();await id('generate-report').click();await id('session-report-screen').waitFor();
  await id('session-sources-toggle').click();assert.equal(await id('session-source-details').count(),1);assert.match(await id('session-source-details').innerText(),/缺失或过期/);await id('session-sources-toggle').click();assert.equal(await id('session-source-details').count(),0);
 });
 await check('insight-and-garden-demonstration-states',async()=>{
  const completed=(await read()).sessions.find(s=>s.status==='completed');assert.ok(completed);
  const now=new Date();const day=offset=>{const d=new Date(now);d.setDate(d.getDate()-offset);return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0')};
  // Explicit synthetic histories in a disposable browser only, never user storage.
  const records=[0,1,2,3,4,7,8,9].map((age,index)=>({...completed,id:'V7-QA-HISTORY-'+index,localDate:day(age),startedAt:day(age)+'T08:00:00+08:00',endedAt:day(age)+'T08:10:00+08:00',advice:undefined,prescriptionItemKey:undefined}));
  const checkIns=[4,3,2,1,0].map(age=>({date:day(age),source:'core-exercise',exerciseId:'baduanjin',pointsAwarded:5,createdAt:day(age)+'T08:10:00+08:00'}));
  await seed({...baseline,sessions:records,checkIns,doctorReviews:[]});await nav('data');assert.match(await id('training-insight').innerText(),/最近训练坚持度有提升/);assert.match(await id('training-insight').innerText(),/近7天完成5次.*增加2次/);await capture({path:path.join(out,'15-insight-improvement.png')});
  await nav('profile');await id('profile-garden-growth').click();await capture({path:path.join(out,'20-growth-day5.png')});
  await fs.writeFile(path.join(out,'synthetic-history.json'),JSON.stringify({purpose:'Disposable QA fixture; not real patient records',sessions:records,checkIns},null,2));
  return '5 recent / 3 previous completed sessions show adherence improvement only; 5 check-in days render grown tree. Explicit synthetic fixture recorded.';
 });
 await check('local-demo-tools-opt-in',async()=>{
  await page.goto(url+'?prototypeDemo=1',{waitUntil:'networkidle'});await nav('profile');assert.equal(await id('prototype-demo-tools').count(),1);await page.goto(url,{waitUntil:'networkidle'});await nav('profile');assert.equal(await id('prototype-demo-tools').count(),0);
 });
}
main().catch(e=>results.push({name:'runner',status:'FAIL',actual:e.stack})).finally(async()=>{await fs.mkdir(out,{recursive:true});await fs.writeFile(path.join(out,'state-run.json'),JSON.stringify({generatedAt:new Date().toISOString(),results,errors},null,2));await browser?.close();console.log({pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length,errors:errors.length});process.exitCode=results.some(r=>r.status==='FAIL')||errors.length?1:0});
