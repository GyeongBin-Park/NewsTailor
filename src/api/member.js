// src/api/member.js
import { getToken } from "./auth";
const BACKEND = import.meta.env.VITE_BACKEND_URL;

async function fetchWithAuth(path) {
  const token = await getToken();
  const res = await fetch(`${BACKEND}${path}`, {
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!res.ok) throw new Error(`${path} 조회 실패: ${res.status}`);
  return await res.json();
}

export async function getMemberInfo() {
  // /api/member/info → { data: { memberId, nickname, username, … } }
  const json = await fetchWithAuth("/api/member/info");
  return json.data;
}

export async function getEmergencyContact() {
  // /api/member/phone → { data: { memberId, phoneNumber, phoneType } }
  const json = await fetchWithAuth("/api/member/phone");
  return json.data;
}

export async function updateEmergencyContact(phoneNumber) {
  const token = await getToken();
  const res = await fetch(`${BACKEND}/api/member/phone`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    credentials: "include",
    body: JSON.stringify({ phoneNumber }),
  });
  if (!res.ok) throw new Error(`비상연락처 수정 실패: ${res.status}`);
  return await res.json(); // 성공하면 { success, status, ... } 형태
}

export async function deleteEmergencyContact() {
  const token = await getToken();
  console.log("▶️ delete 시 토큰:", token);
  const res = await fetch(`${BACKEND}/api/member/phone`, {
    method: "DELETE",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    },
    credentials: "include",
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`비상연락처 삭제 실패: ${res.status}`);
  }
  return;
}