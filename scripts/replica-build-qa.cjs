// Sequential local compilation evidence; no publishing, signing, or remote writes.
const fs=require('node:fs/promises'),path=require('node:path'),{spawn}=require('node:child_process')
const root=path.resolve(__dirname,'..'),out=path.join(root,'docs/visual-acceptance/latest')
async function main(){
 await fs.mkdir(out,{recursive:true});const results=[]
 for(const script of ['type-check','test:rive-runtime','build:h5','build:mp-weixin','build:app']){
  const started=new Date().toISOString();console.log('START '+script)
  const result=await new Promise((resolve,reject)=>{let output='';const child=spawn('npm',['run',script],{cwd:root,env:process.env});child.on('error',reject);child.stdout.on('data',b=>output+=b);child.stderr.on('data',b=>output+=b);child.on('close',code=>resolve({script,started,finished:new Date().toISOString(),code,output}))})
  await fs.writeFile(path.join(out,script.replace(':','-')+'.log'),result.output);const {output:unused,...summary}=result;results.push(summary);console.log((result.code===0?'PASS ':'FAIL ')+script)
 }
 await fs.writeFile(path.join(out,'build-run.json'),JSON.stringify(results,null,2))
 await fs.writeFile(path.join(out,'build-summary.md'),'# 本地编译验证\n\n'+results.map(r=>`- ${r.script}: ${r.code===0?'PASS':'FAIL'}（${r.finished}）`).join('\n')+'\n\n仅本地编译；不包含微信/App 真机运行、登录签名或发布。Sass legacy API 弃用提示属于构建警告，不是测试错误。\n')
 if(results.some(r=>r.code!==0))process.exitCode=1
}
main().catch(e=>{console.error(e);process.exitCode=1})
