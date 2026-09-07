// Local H5 readability and expanded hit-area evidence; not native/WCAG certification.
const fs = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const { chromium } = createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright')
const { auditReadability } = require('./replica-readability-audit.cjs')
const out = path.resolve(__dirname, '../docs/visual-acceptance/latest')
const results = [], errors = []
let browser, page
async function check(name, fn) {
  const before = errors.length
  try { const actual = await fn(); assert.equal(errors.length, before); results.push({ name, status: 'PASS', actual }); console.log('PASS ' + name) }
  catch (e) { results.push({ name, status: 'FAIL', actual: e.message }); console.log('FAIL ' + name + ' ' + e.message) }
}
async function main() {
  await fs.mkdir(out, { recursive: true })
  browser = await chromium.launch({ headless: true, channel: 'chrome' })
  page = await browser.newPage({ viewport: { width: 360, height: 800 }, timezoneId: 'Asia/Shanghai' })
  page.on('pageerror', e => errors.push(e.message))
  await check('审计器嵌套文字与不可推断背景', async () => {
    await page.setContent('<body style="background:white"><uni-text id="nested" style="color:black;font-size:10px"><span>嵌套小字</span></uni-text><uni-text style="color:black;font-size:16px">正常文本</uni-text><div style="background:linear-gradient(white,#eee)"><uni-text>渐变文本</uni-text></div><uni-button disabled style="display:block;width:20px;height:20px">禁用按钮</uni-button><uni-text style="display:none;font-size:8px">隐藏文本</uni-text></body>')
    const audit = await page.evaluate(auditReadability)
    assert.equal(audit.smallText.length, 1); assert.equal(audit.smallText[0].text, '嵌套小字')
    assert.equal(audit.smallTargets.length, 0); assert.equal(audit.lowPlainContrast.length, 0)
    assert.ok(audit.unverifiedContrast.some(x => x.text === '渐变文本' && /gradient/.test(x.reason)))
    return '内部span被计入字号；隐藏文本/禁用点击目标不计入；渐变背景明确待像素核验，不伪造通过。'
  })
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
  await page.getByTestId('choose-public').click()
  const baseline = await page.evaluate(() => uni.getStorageSync('magpie-prototype-state'))
  const seed = async () => {
    await page.evaluate(s => uni.setStorageSync('magpie-prototype-state', s), { ...baseline, mode: 'cardiac', publishedPolicy: { ...baseline.publishedPolicy, preMode: 'required', postMode: 'required' } })
    await page.reload({ waitUntil: 'networkidle' })
  }
  await check('六个策略开关44像素边缘命中', async () => {
    await seed(); await page.getByTestId('nav-profile').click()
    await page.locator('.service-list uni-button').filter({ hasText: '训练状态策略' }).click()
    const alignment = await page.locator('.detail-header uni-button,.policy-phase uni-button').evaluateAll(es => es.map(e => {
      const range = document.createRange(); range.selectNodeContents(e)
      const text = range.getBoundingClientRect(), box = e.getBoundingClientRect()
      return { display: getComputedStyle(e).display, offset: Math.abs(text.top + text.height / 2 - box.top - box.height / 2) }
    }))
    for (const measured of alignment) { assert.equal(measured.display, 'flex'); assert.ok(measured.offset < 4) }
    const switches = page.locator('.policy-fields uni-switch'); assert.equal(await switches.count(), 6)
    for (const target of await switches.all()) {
      await target.scrollIntoViewIfNeeded(); const r = await target.boundingBox()
      assert.ok(r.height >= 44 && r.width >= 44)
      const state = () => target.locator('.uni-switch-input').evaluate(e => e.classList.contains('uni-switch-input-checked'))
      const before = await state()
      await target.click({ position: { x: r.width / 2, y: 1 } }); assert.equal(await state(), !before)
      await target.click({ position: { x: r.width / 2, y: r.height - 1 } }); assert.equal(await state(), before)
    }
    assert.deepEqual(await page.evaluate(() => uni.getStorageSync('magpie-prototype-state').publishedPolicy.fields), baseline.publishedPolicy.fields)
    return '6个开关上/下1px边缘都切换一次并恢复；草稿未发布，已发布字段不变。页头/策略页签文字垂直中心偏差<4px。仅H5命中与布局证据，非真机触控证明。'
  })
  await check('运动前评分滑条扩展区域实际生效', async () => {
    await seed(); await page.locator('.prescription-card .task-primary').first().click()
    const slider = page.getByTestId('discomfort-score').locator('uni-slider')
    await slider.scrollIntoViewIfNeeded(); const r = await slider.boundingBox(); assert.ok(r.height >= 44)
    await slider.click({ position: { x: r.width - 2, y: 1 } })
    assert.equal((await page.locator('.precheck-section__title').first().locator(':scope > uni-text').last().innerText()).trim(), '10')
    await slider.click({ position: { x: 2, y: r.height - 1 } })
    assert.equal((await page.locator('.precheck-section__title').first().locator(':scope > uni-text').last().innerText()).trim(), '0')
    await page.screenshot({ path: path.join(out, 'A11Y-前检查滑条与按钮.png') })
    return '44px滑条顶部右端写入10，底部左端写入0；沿用原评分处理器与0—10步进，没有新增医疗阈值。'
  })
  await check('三尺寸44像素按钮与输入框基线', async () => {
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 }); await seed()
      await page.getByTestId('nav-assistant').click()
      await page.getByTestId('assistant-query').locator('input').fill('点击区域测试')
      const audit = await page.evaluate(auditReadability)
      assert.deepEqual(audit.smallTargets, []); assert.deepEqual(audit.smallText, [])
      assert.deepEqual(audit.lowPlainContrast, [])
    }
    return '360/390/430助手页含可用发送按钮、输入框、任务和导航；DOM目标均≥44px且文本≥11px。渐变及图像背景不在纯色对比度结论中。'
  })
}
main().catch(e => results.push({ name: 'runner', status: 'FAIL', actual: e.stack })).finally(async () => {
  await fs.writeFile(path.join(out, 'accessibility-run.json'), JSON.stringify({ generatedAt: new Date().toISOString(), environment: 'Chrome H5 localhost; disposable data', results, errors, notProven: ['keyboard navigation and focus semantics', 'native mini-program/device touch', 'screen reader', 'gradient/image contrast', 'all conditional states'] }, null, 2))
  await browser?.close(); console.log(JSON.stringify({ pass: results.filter(r => r.status === 'PASS').length, fail: results.filter(r => r.status === 'FAIL').length, errors: errors.length }))
  process.exitCode = results.some(r => r.status === 'FAIL') || errors.length ? 1 : 0
})
