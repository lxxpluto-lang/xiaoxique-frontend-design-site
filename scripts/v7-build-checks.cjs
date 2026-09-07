const fs=require('node:fs'),path=require('node:path'),{spawnSync}=require('node:child_process');
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/visual-acceptance/v7-20260907');
const checks=[['type-check',['run','type-check']],['rive-runtime',['run','test:rive-runtime']],['build-h5',['run','build:h5']],['build-mp-weixin',['run','build:mp-weixin']],['build-app',['run','build:app']]];
let failed=false;const result=[];
for(const [name,args] of checks){const run=spawnSync('npm',args,{cwd:root,encoding:'utf8',maxBuffer:12*1024*1024});fs.writeFileSync(path.join(out,name+'.log'),run.stdout+'\n'+run.stderr);const pass=run.status===0;failed ||= !pass;result.push({name,pass,exitCode:run.status});console.log(name+': '+(pass?'PASS':'FAIL'))}
fs.writeFileSync(path.join(out,'latest-build-results.json'),JSON.stringify({generatedAt:new Date().toISOString(),result},null,2));process.exitCode=failed?1:0;
