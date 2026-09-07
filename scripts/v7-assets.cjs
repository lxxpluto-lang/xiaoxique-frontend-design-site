const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const { createRequire } = require('node:module');
const sharp = createRequire('/Users/guagua/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/package.json')('sharp');
const root = path.resolve(__dirname, '..');
const refs = path.resolve(root, '../output/小喜鹊原型升级-20260906/全部28页原型-v7-image2精绘版-20260907/raw-image2-originals');
const out = path.join(root, 'src/static/replica-v7');
// Coordinates are measured on the unpadded, original image2 export. Only artwork is extracted.
const cuts = [
  ['knowledge-video-reference','14-知识视频-image2-v7.png',30,142,812,1490,false],
  ['data-time-icon','15-训练数据-image2-v7.png',123,130,73,68,false],
  ['data-completed-icon','15-训练数据-image2-v7.png',393,130,72,68,false],
  ['data-streak-icon','15-训练数据-image2-v7.png',664,130,70,68,false],
  ['data-heart-icon','15-训练数据-image2-v7.png',76,1114,72,73,false],
  ['data-oxygen-icon','15-训练数据-image2-v7.png',463,1114,73,73,false],
  ['garden-calendar-icon','20-运动小菜园-成长-image2-v7.png',126,1404,72,77,false],
  ['garden-exercise-icon','20-运动小菜园-成长-image2-v7.png',386,1404,76,77,false],
  ['garden-shield-icon','20-运动小菜园-成长-image2-v7.png',641,1404,76,77,false],
  ['garden-check-icon','20-运动小菜园-成长-image2-v7.png',79,1188,143,128,true],
  ['welcome','01-今日-image2-v7.png',38,106,160,162,true],
  ['baduanjin','01-今日-image2-v7.png',467,666,346,407,false],
  ['walking','01-今日-image2-v7.png',49,1440,175,215,false],
  ['stretch','01-今日-image2-v7.png',246,1440,173,215,false],
  ['resistance','01-今日-image2-v7.png',449,1437,173,218,false],
  ['balance','01-今日-image2-v7.png',648,1434,163,221,false],
  ['report-bird','15-训练数据-image2-v7.png',42,376,177,210,true],
  ['trend-icon','15-训练数据-image2-v7.png',79,604,104,102,false],
  ['nutrition-icon','15-训练数据-image2-v7.png',81,716,102,96,false],
  ['shoe-icon','15-训练数据-image2-v7.png',81,820,103,95,false],
  ['patient','16-个人中心-image2-v7.png',73,190,184,269,true],
  ['archive-icon','16-个人中心-image2-v7.png',81,1125,118,145,false],
  ['device-icon','16-个人中心-image2-v7.png',459,1125,113,145,false],
  ['report-icon','16-个人中心-image2-v7.png',80,1362,115,145,false],
  ['gift-icon','16-个人中心-image2-v7.png',464,1365,114,141,false],
  ['assistant-clothed','11-小喜健康助手-image2-v7.png',489,128,345,305,true],
  ['assistant-plan','11-小喜健康助手-image2-v7.png',52,549,321,410,false],
  ['assistant-advice','11-小喜健康助手-image2-v7.png',547,1061,253,230,true],
  ['tree','20-运动小菜园-成长-image2-v7.png',153,382,537,566,true],
  ['growth-bird','20-运动小菜园-成长-image2-v7.png',580,1173,157,156,true],
  ['onboarding-flight','07-选择使用方式-image2-v7.png',505,174,333,330,true],
  ['onboarding-logo','07-选择使用方式-image2-v7.png',46,77,105,110,false],
  ['onboarding-shoe','07-选择使用方式-image2-v7.png',69,702,249,249,true],
  ['onboarding-checklist','07-选择使用方式-image2-v7.png',70,1156,245,261,true],
  ['binding-flight','08-关联康复计划-image2-v7.png',105,1063,275,304,false],
  ['knowledge-plant','12-康复资讯-image2-v7.png',511,320,306,389,false],
  ['knowledge-checklist','12-康复资讯-image2-v7.png',46,902,170,162,true],
  ['knowledge-effort','12-康复资讯-image2-v7.png',320,947,144,111,true],
  ['knowledge-bird','12-康复资讯-image2-v7.png',565,933,141,156,true],
  ['mini-report-hero','05-康复小报告-image2-v7.png',450,203,339,254,true],
  ['mini-diet','05-康复小报告-image2-v7.png',67,905,152,137,true],
  ['mini-heart','05-康复小报告-image2-v7.png',65,1100,151,126,true],
  ['mini-exercise','05-康复小报告-image2-v7.png',60,1280,165,139,true],
  ['mini-safety','05-康复小报告-image2-v7.png',63,1461,155,145,true],
  ['article-hero','13-知识文章-image2-v7.png',575,56,184,455,true],
  ['article-prepare','13-知识文章-image2-v7.png',78,599,167,150,true],
  ['article-environment','13-知识文章-image2-v7.png',80,875,162,147,true],
  ['article-feeling','13-知识文章-image2-v7.png',86,1132,162,178,true],
  ['article-recovery','13-知识文章-image2-v7.png',70,1383,175,170,true],
  ['selection-clinician','09-运动选择-image2-v7.png',57,506,152,207,true],
  ['selection-baduanjin','09-运动选择-image2-v7.png',37,945,229,155,false],
  ['selection-resistance','09-运动选择-image2-v7.png',37,1119,229,150,false],
  ['selection-walking','09-运动选择-image2-v7.png',37,1288,229,154,false],
  ['selection-stretch','09-运动选择-image2-v7.png',37,1459,229,154,false],
  ['selection-balance','09-运动选择-image2-v7.png',37,1629,229,109,false],
  ['archive-person','17-健康档案-image2-v7.png',53,144,160,169,false],
  ['device-watch','18-设备与数据来源-image2-v7.png',86,220,117,182,true],
  ['weekly-leaves','19-本周运动路径-image2-v7.png',678,146,174,230,true],
  ['team-people','22-健康小队-image2-v7.png',368,146,466,280,false],
  ...[644,781,916,1051,1180].map((y,i)=>['team-person-'+i,'22-健康小队-image2-v7.png',51,y,95,104,false]),
  ['buddy-pair','23-健康搭子-image2-v7.png',65,568,711,312,false],
  ['reward-bird','24-健康积分与权益-image2-v7.png',455,151,355,310,true],
  ['reward-book','24-健康积分与权益-image2-v7.png',82,1369,187,157,true],
  ['reward-band','24-健康积分与权益-image2-v7.png',329,1372,197,151,true],
  ['reward-badge','24-健康积分与权益-image2-v7.png',580,1365,180,166,true],
  ['policy-art','25-训练状态策略-image2-v7.png',519,53,276,179,true],
  ['precheck-art','02-运动前检查-image2-v7.png',573,891,225,185,true],
  ['postcheck-person','10-运动后状态-image2-v7.png',589,350,224,218,true],
  ['session-bird','04-本次运动报告-image2-v7.png',80,1368,222,174,true],
  ['session-leaves','04-本次运动报告-image2-v7.png',680,146,172,335,true],
  ...[47,160,271,384,493,605,715].map((x,i)=>['tree-stage-'+(i+1),'20-运动小菜园-成长-image2-v7.png',x,979,83,87,true]),
];
async function extract(item) {
  const [name,source,left,top,width,height,removeBackground]=item;
  let pipeline=sharp(path.join(refs,source)).extract({left,top,width,height});
  if(removeBackground){
    const {data,info}=await pipeline.ensureAlpha().raw().toBuffer({resolveWithObject:true});
    const seen=new Uint8Array(width*height),queue=new Int32Array(width*height);let head=0,tail=0;
    const eligible=i=>{const o=i*4,r=data[o],g=data[o+1],b=data[o+2];return Math.min(r,g,b)>229&&Math.max(r,g,b)-Math.min(r,g,b)<25};
    function add(i){if(i>=0&&i<seen.length&&!seen[i]&&eligible(i)){seen[i]=1;queue[tail++]=i}}
    for(let x=0;x<width;x++){add(x);add((height-1)*width+x)}
    for(let y=0;y<height;y++){add(y*width);add(y*width+width-1)}
    while(head<tail){const i=queue[head++];data[i*4+3]=0;if(i%width)add(i-1);if(i%width<width-1)add(i+1);add(i-width);add(i+width)}
    pipeline=sharp(data,{raw:{width,height,channels:info.channels}});
  }
  const file=path.join(out,name+'.png');await pipeline.png().toFile(file);
  return {name,url:'/static/replica-v7/'+name+'.png',source:path.join(refs,source),crop:{left,top,width,height},transparent:removeBackground,sha256:crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex')};
}
(async()=>{fs.mkdirSync(out,{recursive:true});const assets=[];for(const cut of cuts)assets.push(await extract(cut));fs.writeFileSync(path.join(root,'docs/visual-acceptance/v7-20260907/assets.json'),JSON.stringify(assets,null,2));console.log({assets:assets.length})})().catch(e=>{console.error(e);process.exitCode=1});
