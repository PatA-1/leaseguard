import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import api from "../services/api";
import Toast from "../components/Toast";
import useToast from "../hooks/useToast";

function Register() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast, showSuccess, showError, clearToast } = useToast();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post("/auth/register", form);
      showSuccess("Registration successful. Redirecting to sign in...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (error) {
      showError(error.response?.data?.message || "Registration failed");
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-shell">
      <div className="card auth-card">
        <h1 className="auth-title">Create account</h1>
        <p className="auth-subtitle">
          Set up your LeaseGuard account to record and protect inspection evidence.
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
              placeholder="Create a password"
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
            {submitting ? "Creating..." : "Create Account"}
          </button>
        </form>

        <p style={{ marginTop: "18px" }} className="muted">
          Already have an account?{" "}
          <Link to="/login" className="nav-link">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default Register;
