import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

import VolumeIcon from "../icons/volume_x.svg";
import VolumeFilledIcon from "../icons/volume_o.svg";
import CopyIcon from "../icons/copy.svg";
import BookmarkIcon from "../icons/bookmark_x.svg";
import BookmarkFilledIcon from "../icons/bookmark_o.svg";

export default function Article({ article, isBookmarked, onToggleBookmark }) {
  const { title, content } = article;
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState(null);

  const handleCopy = () => {
    navigator.clipboard
      .writeText(content)
      .then(() => toast.success("복사되었습니다!"))
      .catch((err) => toast.error("복사에 실패했어요."));
  };

  const handleSpeak = async () => {
    if (audioPlayer) {
      audioPlayer.pause();
      setAudioPlayer(null);
      return;
    }
    if (!selectedVoiceId) {
      toast.error("목소리가 선택되지 않았습니다.");
      return;
    }
    setIsLoading(true);
    const API_KEY = import.meta.env.VITE_SPEECHIFY_API_KEY;
    const API_URL = "/api/v1/audio/speech";

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        input: `${title}. ${content}`,
        voice_id: selectedVoiceId,
        model: "simba-multilingual",
      }),
    };

    try {
      const response = await fetch(API_URL, options);
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.statusText}`);
      }

      const data = await response.json();

      const base64Audio = data.audio_data;
      const audioFormat = data.audio_format || "wav"; // 'wav'가 기본값

      // atob 함수는 Base64 문자열 디코딩
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const audioBlob = new Blob([byteArray], { type: `audio/${audioFormat}` });
      const audioUrl = URL.createObjectURL(audioBlob);

      const newAudioPlayer = new Audio(audioUrl);
      setAudioPlayer(newAudioPlayer); // 오디오 객체 저장

      newAudioPlayer.play().catch((error) => {
        console.error("오디오 재생 오류:", error);
        toast.error("브라우저에서 오디오 재생에 실패했습니다.");
      });

      newAudioPlayer.onended = () => {
        setAudioPlayer(null); // 재생이 끝나면 상태 초기화
        URL.revokeObjectURL(audioUrl); // 메모리 누수 방지
      };
    } catch (error) {
      console.error("Speechify API 처리 오류:", error);
      toast.error("음성을 불러오지 못했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="bg-white p-4 space-y-3 border border-gray-100"
      style={{
        borderRadius: "10px",
        boxShadow: "0px 0px 9.6px rgba(0, 0, 0, 0.1)",
      }}
    >
      {/* Title */}
      <div className="inline-flex items-center px-3 py-1 bg-yellow-200 text-yellow-900 rounded-lg text-sm font-semibold">
        {title}
      </div>

      {/* Content */}
      <div className="bg-gray-100 rounded-lg p-4 text-gray-400 text-sm h-28">
        {content}
      </div>

      {/* Action Icons */}
      <div className="flex space-x-4 pt-2">
        <button
          onClick={handleSpeak}
          disabled={isLoading}
          className="cursor-pointer disabled:opacity-50"
        >
          <img
            src={isLoading || audioPlayer ? VolumeFilledIcon : VolumeIcon}
            alt="volume"
            className="w-6 h-6"
          />
        </button>
        <img
          src={CopyIcon}
          alt="copy"
          className="w-6 h-6 cursor-pointer"
          onClick={handleCopy}
        />
        <img
          src={isBookmarked ? BookmarkFilledIcon : BookmarkIcon}
          alt="bookmark"
          className="w-6 h-6 cursor-pointer"
          onClick={() => onToggleBookmark(article)}
        />
      </div>
    </div>
  );
}
