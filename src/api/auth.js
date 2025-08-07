// src/api/auth.js
/**
 * localStorage에 저장된 accessToken을 반환합니다.
 * 없으면 곧바로 에러를 던져 로그인 필수 상태로 만듭니다.
 */
export function getToken() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      throw new Error("로그인이 필요합니다.");
    }
    return token;
  }