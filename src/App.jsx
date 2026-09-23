import { useEffect, useRef } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  useLocation
} from "react-router-dom";

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

import API_URL from "./api/api";


// =========================================================
// APP
// =========================================================

function App() {

  return (

    <BrowserRouter>

      <AppContent />

    </BrowserRouter>

  );
}


// =========================================================
// APP CONTENT
// =========================================================

function AppContent() {

  const location = useLocation();

  const pushRegistrationInProgress =
    useRef(false);


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
  // BROWSER PUSH NOTIFICATIONS
  // =========================================================

  useEffect(() => {

    const registerPushNotifications = async () => {

      // -------------------------------------------------
      // PREVENT DUPLICATE REGISTRATION
      // -------------------------------------------------

      if (
        pushRegistrationInProgress.current
      ) {

        console.log(
          "Push registration already in progress."
        );

        return;
      }

      pushRegistrationInProgress.current =
        true;


      try {

        // -------------------------------------------------
        // CHECK BROWSER SUPPORT
        // -------------------------------------------------

        if (
          !("serviceWorker" in navigator) ||
          !("PushManager" in window) ||
          !("Notification" in window)
        ) {

          console.log(
            "Browser does not support push notifications."
          );

          return;
        }


        // -------------------------------------------------
        // CHECK LOGGED-IN USER
        // -------------------------------------------------

        const userEmail =
          localStorage.getItem("userEmail") ||
          localStorage.getItem("email");


        if (!userEmail) {

          console.log(
            "No logged-in user found. Push registration skipped."
          );

          return;
        }


        // -------------------------------------------------
        // GET JWT TOKEN
        // -------------------------------------------------

        const token =
          localStorage.getItem("token");


        if (!token) {

          console.log(
            "No JWT token found. Push registration skipped."
          );

          return;
        }


        // -------------------------------------------------
        // CHECK WHETHER THIS USER IS ALREADY REGISTERED
        // -------------------------------------------------

        const registrationStorageKey =
          `pushRegistered:${userEmail}`;


        if (
          localStorage.getItem(
            registrationStorageKey
          ) === "true"
        ) {

          console.log(
            "Push subscription already registered for:",
            userEmail
          );

          return;
        }


        // -------------------------------------------------
        // GET VAPID PUBLIC KEY
        // -------------------------------------------------

        const vapidPublicKey =
          import.meta.env.VITE_VAPID_PUBLIC_KEY;


        if (
          !vapidPublicKey ||
          vapidPublicKey === "VAPID_PUBLIC_KEY"
        ) {

          console.error(
            "Please replace VAPID_PUBLIC_KEY with your actual VAPID public key in .env"
          );

          return;
        }


        // -------------------------------------------------
        // REQUEST NOTIFICATION PERMISSION
        // -------------------------------------------------

        const permission =
          await Notification.requestPermission();


        if (
          permission !== "granted"
        ) {

          console.log(
            "Notification permission was not granted."
          );

          return;
        }


        // -------------------------------------------------
        // REGISTER SERVICE WORKER
        // -------------------------------------------------

        const registration =
          await navigator.serviceWorker.register(
            "/service-worker.js"
          );


        console.log(
          "Service worker registered:",
          registration
        );


        // -------------------------------------------------
        // WAIT UNTIL SERVICE WORKER IS READY
        // -------------------------------------------------

        const readyRegistration =
          await navigator.serviceWorker.ready;


        console.log(
          "Service worker is ready."
        );


        // -------------------------------------------------
        // CHECK EXISTING PUSH SUBSCRIPTION
        // -------------------------------------------------

        let subscription =
          await readyRegistration
            .pushManager
            .getSubscription();


        // -------------------------------------------------
        // CREATE NEW PUSH SUBSCRIPTION
        // -------------------------------------------------

        if (!subscription) {

          subscription =
            await readyRegistration
              .pushManager
              .subscribe({

                userVisibleOnly: true,

                applicationServerKey:
                  urlBase64ToUint8Array(
                    vapidPublicKey
                  )

              });

        }


        console.log(
          "Browser push subscription:",
          subscription
        );


        // -------------------------------------------------
        // CONVERT SUBSCRIPTION TO JSON
        // -------------------------------------------------

        const subscriptionJSON =
          subscription.toJSON();


        const endpoint =
          subscriptionJSON.endpoint;

        const p256dh =
          subscriptionJSON.keys?.p256dh;

        const auth =
          subscriptionJSON.keys?.auth;


        if (
          !endpoint ||
          !p256dh ||
          !auth
        ) {

          console.error(
            "Push subscription data is incomplete."
          );

          return;
        }


        // -------------------------------------------------
        // CHECK WHETHER SUBSCRIPTION ALREADY EXISTS
        // -------------------------------------------------

        try {

          const existingResponse =
            await fetch(
              `${API_URL}/api/push-subscriptions`,
              {
                method: "GET",

                headers: {
                  "Content-Type":
                    "application/json",

                  "Authorization":
                    `Bearer ${token}`
                }
              }
            );


          if (
            existingResponse.ok
          ) {

            const existingSubscriptions =
              await existingResponse.json();


            const alreadyExists =
              existingSubscriptions.some(
                (item) =>
                  item.endpoint === endpoint &&
                  item.userEmail &&
                  item.userEmail.toLowerCase() ===
                    userEmail.toLowerCase()
              );


            if (alreadyExists) {

              console.log(
                "Push subscription already exists in backend."
              );


              localStorage.setItem(
                registrationStorageKey,
                "true"
              );


              return;
            }

          } else {

            console.warn(
              "Could not check existing push subscriptions. HTTP status:",
              existingResponse.status
            );

          }

        } catch (checkError) {

          console.warn(
            "Could not check existing push subscriptions. Continuing with registration.",
            checkError
          );

        }


        // -------------------------------------------------
        // SEND SUBSCRIPTION TO BACKEND
        // -------------------------------------------------

        const response =
          await fetch(
            `${API_URL}/api/push-subscriptions`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                "Authorization":
                  `Bearer ${token}`
              },

              body: JSON.stringify({

                userEmail:
                  userEmail,

                endpoint:
                  endpoint,

                p256dh:
                  p256dh,

                auth:
                  auth

              })

            }
          );


        // -------------------------------------------------
        // HANDLE BACKEND ERROR
        // -------------------------------------------------

        if (
          !response.ok
        ) {

          const errorText =
            await response.text();


          throw new Error(
            `Push subscription save failed: ${response.status} ${errorText}`
          );

        }


        // -------------------------------------------------
        // READ SAVED SUBSCRIPTION
        // -------------------------------------------------

        const savedSubscription =
          await response.json();


        console.log(
          "Push subscription saved successfully:",
          savedSubscription
        );


        // -------------------------------------------------
        // MARK USER AS REGISTERED
        // -------------------------------------------------

        localStorage.setItem(
          registrationStorageKey,
          "true"
        );


        console.log(
          "Browser push notifications are ready for:",
          userEmail
        );


      } catch (error) {

        console.error(
          "Browser push registration failed:",
          error
        );


      } finally {

        pushRegistrationInProgress.current =
          false;

      }

    };


    registerPushNotifications();


  }, [location.pathname]);


  // =========================================================
  // ROUTES
  // =========================================================

  return (

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

  );

}


// =========================================================
// VAPID PUBLIC KEY CONVERTER
// =========================================================

function urlBase64ToUint8Array(
  base64String
) {

  const padding =
    "=".repeat(
      (4 - (base64String.length % 4)) % 4
    );


  const base64 =
    (
      base64String +
      padding
    )
      .replace(/-/g, "+")
      .replace(/_/g, "/");


  const rawData =
    window.atob(base64);


  const outputArray =
    new Uint8Array(
      rawData.length
    );


  for (
    let i = 0;
    i < rawData.length;
    ++i
  ) {

    outputArray[i] =
      rawData.charCodeAt(i);

  }


  return outputArray;
}


export default App;