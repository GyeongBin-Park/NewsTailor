import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackIcon from "../icons/back.svg";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// 관심분야 아이콘 import
import politicsX from "../icons/politics_x.svg";
import politicsO from "../icons/politics_o.svg";
import economyX from "../icons/economy_x.svg";
import economyO from "../icons/economy_o.svg";
import societyX from "../icons/society_x.svg";
import societyO from "../icons/society_o.svg";
import lifestyleX from "../icons/lifestyle_x.svg";
import lifestyleO from "../icons/lifestyle_o.svg";
import worldX from "../icons/world_x.svg";
import worldO from "../icons/world_o.svg";
import scienceX from "../icons/science_x.svg";
import scienceO from "../icons/science_o.svg";

const categories = [
  { id: 'politics', name: '정치', iconX: politicsX, iconO: politicsO, backendId: 100 },
  { id: 'economy', name: '경제', iconX: economyX, iconO: economyO, backendId: 101 },
  { id: 'society', name: '사회', iconX: societyX, iconO: societyO, backendId: 102 },
  { id: 'lifestyle', name: '생활/문화', iconX: lifestyleX, iconO: lifestyleO, backendId: 103 },
  { id: 'world', name: '세계', iconX: worldX, iconO: worldO, backendId: 104 },
  { id: 'science', name: 'IT/과학', iconX: scienceX, iconO: scienceO, backendId: 105 },
];

