const test = require('node:test'), assert = require('node:assert/strict');
const { fixture } = require('./fixture.cjs');
const { PROVIDER_CHECKS } = require('../src/lib/repo/types.ts');
const { prescriptionForDate, providerEligibility, prescriptionSignature, reportReviewSignature } = require('../src/lib/workflow.ts');
const { invoices } = require('../src/lib/billing.ts');
const { adminStatistics, functionalStatistics } = require('../src/lib/admin-data.ts');
const { scopedState, authorize } = require('../src/lib/server/authorization.ts');
const actor = { id:'hospitalA', username:'hospitalA', name:'담당의',role:'hospital',organization:'병원A',providerId:'' };
const provider = { id:'a',name:'테스트 치료사 a' };
const fields = { content:'기록', next:'다음 계획',walk:'',pain:'', attendance:'참여',durationMin:55 };
const draft = f => ({ patientId:'p',prescription:{...f.state.patients[0].prescription,doctorOpinion:'변경 소견'},precautions:'변경 주의',effectiveFrom:'2026-10-15',by:'담당의' });
test('임시 기록은 병원·보호자 조회에 포함하지 않는다',()=>{
 const f=fixture(); f.repo.saveRecord('p',fields,{confirm:false,author:provider});
 assert.equal(scopedState(f.state,{...actor,role:'patient',id:'guardian'}).records.length,1);
 assert.equal(scopedState(f.state,actor).records.length,0);
});
test('참여↔미참여 정정은 누적 회차를 차이만큼 조정하고 원본을 남긴다',()=>{
 const f=fixture(); f.repo.correctRecord('r',{...fields,attendance:'미참여'},'참여 상태 정정',provider); assert.equal(f.state.patients[0].completed,0);
 f.repo.correctRecord('r',fields,'출석 확인',provider);assert.equal(f.state.patients[0].completed,1);assert.equal(f.state.records[0].revisions.length,2);assert.equal(f.state.records[0].revisions[1].snapshot.content,'원기록');
});
test('발행 청구는 가격·참여 변경으로 재계산되지 않으며 명시적 조정만 합산한다',()=>{
 const f=fixture(); f.state.records[0].date='2020-01-02';f.repo.setContract('병원A',{model:'회차당',unitFee:10000,since:'2020-01-01'});f.repo.setBilling('병원A|2020-01',{status:'청구 완료'});
 f.repo.setContract('병원A',{unitFee:20000});f.repo.correctRecord('r',{...fields,attendance:'미참여'},'출석 정정',provider);
 let bill=invoices(f.state,'2020-02-01').find(b=>b.period==='2020-01'); assert.equal(bill.total,11000);assert.equal(bill.visits,1);assert.equal(bill.changed,true);
 assert.equal(f.repo.adjustBilling(bill.key,-1000,'환급 조정','운영자'),true);bill=invoices(f.state,'2020-02-01')[1];assert.equal(bill.total,10000);
 assert.equal(f.repo.adjustBilling(bill.key,-20000,'음수 총액 금지','운영자'),false);f.repo.setContract('병원A',{since:'2026-01-01'});assert.ok(invoices(f.state,'2026-10-15').find(b=>b.period==='2020-01'&&b.snapshot));
});
test('제공본은 모든 공유 경로에서 원기록 스냅샷을 보존한다',()=>{
 for (const publish of ['provideReport','shareReport','saveReport']) { const f=fixture();const signature=reportReviewSignature(f.state,'p','2026년 10월');f.state.records[0].content='변경된 내용';assert.equal(f.repo.provideReport('p','2026-10','운영자','검토',signature),false);f.state.records[0].content='원기록'; if(publish==='provideReport')assert.equal(f.repo.provideReport('p','2026-10','운영자','검토'),true);else if(publish==='shareReport')f.repo.shareReport('p','2026년 10월');else f.repo.saveReport('p','2026년 10월',{opinion:'종합 소견'},true);const before=structuredClone(f.state.reports[0].snapshot);f.repo.correctRecord('r',{...fields,content:'바뀐 원기록'},'정정',provider);assert.deepEqual(f.state.reports[0].snapshot,before); }
});
test('보고서 정정본은 이전 확인·재평가와 연결을 유지한다',()=>{
 const f=fixture();f.repo.provideReport('p','2026-10','운영자','검토');const first=f.state.reports[0].id;f.repo.confirmReportVersion(first,'담당의'); const reevaluation=f.repo.saveReevaluation({patientId:'p',reportId:first,date:'2026-10-14',opinion:'외래 평가',contraindications:[],cautions:[],decision:'변경안 검토',by:'담당의'});
 assert.equal(f.repo.reviseReport(first,'원기록 정정','운영자'),true);const second=f.state.reports[0];assert.equal(second.version,2);assert.equal(second.confirmedAt,undefined);const provided=adminStatistics(f.state,{hospital:'전체',provider:'전체',month:'2026-10'},'2026-10-15');assert.equal(provided.shared,1);assert.equal(provided.acknowledged,1);assert.equal(f.repo.reviseReport(first,'중복 생성','운영자'),false);f.repo.provideReport('p','2026-10','운영자','다시 검토');assert.equal(f.state.reports.find(r=>r.id===first).supersededById,second.id);assert.equal(f.state.reevaluations.find(r=>r.id===reevaluation).reportId,first);assert.equal(f.repo.confirmReportVersion(first,'다른 담당자'),true);assert.equal(f.state.reports.find(r=>r.id===first).confirmedBy,'담당의');
});
test('외래 재평가를 저장해도 처방은 자동 변경되지 않는다',()=>{
 const f=fixture();f.repo.provideReport('p','2026-10','운영자','검토');f.repo.saveReevaluation({patientId:'p',reportId:f.state.reports[0].id,date:'2026-10-14',opinion:'추가 확인',contraindications:[],cautions:[],decision:'추가 확인 필요',by:'담당의'});assert.equal(f.state.patients[0].prescription.doctorOpinion,'기존 소견');assert.equal(f.state.prescriptionVersions.length,0);
});
test('승인은 저장한 변경안만 승인하고 오래된 변경안은 차단한다',()=>{
 const f=fixture(), base=prescriptionSignature(f.state.patients[0],f.state), one=f.repo.savePrescriptionDraft(draft(f),base),two=f.repo.savePrescriptionDraft(draft(f),base);assert.ok(one);assert.equal(f.repo.approvePrescriptionDraft(one,2,'담당의'),false);assert.equal(f.repo.approvePrescriptionDraft(one,1,'담당의'),true);assert.equal(f.repo.approvePrescriptionDraft(two,1,'담당의'),false);assert.equal(f.state.prescriptionVersions.length,2);assert.equal(f.repo.savePrescriptionDraft(draft(f),base),'');
});
test('적용일별 처방 선택과 치료사 확인은 회차의 승인 버전에 묶인다',()=>{
 const f=fixture(), input=draft(f);input.effectiveFrom='2090-01-01';const id=f.repo.savePrescriptionDraft(input);assert.equal(f.repo.approvePrescriptionDraft(id,1,'담당의'),true);
 const before=prescriptionForDate(f.state,f.state.patients[0],'2026-10-15'),after=prescriptionForDate(f.state,f.state.patients[0],'2090-01-02');assert.notEqual(before.id,after.id);assert.equal(before.prescription.doctorOpinion,'기존 소견');
 assert.equal(f.repo.saveRecord('p',{...fields,date:'2026-10-15'},{confirm:true,author:provider}),'');assert.equal(f.repo.acknowledgePrescription('p',before.id,{id:'b',name:'다른 치료사'}),false);assert.equal(f.repo.acknowledgePrescription('p',before.id,provider),true);
 const record=f.repo.saveRecord('p',{...fields,date:'2026-10-15'},{confirm:true,author:provider});assert.equal(f.state.records.find(r=>r.id===record).prescriptionVersionId,before.id);
});
test('인증 근거·유효 보험·보류 상태가 신규 매칭을 제한한다',()=>{
 const f=fixture();const control={providerId:'b',checks:Object.fromEntries(PROVIDER_CHECKS.map(k=>[k,{confirmed:true,reference:'확인 자료-1'}])),insuranceUntil:'2099-01-01',grade:'Senior',hold:false,reason:'',by:'운영자'};
 assert.equal(f.repo.proposeAssignment('p',{id:'b',name:'치료사 b'}),false);assert.equal(f.repo.setProviderControl(control),true);assert.equal(providerEligibility(f.state,'b','2026-10-15'),'배정 가능');assert.equal(f.repo.proposeAssignment('p',{id:'b',name:'치료사 b'}),true);f.repo.acceptAssignment('p',{id:'b',name:'치료사 b'});const accepted=f.state.assignments[0].id;assert.equal(f.state.patients[0].providerId,'a');f.repo.setProviderControl({...control,hold:true,reason:'추가 확인'});assert.equal(f.repo.finalizeAssignment('p',accepted,'운영자'),false);f.repo.setProviderControl(control);assert.equal(f.repo.finalizeAssignment('p',accepted,'운영자'),true);assert.equal(f.repo.finalizeAssignment('p',accepted,'운영자'),false);
});
test('재배정 뒤에도 원기록 작성자 기준 통계와 비교 분모를 유지한다',()=>{
 const f=fixture();f.state.patients[0].providerId='b';f.state.records.push({...f.state.records[0],id:'r2',date:'2026-10-10',measures:[{code:'walk_distance',value:30,note:'지팡이'}]});f.state.records[0].measures=[{code:'walk_distance',value:20,note:'지팡이'}];let d=adminStatistics(f.state,{hospital:'전체',provider:'a',month:'2026-10'},'2026-10-15');assert.equal(d.confirmed.length,2);assert.equal(d.active,0);let change=functionalStatistics(f.state,d.patients,'2026-10','a').find(m=>m.code==='walk_distance');assert.equal(change.count,1);f.state.records[1].measures[0].note='보조기';change=functionalStatistics(f.state,d.patients,'2026-10','a').find(m=>m.code==='walk_distance');assert.equal(change.count,0);assert.equal(change.excluded,1);
});
test('타 병원 조회·병원 매칭·관리자 처방과 작성자 위조를 서버에서 차단한다',()=>{
 const f=fixture();assert.equal(scopedState(f.state,{...actor,organization:'병원B'}).patients.length,0);assert.throws(()=>authorize(f.state,actor,'proposeAssignment',['p',provider]));assert.throws(()=>authorize(f.state,{...actor,role:'admin'},'approvePrescriptionDraft',['d',1,'위조']));const args=authorize(f.state,{...actor,role:'provider',providerId:'a'},'saveRecord',['p',{...fields,authorId:'b',confirmed:true},{confirm:false,author:{id:'b'}}]);assert.equal(args[1].authorId,undefined);assert.equal(args[2].author.id,'a');
});
