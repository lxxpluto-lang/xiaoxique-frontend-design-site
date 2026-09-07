const fs = require('node:fs');
const path = require('node:path');
const cp = require('node:child_process');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const baseline = path.resolve(root, '../小喜鹊精简功能版');
const references = path.resolve(root, '../output/小喜鹊原型升级-20260906');
const walk = dir => fs.readdirSync(dir, { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)]);
const lineAt = (text, pos) => text.slice(0, pos).split('\n').length;
const scan = dir => walk(path.join(dir, 'src')).filter(p => /\.(vue|ts)$/.test(p)).map(p => {
  const source = fs.readFileSync(p, 'utf8');
  return {
    file: path.relative(dir, p),
    anchors: [...source.matchAll(/(?<!:)data-testid="([^"]+)"/g)].map(m => ({ id: m[1], line: lineAt(source, m.index) })),
    handlers: [...source.matchAll(/@([\w:-]+)="([^"]+)"/g)].map(m => ({ event: m[1], expression: m[2], line: lineAt(source, m.index) })),
    fields: [...source.matchAll(/v-model(?:\.[\w]+)?="([^"]+)"/g)].map(m => ({ binding: m[1], line: lineAt(source, m.index) })),
    functions: [...source.matchAll(/(?:async\s+)?function\s+(\w+)\s*\(/g)].map(m => ({ name: m[1], line: lineAt(source, m.index) })),
    views: [...source.matchAll(/detailView\s*===\s*'([^']+)'/g)].map(m => m[1]),
    sha256: crypto.createHash('sha256').update(source).digest('hex'),
  };
});
const git = (dir, args) => cp.execFileSync('git', ['-C', dir, ...args], { encoding: 'utf8' }).trim();
const types = fs.readFileSync(path.join(baseline, 'src/lib/prototype-data.ts'), 'utf8');
const enumeration = Object.fromEntries([...types.matchAll(/export type (\w+)\s*=\s*([\s\S]*?)(?=\nexport |\n\n)/g)].map(m => [m[1], [...m[2].matchAll(/'([^']+)'/g)].map(x => x[1])]));
const views = ['today','precheck','training/active','session-report','hospital-report','training-reports','onboarding/mode','onboarding/binding','exercise-category','postcheck','assistant','discover','knowledge-article','knowledge-video','data','profile','health-archive','devices','weekly-path','garden/growth','garden/checkin','social-hub/team','social-hub/buddy','reward-store','prototype-policy','doctor-reviews','training/stop-modal','training/paused'];
const images = fs.readdirSync(references).filter(n => /^\d\d-.*\.png$/.test(n)).sort();
const baseScan = scan(baseline);
const currentScan = scan(root);
const assets = walk(path.join(baseline, 'src/static')).map(p => ({ file: path.relative(baseline,p), bytes: fs.statSync(p).size }));
const data = { generatedAt: new Date().toISOString(), baseline: git(baseline,['rev-parse','HEAD']), target: git(root,['rev-parse','HEAD']), baselineStatus: git(baseline,['status','--short']), targetStatus: git(root,['status','--short']), node: process.version, enumeration, baselineFiles:baseScan, currentFiles:currentScan, assets, references:images.map((image,i)=>({image,view:views[i],classification: i===4?'rebuild_interaction':'inherit_layout'})) };
const out = path.join(root,'docs');
fs.mkdirSync(out,{recursive:true});
fs.writeFileSync(path.join(out,'REPLICA-STAGE0-INVENTORY.json'), JSON.stringify(data,null,2)+'\n');
const anchors = baseScan.flatMap(s=>s.anchors.map(a=>`| ${a.id} | ${s.file}:${a.line} | 保留，沿用关联事件；浏览器结果另验 |`));
const handlers = baseScan.flatMap(s=>s.handlers.map(a=>`| ${s.file}:${a.line} | ${a.event} | ${a.expression.replace(/\|/g,'\\|').replace(/\s+/g,' ')} |`));
const fields = baseScan.flatMap(s=>s.fields.map(a=>`| ${s.file}:${a.line} | ${a.binding} |`));
const text = `# UI 复刻 Stage 0 盘点\n\n生成：${data.generatedAt}\n\n- 功能权威：只读原项目，提交 ${data.baseline}。\n- 目标副本提交：${data.target}。\n- 原项目工作区：${data.baselineStatus || 'clean'}。\n- Node：${data.node}。\n- 改造前 type-check、test:rive-runtime（2/2）、build:h5 均已通过。Sass legacy API 弃用警告不影响构建。\n- 原始运行截图：visual-acceptance/before/。\n- 完整机器清单：REPLICA-STAGE0-INVENTORY.json（资源、字段、处理器、锚点、文件 hash）。\n\n## 冲突裁决\n\n- DEC-CONFLICT-001：本地源代码行为优先于提示词与效果图中的推测。真实处方、时长、6000 步目标、数据来源、奖励资格、社交开关、医生审核规则均继承。\n- DEC-CONFLICT-002：hospital-report 在类型中存在但无页面实现；增加康复小报告是本次明确新增，不声称它是已存在功能。\n- DEC-CONFLICT-003：图中文字/数字不写死。图中运动选择/数据命名与现有导航不一致时，保留原导航 ID 和功能，视觉使用同一布局语言。\n- DEC-CONFLICT-004：旧花园种植小白菜的计数规则保留，展示名与插画更新为小树；7 个有效训练日一轮、不倒退、不重复成长不变。\n- DEC-CONFLICT-005：图中未在基线存在的搜索、报告分段入口等属于表现层增强；必须标注新增并做到可用。不能依据图新增真实医院/设备/支付/消息。\n\n## 状态和字典\n\n${Object.entries(enumeration).map(([n,v])=>'- '+n+'：'+v.join(', ')).join('\n')}\n\n## 28 页覆盖与处置\n\n| 参考图 | 运行视图/状态 | 处置 |\n|---|---|---|\n${data.references.map(r=>'| '+r.image+' | '+r.view+' | '+r.classification+' |').join('\n')}\n\n## 现有测试锚点\n\n锚点只能证明定位信息；处理器和运行结果需结合下表与浏览器 ARUN。动态锚点保留原模板，并纳入实际 DOM 验收。\n\n| 锚点 | 来源 | 处置/预期 |\n|---|---|---|\n${anchors.join('\n')}\n\n## 事件与处理器\n\n| 来源 | 事件 | 表达式 |\n|---|---|---|\n${handlers.join('\n')}\n\n## 双向表单字段\n\n| 来源 | 数据绑定 |\n|---|---|\n${fields.join('\n')}\n\n## 资源回退\n\n- Rive 资源开关、MP4、poster、sprite、overlay、WASM、微信原生组件沿用原契约。未导出的正式 .riv 继续 disabled 并播放 MP4。\n- 所有原始资产路径和大小见 JSON，新增资源单独落盘。\n- 图像风格：用户已确认全绿界面、紫色小喜、独立树体；28 张图为视觉依据。\n- 本盘点不代表实现或浏览器验收通过。\n`;
fs.writeFileSync(path.join(out,'REPLICA-STAGE0-INVENTORY.md'),text);
console.log(JSON.stringify({references:images.length,anchors:anchors.length,handlers:handlers.length,fields:fields.length,sourceFiles:baseScan.length,assets:assets.length}));
