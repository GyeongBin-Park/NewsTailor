import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackIcon from "../icons/back.svg";

const VOICE_STORAGE_KEY = "user_selected_voice_id";

// 메뉴 아이템을 위한 재사용 컴포넌트
const MenuItem = ({ children, onClick, isDestructive = false, icon }) => {
  const textColor = isDestructive ? "text-red-500" : "text-gray-700";
  const hoverBg = isDestructive ? "hover:bg-red-50" : "hover:bg-gray-50";
  
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-6 py-4 flex justify-between items-center transition-colors ${textColor} ${hoverBg}`}
    >
      <div className="flex items-center gap-3">
        {icon && <span className="text-lg">{icon}</span>}
        <span className="font-medium">{children}</span>
      </div>
      <span className="text-gray-400 text-lg">›</span>
    </button>
  );
};

export default function MyPage() {
  const navigate = useNavigate();

  // 로그인 상태 확인
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({ username: "", nickname: "" });

  // 4. 음성 설정 관련 상태 변수들을 추가합니다.
  const [voices, setVoices] = useState([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState(
    () => localStorage.getItem(VOICE_STORAGE_KEY) || ""
  );
  const [isLoading, setIsLoading] = useState(false);

  // 로그인 상태 확인 및 사용자 정보 가져오기
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");
    
    if (!token || !username) {
      // 로그인되지 않은 경우
      setIsLoggedIn(false);
      return;
    }

    setIsLoggedIn(true);
    // 실제로는 API를 통해 사용자 정보를 가져와야 하지만, 임시로 localStorage 사용
    setUserInfo({
      username: username,
      nickname: localStorage.getItem("nickname") || username,
    });
  }, []);

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

  // 로그아웃 처리 함수
  const handleLogout = () => {
    // 로컬 스토리지 정리
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    localStorage.removeItem("nickname");
    toast.success("로그아웃 되었습니다.");
    navigate("/login");
  };

  // 회원 탈퇴 처리 함수
  const handleDeleteAccount = () => {
    // TODO: 실제 회원 탈퇴 API 호출 로직 구현
    if (window.confirm("정말로 회원 탈퇴를 하시겠습니까?")) {
      // 로컬 스토리지 정리
      localStorage.removeItem("accessToken");
      localStorage.removeItem("username");
      localStorage.removeItem("nickname");
      toast.success("회원 탈퇴가 완료되었습니다.");
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

      <main className="flex-grow px-4 py-6 pb-24 space-y-6">
        {/* 사용자 프로필 섹션 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          {isLoggedIn ? (
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-[#39235C] to-[#F1C40F] rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">{userInfo.nickname.charAt(0).toUpperCase()}</span>
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">{userInfo.nickname}</h2>
                <p className="text-gray-500">{userInfo.username}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="w-16 h-16 bg-gray-200 rounded-full flex items-center justify-center mb-4">
                <span className="text-gray-400 text-2xl">👤</span>
              </div>
              <p className="text-gray-600 text-lg font-medium mb-4">로그인이 필요합니다.</p>
              <button
                onClick={() => navigate("/login")}
                className="bg-[#39235C] text-white px-6 py-2 rounded-xl font-medium hover:bg-[#2d1a47] transition-colors"
              >
                로그인하기
              </button>
            </div>
          )}
        </section>

        {/* 로그인된 경우에만 나머지 섹션 표시 */}
        {isLoggedIn && (
          <>
            {/* 음성 설정 섹션 */}
            <section className="bg-white rounded-2xl p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-xl">🔊</span>
                음성 설정
              </h3>
              <div className="space-y-3">
                <label htmlFor="voice-select" className="block text-sm font-medium text-gray-700">
                  기본 목소리 선택
                </label>
                <select
                  id="voice-select"
                  value={selectedVoiceId}
                  onChange={handleVoiceChange}
                  className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-[#39235C] focus:border-transparent transition-all"
                  disabled={isLoading || voices.length === 0}
                >
                  {isLoading ? (
                    <option>목록 로딩 중...</option>
                  ) : voices.length === 0 ? (
                    <option>사용 가능한 음성이 없습니다</option>
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

            {/* 계정 관리 섹션 */}
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">⚙️</span>
                  계정 관리
                </h3>
              </div>
              <div className="divide-y divide-gray-100">
                <MenuItem 
                  onClick={() => navigate("/mypage/edit")} 
                  icon="👤"
                >
                  프로필 수정
                </MenuItem>
                <MenuItem 
                  onClick={() => alert("비밀번호 변경 페이지로 이동합니다.")} 
                  icon="🔒"
                >
                  비밀번호 변경
                </MenuItem>
                <MenuItem 
                  onClick={handleLogout} 
                  icon="🚪"
                >
                  로그아웃
                </MenuItem>
              </div>
            </section>

            {/* 위험한 작업 섹션 */}
            <section className="bg-white rounded-2xl shadow-sm overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-xl">⚠️</span>
                  위험한 작업
                </h3>
              </div>
              <MenuItem 
                onClick={handleDeleteAccount} 
                isDestructive={true}
                icon="🗑️"
              >
                회원 탈퇴
              </MenuItem>
            </section>
          </>
        )}
      </main>

      <Footer />
    </div>
  );
}
