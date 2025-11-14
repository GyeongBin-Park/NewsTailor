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
const VOICE_STORAGE_KEY = "user_selected_voice_id";

export default function MainPage() {
  const navigate = useNavigate();

  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userInfo, setUserInfo] = useState({ username: "", nickname: "" });
  const [currentPage, setCurrentPage] = useState(0); // 페이징 상태 추가

  // 음성 관련 상태 추가
  const [isMainAudioPlaying, setIsMainAudioPlaying] = useState(false); // "전체 듣기" 스피커의 로딩 상태
  const [isMainAudioLoading, setIsMainAudioLoading] = useState(false);
  // "전체 듣기" 오디오 플레이어 객체
  const [mainAudioPlayer, setMainAudioPlayer] = useState(null);
  // const [voices, setVoices] = useState([]);

  const [selectedVoiceId, setSelectedVoiceId] = useState(
    () => localStorage.getItem(VOICE_STORAGE_KEY) || ""
  );

  // 로그인 상태 확인 (리다이렉트 하지 않음)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");
    const nickname = localStorage.getItem("nickname");

    if (token && username) {
      setUserInfo({ username, nickname: nickname || username });
    }
  }, []);

  /*
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
  */

  // 로그아웃 처리
  const handleLogout = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("username");
    localStorage.removeItem("nickname");
    localStorage.removeItem("interests");
    toast.success("로그아웃 되었습니다.");
    navigate("/login");
  };

  const fetchNews = useCallback(
    async (page = 0) => {
      setIsLoading(true);
      setError(null);
      const token = localStorage.getItem("accessToken");

      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        // API 명세에 맞게 요약뉴스 API 호출
        // 백엔드에서 파라미터 이름을 인식하지 못하는 문제가 있으므로,
        // 명시적으로 page 파라미터 전달
        const separator = BACKEND_URL.endsWith("/") ? "" : "/";

        // 백엔드가 파라미터 이름을 인식하지 못하는 경우를 대비해
        // 명시적으로 query string 구성 (이미 올바름)
        const apiUrl = `${BACKEND_URL}${separator}api/v1/summary-news?page=${page}`;

        // 참고: 이 오류는 백엔드 Spring Boot 설정 문제입니다.
        // 백엔드 코드에서 @RequestParam(value = "page")를 명시하거나
        // 컴파일러에 -parameters 플래그를 추가해야 합니다.

        console.log("🔍 요약뉴스 요청 시작:");
        console.log("  - URL:", apiUrl);
        console.log("  - Token 존재:", !!token);
        console.log("  - Page:", page);

        const response = await fetch(apiUrl, {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });

        console.log("📡 응답 상태:", response.status, response.statusText);

        if (!response.ok) {
          if (response.status === 401 || response.status === 403) {
            toast.error("인증이 만료되었습니다. 다시 로그인해주세요.");
            handleLogout(); // 로그아웃 처리
            return;
          } else if (response.status === 503) {
            // 503 Service Unavailable: 캐시된 요약 뉴스가 아직 준비되지 않음
            let errorMessage = "요약 뉴스가 아직 준비되지 않았습니다.";
            try {
              const errorData = await response.json();
              errorMessage = errorData.message || errorMessage;
              console.log("⚠️ 503 에러 - 캐시 미준비:", errorData);
            } catch (e) {
              console.error("503 에러 응답 파싱 실패:", e);
            }

            // 사용자에게 안내 메시지 표시
            toast.error(errorMessage, {
              duration: 4000,
            });

            // 더 상세한 안내 메시지 표시
            setError(
              errorMessage +
                "\n\n스케줄러가 실행되면 자동으로 생성됩니다. (08:00, 13:00, 20:00)" +
                "\n또는 백엔드 관리자에게 요청하여 테스트 API를 실행할 수 있습니다."
            );

            console.warn(
              "📝 참고: 백엔드에서 다음 테스트 API로 강제 생성 가능"
            );
            console.warn("   POST /api/test/generate-all");

            return;
          } else if (response.status === 400) {
            // 400 에러 응답 파싱 (두 가지 형식 지원)
            let errorMessage = "잘못된 요청입니다.";
            let errorData = null;
            try {
              errorData = await response.json();
              console.error("❌ 400 에러 응답 전체:", errorData);
              // 명세에 따른 에러 응답 형식 처리
              errorMessage =
                errorData.message ||
                errorData.error ||
                errorData.status ||
                "잘못된 요청입니다.";

              // 관심사 관련 에러인지 확인
              if (
                errorMessage.includes("관심사") ||
                errorMessage.includes("interest") ||
                errorMessage.includes("3개")
              ) {
                errorMessage =
                  "관심사를 3개 선택해주세요. 마이페이지에서 설정할 수 있습니다.";
                console.error("⚠️ 관심사 설정 오류 감지");
                setTimeout(() => {
                  if (window.confirm("관심사를 설정하시겠습니까?")) {
                    navigate("/mypage");
                  }
                }, 1000);
              } else {
                // 파라미터 관련 에러인지 확인
                if (
                  errorMessage.includes("파라미터") ||
                  errorMessage.includes("parameter") ||
                  errorMessage.includes("Name for argument")
                ) {
                  console.error(
                    "⚠️ 파라미터 이름 오류 감지 - 백엔드 설정 확인 필요"
                  );
                  errorMessage =
                    "요청 파라미터 오류: 백엔드에서 파라미터 이름을 확인할 수 없습니다.";
                }
              }
            } catch (e) {
              // JSON 파싱 실패 시 텍스트로 읽기 시도
              console.error("에러 응답 JSON 파싱 실패:", e);
              try {
                const text = await response.text();
                console.error("❌ 에러 응답 텍스트:", text);
                errorMessage = text || "잘못된 요청입니다.";
              } catch (textError) {
                console.error("에러 응답 텍스트 읽기 실패:", textError);
              }
            }
            toast.error(errorMessage);
            setError(errorMessage);
            console.error("❌ 400 에러 최종 메시지:", errorMessage);
            return;
          }
          throw new Error("뉴스 목록을 불러오는 데 실패했습니다.");
        }

        // API 응답은 배열을 직접 반환 (명세에 따르면)
        const data = await response.json();

        console.log("✅ 응답 데이터:", data);
        console.log("  - 타입:", Array.isArray(data) ? "배열" : typeof data);
        console.log("  - 길이:", Array.isArray(data) ? data.length : "N/A");

        // 배열인지 확인하고 처리
        const newsArray = Array.isArray(data) ? data : data.content || [];

        console.log("📰 처리된 뉴스 배열:", newsArray);
        console.log("  - 뉴스 개수:", newsArray.length);

        if (newsArray.length === 0) {
          console.warn("⚠️ 뉴스 배열이 비어있습니다!");
          setError("표시할 뉴스가 없습니다.");
          toast.info("현재 표시할 요약 뉴스가 없습니다.");
        }

        // 북마크 상태는 별도로 관리 (초기에는 모두 false)
        // 북마크 목록을 조회하여 매칭할 수 있지만, 일단 기본값 false로 설정
        const articlesWithBookmark = newsArray.map((article) => ({
          ...article,
          isBookmarked: false, // 초기값, 실제 북마크 상태는 북마크 API에서 확인 필요
        }));

        console.log("✅ 최종 articles:", articlesWithBookmark);
        setArticles(articlesWithBookmark);
        setCurrentPage(page);
      } catch (err) {
        setError(err.message);
        console.error("뉴스 로딩 오류:", err);
        toast.error("뉴스를 불러오는 데 실패했습니다.");
      } finally {
        setIsLoading(false);
      }
    },
    [navigate]
  );

  // 로그인된 경우에만 뉴스 불러오기
  useEffect(() => {
    if (userInfo.username) {
      fetchNews();
    } else {
      // 로그인 안 된 경우 로딩 상태 해제
      setIsLoading(false);
    }
  }, [userInfo.username, fetchNews]);

  // 페이지 이동 시 (컴포넌트 unmount 시) "전체 듣기" 오디오 정지
  useEffect(() => {
    // 이 함수는 mainAudioPlayer가 변경되거나 컴포넌트가 사라질 때 실행됩니다.
    return () => {
      if (mainAudioPlayer) {
        mainAudioPlayer.pause(); // 오디오 정지
        setMainAudioPlayer(null); // 상태 초기화
      }
    };
  }, [mainAudioPlayer]); // mainAudioPlayer 객체를 감시

  const handleToggleBookmark = async (articleToToggle) => {
    const token = localStorage.getItem("accessToken");

    // API 응답에 id 필드가 있을 수도 있고 없을 수도 있음
    // 명세에는 없지만 실제 응답에 포함될 수 있음
    const articleInState = articles.find(
      (a) =>
        a.id === articleToToggle.id ||
        (a.sectionId === articleToToggle.sectionId &&
          a.title === articleToToggle.title)
    );
    if (!articleInState) return;

    const isBookmarked = articleInState.isBookmarked;

    // API 명세에 맞게 북마크 API 수정
    // POST /api/bookmark?summaryNewsCacheId={id} 또는 DELETE
    // 주의: 명세에는 id 필드가 없지만, 실제 응답에는 포함되어야 함
    const summaryNewsCacheId =
      articleToToggle.id || articleToToggle.summaryNewsCacheId;

    if (!summaryNewsCacheId) {
      toast.error(
        "북마크할 수 없습니다: 뉴스 ID가 없습니다. 백엔드 응답에 id 필드가 포함되어야 합니다."
      );
      console.error("뉴스 데이터:", articleToToggle);
      return;
    }

    const endpoint = `${BACKEND_URL}/api/bookmark?summaryNewsCacheId=${summaryNewsCacheId}`;
    const method = isBookmarked ? "DELETE" : "POST";

    try {
      const response = await fetch(endpoint, {
        method: method,
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response
          .json()
          .catch(() => ({ message: "북마크 처리에 실패했습니다." }));
        throw new Error(errorData.message || "북마크 처리에 실패했습니다.");
      }

      // 성공 메시지 확인
      const responseText = await response.text();

      // 북마크 상태 업데이트
      setArticles(
        articles.map((article) => {
          // id로 매칭하거나, id가 없으면 sectionId + title로 매칭
          const isMatch =
            article.id === articleToToggle.id ||
            (!article.id &&
              !articleToToggle.id &&
              article.sectionId === articleToToggle.sectionId &&
              article.title === articleToToggle.title);
          return isMatch
            ? { ...article, isBookmarked: !isBookmarked }
            : article;
        })
      );

      toast.success(
        isBookmarked ? "북마크가 삭제되었습니다." : "북마크에 추가되었습니다."
      );
    } catch (err) {
      toast.error(err.message);
      console.error("북마크 처리 오류:", err);
    }
  };

  /*
  // 음성 읽기 기능
  const detectLanguage = (text) => {
    const koreanRegex = /[ㄱ-ㅎ|ㅏ-ㅣ가-힣]/;
    return koreanRegex.test(text) ? "ko-KR" : "en-US";
  };
  */

  const handleSpeak = async () => {
    // 이미 재생 중이면 정지
    if (mainAudioPlayer) {
      mainAudioPlayer.pause();
      setMainAudioPlayer(null);
      setIsMainAudioPlaying(false);
      return;
    }

    // 선택한 목소리 ID가 있는지 확인
    if (!selectedVoiceId) {
      toast.error("목소리가 선택되지 않았습니다.");
      return;
    }

    setIsMainAudioLoading(true);

    // 모든 기사의 제목을 하나의 긴 문자열로 합칩니다.
    const allTitles = articles.map((article) => article.title).join(". ");

    // Article.jsx와 동일하게 Vercel 서버 함수 호출
    const API_URL = "/api/get-speech";
    const options = {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: allTitles,
        voice_id: selectedVoiceId,
        model: "simba-multilingual",
      }),
    };

    try {
      const response = await fetch(API_URL, options);
      if (!response.ok) {
        throw new Error(`API 요청 실패: ${response.statusText}`);
      }

      // Article.jsx와 동일하게 오디오 디코딩 및 재생
      const data = await response.json();
      const base64Audio = data.audio_data;
      const audioFormat = data.audio_format || "wav";

      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);

      const audioBlob = new Blob([byteArray], { type: `audio/${audioFormat}` });
      const audioUrl = URL.createObjectURL(audioBlob);

      const newAudioPlayer = new Audio(audioUrl);
      setMainAudioPlayer(newAudioPlayer);
      setIsMainAudioPlaying(true);

      newAudioPlayer.play().catch((error) => {
        console.error("오디오 재생 오류:", error);
        toast.error("브라우저에서 오디오 재생에 실패했습니다.");
      });

      newAudioPlayer.onended = () => {
        setMainAudioPlayer(null);
        setIsMainAudioPlaying(false);
        URL.revokeObjectURL(audioUrl);
      };
    } catch (error) {
      console.error("Speechify API 처리 오류:", error);
      toast.error("전체 제목을 불러오지 못했습니다.");
    } finally {
      setIsMainAudioLoading(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between pl-4 pr-6 h-[60px] bg-[#39235C] text-white shadow-sm">
        <img src={LogoIcon} alt="Logo" className="w-10 h-10" />
        <img src={TextLogo} alt="News Tailor Logo" className="h-10" />
        <SideMenu />
      </header>

      {/* Section Title */}
      <section className="flex items-center justify-between px-4 mt-4 mb-2">
        <h2 className="text-xl font-bold">Today's News Paper</h2>
        <button
          onClick={handleSpeak}
          aria-label={
            isMainAudioPlaying ? "음성 읽기 중지" : "뉴스 제목 전체 듣기"
          }
          className="cursor-pointer"
          disabled={isMainAudioLoading}
        >
          <img
            src={
              isMainAudioPlaying || isMainAudioLoading
                ? VolumeFilledIcon
                : VolumeIcon
            }
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
        {error && (
          <p className="text-center text-red-500 mt-10 whitespace-pre-line">
            {error}
          </p>
        )}

        {!isLoading && !error && articles.length > 0 ? (
          <>
            {articles.map((a, index) => (
              <Article
                key={a.id || `${a.sectionId}-${a.title}-${index}`}
                article={a}
                isBookmarked={a.isBookmarked} // API에서 받은 북마크 상태 직접 전달
                onToggleBookmark={() => handleToggleBookmark(a)}
                selectedVoiceId={selectedVoiceId}
              />
            ))}

            {/* 페이지네이션 */}
            <div className="flex justify-center items-center gap-2 mt-8 mb-4">
              {[0, 1, 2, 3].map((pageNum) => (
                <button
                  key={pageNum}
                  onClick={() => fetchNews(pageNum)}
                  disabled={isLoading}
                  className={`
                    w-10 h-10 rounded-lg font-medium transition-colors
                    ${
                      currentPage === pageNum
                        ? "bg-[#39235C] text-white"
                        : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                    }
                    ${isLoading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
                  `}
                >
                  {pageNum + 1}
                </button>
              ))}
            </div>
          </>
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
