import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./Login.css";
function Login() {

  const navigate = useNavigate();

  // =========================
  // LOGIN FIELDS
  // =========================

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // =========================
  // PASSWORD VISIBILITY
  // =========================

  const [showPassword, setShowPassword] = useState(false);

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
  // SEND OTP
  // =====================================================

  const handleLogin = async (event) => {

    event.preventDefault();

    setError("");
    setMessage("");

    // =========================
    // VALIDATION
    // =========================

    if (!email.trim()) {
      setError("Email is required.");
      return;
    }

    if (!password) {
      setError("Password is required.");
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

      // =========================
      // SHOW OTP SCREEN
      // =========================

      setShowOtp(true);

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
  // VERIFY OTP + LOGIN
  // =====================================================

  const handleVerifyOtp = async (event) => {

    event.preventDefault();

    setError("");
    setMessage("");

    // =========================
    // OTP VALIDATION
    // =========================

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
    // LOGIN WITH OTP
    // =====================================================

    try {

      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/auth/login",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({
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
          "Invalid email, password, or OTP."
        );
      }

      // =====================================================
      // SAVE JWT
      // =====================================================

      if (!data.token) {
        throw new Error(
          "Login successful, but JWT token was not received."
        );
      }

      localStorage.setItem(
        "token",
        data.token
      );

      // =========================
      // SAVE EMAIL
      // =========================

      if (data.email) {
        localStorage.setItem(
          "email",
          data.email
        );
      }

      // =========================
      // SAVE NAME
      // =========================

      if (data.name) {
        localStorage.setItem(
          "name",
          data.name
        );
      }

      // =====================================================
      // SUCCESS
      // =====================================================

      setMessage(
        "Login successful! Redirecting..."
      );

      setTimeout(() => {
        navigate("/Homepage");
      }, 1000);

    } catch (error) {

      setError(
        error.message ||
        "Invalid email, password, or OTP."
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
        "http://localhost:8080/api/auth/send-login-otp",
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

      setOtp("");

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

      <div className="login-page">

        {/* ================= LEFT ================= */}

        <div className="login-left">

          <div className="login-brand">
            Student Preparation Tracker
          </div>

          <div className="login-intro">

            <h1>
              Verify Your
              <br />
              <span>
                Email Address.
              </span>
            </h1>

            <p>
              We've sent a verification code
              to your email. Verify your email
              to continue your login.
            </p>

          </div>

        </div>


        {/* ================= RIGHT ================= */}

        <div className="login-right">

          <div className="login-card">

            <h2>
              Verify Your Email
            </h2>

            <p className="login-subtitle">

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
                className="login-submit"
                disabled={
                  loading ||
                  timeLeft === 0
                }
              >

                {loading
                  ? "Logging in..."
                  : "Verify & Login"}

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
              className="back-login"
              onClick={() => {

                setShowOtp(false);
                setOtp("");
                setError("");
                setMessage("");

              }}
            >
              ← Back to Login
            </button>

          </div>

        </div>

      </div>

    );

  }


  // =====================================================
  // NORMAL LOGIN SCREEN
  // =====================================================

  return (

    <div className="login-page">

      {/* ================= LEFT SECTION ================= */}

      <div className="login-left">

        <div className="login-brand">
          Student Preparation Tracker
        </div>

        <div className="login-intro">

          <h1>

            Welcome

            <br />

            <span>
              Back.
            </span>

          </h1>

          <p>

            Continue your preparation journey,
            manage your studies, and track your
            progress in one place.

          </p>


          <div className="login-features">

            <div>

              <span>
                📚
              </span>

              <p>
                Plan your studies
              </p>

            </div>


            <div>

              <span>
                📅
              </span>

              <p>
                Manage your schedule
              </p>

            </div>


            <div>

              <span>
                📈
              </span>

              <p>
                Track your progress
              </p>

            </div>

          </div>

        </div>

      </div>


      {/* ================= RIGHT SECTION ================= */}

      <div className="login-right">

        <div className="login-card">

          <h2>
            Welcome Back
          </h2>

          <p className="login-subtitle">

            Login to your Student Preparation Tracker

          </p>


          {/* ERROR */}

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}


          {/* ================= LOGIN FORM ================= */}

          <form onSubmit={handleLogin}>

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
                  placeholder="Enter your password"
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
                        ? "fa fa-eye-slash"
                        : "fa fa-eye"
                    }
                  ></i>

                </button>

              </div>

            </div>


            {/* LOGIN BUTTON */}

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >

              {loading
                ? "Sending OTP..."
                : "Login"}

            </button>

          </form>


          {/* =========================
              FORGOT PASSWORD + BACK HOME
          ========================= */}

          <div className="login-bottom-links">

            <Link
              to="/forgot-password"
              className="forgot-password"
            >
              Forgot Password?
            </Link>

            <Link
              to="/"
              className="back-home"
            >
              ← Back to Home
            </Link>

          </div>


          {/* SIGNUP */}

          <p className="signup-text">

            Don't have an account?

            <Link to="/signup">
              Create Account
            </Link>

          </p>

        </div>

      </div>

    </div>

  );

}

export default Login;