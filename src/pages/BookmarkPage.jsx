import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Article from "../components/Article";
import Footer from "../components/Footer";
import BackIcon from "../icons/back.svg";

export default function BookmarkPage() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);

  useEffect(() => {
    const loadBookmarks = () => {
      const savedBookmarks =
        JSON.parse(localStorage.getItem("bookmarked_articles")) || [];
      setBookmarks(savedBookmarks);
    };
    loadBookmarks();

    // 페이지 이동하고 돌아왔을 때 목록 새로고침
    window.addEventListener("focus", loadBookmarks);
    return () => {
      window.removeEventListener("focus", loadBookmarks);
    };
  }, []);

  const handleToggleBookmark = (article) => {
    const newBookmarks = bookmarks.filter((b) => b.id !== article.id);
    setBookmarks(newBookmarks);
    localStorage.setItem("bookmarked_articles", JSON.stringify(newBookmarks));
  };

  return (
    <div className="flex flex-col min-h-screen bg-white pb-20">
      <Header left_img={BackIcon} text="북마크" onClick={() => navigate(-1)} />
      <main className="flex-grow p-4 space-y-4">
        {bookmarks.length > 0 ? (
          bookmarks.map((a) => (
            <Article
              key={a.id}
              article={a}
              isBookmarked={true}
              onToggleBookmark={handleToggleBookmark}
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
