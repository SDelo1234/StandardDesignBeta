import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Login from "../components/Login";
import { useAuth } from "../context/AuthContext";

const LoginPage = () => {
  const { isAuthenticated, login } = useAuth();
  const navigate = useNavigate();
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/tools", { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = (event) => {
    event.preventDefault();
    const result = login(pin);
    if (result.success) {
      setError("");
      navigate("/tools", { replace: true });
    } else {
      setError(result.error || "Unable to login.");
    }
  };

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md items-center justify-center p-6">
      <Login pin={pin} error={error} onChange={setPin} onSubmit={handleSubmit} />
    </div>
  );
};

export default LoginPage;
