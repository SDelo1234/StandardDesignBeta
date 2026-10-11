import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LOGO = "https://browne.co.uk/wp-content/themes/browne/images/logo_footer.jpg";

const Header = () => {
  const { isAuthenticated, isAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const showBackToTools = isAuthenticated && location.pathname.startsWith("/tools/") && location.pathname !== "/tools";
  const onAdminPage = location.pathname === "/admin";

  return (
    <div className="sticky top-0 z-40 mb-6 w-full border-b bg-white/95 px-4 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2">
        <div className="shrink-0 text-sm font-semibold" style={{ color: "#003A5D" }}>
          MWP Engineering
        </div>
        <div className="flex min-w-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
          {showBackToTools && (
            <button
              type="button"
              onClick={() => navigate("/tools")}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs shadow-sm hover:bg-gray-50"
            >
              <span aria-hidden>←</span> <span className="hidden sm:inline">Back to tools</span><span className="sm:hidden">Tools</span>
            </button>
          )}
          {onAdminPage && (
            <button
              type="button"
              onClick={() => navigate("/tools")}
              className="inline-flex items-center gap-1 whitespace-nowrap rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs shadow-sm hover:bg-gray-50"
            >
              <span aria-hidden>←</span> <span className="hidden sm:inline">Back to tools</span><span className="sm:hidden">Tools</span>
            </button>
          )}
          {isAuthenticated && isAdmin && !onAdminPage && (
            <button
              type="button"
              onClick={() => navigate("/admin")}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs shadow-sm hover:bg-gray-50"
            >
              Admin
            </button>
          )}
          {isAuthenticated && (
            <button
              onClick={handleLogout}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1 text-xs shadow-sm hover:bg-gray-50"
            >
              Logout
            </button>
          )}
          <img src={LOGO} alt="Browne" className="h-10 w-auto max-w-[96px] object-contain sm:h-16 sm:max-w-none" />
        </div>
      </div>
    </div>
  );
};

export default Header;
