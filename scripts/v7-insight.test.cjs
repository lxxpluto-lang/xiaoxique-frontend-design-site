const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const moduleContext={exports:{}};
const source=fs.readFileSync(require('node:path').join(__dirname,'../src/lib/training-insight.ts'),'utf8');
vm.runInNewContext(ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,moduleContext);
const {buildTrainingInsight:insight}=moduleContext.exports;
const session=(localDate,status='completed')=>Object.freeze({localDate,status});
const today='2026-09-07';
test('empty and invalid dates never imply normal or improvement',()=>{
  for(const records of [[],[session('2026-09-08'),session('2026-02-30'),session('bad'),session('2026-08-24')]]){
    const value=insight(Object.freeze(records),today);assert.equal(value.hasRecords,false);assert.equal(value.recentCount,0);assert.equal(value.previousCount,0);assert.equal(value.comparable,false);assert.match(value.title,/完成运动后/);
  }
  assert.equal(insight([session(today)],'bad').hasRecords,false);
});
test('no previous samples gives insufficient comparison, not improvement',()=>{
  const value=insight([session(today),session('2026-09-01')],today);
  assert.equal(value.recentCount,2);assert.equal(value.recentDays,2);assert.equal(value.comparable,false);assert.match(value.summary,/暂不判断提升/);
});
test('calendar boundaries and same-day sessions use separate attendance counts',()=>{
  const records=Object.freeze([session(today),session(today),session('2026-09-01'),session('2026-08-31'),session('2026-08-25'),session('2026-08-24'),session('2026-09-06','stopped')]);
  const before=JSON.stringify(records);const value=insight(records,today);
  assert.equal(value.recentCount,3);assert.equal(value.recentDays,2);assert.equal(value.previousCount,2);assert.equal(value.previousDays,2);assert.match(value.summary,/增加1次/);assert.equal(JSON.stringify(records),before);
});
test('equal counts and reduction including zero current sessions are explicit',()=>{
  assert.match(insight([session(today),session('2026-08-31')],today).title,/保持稳定/);
  const reduced=insight([session('2026-08-31')],today);assert.match(reduced.title,/有所减少/);assert.match(reduced.summary,/近7天完成0次/);assert.equal(reduced.hasRecords,true);
});
test('risk message takes precedence over attendance encouragement',()=>{
  for(const level of ['attention','stop']){
    const value=insight([session(today),session(today),session('2026-08-31')],today,{level,title:'需要留意本次感受',summary:'有待确认的信息',actions:['请先联系医护'],sourceSummary:'本地规则演示'});
    assert.equal(value.title,'需要留意本次感受');assert.equal(value.summary,'有待确认的信息');assert.equal(value.exercise,'请先联系医护');assert.equal(value.level,level);assert.equal(value.recentCount,2);
  }
});
