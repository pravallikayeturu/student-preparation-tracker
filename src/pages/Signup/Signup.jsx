import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Signup.css";

function Signup() {

  const navigate = useNavigate();

  // =========================
  // SIGNUP FIELDS
  // =========================

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // =========================
  // PASSWORD VISIBILITY
  // =========================

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  // =========================
  // OTP
  // =========================

  const [otp, setOtp] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);

  // =========================
  // MESSAGES
  // =========================

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  // =====================================================
  // OTP TIMER
  // =====================================================

  useEffect(() => {

    if (!showOtp || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {
      setTimeLeft((previousTime) => previousTime - 1);
    }, 1000);

    return () => clearInterval(timer);

  }, [showOtp, timeLeft]);

  // =====================================================
  // FORMAT TIMER
  // =====================================================

  const formatTime = () => {

    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;

    return `${minutes}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // =====================================================
  // CREATE ACCOUNT
  // =====================================================

  const handleCreateAccount = async (event) => {

    event.preventDefault();

    setError("");
    setMessage("");

    // NAME

    if (!name.trim()) {
      setError("Full Name is required.");
      return;
    }

    // EMAIL

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    // PASSWORD

    if (!password) {
      setError("Password is required.");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    // CONFIRM PASSWORD

    if (!confirmPassword) {
      setError("Confirm Password is required.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    // =====================================================
    // SEND OTP
    // =====================================================

    try {

      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/auth/send-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.text();

      if (!response.ok) {
        throw new Error(
          data || "Unable to send OTP."
        );
      }

      // Show OTP screen
      setShowOtp(true);

      // Start 5-minute timer
      setTimeLeft(300);

      setMessage(
        "OTP has been sent to your email."
      );

    } catch (error) {

      setError(
        error.message ||
        "Something went wrong. Please try again."
      );

    } finally {

      setLoading(false);

    }
  };

  // =====================================================
  // VERIFY OTP
  // =====================================================

  const handleVerifyOtp = async (event) => {

    event.preventDefault();

    setError("");
    setMessage("");

    if (!otp.trim()) {
      setError("Please enter the OTP.");
      return;
    }

    if (otp.length !== 6) {
      setError("OTP must contain 6 digits.");
      return;
    }

    if (timeLeft <= 0) {
      setError(
        "OTP has expired. Please resend the OTP."
      );
      return;
    }

    // =====================================================
    // SIGNUP WITH OTP
    // =====================================================

    try {

      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/auth/signup",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            name: name.trim(),
            email: email.trim(),
            password: password,
            otp: otp.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message ||
          "Invalid or expired OTP."
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      setMessage(
        "Signup successful! Redirecting to login..."
      );

      setTimeout(() => {
        navigate("/login");
      }, 1500);

    } catch (error) {

      setError(
        error.message ||
        "Invalid or expired OTP."
      );

    } finally {

      setLoading(false);

    }
  };

  // =====================================================
  // RESEND OTP
  // =====================================================

  const handleResendOtp = async () => {

    setError("");
    setMessage("");

    try {

      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/auth/send-otp",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
            email: email.trim(),
          }),
        }
      );

      const data = await response.text();

      if (!response.ok) {
        throw new Error(
          data || "Unable to resend OTP."
        );
      }

      // Clear old OTP
      setOtp("");

      // Reset timer to 5 minutes
      setTimeLeft(300);

      setMessage(
        "A new OTP has been sent."
      );

    } catch (error) {

      setError(
        error.message ||
        "Unable to resend OTP."
      );

    } finally {

      setLoading(false);

    }
  };

  // =====================================================
  // OTP SCREEN
  // =====================================================

  if (showOtp) {

    return (

      <div className="signup-page">

        {/* LEFT */}

        <div className="signup-left">

          <div className="signup-brand">
            Student Preparation Tracker
          </div>

          <div className="signup-intro">

            <h1>
              Verify Your
              <br />
              <span>Email Address.</span>
            </h1>

            <p>
              We've sent a verification code
              to your email. Verify your email
              to complete your registration.
            </p>

          </div>

        </div>

        {/* RIGHT */}

        <div className="signup-right">

          <div className="signup-card">

            <h2>
              Verify Your Email
            </h2>

            <p className="signup-subtitle">

              Enter the 6-digit OTP sent to

              <br />

              <strong>
                {email}
              </strong>

            </p>

            {/* ERROR */}

            {error && (
              <div className="error-message">
                {error}
              </div>
            )}

            {/* SUCCESS */}

            {message && (
              <div className="success-message">
                {message}
              </div>
            )}

            {/* OTP FORM */}

            <form onSubmit={handleVerifyOtp}>

              <div className="input-group">

                <label>
                  Enter OTP
                </label>

                <input
                  type="text"
                  className="otp-input"
                  inputMode="numeric"
                  maxLength="6"
                  value={otp}
                  onChange={(event) => {

                    const value =
                      event.target.value.replace(
                        /\D/g,
                        ""
                      );

                    setOtp(value);

                  }}
                  placeholder="Enter 6-digit OTP"
                />

              </div>

              {/* TIMER */}

              <div className="otp-timer">

                {timeLeft > 0 ? (
                  <>
                    OTP expires in{" "}
                    <strong>
                      {formatTime()}
                    </strong>
                  </>
                ) : (
                  <span>
                    OTP expired
                  </span>
                )}

              </div>

              {/* VERIFY */}

              <button
                type="submit"
                className="signup-submit"
                disabled={
                  loading ||
                  timeLeft === 0
                }
              >

                {loading
                  ? "Verifying..."
                  : "Verify & Create Account"}

              </button>

            </form>

            {/* RESEND */}

            <div className="resend-container">

              <span>
                Didn't receive the OTP?
              </span>

              <button
                type="button"
                className="resend-btn"
                onClick={handleResendOtp}
                disabled={loading}
              >
                Resend OTP
              </button>

            </div>

            {/* BACK */}

            <button
              type="button"
              className="back-signup"
              onClick={() => {

                setShowOtp(false);
                setOtp("");
                setError("");
                setMessage("");

              }}
            >
              ← Back to Signup
            </button>

          </div>

        </div>

      </div>

    );
  }

  // =====================================================
  // NORMAL SIGNUP SCREEN
  // =====================================================

  return (

    <div className="signup-page">

      {/* LEFT SECTION */}

      <div className="signup-left">

        <div className="signup-brand">
          Student Preparation Tracker
        </div>

        <div className="signup-intro">

          <h1>
            Start Your
            <br />
            <span>Preparation Journey.</span>
          </h1>

          <p>
            Create your account and organize
            your studies, track your progress,
            and build better preparation habits.
          </p>

          {/* FEATURES */}

          <div className="signup-features">

            <div>
              <span>📚</span>
              <p>Plan your studies</p>
            </div>

            <div>
              <span>📅</span>
              <p>Manage your schedule</p>
            </div>

            <div>
              <span>📈</span>
              <p>Track your progress</p>
            </div>

          </div>

        </div>

      </div>

      {/* RIGHT SECTION */}

      <div className="signup-right">

        <div className="signup-card">

          <h2>
            Create Your Account
          </h2>

          <p className="signup-subtitle">
            Join Student Preparation Tracker
          </p>

          {/* ERROR */}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {/* NAME */}

          <div className="input-group">

            <label>
              Full Name
            </label>

            <input
              type="text"
              value={name}
              onChange={(event) =>
                setName(event.target.value)
              }
              placeholder="Enter your full name"
            />

          </div>

          {/* EMAIL */}

          <div className="input-group">

            <label>
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="Enter your email"
            />

          </div>

          {/* PASSWORD */}

          <div className="input-group">

            <label>
              Password
            </label>

            <div className="password-wrapper">

              <input
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Create a password"
              />

              {/* FONT AWESOME EYE */}

              <button
                type="button"
                className="password-eye"
                onClick={() =>
                  setShowPassword(!showPassword)
                }
                aria-label={
                  showPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                <i
                  className={
                    showPassword
                      ? "fa-solid fa-eye-slash"
                      : "fa-solid fa-eye"
                  }
                ></i>

              </button>

            </div>

          </div>

          {/* CONFIRM PASSWORD */}

          <div className="input-group">

            <label>
              Confirm Password
            </label>

            <div className="password-wrapper">

              <input
                type={
                  showConfirmPassword
                    ? "text"
                    : "password"
                }
                value={confirmPassword}
                onChange={(event) =>
                  setConfirmPassword(
                    event.target.value
                  )
                }
                placeholder="Confirm your password"
              />

              {/* FONT AWESOME EYE */}

              <button
                type="button"
                className="password-eye"
                onClick={() =>
                  setShowConfirmPassword(
                    !showConfirmPassword
                  )
                }
                aria-label={
                  showConfirmPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                <i
                  className={
                    showConfirmPassword
                      ? "fa-solid fa-eye-slash"
                      : "fa-solid fa-eye"
                  }
                ></i>

              </button>

            </div>

          </div>

          {/* CREATE ACCOUNT */}

          <button
            type="button"
            className="signup-submit"
            onClick={handleCreateAccount}
            disabled={loading}
          >

            {loading
              ? "Sending OTP..."
              : "Create Account"}

          </button>

          {/* LOGIN */}

          <p className="login-text">

            Already have an account?

            <Link to="/login">
              Login
            </Link>

          </p>

          {/* BACK HOME */}

          <Link
            to="/"
            className="back-home"
          >
            ← Back to Home
          </Link>

        </div>

      </div>

    </div>

  );
}

export default Signup;