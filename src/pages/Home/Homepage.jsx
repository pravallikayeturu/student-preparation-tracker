import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";

import studyIllustration from "../../assets/study-illustration.jpg";

import studyIllustration1 from "../../assets/Student1.jpeg";
import studyIllustration2 from "../../assets/Student2.jpeg";
import studyIllustration3 from "../../assets/Student3.jpeg";

import "./Homepage.css";

function Homepage() {

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [profilePicture, setProfilePicture] = useState("");

  // Profile viewer
  const [showProfilePhoto, setShowProfilePhoto] = useState(false);

  // Image adjustment
  const [imageZoom, setImageZoom] = useState(1);
  const [imageX, setImageX] = useState(50);
  const [imageY, setImageY] = useState(50);

  const [isAdjusting, setIsAdjusting] = useState(false);

  const imageRef = useRef(null);

  const dragStart = useRef({
    x: 0,
    y: 0
  });

  const imageStart = useRef({
    x: 50,
    y: 50
  });

  const motivations = [
  {
    quote: "Small progress every day leads to big results.",
    text: "Stay focused. Stay consistent. 💪"
  },
  {
    quote: "Success is the sum of small efforts repeated every day.",
    text: "Keep going. Your efforts will pay off. 🌟"
  },
  {
    quote: "The secret of getting ahead is getting started.",
    text: "Start today. Your future self will thank you. 🚀"
  },
  {
    quote: "Don't watch the clock; do what it does. Keep going.",
    text: "Every minute of effort counts. ⏳"
  },
  {
    quote: "Discipline is choosing between what you want now and what you want most.",
    text: "Stay disciplined. Stay committed. 🔥"
  },
  {
    quote: "Believe you can, and you're halfway there.",
    text: "Believe in yourself and keep moving forward. 💙"
  }
];

const today = new Date();

const dayOfYear = Math.floor(
  (today - new Date(today.getFullYear(), 0, 0)) /
  (1000 * 60 * 60 * 24)
);

const todayMotivation =
  motivations[dayOfYear % motivations.length];

  const isDragging = useRef(false);


  // =====================================================
  // LOAD PROFILE DATA
  // =====================================================

  useEffect(() => {

    const savedName = localStorage.getItem("name");
    const savedEmail = localStorage.getItem("email");

    let cleanName = savedName;

    // If name is stored as JSON string
    if (
      savedName &&
      savedName.trim().startsWith("{") &&
      savedName.trim().endsWith("}")
    ) {
      try {

        const parsedName = JSON.parse(savedName);

        if (
          parsedName &&
          typeof parsedName.name === "string"
        ) {
          cleanName = parsedName.name.trim();
        }

      } catch (error) {
        console.log("Invalid name format");
      }
    }

    const finalName = cleanName || "User";

    setName(finalName);
    setEmail(savedEmail || "");

    // =====================================================
    // USER-SPECIFIC PROFILE PICTURE
    // =====================================================

    if (savedEmail) {

      const userProfilePicture =
        localStorage.getItem(
          `profilePicture_${savedEmail}`
        );

      setProfilePicture(
        userProfilePicture || ""
      );

    } else {

      setProfilePicture("");

    }

    // Save only clean name
    localStorage.setItem(
      "name",
      finalName
    );

  }, []);


  // =====================================================
  // CHANGE PROFILE PICTURE
  // =====================================================

  const handlePictureChange = (event) => {

    const file = event.target.files[0];

    if (!file) {
      return;
    }

    if (!file.type.startsWith("image/")) {
      alert("Please select an image file.");
      return;
    }

    if (!email) {
      alert(
        "User email not found. Please login again."
      );
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {

      const imageData = reader.result;

      setProfilePicture(imageData);

      // =====================================================
      // SAVE PHOTO FOR THIS USER ONLY
      // =====================================================

      localStorage.setItem(
        `profilePicture_${email}`,
        imageData
      );

      // Reset image adjustment
      setImageZoom(1);
      setImageX(50);
      setImageY(50);

    };

    reader.readAsDataURL(file);

    // Allow selecting the same image again
    event.target.value = "";

  };


  // =====================================================
  // OPEN PROFILE
  // =====================================================

  const openProfilePhoto = () => {

    if (!profilePicture) {
      return;
    }

    setShowProfilePhoto(true);
    setIsAdjusting(false);

  };


  // =====================================================
  // CLOSE PROFILE
  // =====================================================

  const closeProfilePhoto = () => {

    setShowProfilePhoto(false);
    setIsAdjusting(false);

    // Reset dragging
    isDragging.current = false;

  };


  // =====================================================
  // DOUBLE CLICK = ADJUST MODE
  // =====================================================

  const handleDoubleClick = (event) => {

    event.preventDefault();

    setIsAdjusting(true);

  };


  // =====================================================
  // MOUSE DOWN
  // =====================================================

  const handleMouseDown = (event) => {

    if (!isAdjusting) {
      return;
    }

    event.preventDefault();

    isDragging.current = true;

    dragStart.current = {
      x: event.clientX,
      y: event.clientY
    };

    imageStart.current = {
      x: imageX,
      y: imageY
    };

  };


  // =====================================================
  // MOUSE MOVE
  // =====================================================

  const handleMouseMove = (event) => {

    if (
      !isDragging.current ||
      !isAdjusting
    ) {
      return;
    }

    const deltaX =
      event.clientX -
      dragStart.current.x;

    const deltaY =
      event.clientY -
      dragStart.current.y;

    // Convert mouse movement into percentage
    const newX =
      imageStart.current.x -
      deltaX / 3;

    const newY =
      imageStart.current.y -
      deltaY / 3;

    setImageX(
      Math.max(
        0,
        Math.min(100, newX)
      )
    );

    setImageY(
      Math.max(
        0,
        Math.min(100, newY)
      )
    );

  };


  // =====================================================
  // MOUSE UP
  // =====================================================

  const handleMouseUp = () => {

    isDragging.current = false;

  };


  // =====================================================
  // MOUSE WHEEL = ZOOM
  // =====================================================

  const handleWheel = (event) => {

    if (!isAdjusting) {
      return;
    }

    event.preventDefault();

    if (event.deltaY < 0) {

      setImageZoom((previous) =>
        Math.min(
          previous + 0.08,
          3
        )
      );

    } else {

      setImageZoom((previous) =>
        Math.max(
          previous - 0.08,
          1
        )
      );

    }

  };


  // =====================================================
  // TOUCH START
  // =====================================================

  const handleTouchStart = (event) => {

    if (!isAdjusting) {
      return;
    }

    if (event.touches.length !== 1) {
      return;
    }

    const touch = event.touches[0];

    isDragging.current = true;

    dragStart.current = {
      x: touch.clientX,
      y: touch.clientY
    };

    imageStart.current = {
      x: imageX,
      y: imageY
    };

  };


  // =====================================================
  // TOUCH MOVE
  // =====================================================

  const handleTouchMove = (event) => {

    if (
      !isDragging.current ||
      !isAdjusting
    ) {
      return;
    }

    if (event.touches.length !== 1) {
      return;
    }

    event.preventDefault();

    const touch = event.touches[0];

    const deltaX =
      touch.clientX -
      dragStart.current.x;

    const deltaY =
      touch.clientY -
      dragStart.current.y;

    const newX =
      imageStart.current.x -
      deltaX / 3;

    const newY =
      imageStart.current.y -
      deltaY / 3;

    setImageX(
      Math.max(
        0,
        Math.min(100, newX)
      )
    );

    setImageY(
      Math.max(
        0,
        Math.min(100, newY)
      )
    );

  };


  // =====================================================
  // TOUCH END
  // =====================================================

  const handleTouchEnd = () => {

    isDragging.current = false;

  };


  // =====================================================
  // ESCAPE
  // =====================================================

  useEffect(() => {

    const handleEscape = (event) => {

      if (event.key === "Escape") {
        closeProfilePhoto();
      }

    };

    document.addEventListener(
      "keydown",
      handleEscape
    );

    return () => {

      document.removeEventListener(
        "keydown",
        handleEscape
      );

    };

  }, []);


  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = (event) => {

    event.preventDefault();

    // Remove only login session
    localStorage.removeItem("token");

    // DO NOT REMOVE USER PROFILE PICTURE
    // It is stored using the user's email.

    window.location.href = "/login";

  };


  return (

    <div className="homepage">


      {/* =====================================================
          SIDEBAR
      ===================================================== */}

      <aside className="homepage-sidebar">

        <h2 className="homepage-logo">
          Student Preparation Tracker
        </h2>

        <nav className="sidebar-nav">

          <a
            href="#home"
            className="sidebar-link active"
          >
            <span className="nav-icon">🏠</span>
            <span>Home</span>
          </a>


          <Link
            to="/create-task"
            className="home-sidebar-link"
          >
            <span className="home-nav-icon">
              ➕
            </span>

            <span>
              Create Task
            </span>
          </Link>


          <Link
            to="/my-tasks"
            className="sidebar-link"
          >
            <span className="nav-icon">
              📚
            </span>

            <span>
              My Tasks
            </span>
          </Link>


          <Link
            to="/calendar"
            className="sidebar-link"
          >
            <span className="nav-icon">
              📅
            </span>

            <span>
              Calendar
            </span>
          </Link>


          <Link
            to="/dashboard"
            className="sidebar-link"
          >
            <span className="nav-icon">
              📊
            </span>

            <span>
              Dashboard
            </span>
          </Link>


          <Link
            to="/Progress"
            className="sidebar-link"
          >
            <span className="nav-icon">
              📈
            </span>

            <span>
              Progress
            </span>
          </Link>


          <Link
            to="/Notifications"
            className="sidebar-link"
          >
            <span className="nav-icon">
              🔔
            </span>

            <span>
              Notifications
            </span>
          </Link>


          <Link
            to="/Chatbot"
            className="sidebar-link"
          >
            <span className="nav-icon">
              🤖
            </span>

            <span>
              AI
            </span>
          </Link>


          <Link
            to="/Files"
            className="sidebar-link"
          >
            <span className="nav-icon">
              📁
            </span>

            <span>
              Files
            </span>
          </Link>


          <Link
            to="/Settings"
            className="sidebar-link"
          >
            <span className="nav-icon">
              ⚙️
            </span>

            <span>
              Settings
            </span>
          </Link>


          <a
            href="#logout"
            className="sidebar-link logout-link"
            onClick={handleLogout}
          >
            <span className="nav-icon">
              🚪
            </span>

            <span>
              Logout
            </span>
          </a>

        </nav>

      </aside>


      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="homepage-main">

        <header className="homepage-header">

          <div className="header-welcome">

            <p>

              Welcome back{" "}

              <strong>
                {name || "User"}
              </strong>{" "}

              👋

            </p>

          </div>


          {/* =====================================================
              PROFILE
          ===================================================== */}

          <div className="profile-section">

            <div className="profile-picture-wrapper">

              {profilePicture ? (

                <img
                  src={profilePicture}
                  alt="Profile"
                  className="profile-picture"
                  onClick={openProfilePhoto}
                  title="Click to view profile"
                />

              ) : (

                <div className="profile-placeholder">

                  {name
                    ? name
                        .charAt(0)
                        .toUpperCase()
                    : "U"}

                </div>

              )}


              <label
                htmlFor="profile-upload"
                className="profile-edit"
                title="Change profile picture"
              >
                ✏️
              </label>


              <input
                id="profile-upload"
                type="file"
                accept="image/*"
                onChange={handlePictureChange}
                hidden
              />

            </div>


            <div className="profile-info">

              <strong>
                {name || "User"}
              </strong>

              <span>
                {email}
              </span>

            </div>

          </div>

        </header>


        {/* =====================================================
            CONTENT
        ===================================================== */}

        <section className="homepage-content">


          {/* =====================================================
              EXISTING WELCOME CARD
          ===================================================== */}

          <div className="welcome-card">

            <h2>

              {name
                ? `Good to see you, ${
                    typeof name === "string" &&
                    name.trim().startsWith("{")
                      ? JSON.parse(name).name
                      : name
                  }! 🎓`
                : "Good to see you! 🎓"}

            </h2>


            <p>
              Stay consistent with your preparation
              and achieve your goals.
            </p>

          </div>


          
{/* =====================================================
    TODAY'S MOTIVATION
===================================================== */}

<section className="today-motivation">

  <span className="motivation-label">
    TODAY'S MOTIVATION
  </span>

  <h2>
    "{todayMotivation.quote}"
  </h2>

  <p>
    {todayMotivation.text}
  </p>

</section>


          {/* =====================================================
              STUDENTS WHO INSPIRE
          ===================================================== */}

          <section className="students-inspire">

            <span className="motivation-label">
              STUDENTS WHO INSPIRE
            </span>

            <h2>
              Learn. Practice. Achieve.
            </h2>


            <div className="student-inspire-grid">


              {/* LEARN */}

              <div className="student-inspire-card">

                <div className="student-image-wrapper">

                  <img
                    src={studyIllustration1}
                    alt="Student learning"
                    className="student-inspire-image"
                  />

                  <span className="student-icon">
                    📚
                  </span>

                </div>

                <h3>
                  LEARN
                </h3>

              </div>


              {/* PRACTICE */}

              <div className="student-inspire-card">

                <div className="student-image-wrapper">

                  <img
                    src={studyIllustration2}
                    alt="Student practicing"
                    className="student-inspire-image"
                  />

                  <span className="student-icon">
                    💻
                  </span>

                </div>

                <h3>
                  PRACTICE
                </h3>

              </div>


              {/* ACHIEVE */}

              <div className="student-inspire-card">

                <div className="student-image-wrapper">

                  <img
                    src={studyIllustration3}
                    alt="Student achieving goals"
                    className="student-inspire-image"
                  />

                  <span className="student-icon">
                    🎓
                  </span>

                </div>

                <h3>
                  ACHIEVE
                </h3>

              </div>

            </div>

          </section>


          {/* =====================================================
              DISCIPLINE TODAY / SUCCESS TOMORROW
          ===================================================== */}

          <section className="discipline-banner">

            
      

              <img
                src={studyIllustration}
                alt="Students studying"
              />

          

          </section>


          {/* =====================================================
              FINAL MOTIVATION
          ===================================================== */}

          <section className="final-motivation">

            <h2>
              KEEP GOING, YOU'VE GOT THIS! 🚀
            </h2>

            <p>
              One day at a time.
              One goal at a time.
            </p>

            <span>
              Your consistency today builds
              your success tomorrow.
            </span>

          </section>


        </section>

      </main>


      {/* =====================================================
          PROFILE PHOTO VIEWER
      ===================================================== */}

      {showProfilePhoto &&
        profilePicture && (

        <div
          className="profile-view-overlay"
          onClick={closeProfilePhoto}
        >

          <div
            className="profile-view-container"
            onClick={(event) =>
              event.stopPropagation()
            }
          >


            {/* CLOSE */}

            <button
              className="profile-view-close"
              onClick={closeProfilePhoto}
            >
              ✕
            </button>


            {/* =================================================
                LARGE PHOTO
            ================================================= */}

            <div
              className={`profile-view-image-wrapper ${
                isAdjusting
                  ? "adjusting"
                  : ""
              }`}
            >

              <img
                ref={imageRef}
                src={profilePicture}
                alt="Profile"
                className="profile-view-large"

                style={{
                  transform:
                    `scale(${imageZoom})`,

                  objectPosition:
                    `${imageX}% ${imageY}%`
                }}

                onDoubleClick={
                  handleDoubleClick
                }

                onMouseDown={
                  handleMouseDown
                }

                onMouseMove={
                  handleMouseMove
                }

                onMouseUp={
                  handleMouseUp
                }

                onMouseLeave={
                  handleMouseUp
                }

                onWheel={
                  handleWheel
                }

                onTouchStart={
                  handleTouchStart
                }

                onTouchMove={
                  handleTouchMove
                }

                onTouchEnd={
                  handleTouchEnd
                }
              />

            </div>


            {/* NAME */}

            <h2 className="profile-view-name">
              {name || "User"}
            </h2>


            {/* EMAIL */}

            <p className="profile-view-email">
              {email}
            </p>


            {/* SMALL INSTRUCTION */}

            {!isAdjusting && (

              <p className="profile-view-hint">
                Double-click the photo to adjust
              </p>

            )}


            {isAdjusting && (

              <p className="profile-view-hint adjusting-hint">
                Drag the photo to adjust •
                Scroll to zoom
              </p>

            )}

          </div>

        </div>

      )}

    </div>

  );

}

export default Homepage;