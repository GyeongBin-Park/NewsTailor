import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Article from "../components/Article";
import Footer from "../components/Footer";
import SideMenu from "../components/SideMenu";

import VolumeIcon from "../icons/volume_x.svg";
import VolumeFilledIcon from "../icons/volume_o.svg";
import TextLogo from "../icons/text_logo.png";
import LogoIcon from "/favicon-96x96.png";

export default function MainPage() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voices, setVoices] = useState([]);
  const [bookmarks, setBookmarks] = useState([]);
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);

  const userId = localStorage.getItem("username") || "guest";
  const BOOKMARK_KEY = `bookmarked_articles_${userId}`;

  useEffect(() => {
    const savedBookmarks = JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || [];
    setBookmarks(savedBookmarks);
  }, [userId]);

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

  useEffect(() => {
    // 실제로는 fetch나 axios 같은 라이브러리를 사용합니다.
    const fetchArticles = () => {
      // --- API 호출 시뮬레이션 ---
      const fetchedData = [
        {
          id: 1,
          title: "안녕하세요",
          content: "반갑습니다. 이것은 테스트입니다.",
        },
        { id: 2, title: "Hello", content: "everyone" },
        { id: 3, title: "Head Line", content: "Article" },
      ];
      setArticles(fetchedData);
    };

    fetchArticles();
  }, []);

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
