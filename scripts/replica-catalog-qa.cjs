// Full local catalog traversal. Disposable storage; no real camera, account or hospital.
const fs = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const { chromium } = createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright')
const { knowledgeItems, exerciseCategories, exerciseGames } = require('../src/lib/prototype-data.ts')
const {root,out,baseUrl,readPrototypeState,writePrototypeState}=require('./replica-qa-config.cjs')
const results = [], errors = []
let page, browser, baseline
const id = value => page.getByTestId(value)
async function saved() { return readPrototypeState(page) }
async function seed(data) { await writePrototypeState(page,data); await page.reload({ waitUntil: 'networkidle' }) }
async function check(name, work) { const prior = errors.length; try { const actual = await work(); assert.equal(errors.length, prior); results.push({ name, status: 'PASS', actual }); console.log('PASS ' + name) } catch (e) { results.push({ name, status: 'FAIL', actual: e.message }); console.log('FAIL ' + name + ' ' + e.message); await page.screenshot({ path: path.join(out, 'CATALOG-FAIL-' + name + '.png') }).catch(() => {}) } }
async function main() {
  await fs.mkdir(out, { recursive: true })
  browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai', locale: 'zh-CN' })
  page = await context.newPage(); page.setDefaultTimeout(6000); page.on('pageerror', e => errors.push(e.message))
  await page.goto(baseUrl, { waitUntil: 'networkidle' }); await id('choose-public').click(); baseline = await saved()
  for (const mode of ['public', 'cardiac']) {
    await check(mode + '-十条知识唯一覆盖', async () => {
      await seed({ ...baseline, mode }); await id('nav-discover').click()
      const actual = await id('discover-content').locator('[data-knowledge-id]').evaluateAll(es => es.map(e => e.getAttribute('data-knowledge-id')))
      const expected = knowledgeItems.filter(item => item.audience === 'all' || item.audience === mode).map(item => item.id)
      assert.deepEqual(actual.slice().sort(), expected.slice().sort()); assert.equal(new Set(actual).size, actual.length)
      assert.equal(await id('region-knowledge-spotlights').locator('uni-button').count(), 3)
      assert.equal(await id('knowledge-team-entry').getAttribute('disabled'), 'true'); assert.equal(await id('knowledge-buddy-entry').getAttribute('disabled'), 'true')
      return expected.length + '条源知识各出现一次，3张重点卡与完整列表无重复/遗漏，原社交入口仍禁用。当前源10条audience都是all，不把此结果冒称患者专属fixture验证。'
    })
    await check(mode + '-五筛选与搜索恢复', async () => {
      const items = knowledgeItems.filter(item => item.audience === 'all' || item.audience === mode)
      const tests = [() => true, i => i.type === 'guide', i => /运动|训练|锻炼|热身|呼吸|Borg/.test([i.title, i.summary, ...i.tags].join(' ')), i => /饮食|营养|膳食/.test([i.title, i.summary, ...i.tags].join(' ')), i => i.type === 'video']
      for (let index = 0; index < tests.length; index++) {
        await id('knowledge-filter').nth(index).click()
        const actual = await id('discover-content').locator('[data-knowledge-id]').evaluateAll(es => es.map(e => e.getAttribute('data-knowledge-id')))
        assert.deepEqual(actual.sort(), items.filter(tests[index]).map(i => i.id).sort())
      }
      await id('knowledge-filter').first().click(); await id('knowledge-search').locator('input').fill('不存在的内容xyz'); await id('knowledge-empty').waitFor()
      assert.equal(await id('discover-content').locator('[data-knowledge-id]').count(), 0)
      await id('knowledge-empty').locator('uni-button').click(); assert.equal(await id('discover-content').locator('[data-knowledge-id]').count(), items.length)
      return '每个筛选集合对照源title/summary/tags逐项核验；零结果只显示空态，恢复全部可用。'
    })
  }
  await check('全部知识逐条打开和原文保留', async () => {
    await seed({ ...baseline, mode: 'cardiac' }); await id('nav-discover').click()
    for (const item of knowledgeItems) {
      await id('discover-content').locator('[data-knowledge-id="' + item.id + '"]').click()
      await id('knowledge-body').waitFor()
      const body = await id('knowledge-body').innerText()
      for (const paragraph of item.body) assert.ok(body.includes(paragraph), item.id + ' 缺少原文段落')
      if (item.type === 'video') {
        const video = page.locator('video').first(); const src = await video.getAttribute('src'); assert.ok(src.endsWith(item.video))
        await video.evaluate(v => { v.muted = true; return v.play() }); await page.waitForTimeout(300); assert.ok(await video.evaluate(v => v.currentTime > 0))
      }
      await id('knowledge-back').click()
    }
    return '7篇文章和3个视频逐条可达；所有原body段落逐段保留；3个源视频均实际推进播放时间。'
  })
  await check('九种运动逐项启动和安全停止', async () => {
    await seed(baseline)
    for (const game of exerciseGames) {
      await id('home-exercises').click(); await id('selection-category').nth(exerciseCategories.findIndex(c => c.id === game.categoryId)).click()
      await id('selection-exercise').filter({ hasText: game.title }).click(); await id('training-screen').waitFor()
      assert.equal(await page.locator('.experience').getAttribute('data-exercise'), game.id)
      await id('training-discomfort').click(); await id('stop-immediately').click(); await id('session-report-screen').waitFor()
      const s = await saved(); assert.equal(s.sessions[0].exerciseId, game.id); assert.equal(s.sessions[0].status, 'stopped'); assert.equal(s.wallet.healthPoints, baseline.wallet.healthPoints)
      await page.locator('.detail-header uni-button').first().click()
    }
    return '5分类9运动全部进入各自原训练体验并可安全停止；exerciseId逐项匹配，停止不增积分；未申请真实摄像头。'
  })
  await check('运动总览缺失与处方隔离', async () => {
    await seed({ ...baseline, mode: 'cardiac', dailyStepRecords: [], sessions: [] }); await id('home-exercises').click()
    assert.match(await page.locator('[data-metric="METRIC-SELECTION-STEPS"]').innerText(), /待同步/); assert.match(await page.locator('[data-metric="METRIC-SELECTION-PROJECTS"]').innerText(), /0/)
    assert.match(await id('selection-prescription').innerText(), /4项计划/); await id('selection-prescription').click()
    assert.equal(await page.locator('.detail-frame').getAttribute('data-detail-view'), 'health-archive'); assert.match(await page.locator('.detail-frame').innerText(), /腹式呼吸/)
    return '无记录无步数时显示0项目/待同步，不借参考图填卡路里或平均心率；医院入口打开真实fixture档案，4项处方不被自选替换。'
  })
  await check('两页三尺寸和装饰资源加载', async () => {
    for (const mode of ['public', 'cardiac']) {
      await seed({ ...baseline, mode })
      for (const nav of ['selection', 'discover']) {
        if (nav === 'selection') await id('home-exercises').click(); else { await page.locator('.detail-header uni-button').first().click(); await id('nav-discover').click() }
        for (const width of [360, 390, 430]) {
          await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(200)
          const selector = nav === 'selection' ? '.exercise-selection-panel,.selection-game,.selection-prescription,.selection-category-bar' : '.knowledge-hub,.knowledge-spotlights,.knowledge-community'
          const overflow = await page.locator(selector).evaluateAll(es => es.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => ({ class: e.className, width: e.clientWidth, scrollWidth: e.scrollWidth })))
          assert.deepEqual(overflow, [])
          const surface = nav === 'selection' ? '.exercise-selection-panel' : '.knowledge-hub'
          const images = page.locator(surface + ' uni-image img')
          assert.ok(await images.count() > 0, '应有实际图片元素')
          await page.waitForFunction(selector => [...document.querySelectorAll(selector)].every(image => image.complete && image.naturalWidth > 0), surface + ' uni-image img')
          const loaded = await images.evaluateAll(es => es.map(e => new URL(e.currentSrc || e.src).pathname))
          const expectedArt = nav === 'discover' ? ['knowledge-leaves-v1.png', 'knowledge-checklist-v1.png', 'knowledge-effort-v1.png'] : mode === 'cardiac' ? ['exercise-clinician-v1.png'] : []
          for (const filename of expectedArt) assert.ok(loaded.some(src => src.endsWith(filename)), filename + ' 未真实加载')
          const tooSmall = await page.locator(surface + ' uni-text').evaluateAll(es => es.filter(e => e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 11).map(e => ({ text: e.textContent, font: getComputedStyle(e).fontSize })))
          assert.deepEqual(tooSmall, [], '两页正文/辅助文字须在当前宽度至少11px')
          await page.screenshot({ path: path.join(out, 'CATALOG-' + mode + '-' + nav + '-' + width + '.png') })
        }
      }
    }
    return '公众/患者两页×360/390/430三宽度无横向溢出；逐个实际图片加载成功并检查4张新增装饰源；两页文字均不低于11px。12张独立截图；并非读屏、对比度或真机软键盘验收。'
  })
}
main().catch(e => results.push({ name: 'runner', status: 'FAIL', actual: e.stack })).finally(async () => {
  await fs.writeFile(path.join(out, 'catalog-run.json'), JSON.stringify({ generatedAt: new Date().toISOString(), environment:baseUrl, results, errors }, null, 2))
  await browser?.close(); console.log(JSON.stringify({ pass: results.filter(r => r.status === 'PASS').length, fail: results.filter(r => r.status === 'FAIL').length, errors: errors.length }))
  process.exitCode = results.some(r => r.status === 'FAIL') || errors.length ? 1 : 0
})
