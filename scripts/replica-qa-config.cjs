const path=require('node:path')
const root=path.resolve(__dirname,'..')
const baseUrl=process.env.REPLICA_QA_URL||'http://127.0.0.1:4173/'
const url=new URL(baseUrl)
if(url.protocol!=='http:'||!['127.0.0.1','localhost','[::1]'].includes(url.hostname)||url.username||url.password)throw Error('QA is restricted to local HTTP prototypes')
const out=path.resolve(root,process.env.REPLICA_QA_OUT||'docs/visual-acceptance/latest')
if(!out.startsWith(path.join(root,'docs/visual-acceptance')+path.sep))throw Error('QA evidence must stay in visual-acceptance')
// Uni H5 production tree-shakes global uni APIs. Read/write its documented-by-
// installed-code {type,data} storage envelope in disposable QA contexts only.
// No application globals/handlers are installed or changed for testing.
const readPrototypeState=page=>page.evaluate(()=>{
 const raw=localStorage.getItem('magpie-prototype-state')
 if(raw===null)throw Error('Prototype has not persisted state')
 const envelope=JSON.parse(raw)
 if(envelope.type!=='object'||!envelope.data)throw Error('Unexpected Uni H5 state envelope')
 return envelope.data
})
const writePrototypeState=(page,data)=>page.evaluate(data=>{
 localStorage.setItem('magpie-prototype-state',JSON.stringify({type:typeof data,data}))
},data)
module.exports={root,baseUrl,out,readPrototypeState,writePrototypeState}
