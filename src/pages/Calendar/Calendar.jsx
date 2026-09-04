import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Calendar.css";

function Calendar() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [currentDate, setCurrentDate] = useState(new Date());

  const [selectedDate, setSelectedDate] = useState(
    formatDateKey(new Date())
  );

  // =====================================================
  // FORMAT DATE AS YYYY-MM-DD
  // =====================================================

  function formatDateKey(date) {
    const year = date.getFullYear();

    const month = String(
      date.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      date.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  }

  // =====================================================
  // GET TODAY
  // =====================================================

  const getToday = () => {
    return formatDateKey(new Date());
  };

  // =====================================================
  // NORMALIZE DATE
  // =====================================================

  const normalizeDate = (dateValue) => {
    if (!dateValue) {
      return "";
    }

    if (typeof dateValue === "string") {
      return dateValue.substring(0, 10);
    }

    return "";
  };

  // =====================================================
  // FORMAT DISPLAY DATE
  // =====================================================

  const formatDisplayDate = (dateString) => {
    if (!dateString) {
      return "Date not specified";
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // FORMAT MONTH
  // =====================================================

  const formatMonth = () => {
    return currentDate.toLocaleDateString(
      "en-IN",
      {
        month: "long",
        year: "numeric",
      }
    );
  };

  // =====================================================
  // FORMAT TIME
  // =====================================================

  const formatTime = (time) => {
    if (!time) {
      return "Not specified";
    }

    try {
      const [hours, minutes] =
        time.split(":");

      const date = new Date();

      date.setHours(
        Number(hours),
        Number(minutes),
        0,
        0
      );

      return date.toLocaleTimeString(
        "en-IN",
        {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }
      );
    } catch {
      return time;
    }
  };

  // =====================================================
  // CHECK RECURRING TASK
  // Same logic as MyTasks
  // =====================================================

  const isRecurring = (task) => {
    if (!task.recurrenceType) {
      return false;
    }

    return (
      task.recurrenceType.toUpperCase() !==
      "ONE_TIME"
    );
  };

  // =====================================================
  // GET JWT TOKEN
  // =====================================================

  const getToken = () => {
    const possibleKeys = [
      "token",
      "jwtToken",
      "accessToken",
    ];

    for (const key of possibleKeys) {
      const value =
        localStorage.getItem(key);

      if (value) {
        return value.replace(
          /^"|"$/g,
          ""
        );
      }
    }

    return null;
  };

  // =====================================================
  // COMMON HEADERS
  // =====================================================

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : {}),
    };
  };

  // =====================================================
  // LOAD TASKS + FUTURE OCCURRENCES
  // =====================================================

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError("");

    const token = getToken();

    if (!token) {
      setError(
        "Your session has expired. Please login again."
      );

      setLoading(false);
      return;
    }

    try {
      // =================================================
      // 1. LOAD NORMAL TASKS
      // =================================================

      const response = await fetch(
        "http://localhost:8080/api/tasks",
        {
          method: "GET",
          headers: getHeaders(),
        }
      );

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            "Your session has expired. Please login again."
          );
        }

        throw new Error(
          "Unable to load your study tasks."
        );
      }

      const data = await response.json();

      if (!Array.isArray(data)) {
        setTasks([]);
        return;
      }

      // =================================================
      // 2. START WITH NORMAL TASKS
      // =================================================

      const allCalendarTasks = [...data];

      // =================================================
      // 3. LOAD FUTURE OCCURRENCES
      //    FOR RECURRING TASKS
      // =================================================

      const recurringTasks = data.filter(
        (task) => isRecurring(task)
      );

      if (recurringTasks.length > 0) {
        const occurrenceResults =
          await Promise.all(
            recurringTasks.map(
              async (task) => {
                try {
                  const occurrenceResponse =
                    await fetch(
                      `http://localhost:8080/api/tasks/${task.id}/occurrences/future`,
                      {
                        method: "GET",
                        headers: getHeaders(),
                      }
                    );

                  if (
                    !occurrenceResponse.ok
                  ) {
                    return [];
                  }

                  const occurrenceData =
                    await occurrenceResponse.json();

                  if (
                    !Array.isArray(
                      occurrenceData
                    )
                  ) {
                    return [];
                  }

                  // =====================================
                  // ONLY FUTURE OCCURRENCES
                  // Same logic as MyTasks Upcoming
                  // =====================================

                  return occurrenceData
                    .filter(
                      (occurrence) =>
                        occurrence.occurrenceDate &&
                        occurrence.occurrenceDate >
                          getToday()
                    )
                    .map(
                      (occurrence) => ({
                        ...task,

                        readingDate:
                          occurrence.occurrenceDate,

                        startTime:
                          occurrence.startTime ||
                          task.startTime,

                        endTime:
                          occurrence.endTime ||
                          task.endTime,

                        status:
                          occurrence.status ||
                          task.status ||
                          "PENDING",

                        parentTaskId:
                          task.id,

                        occurrenceId:
                          occurrence.id,

                        isOccurrence: true,
                      })
                    );
                } catch (err) {
                  console.error(
                    `Unable to load occurrences for task ${task.id}:`,
                    err
                  );

                  return [];
                }
              }
            )
          );

        // ===============================================
        // ADD ALL FUTURE OCCURRENCES TO CALENDAR
        // ===============================================

        const futureOccurrences =
          occurrenceResults.flat();

        allCalendarTasks.push(
          ...futureOccurrences
        );
      }

      // =================================================
      // REMOVE DUPLICATE OCCURRENCES
      // =================================================

      const uniqueTasks = [];

      const taskKeys = new Set();

      allCalendarTasks.forEach(
        (task) => {
          const date =
            normalizeDate(
              task.readingDate
            );

          let key;

          if (task.isOccurrence) {
            key = `occurrence-${task.occurrenceId}`;
          } else {
            key = `task-${task.id}-${date}`;
          }

          if (!taskKeys.has(key)) {
            taskKeys.add(key);
            uniqueTasks.push(task);
          }
        }
      );

      console.log(
        "Calendar tasks received:",
        uniqueTasks
      );

      console.log(
        "Calendar task dates:",
        uniqueTasks.map(
          (task) => ({
            id: task.id,
            occurrenceId:
              task.occurrenceId,
            subject:
              task.subject,
            readingDate:
              task.readingDate,
            isOccurrence:
              task.isOccurrence || false,
          })
        )
      );

      setTasks(uniqueTasks);
    } catch (error) {
      console.error(
        "Calendar fetch error:",
        error
      );

      setError(
        error.message ||
          "Unable to connect to the server."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // GET TASKS FOR SELECTED DATE
  // =====================================================

  const selectedDayTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        const taskDate =
          normalizeDate(
            task.readingDate
          );

        return (
          taskDate === selectedDate
        );
      })
      .sort((a, b) => {
        if (
          !a.startTime ||
          !b.startTime
        ) {
          return 0;
        }

        return a.startTime.localeCompare(
          b.startTime
        );
      });
  }, [
    tasks,
    selectedDate,
  ]);

  // =====================================================
  // GROUP TASKS BY DATE
  // =====================================================

  const tasksByDate = useMemo(() => {
    const grouped = {};

    tasks.forEach((task) => {
      const taskDate =
        normalizeDate(
          task.readingDate
        );

      if (!taskDate) {
        return;
      }

      if (!grouped[taskDate]) {
        grouped[taskDate] = [];
      }

      grouped[taskDate].push(task);
    });

    return grouped;
  }, [tasks]);

  // =====================================================
  // CALENDAR DAYS
  // =====================================================

  const calendarDays = useMemo(() => {
    const year =
      currentDate.getFullYear();

    const month =
      currentDate.getMonth();

    const firstDay = new Date(
      year,
      month,
      1
    );

    const lastDay = new Date(
      year,
      month + 1,
      0
    );

    let startingDay =
      firstDay.getDay();

    startingDay =
      startingDay === 0
        ? 6
        : startingDay - 1;

    const totalDays =
      lastDay.getDate();

    const days = [];

    for (
      let i = 0;
      i < startingDay;
      i++
    ) {
      days.push(null);
    }

    for (
      let day = 1;
      day <= totalDays;
      day++
    ) {
      days.push(
        new Date(
          year,
          month,
          day
        )
      );
    }

    return days;
  }, [currentDate]);

  // =====================================================
  // PREVIOUS MONTH
  // =====================================================

  const handlePreviousMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() - 1,
        1
      )
    );
  };

  // =====================================================
  // NEXT MONTH
  // =====================================================

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        1
      )
    );
  };

  // =====================================================
  // TODAY
  // =====================================================

  const handleToday = () => {
    const today = new Date();

    setCurrentDate(today);

    setSelectedDate(
      formatDateKey(today)
    );
  };

  // =====================================================
  // SELECT DATE
  // =====================================================

  const handleDateClick = (date) => {
    if (!date) {
      return;
    }

    setSelectedDate(
      formatDateKey(date)
    );
  };

  // =====================================================
  // CHECK TODAY
  // =====================================================

  const isToday = (date) => {
    if (!date) {
      return false;
    }

    return (
      formatDateKey(date) ===
      formatDateKey(new Date())
    );
  };

  // =====================================================
  // PRIORITY CLASS
  // =====================================================

  const getPriorityClass = (
    priority
  ) => {
    if (!priority) {
      return "calendar-priority-medium";
    }

    return `calendar-priority-${priority.toLowerCase()}`;
  };

  // =====================================================
  // STATUS CLASS
  // =====================================================

  const getStatusClass = (
    status
  ) => {
    if (!status) {
      return "calendar-status-pending";
    }

    return `calendar-status-${status.toLowerCase()}`;
  };

  // =====================================================
  // LOGOUT
  // =====================================================

  const handleLogout = () => {
    localStorage.removeItem("token");

    navigate("/login");
  };

  // =====================================================
  // RETURN
  // =====================================================

  return (
    <div className="calendar-page">

      {/* HEADER */}

      <header className="calendar-header">

        <button
          type="button"
          className="calendar-home-button"
          onClick={() =>
            navigate("/Homepage")
          }
        >
          ← Home
        </button>

        <div className="calendar-header-content">

          <h1>
            Study Calendar
          </h1>

          <p>
            Plan and manage your study schedule
          </p>

        </div>

        <button
          type="button"
          className="calendar-logout-button"
          onClick={handleLogout}
        >
          Logout
        </button>

      </header>

      {/* MAIN */}

      <main className="calendar-main">

        {/* ERROR */}

        {error && (
          <div className="calendar-error">

            <span>!</span>

            <p>
              {error}
            </p>

            <button
              type="button"
              onClick={() =>
                setError("")
              }
            >
              ×
            </button>

          </div>
        )}

        {/* LOADING */}

        {loading ? (
          <div className="calendar-loading">

            <span className="calendar-spinner"></span>

            <p>
              Loading your study schedule...
            </p>

          </div>
        ) : (

          <div className="calendar-layout">

            {/* CALENDAR */}

            <section className="calendar-container">

              <div className="calendar-top">

                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={
                    handlePreviousMonth
                  }
                >
                  ←
                </button>

                <div className="calendar-month-title">

                  <h2>
                    {formatMonth()}
                  </h2>

                  <p>
                    {tasks.length}{" "}
                    {tasks.length === 1
                      ? "study task"
                      : "study tasks"}
                  </p>

                </div>

                <button
                  type="button"
                  className="calendar-nav-button"
                  onClick={
                    handleNextMonth
                  }
                >
                  →
                </button>

              </div>

              {/* TODAY */}

              <div className="calendar-today-row">

                <button
                  type="button"
                  className="calendar-today-button"
                  onClick={
                    handleToday
                  }
                >
                  📅 Today
                </button>

              </div>

              {/* WEEK DAYS */}

              <div className="calendar-weekdays">

                <div>Mon</div>
                <div>Tue</div>
                <div>Wed</div>
                <div>Thu</div>
                <div>Fri</div>
                <div>Sat</div>
                <div>Sun</div>

              </div>

              {/* CALENDAR DAYS */}

              <div className="calendar-grid">

                {calendarDays.map(
                  (date, index) => {

                    if (!date) {
                      return (
                        <div
                          className="calendar-day empty"
                          key={`empty-${index}`}
                        />
                      );
                    }

                    const dateKey =
                      formatDateKey(date);

                    const dayTasks =
                      tasksByDate[
                        dateKey
                      ] || [];

                    const selected =
                      dateKey ===
                      selectedDate;

                    const today =
                      isToday(date);

                    return (
                      <button
                        type="button"
                        key={dateKey}
                        className={`
                          calendar-day
                          ${selected ? "selected" : ""}
                          ${today ? "today" : ""}
                          ${
                            dayTasks.length > 0
                              ? "has-tasks"
                              : ""
                          }
                        `}
                        onClick={() =>
                          handleDateClick(
                            date
                          )
                        }
                      >

                        <span className="calendar-day-number">
                          {date.getDate()}
                        </span>

                        {today && (
                          <span className="calendar-today-label">
                            Today
                          </span>
                        )}

                        {dayTasks.length > 0 && (
                          <div className="calendar-task-indicator">

                            <span className="calendar-task-dot"></span>

                            <span>
                              {dayTasks.length}
                            </span>

                          </div>
                        )}

                        {dayTasks.length > 0 && (
                          <div className="calendar-task-preview">

                            {dayTasks
                              .slice(0, 2)
                              .map(
                                (task) => (
                                  <span
                                    key={
                                      task.isOccurrence
                                        ? `${task.id}-${task.occurrenceId}`
                                        : task.id
                                    }
                                  >
                                    {task.subject ||
                                      "Task"}
                                  </span>
                                )
                              )}

                            {dayTasks.length > 2 && (
                              <small>
                                +
                                {dayTasks.length - 2}
                                {" "}more
                              </small>
                            )}

                          </div>
                        )}

                      </button>
                    );
                  }
                )}

              </div>

            </section>

            {/* SELECTED DATE */}

            <aside className="calendar-sidebar">

              <div className="calendar-selected-panel">

                <div className="calendar-selected-header">

                  <span className="calendar-selected-icon">
                    📅
                  </span>

                  <div>

                    <h2>
                      Selected Date
                    </h2>

                    <p>
                      {formatDisplayDate(
                        selectedDate
                      )}
                    </p>

                  </div>

                </div>

                {/* TASK COUNT */}

                <div className="calendar-task-count">

                  <strong>
                    {selectedDayTasks.length}
                  </strong>

                  <span>
                    {selectedDayTasks.length === 1
                      ? "Study Task"
                      : "Study Tasks"}
                  </span>

                </div>

                {/* NO TASKS */}

                {selectedDayTasks.length === 0 && (

                  <div className="calendar-no-tasks">

                    <div>
                      📚
                    </div>

                    <h3>
                      No Tasks
                    </h3>

                    <p>
                      You don't have any study
                      tasks scheduled for this date.
                    </p>

                    <button
                      type="button"
                      onClick={() =>
                        navigate(
                          "/create-task"
                        )
                      }
                    >
                      ➕ Create Task
                    </button>

                  </div>

                )}

                {/* SELECTED DATE TASKS */}

                {selectedDayTasks.length > 0 && (

                  <div className="calendar-selected-tasks">

                    {selectedDayTasks.map(
                      (task) => (

                        <article
                          className="calendar-task-card"
                          key={
                            task.isOccurrence
                              ? `${task.id}-${task.occurrenceId}`
                              : task.id
                          }
                        >

                          <div className="calendar-task-card-top">

                            <div>

                              <h3>
                                {task.subject ||
                                  "Untitled Subject"}
                              </h3>

                              <p>
                                {task.topic ||
                                  "No topic specified"}
                              </p>

                            </div>

                            <span
                              className={`calendar-priority ${getPriorityClass(
                                task.priority
                              )}`}
                            >
                              {task.priority ||
                                "MEDIUM"}
                            </span>

                          </div>

                          {task.description && (
                            <p className="calendar-task-description">
                              {task.description}
                            </p>
                          )}

                          <div className="calendar-task-time">

                            <span>
                              🕐
                            </span>

                            <strong>
                              {formatTime(
                                task.startTime
                              )}

                              {" - "}

                              {formatTime(
                                task.endTime
                              )}
                            </strong>

                          </div>

                          <div className="calendar-task-footer">

                            <span
                              className={`calendar-status ${getStatusClass(
                                task.status
                              )}`}
                            >
                              {task.status ||
                                "PENDING"}
                            </span>

                          </div>

                        </article>

                      )
                    )}

                  </div>

                )}

              </div>

              {/* LEGEND */}

              <div className="calendar-legend">

                <h3>
                  Calendar Guide
                </h3>

                <div className="calendar-legend-item">

                  <span className="legend-today"></span>

                  <span>
                    Today
                  </span>

                </div>

                <div className="calendar-legend-item">

                  <span className="legend-selected"></span>

                  <span>
                    Selected date
                  </span>

                </div>

                <div className="calendar-legend-item">

                  <span className="legend-task"></span>

                  <span>
                    Date with tasks
                  </span>

                </div>

              </div>

            </aside>

          </div>
        )}

      </main>

    </div>
  );
}

export default Calendar;