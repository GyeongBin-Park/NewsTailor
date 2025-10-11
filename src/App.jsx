import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import MainPage from "./pages/MainPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import BookmarkPage from "./pages/BookmarkPage";
import Step3Test from "./components/SignUp/Step3Test";
import MyPage from "./pages/MyPage";
import EditProfilePage from "./pages/EditProfilePage";
import ChangePasswordPage from "./pages/ChangePasswordPage";

function App() {
  return (
    <div className="overscroll-none">
      <BrowserRouter>
        <Toaster /> {/* 알림 토스트는 루트에 그대로 둠 */}
        <Routes>
          <Route path="/" element={<MainPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/bookmark" element={<BookmarkPage />} />
          <Route path="/step3-test" element={<Step3Test />} />
          <Route path="/mypage" element={<MyPage />} />
          <Route path="/mypage/edit" element={<EditProfilePage />} />
          <Route path="/mypage/change-password" element={<ChangePasswordPage />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
