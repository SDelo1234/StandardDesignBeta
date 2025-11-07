import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const LOGO = "https://browne.co.uk/wp-content/themes/browne/images/logo_footer.jpg";

const Header = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const showBackToTools = isAuthenticated && location.pathname.startsWith("/tools/") && location.pathname !== "/tools";

  return (
    <div className="sticky top-0 z-40 mb-6 w-full border-b bg-white/95 px-4 py-2 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between">
        <div className="text-sm font-semibold" style={{ color: "#003A5D" }}>
          MWP Engineering
        </div>
        <div className="flex items-center gap-3">
          {showBackToTools && (
            <button
              type="button"
              onClick={() => navigate("/tools")}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-3 py-1.5 text-xs shadow-sm hover:bg-gray-50"
            >
              <span aria-hidden>←</span> Back to tools
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
          <img src={LOGO} alt="Browne" className="h-16 w-auto" />
        </div>
      </div>
    </div>
  );
};

export default Header;
