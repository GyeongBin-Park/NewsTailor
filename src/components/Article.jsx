import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

import VolumeIcon from "../icons/volume_x.svg";
import VolumeFilledIcon from "../icons/volume_o.svg";
import CopyIcon from "../icons/copy.svg";
import BookmarkIcon from "../icons/bookmark_x.svg";
import BookmarkFilledIcon from "../icons/bookmark_o.svg";

export default function Article({ title, content }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`bookmark-${title}`);
    if (saved == "true") {
      setBookmarked(true);
    }
  }, [title]);

  useEffect(() => {
    localStorage.setItem(`bookmark-${title}`, bookmarked);
  }, [bookmarked]);

  const toggleBookmark = () => {
    setBookmarked(!bookmarked);
  };

  const handleCopy = () => {
    navigator.clipboard
      .writeText(content)
      .then(() => {
        toast.success("복사되었습니다!");
      })
      .catch((err) => {
        toast.error("복사에 실패했어요.");
        console.error("복사 실패:", err);
      });
  };

  const detectLanguage = (text) => {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ가-힣]/;
    return koreanRegex.test(text) ? "ko-KR" : "en-US";
  };

  const handleSpeak = () => {
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
      return;
    }

    const fullText = `${title}. ${content}`;
    const lang = detectLanguage(fullText);

    const utterance = new SpeechSynthesisUtterance(fullText);
    utterance.lang = lang;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="bg-white rounded-2xl shadow-md p-4 space-y-2">
      {/* Title */}
      <div className="inline-block px-3 py-1 text-blue-500 border border-blue-300 rounded-full text-sm font-semibold">
        {title}
      </div>

      {/* Content */}
      <div className="bg-gray-100 rounded-lg p-4 text-gray-500 text-sm h-24">
        {content}
      </div>

      {/* Action Icons */}
      <div className="flex space-x-4 pt-2">
        <img
          src={isSpeaking ? VolumeFilledIcon : VolumeIcon}
          alt="volume"
          className="w-6 h-6 cursor-pointer"
          onClick={handleSpeak}
        />
        <img
          src={CopyIcon}
          alt="copy"
          className="w-6 h-6 cursor-pointer"
          onClick={handleCopy}
        />
        <img
          src={bookmarked ? BookmarkFilledIcon : BookmarkIcon}
          alt="bookmark"
          className="w-6 h-6 cursor-pointer"
          onClick={toggleBookmark}
        />
      </div>
    </div>
  );
}
