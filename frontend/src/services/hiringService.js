import { db, Timestamp } from '../firebase';

/**
 * @file hiringService.js
 * @description 채용 인재 발굴 및 평가를 위한 Firestore 서비스
 */

const COLLECTIONS = {
  METADATA: 'hiring_metadata',
  CANDIDATES: 'candidates',
  INTERVIEWS: 'interviews'
};

export const hiringService = {
  // 1. JD 템플릿 및 초기 설정 데이터 로드
  async getHiringMetadata() {
    const doc = await db.collection(COLLECTIONS.METADATA).doc('safety_team_jd').get();
    return doc.exists ? doc.data() : null;
  },

  // 2. 지원자 목록 가져오기
  async getCandidates() {
    const snapshot = await db.collection(COLLECTIONS.CANDIDATES).orderBy('createdAt', 'desc').get();
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // 3. 지원자 등록
  async addCandidate(name, position = '안전보건 전담팀') {
    return await db.collection(COLLECTIONS.CANDIDATES).add({
      name,
      position,
      status: 'pending', // pending, interviewing, completed
      createdAt: Timestamp.now()
    });
  },

  // 4. 면접 평가 데이터 저장
  async saveInterviewEvaluation(candidateId, interviewerId, evaluations, feedback) {
    const totalScore = Object.values(evaluations).reduce((a, b) => a + b, 0);
    
    return await db.collection(COLLECTIONS.INTERVIEWS).add({
      candidateId,
      interviewerId,
      evaluations, // { q1: score, q2: score, q3: score }
      feedback,
      totalScore,
      createdAt: Timestamp.now()
    });
  },

  // 5. 특정 지원자의 종합 평가 리포트 가져오기
  async getCandidateReport(candidateId) {
    const snapshot = await db.collection(COLLECTIONS.INTERVIEWS)
      .where('candidateId', '==', candidateId)
      .get();
    
    return snapshot.docs.map(doc => doc.data());
  }
};
