import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Article from "../components/Article";
import Footer from "../components/Footer";

import VolumeIcon from "../icons/volume_x.svg";
import VolumeFilledIcon from "../icons/volume_o.svg";
import TextLogo from "../icons/text_logo.png";
import LogoIcon from "/favicon-96x96.png";
import PersonIcon from "../icons/person.png";

export default function MainPage() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  // ---  임시 사용자 아이디 (실제로는 로그인 정보에서 가져와야 함) ---
  const userId = "user123";

  useEffect(() => {
    const savedBookmarks =
      JSON.parse(localStorage.getItem("bookmarked_articles")) || [];
    setBookmarks(savedBookmarks);
  }, []);

  const handleToggleBookmark = (article) => {
    const isAlreadyBookmarked = bookmarks.some((b) => b.id === article.id);
    let newBookmarks = [];

    if (isAlreadyBookmarked) {
      newBookmarks = bookmarks.filter((b) => b.id !== article.id);
    } else {
      newBookmarks = [...bookmarks, article];
    }

    setBookmarks(newBookmarks);
    localStorage.setItem("bookmarked_articles", JSON.stringify(newBookmarks));
  };

  // 컴포넌트가 처음 렌더링될 때 목소리 목록을 불러옴
  useEffect(() => {
    const loadVoices = () => {
      setVoices(window.speechSynthesis.getVoices());
    };

    // 목소리가 변경(로드)되면 loadVoices 함수 호출
    window.speechSynthesis.onvoiceschanged = loadVoices;
    loadVoices(); // 초기 로드

    // 컴포넌트가 사라질 때 이벤트 리스너를 정리함
    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  const articles = [
    { id: 1, title: "안녕하세요", content: "반갑습니다. 이것은 테스트입니다." },
    { id: 2, title: "Hello", content: "everyone" },
    { id: 3, title: "Head Line", content: "Article" },
  ];

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

      if (index == articles.length - 1) {
        utterance.onend = () => {
          setIsSpeaking(false);
        };
      }

      synth.speak(utterance);
    });
  };

  // 로그아웃 처리 함수
  const handleLogout = () => {
    console.log("로그아웃 되었습니다.");
    setIsMenuOpen(false); // 메뉴 닫기
    navigate("/login"); // 로그인 페이지로 이동
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="flex items-center justify-between pl-4 pr-6 py-3 bg-[#39235C]">
        <img src={LogoIcon} alt="Logo" className="w-10 h-10" />
        <img src={TextLogo} alt="News Tailor Logo" className="h-10" />
        <div className="relative">
           <img
             src={PersonIcon}
             alt="Person Logo"
             className="w-8 h-8 cursor-pointer"
             onClick={() => setIsMenuOpen(!isMenuOpen)}
           />
          {/* isMenuOpen이 true일 때만 드롭다운 메뉴 표시 */}
          {isMenuOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 border z-10">
              <div className="px-4 py-2 text-sm text-gray-700">
                아이디: <strong>{userId}</strong>
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
        <img
          src={isSpeaking ? VolumeFilledIcon : VolumeIcon}
          alt="volume"
          className="w-6 h-6 cursor-pointer"
          onClick={handleSpeak}
        />
      </section>

      {/* Articles */}
      <main className="space-y-4 px-4">
        {articles.map((a) => (
          <Article
            key={a.id}
            article={a}
            isBookmarked={bookmarks.some((b) => b.id === a.id)}
            onToggleBookmark={handleToggleBookmark}
          />
        ))}
      </main>

      <Footer />
    </div>
  );
}
