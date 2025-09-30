import React from "react";
import { Link, useLocation } from "react-router-dom";

import HomeIcon from "../icons/home_x.svg";
import HomeFilledIcon from "../icons/home_o.svg";
import BookmarkIcon from "../icons/bookmark_x.svg";
import BookmarkFilledIcon from "../icons/bookmark_o.svg";
import SearchIcon from "../icons/search_x.svg";
import SearchFilledIcon from "../icons/search_o.svg";
import UserIcon from "../icons/user_x.svg";
import UserFilledIcon from "../icons/user_o.svg";

const NavItem = ({ to, activeIcon, inactiveIcon, alt }) => {
  const location = useLocation();
  const isActive = location.pathname === to;
  return (
    <Link to={to}>
      <img
        src={isActive ? activeIcon : inactiveIcon}
        alt={alt}
        className="w-6 h-6"
      />
    </Link>
  );
};

export default function Footer() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white flex justify-around items-center h-16 border-t border-[#E6E6E6]">
      <NavItem
        to="/"
        activeIcon={HomeFilledIcon}
        inactiveIcon={HomeIcon}
        alt="home"
      />
      <NavItem
        to="/bookmark"
        activeIcon={BookmarkFilledIcon}
        inactiveIcon={BookmarkIcon}
        alt="bookmark"
      />
      <NavItem
        to="/search"
        activeIcon={SearchFilledIcon}
        inactiveIcon={SearchIcon}
        alt="search"
      />
      <NavItem
        to="/mypage"
        activeIcon={UserFilledIcon}
        inactiveIcon={UserIcon}
        alt="user"
      />
    </nav>
  );
}
