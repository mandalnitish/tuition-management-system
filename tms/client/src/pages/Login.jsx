import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GraduationCap } from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { Field, Input } from "../components/UI";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");

    try {
      await login(username, password, remember);
      navigate("/");
    } catch (err) {
      setError(
        err.response?.data?.message ||
        "Could not sign in. Please try again."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="tms-login-wrap">
      <form className="tms-login-card" onSubmit={submit}>
        <div className="tms-login-brand">
          <div className="tms-login-mark">
            <GraduationCap size={26} />
          </div>

          <div>
            <div className="tms-login-inst">
              Tuition Management System
            </div>
            <div className="tms-login-sub">
              Admin Login
            </div>
          </div>
        </div>

        <Field label="Username" required>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            autoComplete="username"
            autoFocus
          />
        </Field>

        <Field label="Password" required>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoComplete="current-password"
          />
        </Field>

        {error && <div className="tms-error">{error}</div>}

        <label className="tms-checkline">
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
          />
          Remember me
        </label>

        <button
          className="tms-btn-primary tms-block"
          type="submit"
          disabled={busy}
        >
          {busy ? "Signing in..." : "Sign in"}
        </button>
      </form>
    </div>
  );
}