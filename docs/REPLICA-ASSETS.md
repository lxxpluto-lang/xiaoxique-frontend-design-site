# 图片资源清单与生成提示词

所有生成均使用内置 imagegen；未用 API Key/CLI，未读取真实患者照片。生成图只用作局部装饰，没有把整页效果图作为界面背景。

## 采用的资源

| 项目内路径 | 来源文件 | 用途与检查 |
|---|---|---|
| src/static/replica/tree-mature.png | exec-d3b7dd79-c9c6-4d80-9827-66bd6de95f08.png | 独立成熟树体；成长页和个人中心，无土、花盆、地台 |
| src/static/replica/magpie-flying.png | exec-01112cb4-62ab-4f6f-8273-5736b17b01ba.png | 启动/匹配紫色小喜插画 |
| src/static/replica/health-heart.png | exec-e9578385-9573-4920-8441-c1917bc30fc8.png | 小报告绿色心形叶片 |
| src/static/replica/buddy-friends.png | exec-8d179760-dc03-4621-a2e7-b651b93971a5.png | 双人搭子头像；检查为真实 RGBA 透明背景 |
| src/static/replica/social-friends.png | exec-322377a0-785a-4535-9d49-26d26253f0aa.png | 四人小队，最终使用干净浅薄荷实色背景 |
| src/static/replica/tree-sprout.svg | 原生 SVG 矢量绘制 | 幼芽，不含土和底座；不是 AI 位图生成 |

以上 exec 文件共同源目录：

`/Users/guagua/.codex/generated_images/01a07737-8d2c-7931-8dcf-83aa2e17795c/`

另复用原项目紫色角色 `src/static/rive-source/v4/master/magpie-neutral-master-v4.png`，及原有本地教学视频/互动海报。原 216 项静态文件均未覆盖。原旧版带土花园 SVG 作为基线资源保留，但当前 Vue/TS 不再引用。

## 本轮精确生成提示词

### 四人小队初次生成（最终未直接采用其背景）

Use case: illustration-story. Asset type: transparent cutout illustration for the hero card of a green Chinese cardiac rehabilitation mini-app. Input image is STYLE AND SUBJECT reference only, not an editing target. Generate ONLY the four friendly illustrated adults together as a compact group, chest-up with fully visible heads: a middle-aged woman with short dark bob in pale mint cardigan, an older gray-haired woman with glasses in sage green, a middle-aged man in a dark green hoodie, and a mature dark-haired man in muted teal shirt. The visual language must closely match the gentle polished illustrated people in the reference UI: clean soft 3D-cartoon shading, expressive but mature faces, warm trustworthy medical-wellness editorial style. Actual transparent RGBA background. A compact horizontal composition, four people side by side with a little overlap, all heads inside image, natural friendly poses, crop below waist, no hard rectangular background. Clothing shades only mint, sage, teal and cream. No UI, no lettering, no numbers, no badges, no logos, no trophy, no plants, no ground, no platform. Intended as decoration only, not real patient portraits.

参考：只读设计目录中的 `22-健康小队.png`，仅作为风格和人物参考。

### 双人搭子（采用）

Use case: illustration-story. Asset type: transparent cutout illustration for a green Chinese wellness mini-app buddy card. Input image is STYLE reference only. Generate ONLY TWO friendly mature women from the reference illustration language, side by side and facing slightly toward one another: on left a middle-aged Chinese woman with a dark bob and pale sage cardigan, on right a mature Chinese woman with soft curly dark hair and a teal cardigan. Chest-up, all heads and shoulders fully in frame, modest clothes, mature gentle faces, clean polished soft 3D-cartoon editorial illustration with fine shading. Leave a modest transparent gap between them for a UI heart drawn separately. Each figure has complete upper torso. Horizontal composition, genuine transparent RGBA background. No captions, no UI, no circles, no border, no leaves, no floor, no platform, no trophy, no extra people, no branding. Use the portrait style of the two women in the reference, not the whole screenshot.

参考：只读设计目录中的 `23-健康搭子.png`，仅作为风格参考。

### 四人小队背景修正（最终采用）

Precise background replacement edit. Preserve the four adults exactly as shown: same faces, ages, poses, arrangement, mint and teal clothes. Replace the entire gray-white checkerboard with a smooth solid very pale mint background, hex #E6F7EE. Absolutely NO checkerboard, NO transparency simulation, NO grid, NO text, NO blur glow, NO shadow and NO objects. Use an opaque clean pale mint background, not transparency. The people are a decorative header illustration for a green wellness app; their heads fully visible, tightly framed waist up with little empty space above the heads. The source is the editing target.

编辑输入：`exec-2fe3a4fe-e261-4223-aca2-a4bba29ab32f.png`。

## 未采用的输出

- `exec-2fe3a4fe-e261-4223-aca2-a4bba29ab32f.png`：人物合适，但透明棋盘格烘焙在像素中。
- `exec-d7d279ad-e8cc-437e-97df-66714798c346.png`：二次透明修正仍带棋盘格。

