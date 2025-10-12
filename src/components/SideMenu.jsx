import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

export default function SideMenu() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInfo, setUserInfo] = useState({ username: "", nickname: "" });
  const navigate = useNavigate();

  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");
    
    if (token && username) {
      setIsLoggedIn(true);
      setUserInfo({
        username: username,
        nickname: localStorage.getItem("nickname") || username,
      });
    }
  }, []);

  // 로그아웃 처리 함수
  const handleLogout = () => {
    // localStorage 정리
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    localStorage.removeItem("nickname");
    localStorage.removeItem("interests");
    
    toast.success("로그아웃 되었습니다.");
    setIsMenuOpen(false);
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <>
      {/* 햄버거 메뉴 버튼 */}
      <button
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        aria-label="메뉴 열기"
        className="cursor-pointer p-2"
      >
        {/* 햄버거 메뉴 아이콘 */}
        <div className="space-y-1.5">
          <div className="w-6 h-0.5 bg-[#F1C40F]"></div>
          <div className="w-6 h-0.5 bg-[#F1C40F]"></div>
          <div className="w-6 h-0.5 bg-[#F1C40F]"></div>
        </div>
      </button>

      {/* 배경 오버레이 (밝기 낮춤) */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-40 transition-opacity duration-300"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.3)' }}
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}

      {/* 슬라이드 메뉴 */}
      <div
        className={`fixed top-0 right-0 h-full w-64 bg-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out ${
          isMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* 메뉴 헤더 */}
        <div className="bg-[#39235C] text-white p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">메뉴</h2>
            <button
              onClick={() => setIsMenuOpen(false)}
              className="text-[#F1C40F] text-2xl hover:opacity-80 transition-opacity"
            >
              ×
            </button>
          </div>
          
          {isLoggedIn ? (
            <div className="border-t border-[#F1C40F] border-opacity-50 pt-4">
              <p className="font-semibold text-lg">
                {userInfo.nickname}님 환영합니다.
              </p>
            </div>
          ) : (
            <div className="border-t border-[#F1C40F] border-opacity-50 pt-4">
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/login");
                }}
                className="w-full bg-[#F1C40F] text-[#39235C] font-semibold py-3 rounded-lg hover:opacity-90 transition-opacity"
              >
                로그인
              </button>
            </div>
          )}
        </div>

        {/* 메뉴 아이템 */}
        <div className="py-4">
          {isLoggedIn && (
            <>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/");
                }}
                className="w-full text-left px-6 py-4 text-gray-800 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <span className="text-xl">🏠</span>
                <span className="font-medium">홈</span>
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/mypage");
                }}
                className="w-full text-left px-6 py-4 text-gray-800 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <span className="text-xl">👤</span>
                <span className="font-medium">마이페이지</span>
              </button>
              <button
                onClick={() => {
                  setIsMenuOpen(false);
                  navigate("/bookmark");
                }}
                className="w-full text-left px-6 py-4 text-gray-800 hover:bg-gray-50 transition-colors flex items-center gap-3"
              >
                <span className="text-xl">🔖</span>
                <span className="font-medium">북마크</span>
              </button>
              <div className="border-t border-gray-200 my-2"></div>
              <button
                onClick={handleLogout}
                className="w-full text-left px-6 py-4 text-red-600 hover:bg-red-50 transition-colors flex items-center gap-3"
              >
                <span className="text-xl">🚪</span>
                <span className="font-medium">로그아웃</span>
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}

