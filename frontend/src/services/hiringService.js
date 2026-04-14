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

  // 3. 지원자 등록 (기존/신규 하이브리드 지원)
  async addCandidate(candidateData) {
    // 인자가 문자열(이름)인 경우 레거시 대응
    if (typeof candidateData === 'string') {
      return await db.collection(COLLECTIONS.CANDIDATES).add({
        name: candidateData,
        position: '안전보건팀',
        status: 'pending',
        createdAt: Timestamp.now()
      });
    }

    // 객체인 경우 고도화 버전 대응
    const { name, type, examNumber, position = '안전보건팀' } = candidateData;
    return await db.collection(COLLECTIONS.CANDIDATES).add({
      name,
      type, // 'new_entry' or 'experienced'
      examNumber,
      position,
      status: 'pending',
      createdAt: Timestamp.now(),
      ...candidateData
    });
  },

  // 4. 면접 평가 데이터 저장 (기존/신규 하이브리드 지원)
  async saveInterviewEvaluation(candidateId, interviewerId, evaluationInput) {
    const batch = db.batch();
    const interviewRef = db.collection(COLLECTIONS.INTERVIEWS).doc();
    
    let saveData = {
      candidateId,
      interviewerId,
      createdAt: Timestamp.now()
    };

    // evaluationInput이 중첩된 구조(신규 시스템)인지 확인
    if (evaluationInput.appearance || evaluationInput.competency || evaluationInput.safetyTech) {
      const { 
        appearance, competency, specific, safetyTech, 
        bars, feedback, interviewerName 
      } = evaluationInput;

      saveData = {
        ...saveData,
        interviewerName,
        evaluationData: { appearance, competency, specific, safetyTech, bars },
        feedback
      };
    } else {
      // 레거시 BARS 시스템 대응 (평면적인 evaluations 객체)
      saveData = {
        ...saveData,
        evaluations: evaluationInput, // 기존 필드명 유지
        totalScore: Object.values(evaluationInput).reduce((a, b) => a + (Number(b) || 0), 0)
      };
    }

    batch.set(interviewRef, saveData);

    // 2. 지원자 상태 업데이트
    const candidateRef = db.collection(COLLECTIONS.CANDIDATES).doc(candidateId);
    batch.update(candidateRef, { status: 'completed' });

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
