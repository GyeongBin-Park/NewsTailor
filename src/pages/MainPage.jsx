import React, { useState } from "react";
import Article from "../components/Article";

import HomeIcon from "../icons/home_o.png";
import BookmarkIcon from "../icons/bookmark_x.png";
import SearchIcon from "../icons/search_x.png";
import UserIcon from "../icons/user_x.png";
import VolumeIcon from "../icons/volume_x.png";
import VolumeFilledIcon from "../icons/volume_o.png";

export default function MainPage() {
  const [isSpeaking, setIsSpeaking] = useState(false);

  const articles = [
    { title: "안녕하세요", content: "반갑습니다" },
    { title: "Hello", content: "everyone" },
    { title: "Head Line", content: "Article" },
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
    const voices = synth.getVoices();
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
      <header className="flex items-center justify-between px-4 py-3 border-b gap-10">
        <div className="w-10 h-10 bg-gray-300 rounded-md" />
        <h1 className="text-lg font-semibold">오늘의 뉴스</h1>
        <div className="w-8 h-8 bg-gray-300 rounded-full" />
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
        {articles.map((a, i) => (
          <Article key={i} title={a.title} content={a.content} />
        ))}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white flex justify-around items-center h-16">
        <img src={HomeIcon} alt="home" className="w-6 h-6" />
        <img src={BookmarkIcon} alt="bookmark" className="w-6 h-6" />
        <img src={SearchIcon} alt="search" className="w-6 h-6" />
        <img src={UserIcon} alt="user" className="w-6 h-6" />
      </nav>
    </div>
  );
}
