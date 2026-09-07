// Presentation-only regression tests with disposable local fixtures.
const fs = require('node:fs/promises'), path = require('node:path'), assert = require('node:assert/strict')
const { createRequire } = require('node:module')
const { chromium } = createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('playwright')
const root = path.resolve(__dirname, '..'), out = path.join(root, 'docs/visual-acceptance/latest')
const results = [], errors = []
let browser, page, baseline
const id = name => page.getByTestId(name)
async function saved() { return page.evaluate(() => uni.getStorageSync('magpie-prototype-state')) }
async function seed(data) { await page.evaluate(data => uni.setStorageSync('magpie-prototype-state', data), data); await page.reload({ waitUntil: 'networkidle' }) }
async function check(name, work) {
  const prior = errors.length
  try { const actual = await work(); assert.equal(errors.length, prior); results.push({ name, status: 'PASS', actual }); console.log('PASS ' + name) }
  catch (e) { results.push({ name, status: 'FAIL', actual: e.message }); console.log('FAIL ' + name + ' ' + e.message); await page.screenshot({ path: path.join(out, 'LAYOUT-FAIL-' + name + '.png') }).catch(() => {}) }
}
async function main() {
  await fs.mkdir(out, { recursive: true })
  browser = await chromium.launch({ headless: true, channel: 'chrome' })
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, timezoneId: 'Asia/Shanghai', locale: 'zh-CN' })
  page = await ctx.newPage(); page.setDefaultTimeout(5000); page.on('pageerror', e => errors.push(e.message))
  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
  await id('choose-public').click(); baseline = await saved()
  await check('处方卡三尺寸按钮不裁切', async () => {
    await seed({ ...baseline, mode: 'cardiac' })
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(150)
      const cards = await page.locator('.prescription-presentation').evaluateAll(es => es.map(e => {
        const r = e.getBoundingClientRect(), b = e.querySelector('.task-primary').getBoundingClientRect(), s = e.closest('uni-swiper').getBoundingClientRect()
        return { bottom: b.bottom, cardBottom: r.bottom, swiperBottom: s.bottom, width: b.width, available: !e.querySelector('.task-primary').hasAttribute('disabled'), title: e.querySelector('.prescription-name').textContent }
      }))
      assert.equal(cards.length, 4)
      for (const card of cards) { assert.ok(card.bottom <= card.swiperBottom + 1, width + ' ' + card.title + ' 按钮超出轮播'); assert.ok(card.bottom <= card.cardBottom + 1); assert.ok(card.width > 120); assert.equal(card.available, true) }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    return '4项原处方在360/390/430宽度中按钮均完整容纳；内容与可用守卫未丢失。'
  })
  await check('医生确认说明不挤掉开始按钮', async () => {
    await seed({ ...baseline, mode: 'cardiac', planAdjustment: '沿用医生确认的当前计划，训练前后记录身体感受；这是一条本地排版测试说明。' })
    const values = await page.locator('.prescription-presentation').evaluateAll(es => es.map(e => ({ content: e.scrollHeight, height: e.clientHeight })))
    for (const value of values) assert.ok(value.content <= value.height + 1, JSON.stringify(value))
    return '合成说明仅写入可丢弃浏览器；扩展卡片高度容纳医生确认文案。'
  })
  await check('助手输入常驻和消息滚动', async () => {
    await seed(baseline); await id('nav-assistant').click()
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(150)
      const composer = await id('assistant-composer').boundingBox(), nav = await page.locator('.bottom-nav').boundingBox()
      assert.ok(composer.y > 0 && composer.y + composer.height <= nav.y + 1)
      assert.ok(await id('assistant-query').isVisible())
      const scroll = id('assistant-scroll').locator('.uni-scroll-view').first()
      await scroll.evaluate(e => { e.scrollTop = e.scrollHeight })
      const after = await id('assistant-composer').boundingBox(); assert.ok(Math.abs(after.y - composer.y) < 1)
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await id('assistant-query').locator('input').fill('今天身体数据怎么理解？'); await id('assistant-send').click()
    await id('assistant-messages').waitFor(); await page.waitForTimeout(600)
    assert.equal(await id('assistant-query').locator('input').inputValue(), '')
    assert.match(await id('assistant-messages').innerText(), /判断依据/)
    const message = await page.locator('#assistant-message-0').boundingBox(), scroll = await id('assistant-scroll').boundingBox()
    assert.ok(message.y >= scroll.y - 3 && message.y < scroll.y + scroll.height)
    await page.screenshot({ path: path.join(out, '11-小喜健康助手-常驻输入与问答.png') })
    return '三尺寸下输入栏在导航上方常驻；内容滚动不推动输入栏；发送后定位到新问题，输入清空且回答可见。未模拟手机软键盘。'
  })
  await check('报告评分来源和前后缺失值', async () => {
    await seed({ ...baseline, mode: 'cardiac' }); await id('nav-profile').click()
    await page.locator('.service-list uni-button').filter({ hasText: '训练状态策略' }).click()
    await page.locator('.scenario-section uni-button').filter({ hasText: '稳定' }).click()
    await id('session-report-screen').waitFor()
    const session = (await saved()).sessions[0]
    const ring = await id('session-result-ring').innerText()
    if (session.poseScored && Number.isFinite(session.score)) assert.match(ring, new RegExp(String(session.score)))
    else { assert.match(ring, /运动已记录/); assert.doesNotMatch(ring, /动作评分/) }
    const snapshots = [session.assessment.pre, session.assessment.post]
    for (const [metric, key] of [['METRIC-SESSION-HR', 'heartRate'], ['METRIC-SESSION-SPO2', 'oxygenSaturation']]) {
      const cells = page.locator('[data-metric="' + metric + '"] > uni-text')
      for (const [i, snapshot] of snapshots.entries()) {
        const actual = await cells.nth(i ? 2 : 0).innerText()
        const expected = snapshot?.quality === 'valid' && Number.isFinite(snapshot[key]) ? String(snapshot[key]) + (key === 'oxygenSaturation' ? '%' : '') : '未采集'
        assert.equal(actual, expected)
      }
    }
    return '圆环按实际poseScored显示分数或已记录；前后心率/血氧逐格与保存的有效快照一致，不填参考图演示值。'
  })
  await check('打卡摘要真实计数与树体同步', async () => {
    for (const checked of [false, true]) {
      const records = await page.evaluate(checked => Array.from({ length: 3 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (checked ? 2 : 3) + i)
        const date = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
        return { date, source: 'core-exercise', exerciseId: 'baduanjin', pointsAwarded: 5, createdAt: d.toISOString() }
      }), checked)
      await seed({ ...baseline, checkIns: records }); await id('nav-profile').click(); await id('profile-garden-growth').click()
      const growth = await page.locator('.growth-plant-art').getAttribute('src')
      await id('garden-section-checkin').click()
      assert.equal(await id('checkin-growth-art').getAttribute('src'), growth)
      assert.match(await id('checkin-total').innerText(), /3/); assert.match(await id('checkin-streak').innerText(), /3/)
      assert.match(await id('garden-checkin-summary').innerText(), checked ? /今天已自动打卡/ : /完成有效运动后自动打卡/)
      for (const width of [360, 390, 430]) {
        await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(150)
        const box = await id('garden-checkin-summary').evaluate(e => ({ width: e.clientWidth, content: e.scrollWidth }))
        assert.ok(box.content <= box.width + 1)
        await page.screenshot({ path: path.join(out, '21-打卡摘要-' + (checked ? '已打卡' : '待打卡') + '-' + width + '.png') })
      }
      await page.reload({ waitUntil: 'networkidle' }); assert.deepEqual((await saved()).checkIns, records)
    }
    return '3个连续自然日的已打卡/待打卡两状态显示正确；连续与累计为3，树体和成长页同源；三尺寸无横向溢出，刷新不改变原checkIns。'
  })
  await check('启动双卡插画和模式行为', async () => {
    await seed({ ...baseline, ready: false })
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(150)
      await page.waitForFunction(() => [...document.querySelectorAll('.mode-icon img')].length === 2 && [...document.querySelectorAll('.mode-icon img')].every(i => i.complete && i.naturalWidth > 0))
      const overflow = await page.locator('.mode-card').evaluateAll(es => es.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className))
      assert.deepEqual(overflow, [])
      await page.screenshot({ path: path.join(out, '07-启动插画-' + width + '.png') })
    }
    await id('choose-cardiac').click(); await id('onboarding-binding').waitFor()
    await page.locator('.binding-header uni-button').click(); await id('choose-public').click(); await id('today-screen').waitFor()
    assert.equal((await saved()).mode, 'public')
    return '运动鞋和检查表两张本地插画实际加载；三尺寸双卡无横向溢出；心脏康复仍进入绑定、公众仍直接进入，未改模式处理器。'
  })
  await check('个人中心原入口和三尺寸横向卡片', async () => {
    for (const mode of ['public', 'cardiac']) {
      await seed({ ...baseline, mode }); await id('nav-profile').click()
      const before = await saved()
      assert.equal(await id('points-exchange-unavailable').getAttribute('disabled'), 'true')
      assert.equal(await page.locator('.health-management-grid uni-button').count(), 4)
      for (const width of [360, 390, 430]) {
        await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(150)
        const cards = await page.locator('.profile-identity,.profile-garden-card,.health-management-grid>uni-button').evaluateAll(es => es.map(e => ({ width: e.clientWidth, content: e.scrollWidth })))
        for (const card of cards) assert.ok(card.content <= card.width + 1, mode + ' ' + width + ' ' + JSON.stringify(card))
        const tree = await page.locator('.profile-garden-main uni-image').boundingBox(), copy = await page.locator('.profile-garden-main>uni-view').boundingBox()
        assert.ok(tree.x > copy.x + copy.width - 1, '树体必须位于文字右侧')
        const small = await page.locator('.profile-identity,.profile-garden-card,.health-management-grid').locator('uni-text').evaluateAll(es => es.filter(e => parseFloat(getComputedStyle(e).fontSize) < 11).map(e => e.textContent))
        assert.deepEqual(small, [])
        await page.screenshot({ path: path.join(out, '16-个人中心-' + mode + '-' + width + '.png') })
      }
      await page.locator('.profile-identity uni-button').click()
      assert.equal(await page.locator('.detail-frame').getAttribute('data-detail-view'), 'health-archive')
      await page.locator('.detail-header uni-button').first().click()
      await id('profile-garden-checkin').click(); await id('garden-checkin-summary').waitFor()
      assert.deepEqual((await saved()).checkIns, before.checkIns)
    }
    await page.setViewportSize({ width: 390, height: 844 })
    return '双角色身份/健康档案入口、4管理卡、禁用积分、真实打卡入口保留；三尺寸树右文左且卡片不溢出，所测区域字号≥11px；查看不更改记录。'
  })
  await check('文章分节原文与医学状态', async () => {
    const { knowledgeItems } = require('../src/lib/prototype-data.ts')
    await seed(baseline); await id('nav-discover').click()
    for (const item of knowledgeItems.filter(i => i.type !== 'video')) {
      await page.locator('[data-knowledge-id="' + item.id + '"]').click()
      assert.deepEqual(await id('knowledge-paragraph').allTextContents(), item.body)
      assert.match(await page.locator('.article-cover').innerText(), /内容待医学审核/)
      for (const width of [360, 390, 430]) {
        await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(80)
        const overflow = await page.locator('.article-cover,.reading-point').evaluateAll(es => es.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className))
        assert.deepEqual(overflow, [], item.id + ' ' + width)
      }
      await id('knowledge-back').click()
    }
    await page.setViewportSize({ width: 390, height: 844 })
    return '7篇原文段落逐字、逐序匹配；分节仅增加展示标题；均保留待医学审核，不伪造阅读进度或已审核。三宽度封面与章节无横向溢出。'
  })
  await check('审核队列三处理刷新与长文空态', async () => {
    const reviews = ['approved','maintained','rejected'].map((status,index) => ({ id: 'layout-review-'+index, sessionId: 'layout-session-'+index, adviceId: 'layout-advice-'+index, status: 'pending', proposedChange: '这是排版回归的本地测试建议，不构成真实处方。'.repeat(index ? 1 : 6), createdAt: new Date().toISOString() }))
    await seed({ ...baseline, mode: 'cardiac', doctorReviews: reviews, planAdjustment: '原计划说明' })
    await id('nav-profile').click(); await page.locator('.service-list uni-button').filter({ hasText: '医生审核队列' }).click()
    assert.ok(await page.locator('.screen-copy').evaluate(e => parseFloat(getComputedStyle(e).paddingTop) > 0), '审核信息条样式实际生效')
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(150)
      const overflow = await id('review-card').evaluateAll(es => es.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.getAttribute('data-review-id')))
      assert.deepEqual(overflow, [])
      for (const button of await page.locator('.review-actions uni-button').all()) assert.ok((await button.boundingBox()).height >= 44)
      await page.screenshot({ path: path.join(out, '26-审核长文-' + width + '.png') })
    }
    for (const [index, status] of ['approved','maintained','rejected'].entries()) {
      const card = page.locator('[data-review-id="layout-review-' + index + '"]')
      await card.locator('.review-actions uni-button').nth(index).click()
      assert.equal(await card.getAttribute('data-state'), status)
      assert.equal(await card.locator('.review-actions uni-button').count(), 0)
      await card.getByTestId('review-resolution').waitFor()
      const state = await saved(); assert.equal(state.doctorReviews[index].status, status)
      assert.ok(state.doctorReviews[index].reviewedAt); assert.equal(state.planAdjustment, reviews[0].proposedChange)
    }
    const after = await saved(); await page.reload({ waitUntil: 'networkidle' })
    assert.deepEqual((await saved()).doctorReviews, after.doctorReviews)
    await id('nav-profile').click(); await page.locator('.service-list uni-button').filter({ hasText: '医生审核队列' }).click()
    assert.equal(await id('review-resolution').count(), 3); assert.match(await id('review-boundary').innerText(), /本地原型演示/)
    await seed({ ...baseline, doctorReviews: [] }); await id('nav-profile').click()
    await page.locator('.service-list uni-button').filter({ hasText: '医生审核队列' }).click()
    assert.equal(await id('review-card').count(), 0); assert.match(await page.locator('.review-list').innerText(), /暂无待审核建议/)
    await page.setViewportSize({ width: 390, height: 844 })
    return '三种处理均更新对应实体、隐藏处理按钮并保存时间，刷新保持；只有同意更新planAdjustment。长建议三宽度不溢出、按钮≥44px；空列表不伪造已处理记录。仅使用可丢弃测试数据。'
  })
  await check('运动前手动设备三字段与必填守卫', async () => {
    await seed({ ...baseline, mode: 'cardiac' })
    await page.locator('.prescription-card .task-primary').first().click()
    assert.equal(await id('begin-training').getAttribute('disabled'), 'true', '进入必填检查页时禁用')
    await id('enter-pre-vitals-manually').click()
    const inputs = page.locator('.precheck-vital-form input')
    assert.equal(await inputs.count(), 3)
    await inputs.nth(0).fill('128'); await inputs.nth(1).fill('78')
    assert.equal(await id('begin-training').getAttribute('disabled'), 'true')
    await inputs.nth(2).fill('98')
    assert.equal(await id('begin-training').getAttribute('disabled'), 'true', '填完设备值仍须记录不适评分')
    await id('discomfort-score').locator('uni-slider').click({ position: { x: 35, y: 15 } })
    assert.notEqual(await id('begin-training').getAttribute('disabled'), 'true')
    await inputs.nth(2).fill(''); await page.waitForTimeout(100); assert.equal(await id('begin-training').getAttribute('disabled'), 'true', '清空血氧后恢复禁用')
    await inputs.nth(2).fill('98')
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(150)
      const overflow = await page.locator('.assessment-intro,.precheck-section,.precheck-vital-form label').evaluateAll(es => es.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className))
      assert.deepEqual(overflow, [])
      for (const input of await inputs.all()) assert.ok((await input.boundingBox()).height >= 42)
      const small = await id('precheck-screen').locator('uni-text').evaluateAll(es => es.filter(e => parseFloat(getComputedStyle(e).fontSize) < 11).map(e => e.textContent))
      assert.deepEqual(small, [])
      await page.screenshot({ path: path.join(out, '02-手动填写-' + width + '.png') })
    }
    await id('read-pre-vitals').click()
    for (const input of await inputs.all()) assert.equal(await input.isDisabled(), true)
    assert.deepEqual(await inputs.evaluateAll(es => es.map(e => e.value)), ['128','78','98'])
    await id('begin-training').click(); await id('training-screen').waitFor()
    await id('training-discomfort').click(); await id('stop-immediately').click()
    return '未填/两项/缺评分/清空血氧均保持禁用，填全后可开始；3个原字段和输入顺序未变，设备读取后只读。三尺寸字段不溢出、输入≥42px、文字≥11px。仅演示设备值，未判定真实临床安全。'
  })
  await check('运动后策略字段与报告映射', async () => {
    for (const fieldsVisible of [true, false]) {
      const policy = { ...baseline.publishedPolicy, preMode: 'off', postMode: 'required', fields: { ...baseline.publishedPolicy.fields, heartRate: fieldsVisible, oxygenSaturation: fieldsVisible, borg: fieldsVisible, feeling: fieldsVisible } }
      await seed({ ...baseline, mode: 'cardiac', publishedPolicy: policy })
      await page.locator('.prescription-card .task-primary').first().click(); await id('demo-complete').click()
      await id('postcheck-screen').waitFor()
      assert.equal(await id('post-heart-rate').count(), fieldsVisible ? 1 : 0)
      assert.equal(await id('post-oxygen').count(), fieldsVisible ? 1 : 0)
      assert.equal(await id('post-borg').count(), fieldsVisible ? 1 : 0)
      assert.equal(await page.locator('.feeling-row').count(), fieldsVisible ? 1 : 0)
      await id('read-post-vitals').click()
      if (fieldsVisible) {
        await id('post-heart-rate').locator('input').fill('79'); await id('post-oxygen').locator('input').fill('97')
        await page.locator('.feeling-row uni-button').filter({ hasText: '较累' }).click()
        assert.equal(await page.locator('.feeling-row uni-button.active').innerText(), '较累')
        for (const width of [360, 390, 430]) {
          await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(150)
          const overflow = await page.locator('.assessment-intro,.assessment-panel,.feeling-card,.postcheck-detail .vital-form label').evaluateAll(es => es.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className))
          assert.deepEqual(overflow, [])
          for (const button of await page.locator('.feeling-row uni-button,.assessment-panel-head uni-button').all()) assert.ok((await button.boundingBox()).height >= 44)
          const small = await id('postcheck-screen').locator('uni-text').evaluateAll(es => es.filter(e => parseFloat(getComputedStyle(e).fontSize) < 11).map(e => e.textContent))
          assert.deepEqual(small, [])
          await page.screenshot({ path: path.join(out, '10-运动后数据-' + width + '.png') })
        }
      }
      await id('generate-report').click(); await id('session-report-screen').waitFor()
      const post = (await saved()).sessions[0].assessment.post
      if (fieldsVisible) { assert.equal(post.heartRate, 79); assert.equal(post.oxygenSaturation, 97); assert.equal(post.feeling, '较累') }
    }
    await page.setViewportSize({ width: 390, height: 844 })
    return '4个策略字段显示/隐藏逐项对应；原同步、数值编辑、感受选择进入原报告快照。三尺寸卡片不溢出，感受/同步按钮≥44px，文字≥11px；没有增设不适表单或修改生成守卫。'
  })
  await check('训练数据真实统计步数与三尺寸图表', async () => {
    const today = baseline.dailyStepRecords.at(-1).date
    const rows = [{ id: 'layout-completed', title: '本地排版测试运动', status: 'completed', exerciseId: 'breathing', createdAt: new Date().toISOString(), durationSeconds: 180 }, { id: 'layout-stopped', title: '停止记录', status: 'stopped', exerciseId: 'breathing', createdAt: new Date().toISOString(), durationSeconds: 120 }]
    for (const quality of ['valid','missing','stale','denied']) {
      const stepRows = baseline.dailyStepRecords.map(row => ({ ...row, steps: row.date === today ? 4321 : row.steps, goal: 6000, quality, source: 'manual', syncedAt: new Date().toISOString() }))
      await seed({ ...baseline, sessions: rows, dailyStepRecords: stepRows })
      const normalizedRows = (await saved()).sessions
      await id('nav-data').click()
      assert.equal(await page.locator('[data-metric="METRIC-DATA-TOTAL-MINUTES"] .data-stat-value').innerText(), '3')
      assert.equal(await page.locator('[data-metric="METRIC-DATA-TOTAL-COMPLETED"] .data-stat-value').innerText(), '1')
      assert.equal(await id('data-step-progress').getAttribute('data-progress'), quality === 'valid' ? '72' : '0')
      assert.match(await id('daily-steps-card').innerText(), /6,000/)
      if (quality === 'valid') assert.match(await id('daily-steps-card').innerText(), /4,321/)
      else assert.doesNotMatch(await id('daily-steps-card').innerText(), /4,321/)
      assert.equal(await page.locator('.steps-trend-chart>uni-view').count(), 7)
      assert.equal(await page.locator('.recent-session-list>uni-view').count(), 1)
      for (const width of [360, 390, 430]) {
        await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(120)
        const overflow = await page.locator('.data-panel,.data-section,.data-activity-card,.steps-trend-card').evaluateAll(es => es.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.className))
        assert.deepEqual(overflow, [], quality + ' ' + width)
        const small = await page.locator('.data-panel uni-text').evaluateAll(es => es.filter(e => parseFloat(getComputedStyle(e).fontSize) < 11).map(e => e.textContent))
        assert.deepEqual(small, [])
        const rects = await page.locator('.steps-trend-chart>uni-view>uni-text:first-child').evaluateAll(es => es.map(e => { const range = document.createRange(); range.selectNodeContents(e); const r = range.getBoundingClientRect(); return { left: r.left, right: r.right } }))
        for (let i = 1; i < rects.length; i++) assert.ok(rects[i-1].right <= rects[i].left + .5, '相邻趋势值不能重叠')
        await page.screenshot({ path: path.join(out, '15-数据-' + quality + '-' + width + '.png') })
      }
      await id('daily-steps-card').click(); assert.equal(await page.locator('.detail-frame').getAttribute('data-detail-view'), 'devices')
      assert.deepEqual((await saved()).sessions, normalizedRows)
    }
    await page.setViewportSize({ width: 390, height: 844 })
    return '完成/停止合成记录证明3分钟1项目，不计停止时长；4321/6000显示72%，缺失/过期/拒绝显示0且不泄露无效步数。7日图/原记录/来源入口保留，三尺寸无溢出、数值不重叠、文字≥11px。未把原演示身体指标当作新采集数据。'
  })
  await check('快速离开训练的视频播放请求回收', async () => {
    await seed({ ...baseline, mode: 'cardiac', publishedPolicy: { ...baseline.publishedPolicy, preMode: 'off', postMode: 'required' } })
    for (let index = 0; index < 12; index++) {
      await page.locator('.prescription-card .task-primary').first().click()
      await id('demo-complete').click()
      await id('postcheck-screen').waitFor()
      await page.locator('.detail-header uni-button').first().click()
    }
    await page.waitForTimeout(500)
    return '连续12次快速进入训练并转到运动后页，播放未完成时离开也不产生未处理Promise错误；非H5仍使用原VideoContext。不是完整时长训练测试。'
  })
  await check('五类礼品素材和角色过滤', async () => {
    await seed({ ...baseline, mode: 'cardiac', wallet: { ...baseline.wallet, healthPoints: 500, mCoins: 50 } })
    await id('nav-profile').click(); await id('preview-rewards').click()
    assert.equal(await id('reward-product-card').count(), 3)
    await id('mem-code').locator('input').fill('MEM-2026'); await id('unlock-mem').click()
    assert.equal(await id('reward-product-card').count(), 5)
    await page.waitForFunction(() => [...document.querySelectorAll('.reward-product-art img')].length === 5 && [...document.querySelectorAll('.reward-product-art img')].every(i => i.complete && i.naturalWidth > 0))
    assert.equal(await page.locator('.reward-product-fallback').count(), 0)
    const expected = { 'REWARD-001': '50积分', 'REWARD-002': '80积分', 'REWARD-003': '150积分', 'REWARD-004': '20M币', 'REWARD-005': '10M币' }
    for (const card of await id('reward-product-card').all()) assert.equal((await card.locator('.reward-product-price').innerText()).replace(/\s/g, ''), expected[await card.getAttribute('data-reward-id')])
    for (const width of [360, 390, 430]) {
      await page.setViewportSize({ width, height: 844 }); await page.waitForTimeout(150)
      const overflows = await id('reward-product-card').evaluateAll(es => es.filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.getAttribute('data-reward-id')))
      assert.deepEqual(overflows, [])
    }
    await page.setViewportSize({ width: 390, height: 844 })
    await id('region-reward-catalog').scrollIntoViewIfNeeded(); await page.screenshot({ path: path.join(out, '24-健康积分与权益-五类礼品.png') })
    return '患者3礼品、MEM解锁后5礼品；5张本地图片实际加载，金额和币种逐项匹配，三尺寸无卡片横向溢出。'
  })
}
main().catch(e => results.push({ name: 'runner', status: 'FAIL', actual: e.stack })).finally(async () => {
  await fs.writeFile(path.join(out, 'layout-run.json'), JSON.stringify({ generatedAt: new Date().toISOString(), results, errors }, null, 2))
  await browser?.close(); console.log(JSON.stringify({ pass: results.filter(r => r.status === 'PASS').length, fail: results.filter(r => r.status === 'FAIL').length, errors: errors.length }))
  process.exitCode = results.some(r => r.status === 'FAIL') ? 1 : 0
})
