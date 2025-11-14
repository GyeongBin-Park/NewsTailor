import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackIcon from "../icons/back.svg";
import TextLogo from "../icons/text_logo.png";
import LogoIcon from "/favicon-96x96.png";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

export default function RankingPage() {
  const navigate = useNavigate();
  const [articles, setArticles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [expandedItems, setExpandedItems] = useState(new Set()); // 펼쳐진 항목 관리

  useEffect(() => {
    fetchRankingNews();
  }, []);

  const fetchRankingNews = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log('🔍 랭킹뉴스 요청 시작:', `${BACKEND_URL}/api/v1/news/ranking`);
      
      const response = await fetch(`${BACKEND_URL}/api/v1/news/ranking`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log('📡 응답 상태:', response.status, response.statusText);

      if (!response.ok) {
        if (response.status === 403) {
          // 403 Forbidden: 권한 문제 또는 CORS 문제
          let errorMessage = "랭킹 뉴스에 접근할 수 없습니다.";
          try {
            // JSON 파싱 시도
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errorData = await response.json();
              errorMessage = errorData.message || errorData.error || errorMessage;
              console.error('❌ 403 에러 (JSON):', errorData);
            } else {
              // JSON이 아니면 텍스트로 읽기
              const text = await response.text();
              console.error('❌ 403 에러 (텍스트):', text);
              errorMessage = text || errorMessage;
            }
          } catch (e) {
            console.error("403 에러 응답 파싱 실패:", e);
            // 빈 응답이거나 파싱 실패 시 기본 메시지 사용
            errorMessage = "랭킹 뉴스에 접근할 수 없습니다. (403 Forbidden)";
          }
          toast.error(errorMessage);
          setError("랭킹 뉴스에 접근할 수 없습니다. 서버 설정을 확인해주세요.");
          return;
        } else if (response.status === 503) {
          const errorData = await response.json().catch(() => ({ message: "서비스 준비 중입니다." }));
          toast.error(errorData.message || "랭킹 뉴스가 아직 준비되지 않았습니다.");
          setError("랭킹 뉴스가 아직 준비되지 않았습니다.");
          return;
        }
        throw new Error("랭킹 뉴스를 불러오는 데 실패했습니다.");
      }

      const data = await response.json();
      const newsArray = Array.isArray(data) ? data : [];
      
      console.log("✅ 랭킹 뉴스:", newsArray);
      setArticles(newsArray);
    } catch (err) {
      setError(err.message);
      console.error("랭킹 뉴스 로딩 오류:", err);
      toast.error("랭킹 뉴스를 불러오는 데 실패했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const toggleExpand = (id) => {
    setExpandedItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <Header
        left_img={BackIcon}
        text="데일리 하이라이트"
        onClick={() => navigate("/")}
      />

      <main className="flex-grow px-4 py-4">
        {isLoading && (
          <p className="text-center text-gray-500 mt-10">
            랭킹 뉴스를 불러오는 중...
          </p>
        )}
        
        {error && (
          <p className="text-center text-red-500 mt-10 whitespace-pre-line">{error}</p>
        )}

        {!isLoading && !error && articles.length > 0 && (
          <div className="space-y-2">
            {articles.map((article, index) => {
              const isExpanded = expandedItems.has(article.id || index);
              const displayRank = index + 1;
              return (
                <div
                  key={article.id || index}
                  className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                >
                  {/* 제목 클릭 영역 */}
                  <button
                    onClick={() => toggleExpand(article.id || index)}
                    className="w-full text-left px-4 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xs font-semibold text-gray-500">
                          {article.press || "언론사"}
                        </span>
                        <span className="text-xs text-gray-400">
                          {article.sectionId
                            ? getSectionName(article.sectionId)
                            : "전체"}
                        </span>
                        <span className="text-xs text-[#39235C] font-semibold">
                          랭킹 #{displayRank}
                        </span>
                      </div>
                      <h3 className="text-base font-medium text-gray-900 line-clamp-2">
                        {article.title}
                      </h3>
                      {article.collectedAt && (
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(article.collectedAt)}
                        </p>
                      )}
                    </div>
                    <span className="ml-4 text-gray-400 text-xl">
                      {isExpanded ? "−" : "+"}
                    </span>
                  </button>

                  {/* 펼쳐진 내용 */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                      {article.summary && (
                        <p className="text-sm text-gray-700 mb-3 leading-relaxed">
                          {article.summary}
                        </p>
                      )}
                      {article.url && (
                        <a
                          href={article.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#39235C] font-medium hover:underline inline-flex items-center gap-1"
                        >
                          원문 보기
                          <span className="text-xs">↗</span>
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {!isLoading && !error && articles.length === 0 && (
          <p className="text-center text-gray-500 mt-10">
            표시할 랭킹 뉴스가 없습니다.
          </p>
        )}
      </main>

      <Footer />
    </div>
  );
}

// 섹션 ID를 이름으로 변환하는 헬퍼 함수
function getSectionName(sectionId) {
  const sectionMap = {
    100: "정치",
    101: "경제",
    102: "사회",
    103: "생활/문화",
    104: "세계",
    105: "IT/과학",
  };
  return sectionMap[sectionId] || "기타";
}

// 날짜 포맷팅 함수
function formatDate(dateString) {
  if (!dateString) return "";
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    
    if (diffMins < 1) return "방금 전";
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    
    // 24시간 이상이면 날짜 표시
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return `${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  } catch (e) {
    return dateString;
  }
}

