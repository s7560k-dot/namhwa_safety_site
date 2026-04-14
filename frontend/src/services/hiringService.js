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
  async addCandidate(candidateData) {
    const { name, type, examNumber, position = '안전보건팀' } = candidateData;
    return await db.collection(COLLECTIONS.CANDIDATES).add({
      name,
      type, // 'new_entry' or 'experienced'
      examNumber,
      position,
      status: 'pending', // pending, interviewing, completed
      createdAt: Timestamp.now(),
      ...candidateData // 기타 추가 필드 (생년월일, 학력 등)
    });
  },

  // 4. 면접 평가 데이터 저장
  async saveInterviewEvaluation(candidateId, interviewerId, evaluationData) {
    const { 
      appearance, 
      competency, 
      specific, 
      safetyTech, 
      bars, 
      feedback, 
      interviewerName 
    } = evaluationData;
    
    const batch = db.batch();
    
    // 1. 인터뷰 데이터 저장
    const interviewRef = db.collection(COLLECTIONS.INTERVIEWS).doc();
    batch.set(interviewRef, {
      candidateId,
      interviewerId,
      interviewerName,
      evaluationData: {
        appearance,
        competency,
        specific,
        safetyTech,
        bars,
      },
      feedback,
      createdAt: Timestamp.now()
    });

    // 2. 지원자 상태 업데이트
    const candidateRef = db.collection(COLLECTIONS.CANDIDATES).doc(candidateId);
    batch.update(candidateRef, {
      status: 'completed'
    });

    return await batch.commit();
  },

  // 4.5 지원자 상태 개별 업데이트
  async updateCandidateStatus(candidateId, status) {
    return await db.collection(COLLECTIONS.CANDIDATES).doc(candidateId).update({
      status
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
