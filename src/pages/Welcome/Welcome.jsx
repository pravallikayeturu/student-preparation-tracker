import { Link } from "react-router-dom";
import "./Welcome.css";

function Welcome() {
  return (
    <div className="welcome-page">

      {/* ================= NAVBAR ================= */}

      <nav className="navbar">

        <div className="nav-left"></div>

        <div className="logo">
          Preparation Tracker
        </div>

        <div className="nav-right">
          <Link to="/signup" className="signup-btn">
            Sign Up
          </Link>
        </div>

      </nav>


      {/* ================= HERO SECTION ================= */}

      <section className="hero">

        {/* LEFT SIDE */}

        <div className="hero-content">

          <p className="small-title">
            YOUR PERSONAL STUDY COMPANION
          </p>

          <h1>
            Prepare Smarter.
            <br />
            <span>Achieve More.</span>
          </h1>

          <p className="hero-description">
            Plan your studies, organize your daily tasks,
            stay consistent, and track your preparation
            progress — all in one place.
          </p>

          <Link
            to="/signup"
            className="hero-btn"
          >
            Get Started →
          </Link>

        </div>


        {/* RIGHT SIDE */}

        <div className="hero-image">

          <div className="student-card">

            <div className="book-icon">
              📚
            </div>

            <h2>
              Study. Track. Improve.
            </h2>

            <p>
              Build better study habits and stay
              on top of your preparation.
            </p>


            {/* PROGRESS */}

            <div className="progress-box">

              <div className="progress-info">

                <span>
                  Today's Progress
                </span>

                <strong>
                  75%
                </strong>

              </div>

              <div className="progress-bar">
                <div className="progress"></div>
              </div>

            </div>

          </div>

        </div>

      </section>


      {/* ================= FEATURES SECTION ================= */}

      <section className="features">

        <h2>
          Everything You Need to Prepare Better
        </h2>

        <p className="features-subtitle">
          Simple tools to help you stay organized and focused.
        </p>


        <div className="feature-container">

          {/* FEATURE 1 */}

          <div className="feature-card">

            <div className="feature-icon">
              📚
            </div>

            <h3>
              Study Planning
            </h3>

            <p>
              Organize your subjects and topics
              and create a structured preparation plan.
            </p>

          </div>


          {/* FEATURE 2 */}

          <div className="feature-card">

            <div className="feature-icon">
              📅
            </div>

            <h3>
              Daily Schedule
            </h3>

            <p>
              Schedule your study sessions and
              manage your daily preparation effectively.
            </p>

          </div>


          {/* FEATURE 3 */}

          <div className="feature-card">

            <div className="feature-icon">
              🔔
            </div>

            <h3>
              Smart Reminders
            </h3>

            <p>
              Receive reminders before your scheduled
              study sessions so you never miss them.
            </p>

          </div>


          {/* FEATURE 4 */}

          <div className="feature-card">

            <div className="feature-icon">
              📈
            </div>

            <h3>
              Track Progress
            </h3>

            <p>
              Monitor your completed tasks and
              understand your preparation progress.
            </p>

          </div>

        </div>

      </section>


      {/* ================= BOTTOM SECTION ================= */}

      <section className="bottom-section">

        <h2>
          Ready to Start Your Preparation?
        </h2>

        <p>
          Create your account and take control
          of your study journey.
        </p>

        {/* Plain text - NOT a button */}

        <span className="bottom-text">
          Create Account
        </span>

      </section>

    </div>
  );
}

export default Welcome;