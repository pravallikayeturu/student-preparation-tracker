// =========================================================
// SERVICE WORKER - BROWSER PUSH NOTIFICATIONS
// =========================================================

self.addEventListener("push", function (event) {

  console.log("Push notification received.");


  // -------------------------------------------------------
  // DEFAULT NOTIFICATION DATA
  // -------------------------------------------------------

  let data = {
    title: "Student Preparation Tracker",
    message: "You have a new notification."
  };


  // -------------------------------------------------------
  // READ PUSH DATA
  // -------------------------------------------------------

  if (event.data) {

    try {

      data = event.data.json();

    } catch (error) {

      console.error(
        "Failed to read push notification data:",
        error
      );

      data.message =
        event.data.text();

    }

  }


  // -------------------------------------------------------
  // SHOW BROWSER NOTIFICATION
  // -------------------------------------------------------

  const notificationTitle =
    data.title ||
    "Student Preparation Tracker";


  const notificationOptions = {

    body:
      data.message ||
      "You have a new notification.",

    icon: "/favicon.ico",

    badge: "/favicon.ico",

    data: {
      url: "/Notifications"
    }

  };


  event.waitUntil(

    self.registration.showNotification(
      notificationTitle,
      notificationOptions
    )

  );

});


// =========================================================
// NOTIFICATION CLICK
// =========================================================

self.addEventListener(
  "notificationclick",
  function (event) {

    event.notification.close();


    event.waitUntil(

      clients.matchAll({
        type: "window",
        includeUncontrolled: true
      })

      .then(function (clientList) {

        const notificationUrl =
          event.notification.data?.url ||
          "/Notifications";


        // -------------------------------------------------
        // IF APP IS ALREADY OPEN
        // -------------------------------------------------

        for (
          const client of clientList
        ) {

          if (
            "focus" in client
          ) {

            client.navigate(
              notificationUrl
            );

            return client.focus();

          }

        }


        // -------------------------------------------------
        // OTHERWISE OPEN APP
        // -------------------------------------------------

        if (
          clients.openWindow
        ) {

          return clients.openWindow(
            notificationUrl
          );

        }

      })

    );

  }
);