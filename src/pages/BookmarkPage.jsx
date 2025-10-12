import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/Header";
import Article from "../components/Article";
import Footer from "../components/Footer";
import BackIcon from "../icons/back.svg";

export default function BookmarkPage() {
  const navigate = useNavigate();
  const [bookmarks, setBookmarks] = useState([]);

  const userId = localStorage.getItem("username");
  const BOOKMARK_KEY = `bookmarked_articles_${userId}`;

  useEffect(() => {
    if (!userId) {
      alert("로그인이 필요한 서비스입니다.");
      navigate("/login");
      return;
    }

    const loadBookmarks = () => {
      const savedBookmarks =
        JSON.parse(localStorage.getItem(BOOKMARK_KEY)) || [];
      setBookmarks(savedBookmarks);
    };
    loadBookmarks();

    window.addEventListener("focus", loadBookmarks);
    return () => {
      window.removeEventListener("focus", loadBookmarks);
    };
  }, [userId, navigate, BOOKMARK_KEY]);

  const handleToggleBookmark = (article) => {
    const newBookmarks = bookmarks.filter((b) => b.id !== article.id);
    setBookmarks(newBookmarks);
    localStorage.setItem(BOOKMARK_KEY, JSON.stringify(newBookmarks));
  };

  if (!userId) {
    return null;
  }

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
