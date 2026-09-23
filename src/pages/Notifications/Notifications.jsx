import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Notifications.css";
import API_URL from "../../api/api";
function Notifications() {
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // =====================================================
  // GET JWT TOKEN
  // =====================================================

  const getToken = () => {
    const possibleKeys = [
      "token",
      "jwtToken",
      "accessToken"
    ];

    for (const key of possibleKeys) {
      const value = localStorage.getItem(key);

      if (value) {
        return value;
      }
    }

    return null;
  };

  // =====================================================
  // API BASE URL
  // =====================================================

  const API_URL=
    `${API_URL}/api/notifications`;

  // =====================================================
  // FETCH NOTIFICATIONS
  // =====================================================

  const fetchNotifications = useCallback(async () => {
    const token = getToken();

    if (!token) {
      setError("Please login to view notifications.");
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.status === 401 || response.status === 403) {
        setError(
          "Your session has expired. Please login again."
        );
        setLoading(false);
        return;
      }

      if (!response.ok) {
        throw new Error(
          "Failed to load notifications."
        );
      }

      const data = await response.json();

      setNotifications(
        Array.isArray(data) ? data : []
      );

      setError("");

    } catch (error) {
      console.error(
        "Notification fetch error:",
        error
      );

      setError(
        "Unable to load notifications. Please try again."
      );

    } finally {
      setLoading(false);
    }
  }, []);

  // =====================================================
  // INITIAL LOAD
  // =====================================================

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // =====================================================
  // REAL-TIME POLLING
  // CHECK BACKEND EVERY 30 SECONDS
  // =====================================================

  useEffect(() => {
    const interval = setInterval(() => {
      fetchNotifications();
    }, 30000);

    return () => {
      clearInterval(interval);
    };
  }, [fetchNotifications]);

  // =====================================================
  // MARK ONE AS READ
  // =====================================================

  const markAsRead = async (id) => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${id}/read`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark notification as read."
        );
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                read: true
              }
            : notification
        )
      );

    } catch (error) {
      console.error(
        "Mark as read error:",
        error
      );
    }
  };

  // =====================================================
  // MARK ONE AS UNREAD
  // =====================================================

  const markAsUnread = async (id) => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${id}/unread`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark notification as unread."
        );
      }

      setNotifications((previous) =>
        previous.map((notification) =>
          notification.id === id
            ? {
                ...notification,
                read: false
              }
            : notification
        )
      );

    } catch (error) {
      console.error(
        "Mark as unread error:",
        error
      );
    }
  };

  // =====================================================
  // MARK ALL AS READ
  // =====================================================

  const markAllAsRead = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/read-all`,
        {
          method: "PUT",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to mark all notifications as read."
        );
      }

      setNotifications((previous) =>
        previous.map((notification) => ({
          ...notification,
          read: true
        }))
      );

    } catch (error) {
      console.error(
        "Mark all as read error:",
        error
      );
    }
  };

  // =====================================================
  // DELETE ONE NOTIFICATION
  // =====================================================

  const deleteNotification = async (id) => {
    const token = getToken();

    if (!token) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/${id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete notification."
        );
      }

      setNotifications((previous) =>
        previous.filter(
          (notification) =>
            notification.id !== id
        )
      );

    } catch (error) {
      console.error(
        "Delete notification error:",
        error
      );
    }
  };

  // =====================================================
  // CLEAR ALL NOTIFICATIONS
  // =====================================================

  const clearAll = async () => {
    const token = getToken();

    if (!token) {
      return;
    }

    const confirmClear = window.confirm(
      "Are you sure you want to clear all notifications?"
    );

    if (!confirmClear) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/clear-all`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to clear notifications."
        );
      }

      setNotifications([]);

    } catch (error) {
      console.error(
        "Clear all notifications error:",
        error
      );
    }
  };

  // =====================================================
  // GET ICON
  // =====================================================

  const getIcon = (type) => {
    switch (type?.toUpperCase()) {

      case "STUDY":
        return "📚";

      case "DEADLINE":
        return "⏰";

      default:
        return "🔔";
    }
  };

  // =====================================================
  // TIME FORMAT
  // =====================================================

  const formatTime = (createdAt) => {
    if (!createdAt) {
      return "Just now";
    }

    const date = new Date(createdAt);

    if (Number.isNaN(date.getTime())) {
      return "Recently";
    }

    const now = new Date();

    const difference =
      Math.floor(
        (now.getTime() - date.getTime()) / 1000
      );

    if (difference < 60) {
      return "Just now";
    }

    if (difference < 3600) {
      const minutes =
        Math.floor(difference / 60);

      return `${minutes} minute${
        minutes !== 1 ? "s" : ""
      } ago`;
    }

    if (difference < 86400) {
      const hours =
        Math.floor(difference / 3600);

      return `${hours} hour${
        hours !== 1 ? "s" : ""
      } ago`;
    }

    if (difference < 604800) {
      const days =
        Math.floor(difference / 86400);

      return `${days} day${
        days !== 1 ? "s" : ""
      } ago`;
    }

    return date.toLocaleDateString();
  };

  // =====================================================
  // FILTER NOTIFICATIONS
  // =====================================================

  const filteredNotifications =
    notifications.filter((notification) => {

      // -------------------------------------------------
      // SEARCH
      // -------------------------------------------------

      const search =
        searchTerm.toLowerCase().trim();

      const matchesSearch =
        !search ||
        notification.title
          ?.toLowerCase()
          .includes(search) ||
        notification.message
          ?.toLowerCase()
          .includes(search);

      // -------------------------------------------------
      // TYPE FILTER
      // -------------------------------------------------

      const notificationType =
        notification.type?.toUpperCase();

      const matchesFilter =
        filter === "ALL" ||
        notificationType === filter;

      // -------------------------------------------------
      // UNREAD FILTER
      // -------------------------------------------------

      const matchesUnread =
        !showUnreadOnly ||
        !notification.read;

      return (
        matchesSearch &&
        matchesFilter &&
        matchesUnread
      );
    });

  // =====================================================
  // COUNTS
  // =====================================================

  const unreadCount =
    notifications.filter(
      (notification) =>
        !notification.read
    ).length;

  const totalCount =
    notifications.length;

  const studyCount =
    notifications.filter(
      (notification) =>
        notification.type?.toUpperCase() ===
        "STUDY"
    ).length;

  const deadlineCount =
    notifications.filter(
      (notification) =>
        notification.type?.toUpperCase() ===
        "DEADLINE"
    ).length;

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="notifications-page">

        <div className="notifications-loading">

          <div className="loading-spinner"></div>

          <h2>
            Loading notifications...
          </h2>

          <p>
            Please wait while we get your
            latest study updates.
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // PAGE
  // =====================================================

  return (
    <div className="notifications-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="notifications-header">

        <div className="notifications-header-left">

          <button
            className="back-button"
            onClick={() =>
              navigate("/Homepage")
            }
          >
            ← Back
          </button>

          <div className="notifications-title-section">

            <div className="notifications-title-icon">
              🔔
            </div>

            <div>

              <h1>
                Notifications
              </h1>

              <p>
                Stay updated with your study
                activities and tasks.
              </p>

            </div>

          </div>

        </div>

        <div className="notification-count-box">

          <span className="notification-count-number">
            {unreadCount}
          </span>

          <span className="notification-count-text">
            Unread
          </span>

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (
        <div className="notification-error">

          <span>⚠️</span>

          <p>
            {error}
          </p>

          <button
            onClick={fetchNotifications}
          >
            Retry
          </button>

        </div>
      )}

      {/* =================================================
          SUMMARY
      ================================================= */}

      <div className="notification-summary">

        {/* TOTAL */}

        <div className="summary-card">

          <div className="summary-icon">
            🔔
          </div>

          <div>

            <span>
              Total
            </span>

            <strong>
              {totalCount}
            </strong>

          </div>

        </div>

        {/* STUDY */}

        <div className="summary-card">

          <div className="summary-icon">
            📚
          </div>

          <div>

            <span>
              Study
            </span>

            <strong>
              {studyCount}
            </strong>

          </div>

        </div>

        {/* DEADLINE */}

        <div className="summary-card">

          <div className="summary-icon">
            ⏰
          </div>

          <div>

            <span>
              Deadline
            </span>

            <strong>
              {deadlineCount}
            </strong>

          </div>

        </div>

      </div>

      {/* =================================================
          SEARCH + FILTER
      ================================================= */}

      <div className="notifications-toolbar">

        {/* SEARCH */}

        <div className="notification-search">

          <span className="search-icon">
            🔍
          </span>

          <input
            type="text"
            placeholder="Search notifications..."
            value={searchTerm}
            onChange={(event) =>
              setSearchTerm(
                event.target.value
              )
            }
          />

          {searchTerm && (
            <button
              className="search-clear"
              onClick={() =>
                setSearchTerm("")
              }
            >
              ✕
            </button>
          )}

        </div>

        {/* FILTER BUTTONS */}

        <div className="notification-filters">

          {/* ALL */}

          <button
            className={`filter-button ${
              filter === "ALL"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilter("ALL")
            }
          >
            🔔 All
          </button>

          {/* STUDY */}

          <button
            className={`filter-button ${
              filter === "STUDY"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilter("STUDY")
            }
          >
            📚 Study
          </button>

          {/* DEADLINE */}

          <button
            className={`filter-button ${
              filter === "DEADLINE"
                ? "active"
                : ""
            }`}
            onClick={() =>
              setFilter("DEADLINE")
            }
          >
            ⏰ Deadline
          </button>

        </div>

        {/* UNREAD */}

        <button
          className={`unread-toggle ${
            showUnreadOnly
              ? "active"
              : ""
          }`}
          onClick={() =>
            setShowUnreadOnly(
              (previous) => !previous
            )
          }
        >
          🔴 Unread only
        </button>

      </div>

      {/* =================================================
          ACTIONS
      ================================================= */}

      <div className="notification-actions">

        <div className="notification-result-text">

          Showing{" "}

          <strong>
            {filteredNotifications.length}
          </strong>{" "}

          notification
          {filteredNotifications.length !== 1
            ? "s"
            : ""}

        </div>

        <div className="notification-action-buttons">

          {unreadCount > 0 && (
            <button
              className="mark-read-button"
              onClick={markAllAsRead}
            >
              ✓ Mark all as read
            </button>
          )}

          {notifications.length > 0 && (
            <button
              className="clear-all-button"
              onClick={clearAll}
            >
              🗑 Clear all
            </button>
          )}

        </div>

      </div>

      {/* =================================================
          NOTIFICATION LIST
      ================================================= */}

      <div className="notifications-container">

        {filteredNotifications.length === 0 ? (

          <div className="empty-notifications">

            <div className="empty-notification-icon">

              {notifications.length === 0
                ? "🔕"
                : "🔍"}

            </div>

            <h2>

              {notifications.length === 0
                ? "No notifications"
                : "No matching notifications"}

            </h2>

            <p>

              {notifications.length === 0
                ? "You're all caught up! New notifications will appear here."
                : "Try changing your search or filter."}

            </p>

            {notifications.length > 0 && (

              <button
                className="reset-filter-button"
                onClick={() => {

                  setSearchTerm("");
                  setFilter("ALL");
                  setShowUnreadOnly(false);

                }}
              >
                Reset filters
              </button>

            )}

          </div>

        ) : (

          <div className="notification-list">

            {filteredNotifications.map(
              (notification) => (

                <div
                  key={notification.id}
                  className={`notification-card ${
                    !notification.read
                      ? "unread"
                      : ""
                  }`}
                >

                  {/* =================================================
                      ICON
                  ================================================= */}

                  <div
                    className={`notification-icon notification-${
                      notification.type?.toLowerCase() ||
                      "default"
                    }`}
                  >

                    {getIcon(
                      notification.type
                    )}

                  </div>

                  {/* =================================================
                      CONTENT
                  ================================================= */}

                  <div className="notification-content">

                    <div className="notification-title-row">

                      <div className="notification-heading">

                        <span className="notification-type">

                          {notification.type ||
                            "NOTIFICATION"}

                        </span>

                        <h3>
                          {notification.title}
                        </h3>

                      </div>

                      {!notification.read && (
                        <span className="unread-dot"></span>
                      )}

                    </div>

                    {/* =================================================
                        MESSAGE
                    ================================================= */}

                    <p className="notification-message">

                      {notification.message}

                    </p>

                    {/* =================================================
                        DEADLINE
                        CONNECTED TO CREATE TASK DEADLINE
                    ================================================= */}

                    {notification.type?.toUpperCase() ===
                      "DEADLINE" && (

                      <div className="notification-deadline">

                        ⏰ Deadline:{" "}

                        {notification.deadline
                          ? new Date(
                              notification.deadline
                            ).toLocaleDateString()
                          : "No deadline available"}

                      </div>

                    )}

                    {/* =================================================
                        FOOTER
                    ================================================= */}

                    <div className="notification-footer">

                      <span className="notification-time">

                        🕐{" "}

                        {formatTime(
                          notification.createdAt
                        )}

                      </span>

                      {/* MARK READ / UNREAD */}

                      {!notification.read ? (

                        <button
                          className="notification-read-button"
                          onClick={() =>
                            markAsRead(
                              notification.id
                            )
                          }
                        >
                          ✓ Mark as read
                        </button>

                      ) : (

                        <button
                          className="notification-unread-button"
                          onClick={() =>
                            markAsUnread(
                              notification.id
                            )
                          }
                        >
                          Mark as unread
                        </button>

                      )}

                      {/* DELETE */}

                      <button
                        className="notification-delete-button"
                        title="Delete notification"
                        onClick={() =>
                          deleteNotification(
                            notification.id
                          )
                        }
                      >
                        🗑
                      </button>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  );
}

export default Notifications;