import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import "./ForgotPassword.css";

function ForgotPassword() {

  // =========================
  // FIELDS
  // =========================

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // =========================
  // SCREEN
  // =========================

  const [step, setStep] = useState(1);

  // =========================
  // PASSWORD VISIBILITY
  // =========================

  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // =========================
  // OTP TIMER
  // =========================

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

    if (step !== 2 || timeLeft <= 0) {
      return;
    }

    const timer = setInterval(() => {

      setTimeLeft((previousTime) => {

        if (previousTime <= 1) {
          clearInterval(timer);
          return 0;
        }

        return previousTime - 1;

      });

    }, 1000);

    return () => clearInterval(timer);

  }, [step, timeLeft]);


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

  const handleSendOtp = async (event) => {

    event.preventDefault();

    setError("");
    setMessage("");

    if (!email.trim()) {

      setError("Email is required.");

      return;

    }

    try {

      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/auth/forgot-password",
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

      // Move to OTP screen
      setStep(2);

      setTimeLeft(300);

      setOtp("");

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
  // CONTINUE AFTER OTP
  // =====================================================

  const handleVerifyOtp = (event) => {

    event.preventDefault();

    setError("");
    setMessage("");

    if (!otp.trim()) {

      setError("Please enter the OTP.");

      return;

    }

    if (!/^\d{6}$/.test(otp)) {

      setError("OTP must contain exactly 6 digits.");

      return;

    }

    if (timeLeft <= 0) {

      setError(
        "OTP has expired. Please resend the OTP."
      );

      return;

    }

    /*
      We don't call the backend here.

      The OTP will be verified by the backend
      inside /reset-password.
    */

    setStep(3);

    setMessage(
      "OTP entered successfully. Create your new password."
    );

  };


  // =====================================================
  // RESET PASSWORD
  // =====================================================

  const handleResetPassword = async (event) => {

    event.preventDefault();

    setError("");
    setMessage("");

    // =========================
    // VALIDATION
    // =========================

    if (!otp.trim()) {

      setError("OTP is required.");

      setStep(2);

      return;

    }

    if (timeLeft <= 0) {

      setError(
        "OTP has expired. Please request a new OTP."
      );

      setStep(2);

      return;

    }

    if (!newPassword) {

      setError("New password is required.");

      return;

    }

    if (newPassword.length < 6) {

      setError(
        "Password must contain at least 6 characters."
      );

      return;

    }

    if (!confirmPassword) {

      setError(
        "Please confirm your password."
      );

      return;

    }

    if (newPassword !== confirmPassword) {

      setError(
        "Passwords do not match."
      );

      return;

    }


    // =====================================================
    // RESET PASSWORD API
    // =====================================================

    try {

      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/auth/reset-password",
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
          },

          body: JSON.stringify({

            email: email.trim(),

            otp: otp.trim(),

            newPassword: newPassword,

          }),
        }
      );

      const data = await response.text();

      if (!response.ok) {

        throw new Error(
          data || "Unable to reset password."
        );

      }


      // =========================
      // SUCCESS
      // =========================

      setMessage(
        "Password reset successfully! You can now login."
      );

      setTimeout(() => {

        window.location.href = "/login";

      }, 1500);

    } catch (error) {

      setError(
        error.message ||
        "Unable to reset password."
      );

    } finally {

      setLoading(false);

    }

  };


  // =====================================================
  // RESEND OTP
  // =====================================================

  const handleResendOtp = async () => {

    if (!email.trim()) {

      setError("Email is required.");

      return;

    }

    setError("");
    setMessage("");

    try {

      setLoading(true);

      const response = await fetch(
        "http://localhost:8080/api/auth/forgot-password",
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

      // IMPORTANT:
      // Old OTP is now invalid.
      // User must enter the newest OTP.

      setOtp("");

      setTimeLeft(300);

      setMessage(
        "A new OTP has been sent. Please use the latest OTP."
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
  // STEP 1
  // ENTER EMAIL
  // =====================================================

  if (step === 1) {

    return (

      <div className="forgot-page">

        <div className="forgot-card">

          <h2>
            Forgot Password?
          </h2>

          <p className="forgot-subtitle">
            Enter your registered email address
            to reset your password.
          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <form onSubmit={handleSendOtp}>

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

            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >

              {loading
                ? "Sending OTP..."
                : "Send OTP"}

            </button>

          </form>

          <Link
            to="/login"
            className="back-login"
          >
            ← Back to Login
          </Link>

        </div>

      </div>

    );

  }


  // =====================================================
  // STEP 2
  // ENTER OTP
  // =====================================================

  if (step === 2) {

    return (

      <div className="forgot-page">

        <div className="forgot-card">

          <h2>
            Verify OTP
          </h2>

          <p className="forgot-subtitle">

            Enter the 6-digit OTP sent to

            <br />

            <strong>
              {email}
            </strong>

          </p>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          {message && (
            <div className="success-message">
              {message}
            </div>
          )}

          <form onSubmit={handleVerifyOtp}>

            <div className="input-group">

              <label>
                Enter OTP
              </label>

              <input
                type="text"
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

            <button
              type="submit"
              className="login-submit"
              disabled={
                loading ||
                timeLeft === 0
              }
            >

              Continue

            </button>

          </form>

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

          <button
            type="button"
            className="back-login"
            onClick={() => {

              setStep(1);

              setOtp("");

              setError("");

              setMessage("");

            }}
          >
            ← Change Email
          </button>

        </div>

      </div>

    );

  }


  // =====================================================
  // STEP 3
  // CREATE NEW PASSWORD
  // =====================================================

  return (

    <div className="forgot-page">

      <div className="forgot-card">

        <h2>
          Create New Password
        </h2>

        <p className="forgot-subtitle">

          Create a new password for

          <br />

          <strong>
            {email}
          </strong>

        </p>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {message && (
          <div className="success-message">
            {message}
          </div>
        )}

        <form onSubmit={handleResetPassword}>

          <div className="input-group">

            <label>
              New Password
            </label>

            <div className="password-wrapper">

              <input
                type={
                  showNewPassword
                    ? "text"
                    : "password"
                }
                value={newPassword}
                onChange={(event) =>
                  setNewPassword(event.target.value)
                }
                placeholder="Enter new password"
              />

              <button
                type="button"
                className="password-eye"
                onClick={() =>
                  setShowNewPassword(
                    !showNewPassword
                  )
                }
                aria-label={
                  showNewPassword
                    ? "Hide password"
                    : "Show password"
                }
              >

                <i
                  className={
                    showNewPassword
                      ? "fa fa-eye-slash"
                      : "fa fa-eye"
                  }
                ></i>

              </button>

            </div>

          </div>

          <div className="input-group">

            <label>
              Confirm New Password
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
                placeholder="Confirm new password"
              />

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
                      ? "fa fa-eye-slash"
                      : "fa fa-eye"
                  }
                ></i>

              </button>

            </div>

          </div>

          <button
            type="submit"
            className="login-submit"
            disabled={loading}
          >

            {loading
              ? "Resetting Password..."
              : "Reset Password"}

          </button>

        </form>

        <Link
          to="/login"
          className="back-login"
        >
          ← Back to Login
        </Link>

      </div>

    </div>

  );

}

export default ForgotPassword;