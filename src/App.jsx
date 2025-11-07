import React from "react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router-dom";
import Header from "./components/Header";
import { AuthProvider, useAuth } from "./context/AuthContext";
import FencesPage from "./pages/FencesPage";
import LoginPage from "./pages/LoginPage";
import ShaftsPage from "./pages/ShaftsPage";
import ToolsPage from "./pages/ToolsPage";

const RequireAuth = () => {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
};

const AppRoutes = () => {
  const { isAuthenticated } = useAuth();

  return (
    <>
      <Header />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<RequireAuth />}>
          <Route path="/tools" element={<ToolsPage />} />
          <Route path="/tools/fences" element={<FencesPage />} />
          <Route path="/tools/shafts" element={<ShaftsPage />} />
        </Route>
        <Route
          path="*"
          element={<Navigate to={isAuthenticated ? "/tools" : "/login"} replace />}
        />
      </Routes>
    </>
  );
};

const App = () => (
  <AuthProvider>
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </AuthProvider>
);

export default App;