export default function EditProfilePage() {
  const navigate = useNavigate();
  
  // 로그인 상태 확인
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [nickname, setNickname] = useState("");
  const [selectedCategories, setSelectedCategories] = useState(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // 초기값 저장 (변경사항 비교용)
  const [initialNickname, setInitialNickname] = useState("");
  const [initialCategories, setInitialCategories] = useState(new Set());

  // 사용자 정보 불러오기
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");

    if (!token || !username) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    if (!BACKEND_URL) {
      toast.error("백엔드 주소가 설정되지 않았습니다.");
      return;
    }

    setIsLoggedIn(true);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort("timeout"), 10000);

    const loadProfile = async () => {
      try {
        // 명세에 따라 GET /api/user/info 사용
        const response = await fetch(`${BACKEND_URL}/api/user/info`, {
          method: "GET",
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          if (response.status === 401) {
            toast.error("로그인이 만료되었습니다. 다시 로그인해주세요.");
            navigate("/login");
            return;
          } else if (response.status === 404) {
            toast.error("사용자 정보를 찾을 수 없습니다.");
            navigate("/login");
            return;
          }

          const errorText = await response.text().catch(() => "프로필 정보를 불러오지 못했습니다.");
          throw new Error(errorText);
        }

        const data = await response.json();

        // 명세에 따라 nickname, interests (문자열 배열) 처리
        const nicknameFromServer = data.nickname?.trim()?.length ? data.nickname : username;
        setNickname(nicknameFromServer);
        setInitialNickname(nicknameFromServer);

        // interests는 ["정치", "경제", "IT/과학"] 형식의 문자열 배열
        const interestsFromServer = Array.isArray(data.interests) ? data.interests : [];
        
        // 문자열 배열을 카테고리 ID로 변환
        let categoryIds = categories
          .filter(cat => interestsFromServer.includes(cat.name))
          .map(cat => cat.id);

        if (categoryIds.length === 0) {
          categoryIds = categories.slice(0, 3).map(cat => cat.id);
        }

        const categorySet = new Set(categoryIds);
        setSelectedCategories(categorySet);
        setInitialCategories(categorySet);

        // 최신 정보로 로컬스토리지 동기화
        localStorage.setItem("nickname", nicknameFromServer);
        const interestIdsToPersist = categories
          .filter(cat => categorySet.has(cat.id))
          .map(cat => cat.backendId);
        localStorage.setItem("interests", JSON.stringify(interestIdsToPersist));
      } catch (error) {
        if (error.name === "AbortError") {
          toast.error("프로필 정보를 불러오는데 시간이 너무 오래 걸립니다.");
        } else {
          console.error("프로필 정보 로드 오류:", error);
          toast.error(error.message || "프로필 정보를 불러오지 못했습니다.");

          // 기존 로컬 저장값으로라도 표시
          const savedNickname = localStorage.getItem("nickname") || username;
          const savedInterests = localStorage.getItem("interests");

          setNickname(savedNickname);
          setInitialNickname(savedNickname);

          if (savedInterests) {
            try {
              const interestIds = JSON.parse(savedInterests);
              const fallbackCategoryIds = categories
                .filter(cat => interestIds.includes(cat.backendId))
                .map(cat => cat.id);
              const fallbackCategorySet = new Set(fallbackCategoryIds);
              setSelectedCategories(fallbackCategorySet);
              setInitialCategories(fallbackCategorySet);
            } catch (parseError) {
              console.error("로컬 관심분야 로드 오류:", parseError);
            }
          }
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    loadProfile();

    return () => {
      clearTimeout(timeoutId);
      controller.abort("component unmounted");
    };
  }, [navigate]);

  // 관심분야 토글
  const toggleCategory = (categoryId) => {
    setSelectedCategories(prev => {
      const newSet = new Set(prev);
      if (newSet.has(categoryId)) {
        newSet.delete(categoryId);
      } else {
        newSet.add(categoryId);
      }
      return newSet;
    });
  };

  // 변경사항이 있는지 확인
  const hasChanges = () => {
    // 닉네임이 변경되었는지 확인
    if (nickname !== initialNickname) {
      return true;
    }
    
    // 관심분야가 변경되었는지 확인
    if (selectedCategories.size !== initialCategories.size) {
      return true;
    }
    
    for (const category of selectedCategories) {
      if (!initialCategories.has(category)) {
        return true;
      }
    }
    
    return false;
  };

  // 저장 버튼 활성화 여부 (명세에 따르면 관심분야는 정확히 3개)
  const isValid = 
    nickname.trim().length >= 2 && 
    nickname.trim().length <= 20 && 
    selectedCategories.size === 3 && 
    hasChanges();

  // 저장 처리
  const handleSave = async () => {
    const token = localStorage.getItem("accessToken");
    
    if (!token) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    // 닉네임 검증
    const trimmedNickname = nickname.trim();
    if (trimmedNickname.length < 2 || trimmedNickname.length > 20) {
      toast.error("닉네임은 2~20자 사이여야 합니다.");
      return;
    }
    
    // 관심분야 검증 (명세에 따르면 정확히 3개)
    if (selectedCategories.size !== 3) {
      toast.error("관심분야를 정확히 3개 선택해주세요.");
      return;
    }
    
    // 변경사항 확인
    if (!hasChanges()) {
      toast.error("변경된 내용이 없습니다.");
      return;
    }

    setIsSubmitting(true);

    try {
      // API 명세에 맞게 프로필 수정 API 호출
      const selectedInterestIds = categories
        .filter(cat => selectedCategories.has(cat.id))
        .map(cat => cat.backendId);

      const response = await fetch(`${BACKEND_URL}/api/user/profile`, {
        method: "PUT",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          nickname: trimmedNickname,
          interestIds: selectedInterestIds,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          toast.error("인증이 만료되었습니다. 다시 로그인해주세요.");
          navigate("/login");
          return;
        } else if (response.status === 400) {
          const errorData = await response.json().catch(() => ({ message: "잘못된 요청입니다." }));
          toast.error(errorData.message || "입력 정보를 확인해주세요.");
          return;
        }
        throw new Error("프로필 수정에 실패했습니다.");
      }

      // 성공 응답 처리
      const responseText = await response.text();
      console.log("프로필 수정 성공:", responseText);

      // localStorage 업데이트
      localStorage.setItem("nickname", trimmedNickname);
      localStorage.setItem("interests", JSON.stringify(selectedInterestIds));

      toast.success("프로필이 수정되었습니다!");
      navigate("/mypage");
    } catch (error) {
      console.error("프로필 저장 오류:", error);
      toast.error(error.message || "프로필 저장에 실패했습니다.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 로그인되지 않은 경우 로딩 중 표시
  if (!isLoggedIn) {
    return null;
  }

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header
        left_img={BackIcon}
        text="프로필 수정"
        onClick={() => navigate("/mypage")}
      />

      <main className="flex-grow px-4 py-6 pb-24 space-y-6">
        {/* 이름 수정 섹션 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">✏️</span>
            이름
          </h3>
          <div className="space-y-2">
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="이름을 입력하세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-[#39235C] focus:border-transparent transition-all caret-[#39235C]"
              maxLength={20}
            />
            <p className="text-sm text-gray-500 text-right">{nickname.length}/20</p>
          </div>
        </section>

        {/* 관심분야 수정 섹션 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">📌</span>
            관심분야
          </h3>
          <p className="text-sm text-gray-500 mb-6">
            관심있는 분야를 정확히 3개 선택해주세요
            {selectedCategories.size > 0 && (
              <span className="ml-2 text-[#39235C] font-semibold">
                ({selectedCategories.size}/3)
              </span>
            )}
          </p>
          
          <div className="flex justify-center">
            <div className="grid grid-cols-2 gap-x-0 gap-y-[7px] justify-items-center w-[326px]">
              {categories.map((category) => {
                const isSelected = selectedCategories.has(category.id);
                return (
                  <div key={category.id} className="flex flex-col items-center">
                    <div
                      onClick={() => toggleCategory(category.id)}
                      className={`w-[128px] h-[128px] rounded-[28px] flex items-center justify-center cursor-pointer transition-all duration-200 ${
                        isSelected 
                          ? 'bg-[#F1C40F]' 
                          : 'bg-[#F1F1F1] hover:bg-[#E8E8E8]'
                      }`}
                    >
                      <img
                        src={isSelected ? category.iconO : category.iconX}
                        alt={category.name}
                        className="w-[100px] h-[100px]"
                      />
                    </div>
                    <span className="text-sm font-medium mt-2 text-center">
                      {category.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* 저장 버튼 */}
        <button
          onClick={handleSave}
          disabled={!isValid || isSubmitting}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
            isValid && !isSubmitting
              ? 'bg-[#39235C] hover:bg-[#2d1a47] active:bg-[#401E63]'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isSubmitting ? '저장 중...' : '저장하기'}
        </button>
      </main>

      <Footer />
    </div>
  );
}

