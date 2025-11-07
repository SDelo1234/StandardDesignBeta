import React from "react";

const Login = ({ pin, onChange, onSubmit, error }) => (
  <form onSubmit={onSubmit} className="w-full rounded-2xl bg-white p-6 shadow-sm">
    <h1 className="mb-2 text-xl font-semibold">Browne access</h1>
    <p className="mb-4 text-sm text-gray-600">
      Enter PIN to continue. Demo PIN: <span className="font-mono">1234</span>.
    </p>
    <label className="mb-1 block text-sm font-medium">PIN</label>
    <input
      type="password"
      inputMode="numeric"
      autoComplete="one-time-code"
      maxLength={6}
      placeholder="••••"
      className={`mb-2 w-full rounded-xl border p-2.5 tracking-widest focus:outline-none focus:ring ${
        error ? "border-red-500" : "border-gray-300"
      }`}
      value={pin}
      onChange={(e) => onChange(e.target.value)}
    />
    {error && <p className="mb-2 text-xs text-red-600">{error}</p>}
    <button
      type="submit"
      className="mt-2 w-full rounded-xl px-4 py-2 shadow-sm"
      style={{ background: "#003A5D", color: "#fff" }}
    >
      Enter
    </button>
  </form>
);

export default Login;
