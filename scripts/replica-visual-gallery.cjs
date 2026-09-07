// Renders visual comparison evidence; never modifies reference or runtime images.
const fs=require('node:fs/promises'),path=require('node:path'),{pathToFileURL}=require('node:url')
const {createRequire}=require('node:module')
const {chromium}=createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright')
const {root,out}=require('./replica-qa-config.cjs'),refs=path.resolve(root,'../output/小喜鹊原型升级-20260906')
const esc=s=>s.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))
async function main(){
 const files=(await fs.readdir(refs)).filter(n=>/^\d\d-.*\.png$/.test(n)).sort()
 const browser=await chromium.launch({headless:true,channel:'chrome'}),page=await browser.newPage({viewport:{width:1260,height:945},deviceScaleFactor:1})
 const cards=[]
 for(const name of files){
  await fs.access(path.join(out,name));const title=name.replace('.png',''),reference=pathToFileURL(path.join(refs,name)).href,runtime=pathToFileURL(path.join(out,name)).href
  const html=`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>${esc(title)} · 视觉对照</title><style>*{box-sizing:border-box}body{margin:0;padding:20px;background:#e9f1ed;color:#16392d;font:14px -apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif}header{display:flex;justify-content:space-between;align-items:center;margin-bottom:12px}h1{font-size:20px;margin:0}.comparison{display:flex;gap:20px}figure{margin:0;width:390px}figcaption{height:30px;color:#5e7769}.frame{position:relative;width:390px;height:844px;background:white;border:1px solid #bed8c9;overflow:hidden}.frame img{position:absolute;inset:0;width:390px;height:844px;object-fit:fill}.overlay img:last-child{opacity:.5}</style><header><h1>${esc(title)}</h1><span>390 × 844 · 原图不变 · 半透明叠加用于定位差异，不代表相似度评分</span></header><main class="comparison"><figure><figcaption>视觉参考</figcaption><div class="frame"><img src="${reference}"></div></figure><figure><figcaption>真实运行截图</figcaption><div class="frame"><img src="${runtime}"></div></figure><figure><figcaption>50% 叠加对照</figcaption><div class="frame overlay"><img src="${runtime}"><img src="${reference}"></div></figure></main></html>`
  const file=path.join(out,title+'-对照.html');await fs.writeFile(file,html);await page.goto(pathToFileURL(file).href);await page.locator('img').evaluateAll(es=>Promise.all(es.map(e=>e.decode())));await page.screenshot({path:path.join(out,title+'-对照.png')});cards.push(`<a href="${encodeURIComponent(title+'-对照.html')}"><img src="${encodeURIComponent(name)}" loading="lazy" alt="${esc(title)}"><span>${esc(title)}</span></a>`)
 }
 await fs.writeFile(path.join(out,'全部28页-运行与参考对照.html'),`<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>小喜鹊 · 全部28页验收图册</title><style>*{box-sizing:border-box}body{margin:0;padding:40px;background:#eff8f2;color:#16392d;font-family:-apple-system,BlinkMacSystemFont,'PingFang SC',sans-serif}h1{font-size:30px}p{color:#617b6c;line-height:1.8}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:25px}a{display:block;padding:12px;border-radius:20px;background:#fff;color:inherit;text-decoration:none;box-shadow:0 8px 26px #2368410c}img{display:block;width:100%;height:auto;border-radius:12px}span{display:block;padding:15px 0 4px;font-size:15px;font-weight:600}</style><h1>小喜鹊 · 28页运行图册</h1><p>绿色界面 · 紫色小喜 · 本地功能优先<br>点击任一页面查看原效果图、真实运行截图与50%叠加。动态数据和源项目规则不因参考图改变。浏览器截图不等于微信真机验收。</p><main>${cards.join('')}</main></html>`)
 await browser.close();console.log('28 runtime references + 28 comparison PNGs + gallery generated')
}
main().catch(e=>{console.error(e);process.exitCode=1})
