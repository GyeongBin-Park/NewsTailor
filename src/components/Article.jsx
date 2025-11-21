import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

import VolumeIcon from "../icons/volume_x.svg";
import VolumeFilledIcon from "../icons/volume_o.svg";
import CopyIcon from "../icons/copy.svg";
import BookmarkIcon from "../icons/bookmark_x.svg";
import BookmarkFilledIcon from "../icons/bookmark_o.svg";

export default function Article({
  article,
  isBookmarked,
  onToggleBookmark,
  selectedVoiceId,
}) {
  // API 응답에서 summary 필드를 content로 사용 (호환성 유지)
  const title = article.title || "";
  const content = article.summary || article.content || "";
  const sectionName = article.sectionName || "";
  const url = article.url || "";
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState(null);

  const handleCopy = () => {
    const textToCopy = `${title}\n\n${content}`;

    navigator.clipboard
      .writeText(textToCopy)
      .then(() => toast.success("제목과 내용이 복사되었습니다!"))
      .catch((err) => {
        console.error("복사 오류:", err);
        toast.error("복사에 실패했어요.");
      });
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
    const API_URL = "/api/get-speech";

    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
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

  // 페이지 이동 시 (컴포넌트 unmount 시) "개별 듣기" 오디오 정지
  useEffect(() => {
    // 이 함수는 audioPlayer가 변경되거나 컴포넌트가 사라질 때 실행됨.
    return () => {
      if (audioPlayer) {
        audioPlayer.pause(); // 오디오 정지
        setAudioPlayer(null); // 상태 초기화
      }
    };
  }, [audioPlayer]); // audioPlayer 객체 감시

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
      {/* 카테고리 뱃지 */}
      {sectionName && (
        <div className="px-4 pt-4 pb-2">
          <span className="inline-block px-3 py-1 bg-[#39235C] text-white text-xs font-semibold rounded-full">
            {sectionName}
          </span>
        </div>
      )}

      <div className="px-4 pb-4 space-y-3">
        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 leading-snug break-words">
          {title}
        </h3>

        {/* Content */}
        <div className="text-sm text-gray-600 leading-relaxed break-words">
          {content}
        </div>

        {/* 원문 링크 */}
        {url && (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-[#39235C] font-medium hover:underline"
          >
            원문 보기
            <span className="text-xs">↗</span>
          </a>
        )}

        {/* Action Icons */}
        <div className="flex items-center justify-end gap-4 pt-2 border-t border-gray-100">
          <button
            onClick={handleSpeak}
            disabled={isLoading}
            className="cursor-pointer disabled:opacity-50 hover:opacity-70 transition-opacity"
            title="음성으로 듣기"
          >
            <img
              src={isLoading || audioPlayer ? VolumeFilledIcon : VolumeIcon}
              alt="volume"
              className="w-5 h-5"
            />
          </button>
          <button
            onClick={handleCopy}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            title="복사하기"
          >
            <img src={CopyIcon} alt="copy" className="w-5 h-5" />
          </button>
          <button
            onClick={() => onToggleBookmark(article)}
            className="cursor-pointer hover:opacity-70 transition-opacity"
            title={isBookmarked ? "북마크 제거" : "북마크 추가"}
          >
            <img
              src={isBookmarked ? BookmarkFilledIcon : BookmarkIcon}
              alt="bookmark"
              className="w-5 h-5"
            />
          </button>
        </div>
      </div>
    </div>
  );
}
