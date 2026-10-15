require('./register.cjs');
const { emptyState } = require('../src/lib/repo/empty.ts');
const { createRepository } = require('../src/lib/repo/engine.ts');
exports.fixture = function() {
  let state = structuredClone(emptyState);
  state.registeredProviders = ['a','b'].map(id => ({ id, name: '테스트 치료사 '+id, license: '물리치료사', years: 3, focus: [], visit: ['방문'], area: '테스트 지역', applicationId: id }));
  state.patients = [{ id: 'p', name: '테스트 환자', age: 50, sex: '미입력', condition: '테스트', area: '테스트 지역', hospital: '병원A', provider: '테스트 치료사 a', providerId: 'a', status: '진행 중', goal: '기능 평가', precautions: '기존 주의', completed: 1, total: 12, nextDate: '2026-10-15', nextTime: '10:00', method: '방문', consent: true, guardianAccountId: 'guardian', prescription: { doctor: '테스트 의사', startDate: '2020-01-01', endDate: '2099-12-31', perWeek: 3, scope: ['보행'], doctorOpinion: '기존 소견', consentChecked: true, places: ['자택'] } }];
  state.records = [{ id: 'r', patientId: 'p', date: '2026-10-01', title: '1회차', content: '원기록', next: '계속', walk: '', pain: '', confirmed: true, authorId: 'a', attendance: '참여', sessionNo: 1 }];
  const repo = createRepository(() => state, fn => { state = fn(state); });
  return { repo, get state() { return state; }, set state(s) { state=s; } };
};
