import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

import Article from "../components/Article";
import Footer from "../components/Footer";

import TextLogo from "../icons/text_logo.png";
import LogoIcon from "/favicon-96x96.png";
import PersonIcon from "../icons/person.png";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function MainPage() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({ username: "", nickname: "" });

  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");
    const nickname = localStorage.getItem("nickname");

    if (!token || !username) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }
    setUserInfo({ username, nickname: nickname || username });
  }, [navigate]);

  const fetchNews = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const token = localStorage.getItem("accessToken");

    try {
      const response = await fetch(`${BACKEND_URL}/api/news`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "ngrok-skip-browser-warning": "true",
        },
      });

      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          toast.error("인증이 만료되었습니다. 다시 로그인해주세요.");
          handleLogout(); // 로그아웃 처리
        }
        throw new Error("뉴스 목록을 불러오는 데 실패했습니다.");
      }

      const data = await response.json();
      // API 응답에서 isBookmarked 값을 확인하여 초기 북마크 상태 설정
      const initialBookmarks = data.content.filter(
        (article) => article.isBookmarked
      );
      setArticles(data.content);
    } catch (err) {
      setError(err.message);
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    if (userInfo.username) {
      fetchNews();
    }
  }, [userInfo.username, fetchNews]);

  const handleToggleBookmark = async (articleToToggle) => {
    const token = localStorage.getItem("accessToken");

    const articleInState = articles.find((a) => a.id === articleToToggle.id);
    if (!articleInState) return;

    const isBookmarked = articleInState.isBookmarked;
    const endpoint = `${BACKEND_URL}/api/news/${articleToToggle.id}/bookmark`;
    const method = isBookmarked ? "DELETE" : "POST";

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error("북마크 처리에 실패했습니다.");
      }

      setArticles(
        articles.map((article) =>
          article.id === articleToToggle.id
            ? { ...article, isBookmarked: !isBookmarked }
            : article
        )
      );
      toast.success(
        isBookmarked ? "북마크가 삭제되었습니다." : "북마크에 추가되었습니다."
      );
    } catch (err) {
      toast.error(err.message);
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    localStorage.removeItem("nickname");
    toast.success("로그아웃 되었습니다.");
    setIsMenuOpen(false);
    navigate("/login");
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="flex items-center justify-between pl-4 pr-6 h-[60px] bg-[#39235C] text-white border-b border-[#E6E6E6]">
        <img src={LogoIcon} alt="Logo" className="w-10 h-10" />
        <img src={TextLogo} alt="News Tailor Logo" className="h-10" />
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="사용자 메뉴 열기"
            className="cursor-pointer"
          >
            <img src={PersonIcon} alt="Person Logo" className="w-8 h-8" />
          </button>
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border z-10">
              <div className="px-4 py-2 text-sm text-gray-700">
                아이디: <strong>{userInfo.username}</strong>
              </div>
              <div className="border-t border-gray-100"></div>
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </header>

      {/* Section Title */}
      <section className="flex items-center justify-between px-4 mt-4 mb-2">
        <h2 className="text-xl font-bold">Today’s News Paper</h2>
      </section>

      {/* Articles */}
      <main className="space-y-4 px-4">
        {isLoading && (
          <p className="text-center text-gray-500 mt-10">
            기사를 불러오는 중...
          </p>
        )}
        {error && <p className="text-center text-red-500 mt-10">{error}</p>}

        {!isLoading && !error && articles.length > 0
          ? articles.map((a) => (
              <Article
                key={a.id}
                article={a}
                isBookmarked={a.isBookmarked} // API에서 받은 북마크 상태 직접 전달
                onToggleBookmark={() => handleToggleBookmark(a)}
              />
            ))
          : !isLoading && (
              <p className="text-center text-gray-500 mt-10">
                표시할 뉴스가 없습니다.
              </p>
            )}
      </main>

      <Footer />
    </div>
  );
}
