/**
 * WealthyHair 설문조사 프로필 로컬 스토리지 관리 유틸리티
 */

const PROFILE_STORAGE_KEY = 'wealthyhair_user_survey_profile';

/**
 * 저장된 사용자 설문 프로필 불러오기
 */
export const getSavedSurveyProfile = () => {
  try {
    const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // 성별(gender) 또는 나이(age) 등 최소 필수 문항이 완료되어 있는지 확인
    if (parsed && (parsed.gender || parsed.isCompleted)) {
      return parsed;
    }
    return null;
  } catch (err) {
    console.error('[SurveyStorage] 저장된 설문 프로필 불러오기 실패:', err);
    return null;
  }
};

/**
 * 설문 프로필 저장/업데이트
 * @param {Object} partialProfile
 */
export const saveSurveyProfile = (partialProfile) => {
  try {
    const currentRaw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const current = currentRaw ? JSON.parse(currentRaw) : {};
    const updated = {
      ...current,
      ...partialProfile,
      updatedAt: new Date().toISOString()
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('[SurveyStorage] 설문 프로필 저장 실패:', err);
    return null;
  }
};

/**
 * 설문 프로필 삭제 (재작성 시)
 */
export const clearSurveyProfile = () => {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
  } catch (err) {
    console.error('[SurveyStorage] 설문 프로필 삭제 실패:', err);
  }
};
