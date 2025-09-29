import React, { useState, useEffect } from "react";
import { toast } from "react-hot-toast";

import VolumeIcon from "../icons/volume_x.svg";
import VolumeFilledIcon from "../icons/volume_o.svg";
import CopyIcon from "../icons/copy.svg";
import BookmarkIcon from "../icons/bookmark_x.svg";
import BookmarkFilledIcon from "../icons/bookmark_o.svg";

export default function Article({ article, isBookmarked, onToggleBookmark }) {
  const { title, content } = article;
  // const [bookmarked, setBookmarked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [audioPlayer, setAudioPlayer] = useState(null);

  // Speechify API를 위한 상태 변수 추가
  const [voices, setVoices] = useState([]); // API로부터 받아온 전체 목소리 목록
  const [selectedVoiceId, setSelectedVoiceId] = useState(""); // 선택된 목소리의 'id'
  const [speed, setSpeed] = useState(1);

  // useEffect(() => {
  //   const saved = localStorage.getItem(`bookmark-${title}`);
  //   setBookmarked(saved === "true");
  // }, [title]);

  // useEffect(() => {
  //   localStorage.setItem(`bookmark-${title}`, bookmarked);
  // }, [bookmarked, title]);

  useEffect(() => {
    const fetchVoices = async () => {
      // Vite 프록시를 사용하므로 '/api'로 시작
      const API_URL = "/api/v1/voices";
      const API_KEY = import.meta.env.VITE_SPEECHIFY_API_KEY;

      try {
        const response = await fetch(API_URL, {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
          },
        });

        if (!response.ok) {
          throw new Error(`목소리 목록 로딩 실패: ${response.statusText}`);
        }

        const data = await response.json();
        let availableVoices = [];

        console.log("voices response:", data);

        if (Array.isArray(data)) {
          availableVoices = data; // API가 배열만 반환하는 경우
        } else if (data.voices) {
          availableVoices = data.voices;
        }

        setVoices(availableVoices);

        if (availableVoices.length > 0) {
          const koreanVoice = availableVoices.find((v) =>
            v.locale.startsWith("ko-KR")
          );
          setSelectedVoiceId(
            koreanVoice ? koreanVoice.id : availableVoices[0].id
          );
        }
      } catch (error) {
        console.error("목소리 목록 로딩 오류:", error);
        toast.error("목소리 목록을 불러오지 못했습니다.");
      }
    };
    fetchVoices();
  }, []);

  // const toggleBookmark = () => setBookmarked(!bookmarked);

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

      // atob 함수는 Base64 문자열을 디코딩합니다.
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
    <div className="bg-white p-4 space-y-3 border border-gray-100" style={{ borderRadius: '10px', boxShadow: '0px 0px 9.6px rgba(0, 0, 0, 0.1)' }}>
      {/* Title */}
      <div className="inline-flex items-center px-3 py-1 bg-yellow-200 text-yellow-900 rounded-lg text-sm font-semibold">
        {title}
      </div>

      {/* Content */}
      <div className="bg-gray-100 rounded-lg p-4 text-gray-400 text-sm h-28">
        {content}
      </div>

      {/* TTS control UI */}
      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm pt-2">
        <div>
          <label
            htmlFor={`voice-select-${title}`}
            className="font-semibold text-gray-600"
          >
            목소리
          </label>
          <select
            id={`voice-select-${title}`}
            value={selectedVoiceId}
            onChange={(e) => setSelectedVoiceId(e.target.value)}
            className="w-full border rounded p-1 mt-1"
            disabled={voices.length === 0 || voices[0]?.id === "error"}
          >
            {voices.length > 0 ? (
              voices[0].id === "error" ? (
                <option value="error">목록 로딩 실패</option>
              ) : (
                voices
                  // 한국어 목소리만 필터링하여 모두 보여주기
                  .filter((v) => v.locale && v.locale.startsWith("ko-KR"))

                  .map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.display_name} ({voice.locale})
                    </option>
                  ))
              )
            ) : (
              <option>로딩 중...</option>
            )}
          </select>
        </div>
        <div>
          <label
            htmlFor={`speed-range-${title}`}
            className="font-semibold text-gray-600"
          >
            속도: {speed.toFixed(1)}x
          </label>
          <input
            id={`speed-range-${title}`}
            type="range"
            min="0.5"
            max="2.5"
            step="0.1"
            value={speed}
            onChange={(e) => setSpeed(parseFloat(e.target.value))}
            className="w-full mt-2"
          />
        </div>
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
