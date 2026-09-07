// Actual Chrome keyboard events, isolated local fixtures. No real medical/device actions.
const fs = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const { chromium } = createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright')
const {out,baseUrl,readPrototypeState,writePrototypeState}=require('./replica-qa-config.cjs'), results = [], errors = []
let browser, page, baseline
const id = value => page.getByTestId(value)
const saved = () => readPrototypeState(page)
async function seed(value) { await writePrototypeState(page,value); await page.reload({ waitUntil: 'networkidle' }) }
async function activate(target, key = 'Enter') { await target.focus(); await page.keyboard.press(key); await page.waitForTimeout(80) }
async function check(name, fn) {
  const before = errors.length
  try { const actual = await fn(); assert.equal(errors.length, before); results.push({ name, status: 'PASS', actual }); console.log('PASS ' + name) }
  catch (e) { results.push({ name, status: 'FAIL', actual: e.message }); console.log('FAIL ' + name + ' ' + e.message); await page.screenshot({ path: path.join(out, 'KEYBOARD-FAIL-' + name + '.png') }).catch(() => {}) }
}
async function main() {
  await fs.mkdir(out, { recursive: true }); browser = await chromium.launch({ headless: true, channel: 'chrome' })
  page = await browser.newPage({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai', locale: 'zh-CN' }); page.setDefaultTimeout(5000)
  page.on('pageerror', e => errors.push(e.message))
  await page.goto(baseUrl, { waitUntil: 'networkidle' })
  await check('首次Tab与边界弹窗焦点闭环', async () => {
    await page.keyboard.press('Tab'); await id('choose-public').evaluate(e => { if (e !== document.activeElement) throw Error('first Tab missed primary mode') })
    assert.equal(await id('choose-public').getAttribute('role'), 'button')
    await activate(id('open-medical-boundary'))
    const close = id('medical-boundary-modal').locator('[data-keyboard-dismiss]')
    assert.equal(await close.evaluate(e => e === document.activeElement), true)
    assert.equal(await page.locator('.onboarding').evaluate(e => e.inert), true)
    for (const key of ['Tab', 'Shift+Tab', 'Tab']) { await page.keyboard.press(key); assert.equal(await close.evaluate(e => e === document.activeElement), true) }
    await page.keyboard.press('Escape'); await id('medical-boundary-modal').waitFor({ state: 'detached' })
    await page.waitForTimeout(100); assert.equal(await id('open-medical-boundary').evaluate(e => e === document.activeElement), true)
    assert.equal(await page.locator('.onboarding').evaluate(e => e.inert), false)
    assert.equal(await page.evaluate(() => document.body.style.overflow), '')
    return '首个Tab到日常运动；边界弹窗初始/正反Tab均留在关闭按钮，背景inert；Escape关闭并恢复触发器和滚动。'
  })
  await check('患者绑定与四处方键盘轮播', async () => {
    await activate(id('choose-cardiac'), 'Space')
    await id('visit-number').locator('input').fill('256572'); await page.keyboard.press('Enter'); await id('binding-result').waitFor()
    await activate(id('bind-plan')); await id('today-screen').waitFor(); baseline = await saved()
    const carousel = id('prescription-swiper'); await carousel.focus()
    for (const [key, index] of [['ArrowRight',1],['End',3],['ArrowRight',3],['Home',0],['ArrowLeft',0]]) {
      await page.keyboard.press(key); await page.waitForTimeout(550)
      const states = await id('prescription-slide').evaluateAll(es => es.map(e => ({ hidden: e.getAttribute('aria-hidden'), inert: e.inert, tab: e.querySelector('uni-button').tabIndex })))
      assert.equal(states.length,4); states.forEach((s,i)=>{assert.equal(s.hidden,String(i!==index));assert.equal(s.inert,i!==index);assert.equal(s.tab,i===index?0:-1)})
    }
    await page.keyboard.press('Tab'); assert.equal(await page.locator('[data-testid="prescription-slide"][aria-hidden="false"] .task-primary').evaluate(e=>e===document.activeElement), true)
    await page.screenshot({ path: path.join(out, 'KEYBOARD-处方焦点.png') })
    return '患者输入Enter匹配，Space/Enter入口有效；4卡左右/Home/End有边界，3张非当前卡inert且不进入Tab序列，Tab到当前卡开始按钮。'
  })
  await check('开关键盘与策略发布隔离', async () => {
    await seed(baseline); await activate(id('nav-profile')); await activate(page.locator('.service-list uni-button').filter({hasText:'训练状态策略'}))
    const original = (await saved()).publishedPolicy
    for (const sw of await page.getByRole('switch').all()) {
      const initial = await sw.getAttribute('aria-checked'); assert.ok(await sw.getAttribute('aria-label'))
      await activate(sw,'Space'); assert.notEqual(await sw.getAttribute('aria-checked'),initial)
      await activate(sw,'Enter'); assert.equal(await sw.getAttribute('aria-checked'),initial)
    }
    assert.deepEqual((await saved()).publishedPolicy,original)
    return '6字段开关Space改变、Enter恢复，aria-checked同步；未点击发布，已发布版本/字段完全不变。'
  })
  await check('前后评分键盘与暂停单次触发', async () => {
    await seed({...baseline,publishedPolicy:{...baseline.publishedPolicy,preMode:'required',postMode:'required'}})
    await activate(page.locator('[data-testid="prescription-slide"][aria-hidden="false"] .task-primary'))
    const pre=page.getByRole('slider',{name:'运动前不适程度'});await pre.focus()
    for(const [key,value] of [['End',10],['ArrowRight',10],['ArrowLeft',9],['Home',0],['ArrowDown',0]]){await page.keyboard.press(key);assert.equal(await pre.getAttribute('aria-valuenow'),String(value))}
    assert.equal(await id('begin-training').getAttribute('disabled'),'true')
    await activate(id('read-pre-vitals'));await activate(id('begin-training'));await id('training-screen').waitFor()
    await id('toggle-training').focus();await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');await page.waitForTimeout(100)
    assert.equal(await page.locator('.prototype-shell').getAttribute('data-state'),'paused')
    const time=await page.locator('.training-timer').innerText();await page.waitForTimeout(1100);assert.equal(await page.locator('.training-timer').innerText(),time)
    await activate(id('toggle-training'),'Space');assert.equal(await page.locator('.prototype-shell').getAttribute('data-state'),'active')
    await activate(id('demo-complete'));await id('postcheck-screen').waitFor()
    await activate(id('read-post-vitals'))
    const post=page.getByRole('slider',{name:'运动后Borg主观用力感'});await post.focus();await page.keyboard.press('End');await page.keyboard.press('ArrowLeft');assert.equal(await post.getAttribute('aria-valuenow'),'9')
    await activate(page.locator('.feeling-row uni-button').filter({hasText:'适中'}));await activate(id('generate-report'));await id('session-report-screen').waitFor()
    assert.equal((await saved()).sessions[0].assessment.post.borg,9)
    return '前评分0—10方向/Home/End有界；缺设备仍禁用；Enter长按不重复切换暂停，暂停计时冻结；后Borg=9写入原报告快照。'
  })
  await check('安全停止弹窗陷阱恢复与停止记录', async () => {
    await seed({...baseline,publishedPolicy:{...baseline.publishedPolicy,preMode:'off',postMode:'off'}})
    const before=await saved();await activate(page.locator('[data-testid="prescription-slide"][aria-hidden="false"] .task-primary'));await id('training-screen').waitFor()
    await activate(id('training-discomfort'));assert.equal(await id('return-to-training').evaluate(e=>e===document.activeElement),true)
    for(let i=0;i<7;i++){await page.keyboard.press('Tab');assert.equal(await id('stop-modal').evaluate(e=>e.contains(document.activeElement)),true)}
    await page.keyboard.press('Escape');await id('stop-modal').waitFor({state:'detached'});await page.waitForTimeout(100);assert.equal(await id('training-discomfort').evaluate(e=>e===document.activeElement),true)
    assert.equal(await page.locator('.prototype-shell').getAttribute('data-state'),'active')
    await activate(id('training-discomfort'));await activate(id('stop-immediately'));await id('session-report-screen').waitFor();const after=await saved()
    assert.equal(after.sessions[0].status,'stopped');assert.equal(after.wallet.healthPoints,before.wallet.healthPoints);assert.equal(after.checkIns.length,before.checkIns.length)
    assert.equal(await page.locator('.prototype-shell [inert]').count(),0)
    return '安全弹窗默认聚焦返回，不默认执行危险动作；7次Tab不逃逸，Escape保持训练并回焦点；确认停止保留stopped且不增加积分/打卡，背景锁释放。'
  })
  await check('兑换原生弹窗取消与一次确认', async () => {
    await seed({...baseline,wallet:{...baseline.wallet,healthPoints:500}});await activate(id('nav-profile'));await activate(id('preview-rewards'))
    const buy=id('reward-product-card').first().locator('uni-button');await activate(buy)
    const modal=page.getByRole('dialog',{name:'确认兑换'});await modal.waitFor();await page.waitForFunction(()=>document.querySelector('.uni-modal__btn_default')===document.activeElement)
    assert.equal((await saved()).wallet.healthPoints,500,'打开弹窗的Enter松键不能自动扣分')
    assert.equal((await saved()).redemptions.length,baseline.redemptions.length,'打开弹窗不能自动兑换')
    await page.keyboard.press('Escape');await modal.waitFor({state:'hidden'});assert.equal((await saved()).wallet.healthPoints,500)
    await activate(buy);await modal.waitFor();await page.waitForFunction(()=>document.querySelector('.uni-modal__btn_default')===document.activeElement);await page.keyboard.press('Tab');assert.equal(await modal.locator('.uni-modal__btn_primary').evaluate(e=>e===document.activeElement),true,'Tab应从取消移到确认')
    await page.keyboard.down('Enter');await page.keyboard.down('Enter');await page.keyboard.up('Enter');await modal.waitFor({state:'hidden'})
    assert.equal((await saved()).wallet.healthPoints,450);assert.equal((await saved()).redemptions.length,baseline.redemptions.length+1)
    return '原uni.showModal默认取消；打开弹窗的Enter松键不扣分/不新增兑换，Escape不扣分，Tab确认并长按Enter只兑换一次，500→450且新增1条记录。'
  })
  await check('出生日期键盘输入保存与原校验', async () => {
    await seed({...baseline,mode:'public'});await activate(id('nav-profile'));await activate(page.locator('.health-management-grid uni-button').filter({hasText:'健康档案'}))
    await id('public-profile-birth-date').click()
    const picker=page.locator('.uni-picker-custom.uni-picker-toggle');await picker.waitFor({state:'visible'})
    await picker.locator('.uni-picker-action-cancel').click();await picker.waitFor({state:'hidden'})
    await page.waitForFunction(()=>!document.querySelector('[data-testid="public-profile-keyboard-date"]')?.closest('[inert]'))
    const date=id('public-profile-keyboard-date');await date.focus();assert.equal(await date.evaluate(e=>getComputedStyle(e).opacity),'1')
    await date.fill('1985-06-15');await page.keyboard.press('Tab');await id('public-profile-name').locator('input').fill('键盘演示');await activate(id('public-profile-save'))
    let data=await saved();assert.equal(data.publicHealthProfile.birthDate,'1985-06-15');assert.equal(data.publicHealthProfile.name,'键盘演示')
    await page.locator('uni-toast').waitFor({state:'hidden'})
    await date.focus();await date.fill('2999-01-01');await page.keyboard.press('Tab');await activate(id('public-profile-save'));assert.equal((await saved()).publicHealthProfile.birthDate,'1985-06-15')
    await page.screenshot({path:path.join(out,'KEYBOARD-档案日期校验.png')})
    return '原指针日期选择器实际打开/取消且背景锁释放；H5聚焦时显示原生日期输入，保存同一publicHealthProfile字段；未来日期被原保存校验拒绝，旧值不变。'
  })
  await check('原禁用社交入口键盘不可激活', async () => {
    await seed({...baseline,mode:'public'});await activate(id('nav-discover'))
    for(const key of ['knowledge-team-entry','knowledge-buddy-entry']){const button=id(key);assert.equal(await button.getAttribute('tabindex'),'-1');assert.equal(await button.getAttribute('aria-disabled'),'true');await button.focus();await page.keyboard.press('Enter');await page.keyboard.press('Space');assert.equal(await id('discover-screen').count(),1)}
    return '两个原业务禁用入口不在Tab序列；即使程序聚焦后按Enter/空格也不进入社交页，不改变开放状态。'
  })
}
main().catch(e=>results.push({name:'runner',status:'FAIL',actual:e.stack})).finally(async()=>{
  await fs.writeFile(path.join(out,'keyboard-run.json'),JSON.stringify({generatedAt:new Date().toISOString(),environment:'Chrome H5 '+baseUrl+', 390×844, isolated local data',results,errors,notProven:['native mini-program/App keyboard and screen reader','all focus order combinations','mobile soft keyboard','full WCAG certification']},null,2))
  await browser?.close();console.log(JSON.stringify({pass:results.filter(r=>r.status==='PASS').length,fail:results.filter(r=>r.status==='FAIL').length,errors:errors.length}));process.exitCode=results.some(r=>r.status==='FAIL')||errors.length?1:0
})