两张原始输出未删除、未复制进应用，便于追溯。树、飞翔小喜、心叶是此前步骤生成资产，其路径已保留；不把后写的描述冒充当时完整工具提示词。

## 本轮新增：五种礼品插图

使用内置 image_gen，以只读参考图24底部产品插画为风格输入，逐个生成单产品PNG，而非生成界面截图。图像均已人工检查：主体完整、浅薄荷背景、无棋盘格、无奖杯，盾牌中的小喜为紫色。PNG只是静态插图，不需要小程序运行3D引擎。

| 保存路径 | 对应原商品 | 展示规则 |
|---|---|---|
| src/static/replica/reward-guardian-v1.png | REWARD-001 七日守护徽章 | 紫色小喜盾牌，50积分 |
| src/static/replica/reward-handbook-v1.png | REWARD-002 康复运动手册 | 绿色手册，80积分，患者可见 |
| src/static/replica/reward-resistance-band-v1.png | REWARD-003 轻量弹力带 | 薄荷弹力环，150积分，患者可见 |
| src/static/replica/reward-notebook-v1.png | REWARD-004 MEM运动笔记本 | 鼠尾草绿笔记本，20M币，MEM解锁后可见 |
| src/static/replica/reward-mem-badge-v1.png | REWARD-005 MEM限定徽章 | 绿色叶片徽章，10M币，MEM解锁后可见 |

每张的完整原始提示词、生成源绝对路径和项目保存路径见 [REPLICA-REWARD-ASSETS.json](REPLICA-REWARD-ASSETS.json)。原生成文件保留，复制为新文件，未覆盖旧资源；浏览器检查见 layout-run.json 的“五类礼品素材和角色过滤”。金额是源字典的显示映射，不是图片里写死的文字。

## 运动选择、资讯与启动局部素材

| 保存路径 | 实际用途 | 边界 |
|---|---|---|
| src/static/replica/knowledge-leaves-v1.png | 资讯精选卡绿叶 | 浅薄荷不透明背景；无土盆底座，不伪称透明 |
| src/static/replica/knowledge-checklist-v1.png | 运动前检查重点卡、启动心脏康复卡 | 仅装饰，图中勾选不作为真实完成状态 |
| src/static/replica/knowledge-effort-v1.png | Borg知识重点卡 | 装饰表盘，无医学数字阈值；不是实时测量 |
| src/static/replica/exercise-clinician-v1.png | 运动选择患者处方入口 | 插画人物，不是真实医生肖像/签署 |
| src/static/replica/onboarding-shoe-v1.png | 启动日常运动卡 | 绿色软3D鞋、白鞋底鞋带，无商标/文字/底座 |

前四张完整提示词见 [REPLICA-KNOWLEDGE-ASSETS.json](REPLICA-KNOWLEDGE-ASSETS.json)；鞋图完整提示词及生成源路径见 [REPLICA-ONBOARDING-ASSETS.json](REPLICA-ONBOARDING-ASSETS.json)。均使用内置image_gen，生成后复制到项目，未删除或覆盖原始输出。未引入3D引擎，未用API Key/CLI。

打卡摘要直接复用growthArtwork：幼芽使用tree-sprout.svg，其余按既有成长阶段使用tree-mature.png；不额外生成无关树体。资讯删除multiply混合并匹配浅色卡面，避免明显叠底色块；图片加载及三尺寸检查见catalog-run.json，启动和打卡检查见layout-run.json。

## 暂停页休息紫喜

新增 `src/static/replica/magpie-resting-v1.png`，1254×1254 RGB PNG，由内置 image_gen 生成并编辑；紫色闭眼坐姿、奶油色脸腹，不含奖杯、土、盆或地台。图像只承担局部装饰，文字、暂停符号和操作按钮均是真实组件。

首张输出带烘焙棋盘格，未采用；第二张改为不透明深青背景，保留在页面圆形装饰区域，不谎称透明素材。全部提示词、参考、被拒输出及采用源路径见 [REPLICA-PAUSE-ASSET.json](REPLICA-PAUSE-ASSET.json)。使用内置模式，未调用 API Key/CLI；原资产保留。

## 安全停止弹窗三枚症状图标

使用内置image_gen分别生成`src/static/replica/safety-chest-v1.png`（心形闪电）、`safety-breath-v1.png`（简化呼吸图形）、`safety-dizzy-v1.png`（侧面头部与眩晕环）。均为1254×1254、不透明白底、珊瑚红软3D局部装饰；没有文本或伪按钮，不作为医学诊断图。原症状名称仍由源字典渲染并调用原停止函数。

三张已逐一查看，再检查真实35px左右显示下的辨识度和白底融合。完整提示词、源路径和保存路径见 [REPLICA-SAFETY-ASSETS.json](REPLICA-SAFETY-ASSETS.json)。原生成输出和原项目素材均保留；未引入3D引擎、外链或API Key。
