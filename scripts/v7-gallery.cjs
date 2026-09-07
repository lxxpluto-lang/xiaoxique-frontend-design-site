const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const {createRequire}=require('node:module');
const sharp=createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('sharp');
const root=path.resolve(__dirname,'..');
const out=path.join(root,'docs/visual-acceptance/v7-20260907');
const refs=path.resolve(root,'../output/小喜鹊原型升级-20260906/全部28页原型-v7-image2精绘版-20260907/pages');
const names=['今日','运动前检查','动作跟练','本次运动报告','康复小报告','训练报告中心','选择使用方式','关联康复计划','运动选择','运动后状态','小喜健康助手','康复资讯','知识文章','知识视频','训练数据','个人中心','健康档案','设备与数据来源','本周运动路径','运动小菜园-成长','运动小菜园-打卡','健康小队','健康搭子','健康积分与权益','训练状态策略','医生审核队列','安全停止提示','训练暂停状态'];
const runtimeNames=names.map((n,i)=>String(i+1).padStart(2,'0')+'-'+(i===0?'今日首页':n));
const notes=[
  '已接入问候喜鹊、白绿计划卡和四类运动插画。患者姓名、处方项目/时长/项数、打卡以本地状态为准，不把图中的示例值写入业务数据。医院今日计划现直接使用最终参考中的人物裁切图。',
  '保留原前检查中的不适程度、显著症状立即阻断、设备与手工血压/血氧入口。参考图的四项勾选及额外心率/Borg采集没有直接替代原安全流程，布局仍有差异。',
  '正常训练已调整为白绿主题，暂停为深绿主题。真实训练页使用原教学视频和合成摄像头测试画面，不以人物插画冒充教学或用户摄像头；保持原评分演示边界，普通完成与快速演示仍是独立动作。',
  '已添加原图叶片和运动后喜鹊。前后测量、停止/演示标记和缺失提示来自真实本地记录；不固定88分，不声称康复改善。单位始终可见，长来源说明可展开查看，仍有正文长度差异。',
  '已替换原图爱心喜鹊、饮食、心率、运动和安全插画；保留7/30天切换、训练明细及待确认入口。周期内停止记录和数据不足会占用额外空间。',
  '日/月/小报告及历史记录可达，使用真实测试记录。图中阶段分数、图表与当前报告布局尚未做到像素级一致。',
  '已使用原图飞翔喜鹊、图标、鞋和心脏康复夹板；底色调整为中性灰白、两张白色入口卡。与参考图的留白、字体尺寸仍有差异。',
  '已使用原图配对喜鹊；保留未输入、错误重试、匹配、确认进入状态。医院名称和处方编号采用现有演示档案。',
  '已用原图医生与五种运动插画，默认推荐列表展示八段锦、弹力带抗阻、户外快走等全部9项目，保留5分类筛选与查看全部入口。指标仍用原项目真实可计算的项目/记录/步数，不伪造热量、平均心率和处方剂量。',
  '已增加原图运动人物，保留后测同步、Borg、真实感受、不适记录和生成报告流程。未用参考图示例数值代替缺失数据。',
  '按本轮要求删除今日计划卡和重复快捷入口，仅保留最新建议、推荐问题与提问；输入框固定在导航上方，回答仍是本地规则演示。',
  '已使用原图植物、夹板、用力感仪表和羽毛喜鹊，卡片底色为白。原知识文章保留；知识视频详情按本轮要求改为静态参考预览；社交入口按原可用性禁用；导航统一为今日/训练/小喜/资讯/我的。',
  '已使用原图拉伸人物与阅读要点插画。章节按原内容保留，不为对齐图片新增医疗建议、虚构审核状态或收藏能力；章节数量与参考图不同。',
  '按本轮明确要求移除旧知识视频播放器，直接使用最终参考中的画面与章节设计。顶部明确标注静态原型、不可播放、审核状态仅为示意；实际返回可点击。旧视频文件未删除，训练教学视频不受影响。',
  '已对齐原图报告喜鹊、三项统计图标、心率/血氧图标和三行解读布局，新增近7天与前7天比较、饮食提示和运动注意；异常信息优先、数据不足不判断提升。主图使用明确记录的隔离测试历史（近7天5次、前7天3次），并非真实患者数据；停止状态另见runtime/15-训练数据.png。',
  '按本轮要求改为中性默认头像，与健康档案共用；补齐原图树与四个健康管理图标。主截图来自普通患者模式，不显示医生/策略工具；演示工具仅本地显式启用时出现。积分入口保留未开放状态。',
  '按本轮要求使用与个人中心一致的中性默认头像，统一白卡和灰白背景。原医疗档案字段保持只读，未把图中的姓名、年龄、BMI、阶段目标写入演示患者档案。信息分组仍需进一步对齐。',
  '已加入原图手表示意，保留数据来源、手动步数和设备优先级。未新增真实系统权限，也未把手表图中的数字当作实时数据；布局与参考图不同。',
  '已使用原图叶片、保持周路径可达和当前日入口。真实周计划有7个日期节点，未根据图中3条示例删除原计划。',
  '已补齐原图无土树、七阶段图标、成长喜鹊、勾选、日历、运动及盾牌图标。主图使用隔离浏览器5个打卡日的测试历史展示成长阶段，不是硬编码树状态；收获后回到新种子的场景另见runtime/20-运动小菜园-成长.png。',
  '月历、已有打卡和记录由本地日期驱动；漏训不倒退规则保留。截图不固定为参考图的示例月份/连续天数。',
  '已用原图团队人物和成员头像。人员姓名、数量、提醒和邀请码采用既有本地小队模型；仅本地演示入口可达，没有外发提醒。',
  '已用原图双人插画，7/30天周期、每日温和提醒与漏打卡不解除关系均保留。实际搭子名称/天数为本地状态。',
  '已用原图礼物喜鹊、手册、弹力带、徽章。兑换保持原积分/权益规则和确认弹窗；普通用户入口仍未开放，仅本地演示可用。',
  '已用原图配置夹板和白色配置卡。发布前草稿与发布后生效规则保留；实际字段/版本不随参考图的虚构数值改变。仅本地演示工具可达。',
  '保留审核三种动作及状态，统一白色卡片；示例建议来自本地规则，未写入参考图中未经依据的功率或心率效果承诺。仅本地演示可达。',
  '真实训练画面上的停止弹层；三种症状和主动停止可点击，取消后恢复原活动/暂停状态，停止不新增积分。合成摄像头画面不是实际患者。',
  '真实暂停页保留原休息紫色喜鹊，继续/结束/不适入口可操作，计时及媒体暂停经过验证。仍保留原教学视频，所以不是图片中的虚构人物双镜头。'
];
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const hash=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
async function main(){
  const comparison=path.join(out,'comparison');fs.mkdirSync(comparison,{recursive:true});
  const pages=[];
  for(let i=0;i<28;i++){
    const id=String(i+1).padStart(2,'0'),reference=path.join(refs,id+'-'+names[i]+'-image2-v7.png');
    const scenario={14:'15-insight-improvement.png',15:'16-normal-patient.png',19:'20-growth-day5.png'}[i];
    const runtime=scenario&&fs.existsSync(path.join(out,'state',scenario))?path.join(out,'state',scenario):path.join(out,'runtime',runtimeNames[i]+'.png');
    if(!fs.existsSync(reference))throw Error('Missing specified reference: '+reference);
    const exists=fs.existsSync(runtime),refOut=path.join(comparison,id+'-reference.png'),runOut=path.join(comparison,id+'-runtime.png'),overlayOut=path.join(comparison,id+'-overlay.png');
    await sharp(reference).resize(390,844,{fit:'contain',background:'#fff'}).png().toFile(refOut);
    if(exists){await sharp(runtime).resize(390,844,{fit:'contain',background:'#fff'}).png().toFile(runOut);const half=await sharp(refOut).removeAlpha().ensureAlpha(.5).png().toBuffer();await sharp(runOut).composite([{input:half}]).png().toFile(overlayOut)}
    pages.push({id,name:names[i],reference,runtime:exists?runtime:null,referenceHash:hash(reference),runtimeHash:exists?hash(runtime):null,status:exists?'PARTIAL':'BLOCKED',note:notes[i],images:{reference:'comparison/'+id+'-reference.png',runtime:exists?'comparison/'+id+'-runtime.png':null,overlay:exists?'comparison/'+id+'-overlay.png':null}});
  }
  for(let group=0;group<7;group++){
    const canvas=sharp({create:{width:1560,height:1688,channels:4,background:'#fff'}}),items=[];
    for(let j=0;j<4;j++){const p=pages[group*4+j],left=j%2*780,top=Math.floor(j/2)*844;items.push({input:path.join(out,p.images.reference),left,top});if(p.images.runtime)items.push({input:path.join(out,p.images.runtime),left:left+390,top})}
    await canvas.composite(items).png().toFile(path.join(comparison,'group-'+(group+1)+'.png'));
  }
  const thumbnails=[];for(let i=0;i<28;i++)if(pages[i].images.runtime)thumbnails.push({input:await sharp(path.join(out,pages[i].images.runtime)).resize(195,422).toBuffer(),left:i%4*195,top:Math.floor(i/4)*422});
  await sharp({create:{width:780,height:2954,channels:4,background:'#fff'}}).composite(thumbnails).png().toFile(path.join(comparison,'28-runtime-overview.png'));
  const counts={MATCH:0,PARTIAL:pages.filter(p=>p.status==='PARTIAL').length,BLOCKED:pages.filter(p=>p.status==='BLOCKED').length};
  fs.writeFileSync(path.join(out,'pages.json'),JSON.stringify({generatedAt:new Date().toISOString(),counts,scope:'Local Chrome H5; all screenshots are real UI. No exact visual match is claimed.',pages},null,2));
  const html='<!doctype html><html lang="zh-CN"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>小喜鹊 · 全部28页 v7运行与参考对照图册</title><style>body{margin:0;background:#f4f7f7;color:#173035;font:15px/1.7 system-ui,sans-serif}main{max-width:1320px;margin:auto;padding:28px}h1{font-size:29px}header,section{padding:24px;background:white;border-radius:20px;margin-bottom:24px}nav{display:flex;flex-wrap:wrap;gap:8px;margin:18px 0}a{color:#007f73}nav a{padding:4px 12px;background:#edf6f4;border-radius:9px;text-decoration:none}.columns{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px}.columns img{width:100%;display:block;border:1px solid #e6eceb}figure{margin:0}figcaption{font-weight:650;margin-bottom:10px}h2{font-size:21px}small{font-size:12px;color:#6a7b80;overflow-wrap:anywhere}.pill{font-size:13px;background:#fff5d8;padding:4px 10px;border-radius:12px}.note{padding:16px;background:#f5f8f8;border-radius:10px}.top{position:fixed;right:12px;bottom:12px;background:white;padding:8px 16px;border-radius:30px}@media(max-width:650px){main{padding:10px}.columns{grid-template-columns:1fr}section{padding:15px}}@media print{.top,nav{display:none}section{break-before:page}}</style><main id="top"><header><h1>小喜鹊 · 全部28页 v7运行与参考对照图册</h1><p>最终参考图 / 当前真实运行 / 50%叠加。逐页记录差异，不以参考图冒充运行截图。</p><p><strong>MATCH '+counts.MATCH+' · PARTIAL '+counts.PARTIAL+' · BLOCKED '+counts.BLOCKED+'</strong>。功能可达不等于像素级复刻完成。原图数字、医疗文字和额外控件不自动作为新业务规则。</p><p>截图来源：本地Chrome，390×844；另有360/390/430尺寸证据。医生、社交和积分演示使用本地限定入口。训练教学视频保留，14页知识视频按本轮要求改为静态参考预览；摄像头采用浏览器合成测试输入。未验证微信真机、App真机或平台发布。</p><p><a href="pages.json">逐页映射与图片指纹</a> · <a href="assets.json">81项裁切素材来源</a> · <a href="runtime/browser-run.json">交互实测结果</a> · <a href="runtime/responsive-run.json">三尺寸记录</a></p><nav>'+pages.map(p=>'<a href="#p'+p.id+'">'+p.id+' '+esc(p.name)+'</a>').join('')+'</nav></header>'+pages.map(p=>'<section id="p'+p.id+'"><h2>'+p.id+' · '+esc(p.name)+' <span class="pill">'+p.status+'</span></h2><div class="columns"><figure><figcaption>最终原型参考</figcaption><img loading="lazy" src="'+p.images.reference+'"></figure><figure><figcaption>当前真实运行</figcaption>'+(p.images.runtime?'<img loading="lazy" src="'+p.images.runtime+'">':'<p>BLOCKED：未取得真实运行截图</p>')+'</figure><figure><figcaption>50%叠加对照</figcaption>'+(p.images.overlay?'<img loading="lazy" src="'+p.images.overlay+'">':'<p>无运行截图，不生成叠加图</p>')+'</figure></div><p class="note">'+esc(p.note)+'</p><small>参考 SHA-256：'+p.referenceHash+'<br>运行 SHA-256：'+(p.runtimeHash||'未取得')+'</small></section>').join('')+'<a class="top" href="#top">返回目录 ↑</a></main></html>';
  fs.writeFileSync(path.join(out,'全部28页-v7运行与参考对照图册.html'),html);
  console.log({pages:pages.length,counts,gallery:path.join(out,'全部28页-v7运行与参考对照图册.html')});
}
main().catch(e=>{console.error(e);process.exitCode=1});
