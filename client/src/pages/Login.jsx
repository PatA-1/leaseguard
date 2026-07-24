import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast, showError, clearToast } = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const response = await api.post("/auth/login", form);
      localStorage.setItem("token", response.data.token);
      localStorage.setItem("user", JSON.stringify(response.data.user));
      navigate("/dashboard");
    } catch (error) {
      showError(error.response?.data?.message || "Login failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h1 className="auth-title">Welcome back</h1>
        <p className="auth-subtitle">
          Sign in to continue managing property inspections in LeaseGuard.
        </p>

        <Toast message={toast.message} type={toast.type} onClose={clearToast} />

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="label">Email address</label>
            <input
              className="input"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label className="label">Password</label>
            <input
              className="input"
              name="password"
              type="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>

          <button
            className="btn btn-primary"
            type="submit"
            style={{ width: "100%" }}
            disabled={submitting}
          >
            {submitting ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p style={{ marginTop: "18px" }} className="muted">
          No account?{" "}
          <Link to="/register" className="nav-link">
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Login;
