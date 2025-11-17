import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Article from "../components/Article";
import Footer from "../components/Footer";
import BackIcon from "../icons/back.svg";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;
const VOICE_STORAGE_KEY = "user_selected_voice_id";

export default function BookmarkPage() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedVoiceId] = useState(
    () => localStorage.getItem(VOICE_STORAGE_KEY) || ""
  );

  const fetchBookmarks = useCallback(async () => {
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");

    if (!token || !username) {
      toast.error("로그인이 필요한 서비스입니다.");
      navigate("/login");
      return;
    }

    setIsLoading(true);

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
        navigate("/login");
        return;
      }

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => "북마크 목록을 불러오지 못했습니다.");
        throw new Error(errorText);
      }

      const data = await response.json().catch(() => []);
      setBookmarks(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("북마크 목록 로드 오류:", error);
      toast.error(error.message || "북마크 목록을 불러오지 못했습니다.");
      setBookmarks([]);
    } finally {
      setIsLoading(false);
    }
  }, [navigate]);

  useEffect(() => {
    fetchBookmarks();
  }, [fetchBookmarks]);

  const handleToggleBookmark = async (articleToDelete) => { // 👈 인자 이름을 'article' -> 'articleToDelete'로 변경 (더 명확하게)
    const token = localStorage.getItem("accessToken");

    if (!token) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    // ▼▼▼▼▼ [ 여기가 핵심 수정 사항입니다 ] ▼▼▼▼▼
    
    // 1. 새 API 명세: URL 기반으로 삭제
    const articleUrl = articleToDelete.url;
    if (!articleUrl) {
      toast.error("북마크를 삭제할 수 없습니다: 뉴스 URL이 없습니다.");
      console.error("뉴스 데이터에 URL이 없습니다:", articleToDelete);
      return;
    }

    // 2. API 명세에 따라 URL 인코딩
    const encodedUrl = encodeURIComponent(articleUrl);
    const endpoint = `${BACKEND_URL}/api/bookmark?url=${encodedUrl}`;
    const method = "DELETE";

    // 3. (참고) 삭제할 북마크의 ID도 UI 갱신을 위해 미리 찾아둡니다.
    const bookmarkId = articleToDelete.id || articleToDelete.summaryNewsCacheId || articleToDelete.summaryId;

    // ▲▲▲▲▲ [ 수정 끝 ] ▲▲▲▲▲

    try {
      const response = await fetch(
        endpoint, // 👈 수정된 endpoint 사용
        {
          method: method, // 👈 method 변수 사용
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 401) {
        toast.error("인증이 만료되었습니다. 다시 로그인해주세요.");
        navigate("/login");
        return;
      }

      if (response.status === 404 || response.status === 400) { // 👈 400 에러도 같이 처리
        const errorData = await response.json().catch(() => ({}));
      const message = errorData.message || "북마크를 찾을 수 없습니다.";
        toast.error(message);
      
      // 400/404 에러(유령 북마크) 발생 시, UI에서만이라도 즉시 삭제
      if (bookmarkId) {
        setBookmarks((prev) =>
          prev.filter((bookmark) => (bookmark.id || bookmark.summaryNewsCacheId || bookmark.summaryId) !== bookmarkId)
        );
      }
      return; // 👈 에러 발생 시 여기서 중단
      }

      if (!response.ok) {
        const errorText = await response
          .text()
          .catch(() => "북마크 삭제에 실패했습니다.");
        throw new Error(errorText);
      }

     // 4. 성공 시, UI에서 해당 북마크 제거
     if (bookmarkId) {
        setBookmarks((prev) =>
          prev.filter((bookmark) => (bookmark.id || bookmark.summaryNewsCacheId || bookmark.summaryId) !== bookmarkId)
        );
     } else {
       // ID를 못 찾으면, 그냥 목록을 새로고침
       fetchBookmarks();
     }
      toast.success("북마크가 삭제되었습니다.");
    } catch (error) {
      console.error("북마크 삭제 오류:", error);
      toast.error(error.message || "북마크 삭제에 실패했습니다.");
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <Header left_img={BackIcon} text="북마크" onClick={() => navigate(-1)} />
      <main className="flex-grow p-4 space-y-4">
        {isLoading ? (
          <p className="text-center text-gray-500 mt-10">
            북마크를 불러오는 중입니다...
          </p>
        ) : bookmarks.length > 0 ? (
          bookmarks.map((a) => (
            <Article
              key={a.id}
              article={a}
              isBookmarked={true}
              onToggleBookmark={handleToggleBookmark}
              selectedVoiceId={selectedVoiceId}
            />
          ))
        ) : (
          <div className="text-center text-gray-500 mt-10">
            <p>북마크한 기사가 없습니다.</p>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
