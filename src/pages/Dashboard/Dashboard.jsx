import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

function Dashboard() {

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const navigate = useNavigate();

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
        return value.replace(/^"|"$/g, "");
      }
    }

    return null;
  };

  // =====================================================
  // DATE HELPERS
  // =====================================================

  const formatDateKey = (date) => {

    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const getToday = () => {
    return formatDateKey(new Date());
  };

  const parseDate = (dateString) => {

    if (!dateString) {
      return null;
    }

    const parts = dateString.split("-");

    if (parts.length !== 3) {
      return null;
    }

    const year = Number(parts[0]);
    const month = Number(parts[1]) - 1;
    const day = Number(parts[2]);

    const date = new Date(
      year,
      month,
      day
    );

    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date;
  };

  // =====================================================
  // FORMAT DATE
  // =====================================================

  const formatDisplayDate = (dateString) => {

    const date = parseDate(dateString);

    if (!date) {
      return "No date";
    }

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (timeString) => {

    if (!timeString) {
      return "";
    }

    const parts = timeString.split(":");

    if (parts.length < 2) {
      return timeString;
    }

    const hour = Number(parts[0]);
    const minute = Number(parts[1]);

    if (
      Number.isNaN(hour) ||
      Number.isNaN(minute)
    ) {
      return timeString;
    }

    const date = new Date();

    date.setHours(
      hour,
      minute,
      0,
      0
    );

    return date.toLocaleTimeString(
      "en-IN",
      {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }
    );
  };

  // =====================================================
  // TASK STATUS
  // =====================================================

  const isCompleted = (task) => {

    return (
      task?.status || "PENDING"
    ).toUpperCase() === "COMPLETED";
  };

  // =====================================================
  // CALCULATE STUDY HOURS
  // =====================================================

  const calculateTaskHours = (task) => {

    if (
      !task?.startTime ||
      !task?.endTime
    ) {
      return 0;
    }

    const startParts =
      task.startTime.split(":");

    const endParts =
      task.endTime.split(":");

    if (
      startParts.length < 2 ||
      endParts.length < 2
    ) {
      return 0;
    }

    const startHour =
      Number(startParts[0]);

    const startMinute =
      Number(startParts[1]);

    const endHour =
      Number(endParts[0]);

    const endMinute =
      Number(endParts[1]);

    if (
      Number.isNaN(startHour) ||
      Number.isNaN(startMinute) ||
      Number.isNaN(endHour) ||
      Number.isNaN(endMinute)
    ) {
      return 0;
    }

    const start =
      startHour * 60 +
      startMinute;

    const end =
      endHour * 60 +
      endMinute;

    let minutes = end - start;

    if (minutes < 0) {
      minutes += 24 * 60;
    }

    return minutes / 60;
  };

  // =====================================================
  // LOAD TASKS
  // =====================================================

  useEffect(() => {
    loadTasks();
  }, []);

  const loadTasks = async () => {

    try {

      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {

        setError(
          "Please login before opening Dashboard."
        );

        setLoading(false);
        return;
      }

      const response = await fetch(
        "http://localhost:8080/api/tasks",
        {
          method: "GET",
          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`
          }
        }
      );

      const responseText =
        await response.text();

      if (response.status === 401) {

        throw new Error(
          "Your login session has expired. Please login again."
        );
      }

      if (response.status === 403) {

        throw new Error(
          "Access denied. Please login again."
        );
      }

      if (!response.ok) {

        throw new Error(
          responseText ||
          "Unable to load tasks."
        );
      }

      const data =
        responseText
          ? JSON.parse(responseText)
          : [];

      if (Array.isArray(data)) {
        setTasks(data);
      } else {
        setTasks([]);
      }

    } catch (err) {

      console.error(
        "Dashboard loading error:",
        err
      );

      setTasks([]);

      setError(
        err.message ||
        "Unable to load tasks."
      );

    } finally {

      setLoading(false);
    }
  };

  // =====================================================
  // BASIC COUNTS
  // =====================================================

  const today = getToday();

  const totalTasks =
    tasks.length;

  const completedTasks =
    tasks.filter(
      (task) =>
        isCompleted(task)
    ).length;

  const pendingTasks =
    tasks.filter(
      (task) =>
        !isCompleted(task)
    ).length;

  const todayTasks =
    tasks.filter(
      (task) =>
        task?.readingDate === today
    ).length;

  const upcomingTasks =
    tasks.filter(
      (task) =>
        task?.readingDate &&
        task.readingDate > today
    ).length;

  const todayCompletedTasks =
    tasks.filter(
      (task) =>
        task?.readingDate === today &&
        isCompleted(task)
    ).length;

  // =====================================================
  // STUDY STREAK
  // =====================================================

  const studyStreak =
    useMemo(() => {

      const studyDates =
        new Set(
          tasks
            .filter(
              (task) =>
                task?.readingDate &&
                isCompleted(task)
            )
            .map(
              (task) =>
                task.readingDate
            )
        );

      let streak = 0;

      const currentDate =
        new Date();

      while (true) {

        const dateKey =
          formatDateKey(currentDate);

        if (!studyDates.has(dateKey)) {
          break;
        }

        streak++;

        currentDate.setDate(
          currentDate.getDate() - 1
        );
      }

      return streak;

    }, [tasks]);

  // =====================================================
  // UPCOMING STUDIES
  // =====================================================

  const upcomingStudies =
    useMemo(() => {

      return [...tasks]
        .filter(
          (task) =>
            task?.readingDate &&
            task.readingDate >= today &&
            !isCompleted(task)
        )
        .sort(
          (a, b) => {

            const dateA =
              `${a.readingDate} ${a.startTime || ""}`;

            const dateB =
              `${b.readingDate} ${b.startTime || ""}`;

            return dateA.localeCompare(dateB);
          }
        );

    }, [tasks, today]);

  // =====================================================
  // GET START OF WEEK
  // =====================================================

  const getStartOfWeek = () => {

    const date = new Date();

    const day = date.getDay();

    const difference =
      day === 0
        ? -6
        : 1 - day;

    date.setDate(
      date.getDate() + difference
    );

    date.setHours(
      0,
      0,
      0,
      0
    );

    return date;
  };

  // =====================================================
  // WEEKLY DATA
  // =====================================================

  const weeklyData =
    useMemo(() => {

      const startOfWeek =
        getStartOfWeek();

      const days = [];

      for (let i = 0; i < 7; i++) {

        const date =
          new Date(startOfWeek);

        date.setDate(
          startOfWeek.getDate() + i
        );

        const dateKey =
          formatDateKey(date);

        const dayTasks =
          tasks.filter(
            (task) =>
              task?.readingDate === dateKey
          );

        const completed =
          dayTasks.filter(
            (task) =>
              isCompleted(task)
          ).length;

        const hours =
          dayTasks.reduce(
            (total, task) =>
              total +
              calculateTaskHours(task),
            0
          );

        days.push({

          date,

          dateKey,

          name:
            date.toLocaleDateString(
              "en-IN",
              {
                weekday: "short"
              }
            ),

          fullName:
            date.toLocaleDateString(
              "en-IN",
              {
                weekday: "long"
              }
            ),

          tasks:
            dayTasks.length,

          completed,

          hours
        });
      }

      return days;

    }, [tasks]);

  // =====================================================
  // WEEK TOTAL HOURS
  // =====================================================

  const weeklyTotalHours =
    weeklyData.reduce(
      (total, day) =>
        total + day.hours,
      0
    );

  // =====================================================
  // MAX WEEKLY HOURS
  // =====================================================

  const maxWeeklyHours =
    Math.max(
      ...weeklyData.map(
        (day) => day.hours
      ),
      1
    );

  // =====================================================
  // NAVIGATION
  // =====================================================

  const openMyTasks = () => {
    navigate("/my-tasks");
  };

  const goHome = () => {
    navigate("/Homepage");
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {

    return (
      <div className="dashboard-page">

        <div className="dashboard-loading">

          <div className="loading-spinner"></div>

          <p>
            Loading Dashboard...
          </p>

        </div>

      </div>
    );
  }

  // =====================================================
  // RENDER
  // =====================================================

  return (

    <div className="dashboard-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="dashboard-header">

        <div className="dashboard-header-left">

          <button
            type="button"
            className="dashboard-home-btn"
            onClick={goHome}
          >
            ← Home
          </button>

          <div>

            <h1>
              Dashboard
            </h1>

            <p>
              Track your study progress
              and manage your study sessions.
            </p>

          </div>

        </div>

        <div className="dashboard-date">

          {new Date().toLocaleDateString(
            "en-IN",
            {
              weekday: "long",
              day: "2-digit",
              month: "short",
              year: "numeric"
            }
          )}

        </div>

      </div>

      {/* =================================================
          ERROR
      ================================================= */}

      {error && (

        <div className="dashboard-error">

          <div className="error-icon">
            ⚠️
          </div>

          <h2>
            Unable to Load Dashboard
          </h2>

          <p>
            {error}
          </p>

          <button
            className="retry-button"
            onClick={loadTasks}
          >
            Try Again
          </button>

        </div>
      )}

      {!error && (

        <>

          {/* =================================================
              STAT CARDS
          ================================================= */}

          <div className="dashboard-stats">

            {/* TODAY */}

            <button
              type="button"
              className="stat-card today-card"
              onClick={() =>
                navigate(
                  "/my-tasks?date=TODAY"
                )
              }
            >

              <div className="stat-icon">
                📚
              </div>

              <div className="stat-content">

                <span>
                  Today's Tasks
                </span>

                <strong>
                  {todayTasks}
                </strong>

                <small>
                  {todayCompletedTasks} completed
                </small>

              </div>

            </button>

            {/* TOTAL */}

            <button
              type="button"
              className="stat-card total-card"
              onClick={openMyTasks}
            >

              <div className="stat-icon">
                📋
              </div>

              <div className="stat-content">

                <span>
                  Total Tasks
                </span>

                <strong>
                  {totalTasks}
                </strong>

                <small>
                  All study tasks
                </small>

              </div>

            </button>

            {/* PENDING */}

            <button
              type="button"
              className="stat-card pending-card"
              onClick={() =>
                navigate(
                  "/my-tasks?status=PENDING"
                )
              }
            >

              <div className="stat-icon">
                ⏳
              </div>

              <div className="stat-content">

                <span>
                  Pending
                </span>

                <strong>
                  {pendingTasks}
                </strong>

                <small>
                  Tasks remaining
                </small>

              </div>

            </button>

            {/* COMPLETED */}

            <button
              type="button"
              className="stat-card completed-card"
              onClick={() =>
                navigate(
                  "/my-tasks?status=COMPLETED"
                )
              }
            >

              <div className="stat-icon">
                ✅
              </div>

              <div className="stat-content">

                <span>
                  Completed
                </span>

                <strong>
                  {completedTasks}
                </strong>

                <small>
                  Successfully completed
                </small>

              </div>

            </button>

            {/* STREAK */}

            <div className="stat-card streak-card">

              <div className="stat-icon">
                🔥
              </div>

              <div className="stat-content">

                <span>
                  Study Streak
                </span>

                <strong>
                  {studyStreak}
                </strong>

                <small>
                  Consecutive days
                </small>

              </div>

            </div>

          </div>

          {/* =================================================
              MAIN GRID
          ================================================= */}

          <div className="dashboard-main-grid">

            {/* =================================================
                UPCOMING STUDIES
            ================================================= */}

            <div className="dashboard-card upcoming-card">

              <div className="card-heading">

                <div>

                  <h2>
                    Upcoming Studies
                  </h2>

                  <p>
                    All your upcoming study sessions
                  </p>

                </div>

                <button
                  type="button"
                  className="upcoming-count"
                  onClick={openMyTasks}
                >
                  {upcomingTasks}
                </button>

              </div>

              {/* SCROLLABLE AREA */}

              <div className="upcoming-studies-list">

                {upcomingStudies.length === 0 ? (

                  <div className="empty-next-study">

                    <div className="empty-next-icon">
                      🎉
                    </div>

                    <h3>
                      No upcoming studies
                    </h3>

                    <p>
                      You are all caught up!
                    </p>

                  </div>

                ) : (

                  upcomingStudies.map(
                    (task, index) => (

                      <div
                        className="upcoming-study-item"
                        key={
                          task.id ??
                          `${task.readingDate}-${task.startTime}-${index}`
                        }
                      >

                        <div className="next-study-icon">
                          📖
                        </div>

                        <div className="next-study-info">

                          <h3>
                            {task.subject ||
                              "Study Task"}
                          </h3>

                          <p className="next-topic">
                            {task.topic ||
                              "No topic"}
                          </p>

                          <div className="next-study-details">

                            <span>
                              📅{" "}
                              {formatDisplayDate(
                                task.readingDate
                              )}
                            </span>

                            <span>
                              ⏰{" "}
                              {formatTime(
                                task.startTime
                              )}
                              {" - "}
                              {formatTime(
                                task.endTime
                              )}
                            </span>

                          </div>

                        </div>

                      </div>

                    )
                  )

                )}

              </div>

            </div>

            {/* =================================================
                WEEKLY STUDY PROGRESS
            ================================================= */}

            <div className="dashboard-card weekly-progress-card">

              <div className="card-heading">

                <div>

                  <h2>
                    Weekly Study Progress
                  </h2>

                  <p>
                    Study hours this week
                  </p>

                </div>

                <div className="week-total">
                  {weeklyTotalHours.toFixed(1)} hrs
                </div>

              </div>

              <div className="weekly-chart">

                {weeklyData.map(
                  (day) => {

                    const barHeight =
                      day.hours > 0
                        ? Math.max(
                            (
                              day.hours /
                              maxWeeklyHours
                            ) * 100,
                            5
                          )
                        : 0;

                    return (

                      <div
                        className="chart-day"
                        key={day.dateKey}
                      >

                        <div className="chart-value">
                          {day.hours > 0
                            ? `${day.hours.toFixed(1)}h`
                            : "0h"}
                        </div>

                        <div className="chart-bar-area">

                          <div
                            className="chart-bar"
                            style={{
                              height:
                                `${barHeight}%`
                            }}
                          ></div>

                        </div>

                        <div className="chart-label">
                          {day.name}
                        </div>

                      </div>

                    );
                  }
                )}

              </div>

            </div>

          </div>

          {/* =================================================
              WEEKLY DETAILS
          ================================================= */}

          <div className="dashboard-card weekly-details-card">

            <div className="card-heading">

              <div>

                <h2>
                  Weekly Details
                </h2>

                <p>
                  Daily study activity
                </p>

              </div>

              <div className="week-total">
                {weeklyTotalHours.toFixed(1)} hrs
              </div>

            </div>

            <div className="weekly-list">

              {weeklyData.map(
                (day) => {

                  const progress =
                    day.tasks > 0
                      ? (
                          day.completed /
                          day.tasks
                        ) * 100
                      : 0;

                  return (

                    <div
                      className="weekly-list-row"
                      key={day.dateKey}
                    >

                      <div className="weekly-day">

                        <strong>
                          {day.fullName}
                        </strong>

                        <span>
                          {formatDisplayDate(
                            day.dateKey
                          )}
                        </span>

                      </div>

                      <div className="weekly-progress">

                        <div className="progress-track">

                          <div
                            className="progress-fill"
                            style={{
                              width:
                                `${progress}%`
                            }}
                          ></div>

                        </div>

                      </div>

                      <div className="weekly-hours">

                        <strong>
                          {day.hours.toFixed(1)} hrs
                        </strong>

                        <span>
                          {" "}•{" "}
                          {day.completed}/
                          {day.tasks}
                        </span>

                      </div>

                    </div>

                  );
                }
              )}

            </div>

          </div>

          {/* =================================================
              QUICK ACTIONS
          ================================================= */}

          <div className="dashboard-actions">

            <button
              type="button"
              className="dashboard-action-btn create-action"
              onClick={() =>
                navigate("/create-task")
              }
            >
              ➕ Create New Task
            </button>

            <button
              type="button"
              className="dashboard-action-btn"
              onClick={openMyTasks}
            >
              📋 View All Tasks
            </button>

            <button
              type="button"
              className="dashboard-action-btn"
              onClick={() =>
                navigate("/calendar")
              }
            >
              📅 Open Calendar
            </button>

          </div>

        </>

      )}

    </div>
  );
}

export default Dashboard;