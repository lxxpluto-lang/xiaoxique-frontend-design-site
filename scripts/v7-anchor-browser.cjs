const fs=require('node:fs');
const path=require('node:path');
const {createRequire}=require('node:module');
const {chromium}=createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright');
const phase=process.argv[2]||'current';
if(!['before','current'].includes(phase))throw Error('Unsupported phase');
const out=path.resolve(__dirname,'../docs/visual-acceptance/v7-20260907',phase);
fs.mkdirSync(out,{recursive:true});
(async()=>{
 const browser=await chromium.launch({channel:'chrome',headless:true});
 try{
 const context=await browser.newContext({viewport:{width:390,height:844},timezoneId:'Asia/Shanghai',locale:'zh-CN'});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://127.0.0.1:4187/',{waitUntil:'networkidle'});
 await page.screenshot({path:path.join(out,'07.png')});
 await page.getByTestId('choose-cardiac').click();
 await page.getByTestId('visit-number').locator('input').fill('P-256572');
 await page.getByTestId('bind-plan').click();await page.getByTestId('binding-result').waitFor();
 await page.screenshot({path:path.join(out,'08.png')});
 await page.getByTestId('bind-plan').click();await page.getByTestId('today-screen').waitFor();
 for(const [nav,id] of [['today','01'],['data','15'],['assistant','11'],['profile','16'],['discover','12']]){
  await page.getByTestId('nav-'+nav).click();await page.waitForTimeout(300);await page.screenshot({path:path.join(out,id+'.png')});
 }
 fs.writeFileSync(path.join(out,'browser.json'),JSON.stringify({phase,errors,url:page.url(),screens:7},null,2));
 console.log({phase,errors,screens:7});
 }finally{await browser.close()}
})().catch(e=>{console.error(e);process.exitCode=1});
