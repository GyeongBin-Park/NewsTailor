import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackIcon from "../icons/back.svg";

const VOICE_STORAGE_KEY = "user_selected_voice_id";

// 메뉴 아이템을 위한 재사용 컴포넌트
const MenuItem = ({ children, onClick, isDestructive = false }) => {
  const textColor = isDestructive ? "text-red-500" : "text-gray-700";
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-3 flex justify-between items-center hover:bg-gray-50 transition ${textColor}`}
    >
      <span>{children}</span>
      <span className="text-gray-400">{">"}</span>
    </button>
  );
};

export default function MyPage() {
  const navigate = useNavigate();

  // 4. 음성 설정 관련 상태 변수들을 추가합니다.
  const [voices, setVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    () => localStorage.getItem(VOICE_STORAGE_KEY) || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  // 5. 컴포넌트가 로드될 때 목소리 목록을 불러오는 useEffect를 추가합니다.
  useEffect(() => {
    const fetchVoices = async () => {
      setIsLoading(true);
      const API_URL = "/api/v1/voices";
      const API_KEY = import.meta.env.VITE_SPEECHIFY_API_KEY;

      try {
        const response = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${API_KEY}` },
        });
        if (!response.ok) throw new Error("API 응답 오류");

        const data = await response.json();
        const availableVoices = data.voices || data || [];
        setVoices(availableVoices);

        if (
          !localStorage.getItem(VOICE_STORAGE_KEY) &&
          availableVoices.length > 0
        ) {
          const koreanVoice = availableVoices.find((v) =>
            v.locale.startsWith("ko-KR")
          );
          if (koreanVoice) {
            setSelectedVoiceId(koreanVoice.id);
            localStorage.setItem(VOICE_STORAGE_KEY, koreanVoice.id);
          }
        }
      } catch (error) {
        toast.error("목소리 목록을 불러오지 못했습니다.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchVoices();
  }, []);

  // 목소리 변경 시 localStorage에 저장하는 핸들러 함수입니다.
  const handleVoiceChange = (e) => {
    const newVoiceId = e.target.value;
    setSelectedVoiceId(newVoiceId);
    localStorage.setItem(VOICE_STORAGE_KEY, newVoiceId);
    toast.success("목소리가 저장되었습니다!");
  };

  // 실제로는 로그인 상태에서 가져와야 할 사용자 정보 (임시 데이터)
  const user = {
    id: "user123",
    email: "user123@example.com",
  };

  // 로그아웃 처리 함수
  const handleLogout = () => {
    // TODO: 로컬 스토리지의 토큰 삭제 등 실제 로그아웃 로직 구현
    alert("로그아웃 되었습니다.");
    navigate("/login");
  };

  // 회원 탈퇴 처리 함수
  const handleDeleteAccount = () => {
    // TODO: 실제 회원 탈퇴 API 호출 로직 구현
    if (window.confirm("정말로 회원 탈퇴를 하시겠습니까?")) {
      alert("회원 탈퇴 처리되었습니다.");
      navigate("/login");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        left_img={BackIcon}
        text="마이페이지"
        onClick={() => navigate("/")} // 메인 페이지로 이동
      />

      <main className="flex-grow">
        {/* 계정 정보 섹션 */}
        <section className="bg-white p-4 border-b">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">
            계정 정보
          </h2>
          <div className="space-y-1">
            <div className="flex justify-between text-gray-800">
              <span>아이디</span>
              <strong>{user.id}</strong>
            </div>
            <div className="flex justify-between text-gray-800">
              <span>이메일</span>
              <strong>{user.email}</strong>
            </div>
          </div>
        </section>

        <div className="mt-4" />
        <section className="bg-white p-4 border-t border-b">
          <h2 className="text-sm font-semibold text-gray-500 mb-2">
            음성 설정
          </h2>
          <div className="space-y-1">
            <label htmlFor="voice-select" className="text-gray-800">
              기본 목소리 선택
            </label>
            <select
              id="voice-select"
              value={selectedVoiceId}
              onChange={handleVoiceChange}
              className="w-full border rounded p-2 mt-1 bg-white"
              disabled={isLoading || voices.length === 0}
            >
              {isLoading ? (
                <option>목록 로딩 중...</option>
              ) : (
                voices
                  .filter((v) => v.locale && v.locale.startsWith("ko-KR"))
                  .map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.display_name} ({voice.locale})
                    </option>
                  ))
              )}
            </select>
          </div>
        </section>

        <div className="mt-4" />
        {/* 앱 설정 및 기타 메뉴 섹션 */}
        <section className="bg-white border-t border-b divide-y">
          <MenuItem onClick={() => alert("프로필 수정 페이지로 이동합니다.")}>
            프로필 수정
          </MenuItem>
          <MenuItem onClick={() => alert("비밀번호 변경 페이지로 이동합니다.")}>
            비밀번호 변경
          </MenuItem>
          <MenuItem onClick={handleLogout}>로그아웃</MenuItem>
        </section>

        <div className="mt-4" />

        <section className="bg-white border-t border-b">
          <MenuItem onClick={handleDeleteAccount} isDestructive={true}>
            회원 탈퇴
          </MenuItem>
        </section>
      </main>

      <Footer />
    </div>
  );
}
