import { useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import Welcome from "./pages/Welcome/Welcome";
import Signup from "./pages/Signup/Signup";
import Login from "./pages/Login/Login";
import Homepage from "./pages/Home/Homepage";
import CreateTask from "./pages/CreateTask/CreateTask";
import MyTasks from "./pages/MyTask/MyTasks";
import Calendar from "./pages/Calendar/Calendar";
import Dashboard from "./pages/Dashboard/Dashboard";
import Progress from "./pages/Progress/Progress";
import Notifications from "./pages/Notifications/Notifications";
import ForgotPassword from "./pages/ForgotPassword/ForgotPassword";

// ================= CHATBOT =================
import Chatbot from "./pages/Chatbot/Chatbot";

// ================= FILES =================
import Files from "./pages/Files/Files";

import Settings from "./pages/Settings/Settings";
import ChangePassword from "./pages/ChangePassword/ChangePassword";


// =========================================================
// APP
// =========================================================

function App() {

  // =========================================================
  // GLOBAL DARK MODE
  // =========================================================

  useEffect(() => {

    const applyDarkMode = () => {

      const darkMode =
        localStorage.getItem("darkMode") === "true";

      if (darkMode) {

        document.body.classList.add("dark-mode");

      } else {

        document.body.classList.remove("dark-mode");

      }
    };


    // Apply dark mode when application loads
    applyDarkMode();


    // Listen for dark mode changes from Settings page
    window.addEventListener(
      "darkModeChanged",
      applyDarkMode
    );


    // Cleanup event listener
    return () => {

      window.removeEventListener(
        "darkModeChanged",
        applyDarkMode
      );

    };

  }, []);


  // =========================================================
  // ROUTES
  // =========================================================

  return (

    <BrowserRouter>

      <Routes>

        {/* ================= WELCOME ================= */}

        <Route
          path="/"
          element={<Welcome />}
        />


        {/* ================= SIGNUP ================= */}

        <Route
          path="/signup"
          element={<Signup />}
        />


        {/* ================= LOGIN ================= */}

        <Route
          path="/login"
          element={<Login />}
        />


        {/* ================= HOMEPAGE ================= */}

        <Route
          path="/Homepage"
          element={<Homepage />}
        />


        {/* ================= CREATE TASK ================= */}

        <Route
          path="/create-task"
          element={<CreateTask />}
        />


        {/* ================= MY TASKS ================= */}

        <Route
          path="/my-tasks"
          element={<MyTasks />}
        />


        {/* ================= CALENDAR ================= */}

        <Route
          path="/calendar"
          element={<Calendar />}
        />


        {/* ================= DASHBOARD ================= */}

        <Route
          path="/Dashboard"
          element={<Dashboard />}
        />


        {/* ================= PROGRESS ================= */}

        <Route
          path="/Progress"
          element={<Progress />}
        />


        {/* ================= NOTIFICATIONS ================= */}

        <Route
          path="/Notifications"
          element={<Notifications />}
        />


        {/* ================= FORGOT PASSWORD ================= */}

        <Route
          path="/forgot-password"
          element={<ForgotPassword />}
        />


        {/* ================= CHATBOT ================= */}

        <Route
          path="/Chatbot"
          element={<Chatbot />}
        />


        {/* ================= FILES ================= */}

        <Route
          path="/Files"
          element={<Files />}
        />


        {/* ================= SETTINGS ================= */}

        <Route
          path="/settings"
          element={<Settings />}
        />


        {/* ================= CHANGE PASSWORD ================= */}

        <Route
          path="/change-password"
          element={<ChangePassword />}
        />

      </Routes>

    </BrowserRouter>
  );
}


export default App;