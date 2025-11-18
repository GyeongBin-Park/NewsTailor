import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import { logout } from "../api/auth";
import Article from "../components/Article";
import Footer from "../components/Footer";
import SideMenu from "../components/SideMenu";

import VolumeIcon from "../icons/volume_x.svg";
import VolumeFilledIcon from "../icons/volume_o.svg";
import TextLogo from "../icons/text_logo.png";
import LogoIcon from "/favicon-96x96.png";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const VOICE_STORAGE_KEY = "user_selected_voice_id";

const extractArticleId = (article) => {
  if (!article) return null;
  const id =
    article.id ??
    article.summaryNewsCacheId ??
    article.summaryId ??
    article.newsId ??
    null; // ID가 null이나 undefined가 아닐 경우, 무조건 문자열로 변환

  return id !== null && id !== undefined ? String(id) : null;
};

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
  const isSequencePlayingRef = useRef(false);

  const [selectedVoiceId, setSelectedVoiceId] = useState(
    () => localStorage.getItem(VOICE_STORAGE_KEY) || ""
  );
  const [bookmarkedUrlSet, setBookmarkedUrlSet] = useState(new Set());

  // 로그인 상태 확인 (리다이렉트 하지 않음)
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");
    const nickname = localStorage.getItem("nickname");

    if (token && username) {
      setUserInfo({ username, nickname: nickname || username });
    }
  }, []);

  // 로그아웃 처리
  const handleLogout = useCallback(() => {
    logout(); // 공통 로그아웃 함수 사용
    navigate("/login");
  }, [navigate]);

  const loadBookmarks = useCallback(async () => {
    const token = localStorage.getItem("accessToken");

    if (!token) {
      setBookmarkedUrlSet(new Set());
      return new Set();
    }

    try {
      const response = await fetch(`${BACKEND_URL}/api/bookmark`, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 401) {
        toast.error("인증이 만료되었습니다. 다시 로그인해주세요.");
        handleLogout();
        return new Set();
      }

      if (!response.ok) throw new Error("북마크 로드 실패");
      const data = await response.json().catch(() => []);
      const normalized = Array.isArray(data) ? data : [];

      const urls = normalized
        .map((bookmark) => {
          // 'summaryNews' 객체가 중첩되어 있거나, 객체 자체에 url이 있을 수 있습니다.
          const item = bookmark.summaryNews || bookmark;
          return item.url;
        })
        .filter((url) => url); // null이나 undefined가 아닌 유효한 url만 필터링

      setBookmarkedUrlSet(new Set(urls));
      return new Set(urls);
    } catch (error) {
      console.error("북마크 로드 오류:", error);
      setBookmarkedUrlSet(new Set());
      return new Set();
    }
  }, [handleLogout]);

  const fetchNews = useCallback(
    async (page = 0, bookmarkIdSetOverride = null) => {
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

        const effectiveBookmarkIds =
          bookmarkIdSetOverride instanceof Set
            ? bookmarkIdSetOverride
            : bookmarkedUrlSet;

        const articlesWithBookmark = newsArray.map((article) => {
          const isBookmarked =
            article.url && effectiveBookmarkIds.has(article.url); // 👈 URL로 비교
          // React의 key prop을 위한 고유 ID를 생성합니다.
          // 1. article.id가 있으면 사용
          // 2. 없으면 뉴스 ID(280번대)라도 추출
          // 3. 그것도 없으면 URL을 사용

          const uniqueKeyId =
            article.id || extractArticleId(article) || article.url;

          return {
            ...article,
            id: uniqueKeyId, // 👈 덮어쓰기 (key를 위해 'id' 필드 보장)
            isBookmarked,
          };
        });

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
    [navigate, handleLogout]
  );

  // 로그인된 경우에만 뉴스 불러오기
  useEffect(() => {
    if (!userInfo.username) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    const loadDataSequentially = async () => {
      setIsLoading(true);
      const bookmarkSet = await loadBookmarks();
      console.log("--- 1. [북마크 Set] 로드된 북마크 ID 목록 ---", bookmarkSet); // 👈 이 줄 추가
      if (!isMounted) return;
      await fetchNews(0, bookmarkSet);
    };

    loadDataSequentially();
    return () => {
      isMounted = false;
    };

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userInfo.username]);

  const handleToggleBookmark = async (articleToToggle) => {
    const token = localStorage.getItem("accessToken");

    const articleInState = articles.find(
      (a) =>
        (a.id && a.id === articleToToggle.id) ||
        (a.sectionId === articleToToggle.sectionId &&
          a.title === articleToToggle.title)
    );
    if (!articleInState) return;

    const isBookmarked = articleInState.isBookmarked;
    const method = isBookmarked ? "DELETE" : "POST";
    let endpoint = ""; // ▼▼▼▼▼ [ 여기가 핵심 수정 사항입니다 ] ▼▼▼▼▼

    if (isBookmarked) {
      // 1. (삭제) 새 API 명세: URL 기반으로 삭제
      const articleUrl = articleToToggle.url;
      if (!articleUrl) {
        toast.error("북마크를 삭제할 수 없습니다: 뉴스 URL이 없습니다.");
        console.error("뉴스 데이터에 URL이 없습니다:", articleToToggle);
        return;
      } // API 명세에 따라 URL 인코딩
      const encodedUrl = encodeURIComponent(articleUrl);
      endpoint = `${BACKEND_URL}/api/bookmark?url=${encodedUrl}`;
    } else {
      // 2. (추가) 기존 API 명세: ID 기반으로 추가
      const summaryNewsCacheId = extractArticleId(articleToToggle);

      if (!summaryNewsCacheId) {
        toast.error("북마크할 수 없습니다: 뉴스 ID가 없습니다.");
        console.error("뉴스 데이터:", articleToToggle);
        return;
      }
      endpoint = `${BACKEND_URL}/api/bookmark?summaryNewsCacheId=${summaryNewsCacheId}`;
    }
    // ▲▲▲▲▲ [ 수정 끝 ] ▲▲▲▲▲

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
      } // 성공 메시지 확인 (삭제 시 텍스트, 추가 시 JSON일 수 있음)

      const responseText = await response.text();
      console.log("북마크 응답:", responseText); // 북마크 상태 업데이트

      setArticles(
        articles.map((article) => {
          const isMatch =
            (article.id && article.id === articleToToggle.id) ||
            (article.sectionId === articleToToggle.sectionId &&
              article.title === articleToToggle.title);
          return isMatch
            ? { ...article, isBookmarked: !isBookmarked }
            : article;
        })
      ); // (기존 loadBookmarks() 호출 로직 대신, 상태를 즉시 업데이트)

      // bookmarkedUrlSet 상태 업데이트
      setBookmarkedUrlSet((prevSet) => {
        const newSet = new Set(prevSet);
        const articleUrl = articleToToggle.url;

        if (!articleUrl) return prevSet; // URL 없으면 아무것도 안 함

        if (isBookmarked) {
          // 삭제
          newSet.delete(articleUrl);
        } else {
          // 추가
          newSet.add(articleUrl);
        }
        return newSet;
      });

      toast.success(
        isBookmarked ? "북마크가 삭제되었습니다." : "북마크에 추가되었습니다."
      );
    } catch (err) {
      // (기존 catch 블록은 동일하게 유지)
      const message = err.message || "북마크 처리에 실패했습니다.";
      const alreadyBookmarked =
        !isBookmarked && /이미\s*북마크|already\s*bookmarked/i.test(message);

      const isDeleteAttempt = isBookmarked;
      const isNewsNotFound = /요약\s*뉴스를\s*찾을\s*수\s*없습니다/i.test(
        message
      );
      const isBookmarkNotFound = /북마크를\s*찾을\s*수\s*없습니다/i.test(
        message
      );

      if (isDeleteAttempt && (isNewsNotFound || isBookmarkNotFound)) {
        toast.success(
          isNewsNotFound
            ? "존재하지 않는 뉴스의 북마크를 삭제합니다."
            : "이미 삭제된 북마크입니다."
        );
        setArticles(
          articles.map((article) => {
            const isMatch =
              (article.id && article.id === articleToToggle.id) ||
              (article.sectionId === articleToToggle.sectionId &&
                article.title === articleToToggle.title);
            return isMatch ? { ...article, isBookmarked: false } : article;
          })
        );

        // 상태 강제 동기화
        setBookmarkedUrlSet((prevSet) => {
          const newSet = new Set(prevSet);
          const articleUrl = articleToToggle.url;
          if (articleUrl) {
            newSet.delete(articleUrl);
          }
          return newSet;
        });

        return;
      }

      if (alreadyBookmarked) {
        toast.success("이미 북마크된 뉴스입니다.");
        const articleId = extractArticleId(articleToToggle);
        setArticles(
          articles.map((article) => {
            const isMatch =
              (article.id && article.id === articleToToggle.id) ||
              (article.sectionId === articleToToggle.sectionId &&
                article.title === articleToToggle.title);
            return isMatch ? { ...article, isBookmarked: true } : article;
          })
        );

        // 상태 강제 동기화
        setBookmarkedUrlSet((prevSet) => {
          const newSet = new Set(prevSet);
          const articleUrl = articleToToggle.url;
          if (articleUrl) {
            newSet.add(articleUrl);
          }
          return newSet;
        });

        return;
      }

      toast.error(message);
      console.error("북마크 처리 오류:", err);
    }
  };

  const stopAudio = () => {
    if (mainAudioPlayer) {
      mainAudioPlayer.pause();
      mainAudioPlayer.currentTime = 0;
      setMainAudioPlayer(null);
    }
    setIsMainAudioPlaying(false);
    setIsMainAudioLoading(false);
    isSequencePlayingRef.current = false;
  };

  // 현재 페이지만 읽기
  const handleSpeakCurrentPage = async () => {
    // 이미 재생 중이면 정지
    if (isMainAudioPlaying || isMainAudioLoading) {
      stopAudio();
      return;
    }

    // 선택한 목소리 ID가 있는지 확인
    if (!selectedVoiceId) {
      toast.error("목소리가 선택되지 않았습니다.");
      return;
    }

    setIsMainAudioLoading(true);
    isSequencePlayingRef.current = false;

    // 현재 페이지의 뉴스만 읽기
    const allNews = articles
      .map((article) => {
        const title = article.title || "";
        const summary = article.summary || article.content || "";
        return `${title}. ${summary}`;
      })
      .join(". ");

    const fullText = allNews
      ? `오늘의 뉴스. ${allNews}`
      : "오늘의 뉴스가 없습니다.";

    await playAudio(fullText, null);
  };

  // 전체 페이지 읽기
  const handleSpeakAllPages = async () => {
    // 이미 재생 중이면 정지
    if (isMainAudioPlaying || isMainAudioLoading) {
      stopAudio();
      return;
    }

    // 선택한 목소리 ID가 있는지 확인
    if (!selectedVoiceId) {
      toast.error("목소리가 선택되지 않았습니다.");
      return;
    }

    setIsMainAudioLoading(true);
    isSequencePlayingRef.current = true;

    try {
      const token = localStorage.getItem("accessToken");
      if (!token) {
        toast.error("로그인이 필요합니다.");
        setIsMainAudioLoading(false);
        return;
      }

      // 모든 페이지(0, 1, 2, 3)의 뉴스를 가져오기
      const allPagesArticles = [];
      const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
      const separator = BACKEND_URL.endsWith("/") ? "" : "/";

      const chunkedTexts = []; // 페이지별 텍스트를 저장할 배열

      // 1. 모든 페이지(0-3)의 텍스트를 가져와 배열에 저장
      for (let page = 0; page < 4; page++) {
        try {
          const response = await fetch(
            `${BACKEND_URL}${separator}api/v1/summary-news?page=${page}`,
            {
              method: "GET",
              headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
              },
            }
          );

          if (response.ok) {
            const data = await response.json();
            const newsArray = Array.isArray(data) ? data : data.content || [];

            if (newsArray.length > 0) {
              const pageText = newsArray
                .map((article) => {
                  const title = article.title || "";
                  const summary = article.summary || article.content || "";
                  return `${title}. ${summary}`;
                })
                .join(". ");

              // 페이지 시작 멘트 추가
              chunkedTexts.push(`${page + 1}페이지 뉴스입니다. ${pageText}`);
            }
          }
        } catch (error) {
          console.error(`페이지 ${page} 로드 실패:`, error);
        }
      }

      if (chunkedTexts.length === 0) {
        toast.info("재생할 뉴스가 없습니다.");
        stopAudio();
        return;
      }

      // 2. 순차 재생 함수 정의
      let currentIndex = 0;

      const playNextChunk = () => {
        // 사용자가 중지 버튼을 눌렀으면 시퀀스 중단
        if (!isSequencePlayingRef.current) {
          stopAudio();
          return;
        }

        // 모든 페이지 재생 완료
        if (currentIndex >= chunkedTexts.length) {
          toast.success("모든 뉴스 재생이 완료되었습니다.");
          stopAudio();
          return;
        }

        const textToPlay = chunkedTexts[currentIndex];
        currentIndex++;

        // 현재 텍스트를 재생하고, 재생이 끝나면 playNextChunk를 다시 호출
        playAudio(textToPlay, playNextChunk);
      };

      // 3. 첫 번째 페이지 재생 시작
      toast("전체 뉴스 듣기를 시작합니다.", { icon: "🎧" });
      playNextChunk();
    } catch (error) {
      console.error("전체 뉴스 로드 오류:", error);
      toast.error("전체 뉴스를 불러오지 못했습니다.");
      stopAudio(); // 에러 발생 시에도 상태 초기화
    }
  };

  // 오디오 재생 공통 함수
  const playAudio = async (fullText, onEndedCallback) => {
    // 텍스트가 비어있으면 바로 콜백 실행 (다음 텍스트로)
    if (!fullText || fullText.trim().length === 0) {
      if (onEndedCallback) onEndedCallback();
      return;
    }

    try {
      // Article.jsx와 동일하게 Vercel 서버 함수 호출
      const API_URL = "/api/get-speech";
      const options = {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          input: fullText,
          voice_id: selectedVoiceId,
          model: "simba-multilingual",
        }),
      };

      const response = await fetch(API_URL, options);
      if (!response.ok) {
        const errorText = await response.text();
        console.error("TTS API Error Body:", errorText);
        throw new Error(
          `API 요청 실패: ${response.status} ${response.statusText}`
        );
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
      setIsMainAudioLoading(false); // 로딩 완료, 재생 시작

      newAudioPlayer.play().catch((error) => {
        console.error("오디오 재생 오류:", error);
        toast.error("브라우저에서 오디오 재생에 실패했습니다.");
        stopAudio();
      });

      newAudioPlayer.onended = () => {
        URL.revokeObjectURL(audioUrl); // 메모리 해제

        // 콜백이 있고, 시퀀스 재생이 중단되지 않았다면 다음 텍스트 재생
        if (onEndedCallback && isSequencePlayingRef.current) {
          onEndedCallback();
        }
        // 콜백이 없거나(단일 재생) 시퀀스가 중단되었다면 상태 초기화
        else {
          setMainAudioPlayer(null);
          setIsMainAudioPlaying(false);
          isSequencePlayingRef.current = false;
        }
      };
    } catch (error) {
      console.error("Speechify API 처리 오류:", error);
      toast.error("뉴스를 불러오지 못했습니다.");
      stopAudio();
    }
  };

  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      {/* Header */}
      <header className="sticky top-0 z-50 flex items-center justify-between pl-4 pr-6 h-[60px] bg-[#39235C] text-white shadow-sm">
        <img src={LogoIcon} alt="Logo" className="w-10 h-10" />
        <img src={TextLogo} alt="News Tailor Logo" className="h-10" />
        <SideMenu />
      </header>

      {/* Section Title */}
      <section className="px-4 mt-6 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-[#39235C] to-[#6B4C93] rounded-full"></div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">오늘의 뉴스</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                {new Date().toLocaleDateString("ko-KR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  weekday: "long",
                })}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSpeakCurrentPage}
              aria-label={
                isMainAudioPlaying && !isSequencePlayingRef.current
                  ? "음성 읽기 중지"
                  : "현재 페이지 뉴스 듣기"
              }
              className={`cursor-pointer px-3 py-2 rounded-lg border transition-colors flex items-center gap-1.5 ${
                isMainAudioPlaying || isMainAudioLoading
                  ? "border-[#39235C] bg-[#39235C]/10"
                  : "border-gray-300 hover:border-[#39235C] hover:bg-gray-50"
              }`}
              disabled={isMainAudioLoading}
              title="현재 페이지 뉴스 듣기"
            >
              <img
                src={
                  (isMainAudioPlaying && !isSequencePlayingRef.current) ||
                  (isMainAudioLoading && !isSequencePlayingRef.current)
                    ? VolumeFilledIcon
                    : VolumeIcon
                }
                alt="volume"
                className={`w-4 h-4 cursor-pointer`}
                style={
                  (isMainAudioPlaying && !isSequencePlayingRef.current) ||
                  (isMainAudioLoading && !isSequencePlayingRef.current)
                    ? {
                        filter:
                          "invert(17%) sepia(72%) saturate(1593%) hue-rotate(236deg) brightness(94%) contrast(91%)",
                      }
                    : {}
                }
              />
              <span
                className={`text-xs font-medium ${
                  (isMainAudioPlaying && !isSequencePlayingRef.current) ||
                  (isMainAudioLoading && !isSequencePlayingRef.current)
                    ? "text-[#39235C]"
                    : "text-gray-700"
                }`}
              >
                {currentPage + 1}
              </span>
            </button>

            <button
              onClick={handleSpeakAllPages}
              aria-label={
                isMainAudioPlaying && isSequencePlayingRef.current
                  ? "음성 읽기 중지"
                  : "전체 페이지 뉴스 듣기"
              }
              className={`cursor-pointer px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5 ${
                (isMainAudioPlaying && isSequencePlayingRef.current) ||
                (isMainAudioLoading && isSequencePlayingRef.current)
                  ? "bg-[#39235C] hover:bg-[#4a2d6e]"
                  : "bg-gradient-to-r from-[#39235C] to-[#6B4C93] hover:from-[#4a2d6e] hover:to-[#7c5da3]"
              }`}
              disabled={isMainAudioLoading}
              title="전체 페이지 뉴스 듣기"
            >
              <img
                src={
                  (isMainAudioPlaying && isSequencePlayingRef.current) ||
                  (isMainAudioLoading && isSequencePlayingRef.current)
                    ? VolumeFilledIcon
                    : VolumeIcon
                }
                alt="volume all"
                className="w-4 h-4 cursor-pointer brightness-0 invert"
              />
              <span className="text-xs font-medium text-white">전체</span>
            </button>
          </div>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>
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
