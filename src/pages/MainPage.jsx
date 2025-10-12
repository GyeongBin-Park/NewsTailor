import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Article from "../components/Article";
import Footer from "../components/Footer";
import SideMenu from "../components/SideMenu";

import VolumeIcon from "../icons/volume_x.svg";
import VolumeFilledIcon from "../icons/volume_o.svg";
import TextLogo from "../icons/text_logo.png";
import LogoIcon from "/favicon-96x96.png";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function MainPage() {
  const navigate = useNavigate();
  
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({ username: "", nickname: "" });
  
  // 음성 관련 상태 추가
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);

  // 로그인 상태 확인 (리다이렉트 하지 않음)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");
    const nickname = localStorage.getItem("nickname");

    if (token && username) {
      setUserInfo({ username, nickname: nickname || username });
    }
  }, []);

  // 음성 목록 불러오기
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices();

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    localStorage.removeItem("nickname");
    localStorage.removeItem("interests");
    toast.success("로그아웃 되었습니다.");
    navigate("/login");
  };

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

  // 로그인된 경우에만 뉴스 불러오기
  useEffect(() => {
    if (userInfo.username) {
      fetchNews();
    } else {
      // 로그인 안 된 경우 로딩 상태 해제
      setIsLoading(false);
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

  // 음성 읽기 기능
  const detectLanguage = (text) => {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ가-힣]/;
    return koreanRegex.test(text) ? "ko-KR" : "en-US";
  };

  const handleSpeak = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    const synth = window.speechSynthesis;
    setIsSpeaking(true);

    articles.forEach((article, index) => {
      const utterance = new SpeechSynthesisUtterance(article.title);
      utterance.lang = detectLanguage(article.title);
      const voice = voices.find((v) => v.lang.startsWith(utterance.lang));
      if (voice) utterance.voice = voice;

      if (index === articles.length - 1) {
        utterance.onend = () => {
          setIsSpeaking(false);
        };
      }

      synth.speak(utterance);
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="flex items-center justify-between pl-4 pr-6 h-[60px] bg-[#39235C] text-white">
        <img src={LogoIcon} alt="Logo" className="w-10 h-10" />
        <img src={TextLogo} alt="News Tailor Logo" className="h-10" />
        <SideMenu />
      </header>

      {/* Section Title */}
      <section className="flex items-center justify-between px-4 mt-4 mb-2">
        <h2 className="text-xl font-bold">Today's News Paper</h2>
        <button
          onClick={handleSpeak}
          aria-label={isSpeaking ? "음성 읽기 중지" : "뉴스 제목 전체 듣기"}
          className="cursor-pointer"
        >
          <img
            src={isSpeaking ? VolumeFilledIcon : VolumeIcon}
            alt="volume"
            className="w-6 h-6 cursor-pointer"
          />
        </button>
      </section>

      {/* Articles */}
      <main className="space-y-4 px-4">
        {isLoading && (
          <p className="text-center text-gray-500 mt-10">
            기사를 불러오는 중...
          </p>
        )}
        {error && <p className="text-center text-red-500 mt-10">{error}</p>}

        {!isLoading && !error && articles.length > 0 ? (
          articles.map((a) => (
            <Article
              key={a.id}
              article={a}
              isBookmarked={a.isBookmarked} // API에서 받은 북마크 상태 직접 전달
              onToggleBookmark={() => handleToggleBookmark(a)}
            />
          ))
        ) : !isLoading && !userInfo.username ? (
          <div className="text-center mt-16 px-4">
            <div className="mb-6">
              <span className="text-6xl">📰</span>
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">
              로그인이 필요합니다
            </h3>
            <p className="text-gray-500 mb-6">
              맞춤 뉴스를 보려면 로그인해주세요
            </p>
            <button
              onClick={() => navigate("/login")}
              className="bg-[#39235C] text-white px-8 py-3 rounded-xl font-semibold hover:bg-[#2d1a47] transition-colors"
            >
              로그인하기
            </button>
          </div>
        ) : !isLoading && userInfo.username ? (
          <p className="text-center text-gray-500 mt-10">
            표시할 뉴스가 없습니다.
          </p>
        ) : null}
      </main>

      <Footer />
    </div>
  );
}
