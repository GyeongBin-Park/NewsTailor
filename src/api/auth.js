// src/api/auth.js
/**
 * localStorage에 저장된 accessToken을 반환합니다.
 * 없으면 곧바로 에러를 던져 로그인 필수 상태로 만듭니다.
 */

import { toast } from "react-hot-toast";

export function getToken() {
  const token = localStorage.getItem("accessToken");
  if (!token) {
    throw new Error("로그인이 필요합니다.");
  }
  return token;
}

/**
 * 로그아웃 처리 함수
 * localStorage를 정리하고 토스트 메시지를 표시합니다.
 * navigate는 각 컴포넌트에서 처리해야 합니다.
 * 
 * @returns {void}
 */
export function logout() {
  // localStorage 정리
  localStorage.removeItem("accessToken");
  localStorage.removeItem("username");
  localStorage.removeItem("nickname");
  localStorage.removeItem("interests");
  
  // 토스트 메시지 표시
  toast.success("로그아웃 되었습니다.");
}
