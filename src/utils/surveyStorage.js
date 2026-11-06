/**
 * WealthyHair 설문조사 프로필 로컬 스토리지 관리 유틸리티
 * - 레거시 키(wealthyhair_survey_profile_v1) 자동 마이그레이션 및 회원 계정 연령·성별 연동 지원
 */

const PROFILE_STORAGE_KEY = 'wealthyhair_user_survey_profile';
const LEGACY_PROFILE_KEY = 'wealthyhair_survey_profile_v1';

/**
 * 저장된 사용자 설문 프로필 불러오기
 */
export const getSavedSurveyProfile = () => {
  try {
    let raw = localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) {
      const legacyRaw = localStorage.getItem(LEGACY_PROFILE_KEY);
      if (legacyRaw) {
        raw = legacyRaw;
        localStorage.setItem(PROFILE_STORAGE_KEY, legacyRaw);
      }
    }
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && (parsed.gender || parsed.age || parsed.isCompleted)) {
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
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('[SurveyStorage] 설문 프로필 저장 실패:', err);
    return null;
  }
};

/**
 * 회원가입·로그인·자동로그인 복원 시 회원의 연령 및 기본 성별을 설문 프로필에 동기화
 * (사용자가 이미 직접 선택한 세부 설문 항목은 보존)
 */
export const syncMemberToSurveyProfile = (member, overwriteGender = false) => {
  if (!member) return null;
  try {
    const currentRaw = localStorage.getItem(PROFILE_STORAGE_KEY);
    const current = currentRaw ? JSON.parse(currentRaw) : {};
    const nextPatch = {};

    if (member.age && (!current.age || overwriteGender)) {
      nextPatch.age = String(member.age);
    }
    if (member.gender && (!current.gender || overwriteGender)) {
      nextPatch.gender = member.gender;
    }

    if (Object.keys(nextPatch).length === 0) {
      return current;
    }
    return saveSurveyProfile(nextPatch);
  } catch {
    return null;
  }
};

/**
 * 설문 프로필 삭제 (재작성 또는 회원탈퇴 시)
 */
export const clearSurveyProfile = () => {
  try {
    localStorage.removeItem(PROFILE_STORAGE_KEY);
    localStorage.removeItem(LEGACY_PROFILE_KEY);
  } catch (err) {
    console.error('[SurveyStorage] 설문 프로필 삭제 실패:', err);
  }
};
