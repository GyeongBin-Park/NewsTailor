import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Header from "../components/Header";
import Footer from "../components/Footer";
import BackIcon from "../icons/back.svg";

export default function ChangePasswordPage() {
  const navigate = useNavigate();

  // 로그인 상태 확인
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 비밀번호 유효성 검사
  const [passwordError, setPasswordError] = useState("");
  const [confirmError, setConfirmError] = useState("");

  // 로그인 상태 확인
  useEffect(() => {
    const token = localStorage.getItem("accessToken");
    const username = localStorage.getItem("username");

    if (!token || !username) {
      toast.error("로그인이 필요합니다.");
      navigate("/login");
      return;
    }

    setIsLoggedIn(true);
  }, [navigate]);

  // 새 비밀번호 유효성 검사
  useEffect(() => {
    if (newPassword.length === 0) {
      setPasswordError("");
      return;
    }

    const passwordRegex =
      /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{8,}$/;

    if (!passwordRegex.test(newPassword)) {
      setPasswordError("영문, 숫자, 특수문자를 포함한 8자 이상이어야 합니다.");
    } else {
      setPasswordError("");
    }
  }, [newPassword]);

  // 비밀번호 확인 검사
  useEffect(() => {
    if (confirmPassword.length === 0) {
      setConfirmError("");
      return;
    }

    if (newPassword !== confirmPassword) {
      setConfirmError("비밀번호가 일치하지 않습니다.");
    } else {
      setConfirmError("");
    }
  }, [newPassword, confirmPassword]);

  // 저장 버튼 활성화 여부
  const isValid =
    currentPassword.length > 0 &&
    newPassword.length > 0 &&
    confirmPassword.length > 0 &&
    passwordError === "" &&
    confirmError === "";

  // 비밀번호 변경 처리
  const handleChangePassword = async () => {
    if (!isValid) {
      return;
    }

    setIsSubmitting(true);

    try {
      const BACKEND = import.meta.env.VITE_BACKEND_URL;
      const token = localStorage.getItem("accessToken");

      const response = await fetch(`${BACKEND}/api/change-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (response.ok) {
        toast.success("비밀번호가 변경되었습니다!");
        navigate("/mypage");
      } else {
        const errorData = await response.json().catch(() => ({}));
        toast.error(errorData.message || "비밀번호 변경에 실패했습니다.");
      }
    } catch (error) {
      console.error("비밀번호 변경 오류:", error);
      toast.error("서버 오류가 발생했습니다.");
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
        text="비밀번호 변경"
        onClick={() => navigate("/mypage")}
      />

      <main className="flex-grow px-4 py-6 pb-[120px] space-y-6">
        {/* 현재 비밀번호 입력 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🔒</span>
            현재 비밀번호
          </h3>
          <div className="space-y-2">
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              placeholder="현재 비밀번호를 입력하세요"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-[#39235C] focus:border-transparent transition-all caret-[#39235C]"
            />
          </div>
        </section>

        {/* 새 비밀번호 입력 */}
        <section className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <span className="text-xl">🔑</span>새 비밀번호
          </h3>
          <div className="space-y-4">
            <div>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="새 비밀번호를 입력하세요"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-[#39235C] focus:border-transparent transition-all caret-[#39235C]"
              />
              {passwordError && (
                <p className="text-[#FF2655] text-sm mt-2">{passwordError}</p>
              )}
            </div>
            <div>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="새 비밀번호를 다시 입력하세요"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 bg-white text-gray-900 focus:ring-2 focus:ring-[#39235C] focus:border-transparent transition-all caret-[#39235C]"
              />
              {confirmError && (
                <p className="text-[#FF2655] text-sm mt-2">{confirmError}</p>
              )}
            </div>
          </div>
        </section>

        {/* 비밀번호 요구사항 안내 */}
        <section className="bg-blue-50 rounded-2xl p-4">
          <p className="text-sm text-gray-700">
            <strong>비밀번호 요구사항:</strong>
          </p>
          <ul className="text-sm text-gray-600 mt-2 space-y-1 list-disc list-inside">
            <li>영문, 숫자, 특수문자 포함</li>
            <li>8자 이상</li>
          </ul>
        </section>
      </main>

      {/* 변경 버튼 - 고정 위치 */}
      <div
        className="fixed bottom-[72px] left-0 right-0 px-4 pb-4"
        style={{ backgroundColor: "#f9fafb" }}
      >
        <button
          onClick={handleChangePassword}
          disabled={!isValid || isSubmitting}
          className={`w-full py-4 rounded-xl font-semibold text-white transition-all ${
            isValid && !isSubmitting
              ? "bg-[#39235C] hover:bg-[#2d1a47] active:bg-[#401E63]"
              : "bg-gray-300 cursor-not-allowed"
          }`}
        >
          {isSubmitting ? "변경 중..." : "비밀번호 변경"}
        </button>
      </div>

      <Footer />
    </div>
  );
}
