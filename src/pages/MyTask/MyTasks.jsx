import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./MyTasks.css";
import API_URL from "../../api/api";

function MyTasks() {
  const navigate = useNavigate();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // =====================================================
  // FUTURE OCCURRENCES
  // Used ONLY for UPCOMING filter
  // =====================================================

  const [upcomingTasks, setUpcomingTasks] = useState([]);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // =====================================================
  // MY TASKS INFORMATION MESSAGE
  // =====================================================

  const [showCompleteInfo, setShowCompleteInfo] = useState(true);

  // ==============================
  // FILTER STATES
  // ==============================

  const [statusFilter, setStatusFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [dateFilter, setDateFilter] = useState("ALL");
  const [searchText, setSearchText] = useState("");

  // ==============================
  // EDIT MODAL STATES
  // ==============================

  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);

  const [occurrences, setOccurrences] = useState([]);
  const [selectedOccurrence, setSelectedOccurrence] = useState(null);

  const [editMode, setEditMode] = useState("SERIES");

  const [editStartTime, setEditStartTime] = useState("");
  const [editEndTime, setEditEndTime] = useState("");

  const [editError, setEditError] = useState("");
  const [editSuccess, setEditSuccess] = useState("");

  // ==============================
  // GET JWT TOKEN
  // ==============================

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

  // ==============================
  // COMMON HEADERS
  // ==============================

  const getHeaders = () => {
    const token = getToken();

    return {
      "Content-Type": "application/json",
      ...(token
        ? {
            Authorization: `Bearer ${token}`
          }
        : {})
    };
  };

  // ==============================
  // GET TODAY
  // ==============================

  const getToday = () => {
    const today = new Date();

    const year = today.getFullYear();

    const month = String(
      today.getMonth() + 1
    ).padStart(2, "0");

    const day = String(
      today.getDate()
    ).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  // ==============================
  // CHECK RECURRING TASK
  // ==============================

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
  // LOAD FUTURE OCCURRENCES
  // Used ONLY when Upcoming is selected.
  // =====================================================

  const loadUpcomingOccurrences = async (taskList) => {
    try {
      const recurringTasks = taskList.filter(
        (task) => isRecurring(task)
      );

      if (recurringTasks.length === 0) {
        setUpcomingTasks([]);
        return;
      }

      const occurrenceResults =
        await Promise.all(
          recurringTasks.map(async (task) => {
            try {
              const response = await fetch(
                `${API_URL}/api/tasks/${task.id}/occurrences/future`,
                {
                  method: "GET",
                  headers: getHeaders()
                }
              );

              if (!response.ok) {
                return [];
              }

              const data =
                await response.json();

              if (!Array.isArray(data)) {
                return [];
              }

              return data
                .filter(
                  (occurrence) =>
                    occurrence.occurrenceDate &&
                    occurrence.occurrenceDate >
                      getToday()
                )
                .map((occurrence) => ({
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

                  parentTaskId: task.id,

                  occurrenceId:
                    occurrence.id,

                  isOccurrence: true
                }));
            } catch (err) {
              console.error(
                `Unable to load occurrences for task ${task.id}:`,
                err
              );

              return [];
            }
          })
        );

      const allUpcomingOccurrences =
        occurrenceResults.flat();

      setUpcomingTasks(
        allUpcomingOccurrences
      );
    } catch (err) {
      console.error(
        "Upcoming occurrence loading error:",
        err
      );

      setUpcomingTasks([]);
    }
  };

  // ==============================
  // LOAD TASKS
  // ==============================

  useEffect(() => {
    const token = getToken();

    if (!token) {
      setError(
        "Please login before opening My Tasks."
      );

      setLoading(false);
      return;
    }

    loadTasks();
  }, []);

  const loadTasks = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        throw new Error(
          "No login token found. Please login again."
        );
      }

      const response = await fetch(
        `${API_URL}/api/tasks`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
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
          "Access denied. Backend rejected your JWT token."
        );
      }

      if (!response.ok) {
        throw new Error(
          responseText ||
            `Failed to load study tasks. Status: ${response.status}`
        );
      }

      let data = [];

      try {
        data = responseText
          ? JSON.parse(responseText)
          : [];
      } catch {
        throw new Error(
          "Backend returned invalid task data."
        );
      }

      if (Array.isArray(data)) {
        setTasks(data);

        await loadUpcomingOccurrences(data);
      } else {
        setTasks([]);
        setUpcomingTasks([]);
      }
    } catch (err) {
      console.error(
        "Load tasks error:",
        err
      );

      setTasks([]);
      setUpcomingTasks([]);

      setError(
        err.message ||
          "Unable to load tasks."
      );
    } finally {
      setLoading(false);
    }
  };

  // ==============================
  // FORMAT DATE
  // ==============================

  const formatDate = (dateString) => {
    if (!dateString) {
      return "-";
    }

    const date = new Date(
      `${dateString}T00:00:00`
    );

    return date.toLocaleDateString(
      "en-IN",
      {
        day: "2-digit",
        month: "short",
        year: "numeric"
      }
    );
  };

  // ==============================
  // FORMAT TIME
  // ==============================

  const formatTime = (timeString) => {
    if (!timeString) {
      return "-";
    }

    const [hours, minutes] =
      timeString.split(":");

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
        hour12: true
      }
    );
  };

  // ==============================
  // PRIORITY CSS CLASS
  // ==============================

  const getPriorityClass = (priority) => {
    if (!priority) {
      return "priority-low";
    }

    switch (priority.toUpperCase()) {
      case "HIGH":
        return "priority-high";

      case "MEDIUM":
        return "priority-medium";

      case "LOW":
        return "priority-low";

      default:
        return "priority-low";
    }
  };

  // ==============================
  // STATUS CSS CLASS
  // ==============================

  const getStatusClass = (status) => {
    if (
      status &&
      status.toUpperCase() === "COMPLETED"
    ) {
      return "status-completed";
    }

    return "status-pending";
  };

  // ==============================
  // RECURRENCE LABEL
  // ==============================

  const getRecurrenceLabel = (task) => {
    if (!task.recurrenceType) {
      return "One Time";
    }

    const type =
      task.recurrenceType.toUpperCase();

    switch (type) {
      case "ONE_TIME":
        return "One Time";

      case "DAILY":
        return "Daily";

      case "WEEKLY":
        return "Weekly";

      case "MONTHLY":
        return "Monthly";

      case "CUSTOM":
        return "Custom";

      default:
        return task.recurrenceType;
    }
  };

  // ==============================
  // FILTER TASKS
  // ==============================

  const filteredTasks = (
    dateFilter === "UPCOMING"
      ? upcomingTasks
      : tasks
  ).filter((task) => {
    const search =
      searchText.trim().toLowerCase();

    // ==============================
    // SEARCH FILTER
    // ==============================

    if (search) {
      const subject =
        (task.subject || "").toLowerCase();

      const topic =
        (task.topic || "").toLowerCase();

      const description =
        (task.description || "").toLowerCase();

      if (
        !subject.includes(search) &&
        !topic.includes(search) &&
        !description.includes(search)
      ) {
        return false;
      }
    }

    // ==============================
    // STATUS FILTER
    // ==============================

    const taskStatus = (
      task.status || "PENDING"
    ).toUpperCase();

    if (
      statusFilter !== "ALL" &&
      taskStatus !== statusFilter
    ) {
      return false;
    }

    // ==============================
    // PRIORITY FILTER
    // ==============================

    const taskPriority = (
      task.priority || "LOW"
    ).toUpperCase();

    if (
      priorityFilter !== "ALL" &&
      taskPriority !== priorityFilter
    ) {
      return false;
    }

    // ==============================
    // DATE FILTER
    // ==============================

    const today = getToday();
    const taskDate = task.readingDate;

    // ==============================
    // UPCOMING
    // ==============================

    if (dateFilter === "UPCOMING") {
      if (
        !taskDate ||
        taskDate <= today
      ) {
        return false;
      }

      return true;
    }

    // ==============================
    // TODAY
    // ==============================

    if (dateFilter === "TODAY") {
      if (taskDate !== today) {
        return false;
      }
    }

    // ==============================
    // OVERDUE
    // ==============================

    if (dateFilter === "OVERDUE") {
      if (
        !taskDate ||
        taskDate >= today
      ) {
        return false;
      }

      if (taskStatus === "COMPLETED") {
        return false;
      }
    }

    return true;
  });

  // ==============================
  // TASK COUNTS
  // ==============================

  const totalTasks = tasks.length;

  const completedTasks = tasks.filter(
    (task) =>
      (
        task.status || ""
      ).toUpperCase() === "COMPLETED"
  ).length;

  const pendingTasks = tasks.filter(
    (task) =>
      (
        task.status || "PENDING"
      ).toUpperCase() !== "COMPLETED"
  ).length;

  // ==============================
  // COMPLETE TASK
  // ==============================

  const completeTask = async (taskId) => {
    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/tasks/${taskId}/complete`,
        {
          method: "PUT",
          headers: getHeaders()
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            "Unable to complete task."
        );
      }

      setSuccess(
        "Task marked as completed."
      );

      await loadTasks();
    } catch (err) {
      console.error(
        "Complete task error:",
        err
      );

      setError(
        err.message ||
          "Unable to complete task."
      );
    }
  };

  // ==============================
  // DELETE TASK
  // ==============================

  const deleteTask = async (taskId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this study task?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");
      setSuccess("");

      const response = await fetch(
        `${API_URL}/api/tasks/${taskId}`,
        {
          method: "DELETE",
          headers: getHeaders()
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            "Unable to delete task."
        );
      }

      setSuccess(
        "Study task deleted successfully."
      );

      await loadTasks();
    } catch (err) {
      console.error(
        "Delete task error:",
        err
      );

      setError(
        err.message ||
          "Unable to delete task."
      );
    }
  };

  // ==============================
  // OPEN EDIT MODAL
  // ==============================

  const openEditModal = async (task) => {
    setSelectedTask(task);
    setSelectedOccurrence(null);
    setEditMode("SERIES");

    setEditStartTime(
      task.startTime || ""
    );

    setEditEndTime(
      task.endTime || ""
    );

    setEditError("");
    setEditSuccess("");

    setError("");
    setSuccess("");

    setShowEditModal(true);

    if (isRecurring(task)) {
      try {
        const response = await fetch(
          `${API_URL}/api/tasks/${task.id}/occurrences/future`,
          {
            method: "GET",
            headers: getHeaders()
          }
        );

        if (!response.ok) {
          const message =
            await response.text();

          throw new Error(
            message ||
              "Unable to load task occurrences."
          );
        }

        const data =
          await response.json();

        setOccurrences(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "Occurrence loading error:",
          err
        );

        setOccurrences([]);

        setEditError(
          err.message ||
            "Unable to load occurrences."
        );
      }
    } else {
      setOccurrences([]);
    }
  };

  // ==============================
  // CLOSE EDIT MODAL
  // ==============================

  const closeEditModal = () => {
    setShowEditModal(false);
    setSelectedTask(null);
    setSelectedOccurrence(null);
    setOccurrences([]);

    setEditMode("SERIES");

    setEditStartTime("");
    setEditEndTime("");

    setEditError("");
    setEditSuccess("");
  };

  // ==============================
  // SELECT OCCURRENCE
  // ==============================

  const selectOccurrence = (occurrence) => {
    setSelectedOccurrence(
      occurrence
    );

    setEditMode("OCCURRENCE");

    setEditStartTime(
      occurrence.startTime || ""
    );

    setEditEndTime(
      occurrence.endTime || ""
    );

    setEditError("");
    setEditSuccess("");
  };

  // ==============================
  // VALIDATE EDIT TIME
  // ==============================

  const validateEditTime = () => {
    setEditError("");

    if (!editStartTime) {
      setEditError(
        "Please select a start time."
      );

      return false;
    }

    if (!editEndTime) {
      setEditError(
        "Please select an end time."
      );

      return false;
    }

    if (editEndTime <= editStartTime) {
      setEditError(
        "End time must be after start time."
      );

      return false;
    }

    const [startHour, startMinute] =
      editStartTime
        .split(":")
        .map(Number);

    const [endHour, endMinute] =
      editEndTime
        .split(":")
        .map(Number);

    const startTotalMinutes =
      startHour * 60 +
      startMinute;

    const endTotalMinutes =
      endHour * 60 +
      endMinute;

    const studyDurationMinutes =
      endTotalMinutes -
      startTotalMinutes;

    if (studyDurationMinutes < 30) {
      setEditError(
        "Please make sure your study session is at least 30 minutes long."
      );

      return false;
    }

    return true;
  };

  // ==============================
  // SAVE OCCURRENCE
  // ==============================

  const saveOccurrence = async () => {
    setEditError("");
    setEditSuccess("");

    if (!selectedOccurrence) {
      setEditError(
        "Please select an occurrence."
      );

      return;
    }

    if (!validateEditTime()) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/tasks/occurrences/${selectedOccurrence.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify({
            startTime: editStartTime,
            endTime: editEndTime
          })
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            "Unable to update occurrence."
        );
      }

      let updatedOccurrence = null;

      try {
        updatedOccurrence =
          responseText
            ? JSON.parse(responseText)
            : null;
      } catch {
        updatedOccurrence = null;
      }

      if (updatedOccurrence) {
        setOccurrences(
          (previous) =>
            previous.map(
              (occurrence) =>
                occurrence.id ===
                updatedOccurrence.id
                  ? updatedOccurrence
                  : occurrence
            )
        );

        setSelectedOccurrence(
          updatedOccurrence
        );
      }

      setEditSuccess(
        "Changes saved successfully."
      );

      await loadTasks();
    } catch (err) {
      console.error(
        "Update occurrence error:",
        err
      );

      setEditError(
        err.message ||
          "Unable to save changes."
      );
    }
  };

  // ==============================
  // SAVE ENTIRE SERIES
  // ==============================

  const saveSeries = async () => {
    setEditError("");
    setEditSuccess("");

    if (!selectedTask) {
      return;
    }

    if (!validateEditTime()) {
      return;
    }

    try {
      const updatedTask = {
        subject: selectedTask.subject,
        topic: selectedTask.topic,
        description: selectedTask.description,
        priority: selectedTask.priority,
        readingDate: selectedTask.readingDate,
        startTime: editStartTime,
        endTime: editEndTime,
        deadline: selectedTask.deadline,
        recurrenceType:
          selectedTask.recurrenceType,
        recurrenceDays:
          selectedTask.recurrenceDays,
        recurrenceDayOfMonth:
          selectedTask.recurrenceDayOfMonth,
        recurrenceEndDate:
          selectedTask.recurrenceEndDate,
        status: selectedTask.status
      };

      const response = await fetch(
        `${API_URL}/api/tasks/${selectedTask.id}`,
        {
          method: "PUT",
          headers: getHeaders(),
          body: JSON.stringify(updatedTask)
        }
      );

      const responseText =
        await response.text();

      if (!response.ok) {
        throw new Error(
          responseText ||
            "Unable to update task."
        );
      }

      await loadTasks();

      if (isRecurring(selectedTask)) {
        const occurrenceResponse =
          await fetch(
            `${API_URL}/api/tasks/${selectedTask.id}/occurrences/future`,
            {
              method: "GET",
              headers: getHeaders()
            }
          );

        if (occurrenceResponse.ok) {
          const data =
            await occurrenceResponse.json();

          setOccurrences(
            Array.isArray(data)
              ? data
              : []
          );
        }
      }

      setSelectedTask(
        (previous) =>
          previous
            ? {
                ...previous,
                startTime:
                  editStartTime,
                endTime:
                  editEndTime
              }
            : previous
      );

      setEditSuccess(
        "Changes saved successfully."
      );

      setEditError("");
    } catch (err) {
      console.error(
        "Update series error:",
        err
      );

      setEditError(
        err.message ||
          "Unable to save changes."
      );
    }
  };

  // ==============================
  // RETURN UI
  // ==============================

  return (
    <div className="my-tasks-page">

      {/* HEADER */}

      <div className="my-tasks-header">

        <div className="header-left">

          <button
            type="button"
            className="home-btn"
            onClick={() =>
              navigate("/Homepage")
            }
          >
            ← Home
          </button>

          <div>
            <h1>My Tasks</h1>

            <p>
              Manage your study sessions
              and recurring schedules.
            </p>
          </div>

        </div>

      </div>

      {/* =====================================================
          COMPLETE BUTTON INFORMATION MESSAGE
          Displays every time My Tasks page is opened
      ===================================================== */}

      {showCompleteInfo && (
        <div className="complete-info-message">

          <span>
            Sure to click Complete. Only after clicking Complete,
            your Progress and Dashboard will be updated.
          </span>

          <button
            type="button"
            className="complete-info-close"
            onClick={() =>
              setShowCompleteInfo(false)
            }
            aria-label="Close message"
          >
            ×
          </button>

        </div>
      )}

      {/* ERROR MESSAGE */}

      {error && (
        <div className="task-error">
          {error}
        </div>
      )}

      {/* SUCCESS MESSAGE */}

      {success && (
        <div className="task-success">
          {success}
        </div>
      )}

      {/* SUMMARY CARDS */}

      <div className="task-summary">

        <div className="summary-card">
          <span>Total Tasks</span>

          <strong>
            {totalTasks}
          </strong>
        </div>

        <div className="summary-card">
          <span>Pending</span>

          <strong>
            {pendingTasks}
          </strong>
        </div>

        <div className="summary-card">
          <span>Completed</span>

          <strong>
            {completedTasks}
          </strong>
        </div>

      </div>

      {/* FILTERS */}

      <div className="task-filters">

        {/* SEARCH */}

        <div className="search-box">

          <input
            type="text"
            placeholder="Search subject, topic..."
            value={searchText}
            onChange={(e) =>
              setSearchText(
                e.target.value
              )
            }
          />

        </div>

        {/* STATUS BUTTONS */}

        <div className="filter-group">

          <button
            type="button"
            className={
              statusFilter === "ALL"
                ? "filter-btn active"
                : "filter-btn"
            }
            onClick={() =>
              setStatusFilter("ALL")
            }
          >
            ALL
          </button>

          <button
            type="button"
            className={
              statusFilter === "PENDING"
                ? "filter-btn active"
                : "filter-btn"
            }
            onClick={() =>
              setStatusFilter("PENDING")
            }
          >
            PENDING
          </button>

          <button
            type="button"
            className={
              statusFilter === "COMPLETED"
                ? "filter-btn active"
                : "filter-btn"
            }
            onClick={() =>
              setStatusFilter("COMPLETED")
            }
          >
            COMPLETED
          </button>

        </div>

        {/* PRIORITY */}

        <select
          value={priorityFilter}
          onChange={(e) =>
            setPriorityFilter(
              e.target.value
            )
          }
          className="filter-select"
        >

          <option value="ALL">
            All Priorities
          </option>

          <option value="HIGH">
            High
          </option>

          <option value="MEDIUM">
            Medium
          </option>

          <option value="LOW">
            Low
          </option>

        </select>

        {/* DATE */}

        <select
          value={dateFilter}
          onChange={(e) =>
            setDateFilter(
              e.target.value
            )
          }
          className="filter-select"
        >

          <option value="ALL">
            All Dates
          </option>

          <option value="TODAY">
            Today
          </option>

          <option value="UPCOMING">
            Upcoming
          </option>

          <option value="OVERDUE">
            Overdue
          </option>

        </select>

      </div>

      {/* TASK CONTENT */}

      {loading ? (

        <div className="empty-state">

          <p>
            Loading your study tasks...
          </p>

        </div>

      ) : filteredTasks.length === 0 ? (

        <div className="empty-state">

          <div className="empty-icon">
            📚
          </div>

          <h2>
            No study tasks found
          </h2>

          <p>
            Try changing your filters
            or create a new study task.
          </p>

        </div>

      ) : (

        <div className="tasks-list">

          {filteredTasks.map(
            (task) => (

              <div
                className="task-card"
                key={
                  task.isOccurrence
                    ? `${task.id}-${task.occurrenceId}`
                    : task.id
                }
              >

                {/* TASK HEADER */}

                <div className="task-card-top">

                  <div>

                    <h2>
                      {task.subject}
                    </h2>

                    <h3>
                      {task.topic}
                    </h3>

                  </div>

                  <div className="task-badges">

                    <span
                      className={`priority-badge ${getPriorityClass(
                        task.priority
                      )}`}
                    >
                      {task.priority ||
                        "LOW"}
                    </span>

                    <span
                      className={`status-badge ${getStatusClass(
                        task.status
                      )}`}
                    >
                      {task.status ||
                        "PENDING"}
                    </span>

                  </div>

                </div>

                {/* DESCRIPTION */}

                {task.description && (
                  <p className="task-description">
                    {task.description}
                  </p>
                )}

                {/* TASK DETAILS */}

                <div className="task-details">

                  <div>

                    <span>
                      📅 Date
                    </span>

                    <strong>
                      {formatDate(
                        task.readingDate
                      )}
                    </strong>

                  </div>

                  <div>

                    <span>
                      ⏰ Time
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

                  <div>

                    <span>
                      🔁 Occurrence
                    </span>

                    <strong>
                      {getRecurrenceLabel(
                        task
                      )}
                    </strong>

                  </div>

                </div>

                {/* RECURRENCE */}

                {isRecurring(task) && (

                  <div className="recurrence-info">

                    <strong>
                      Recurring Task
                    </strong>

                    {task.recurrenceDays && (
                      <span>
                        Days:{" "}
                        {task.recurrenceDays}
                      </span>
                    )}

                    {task.recurrenceDayOfMonth && (
                      <span>
                        Day of month:{" "}
                        {
                          task.recurrenceDayOfMonth
                        }
                      </span>
                    )}

                    {task.recurrenceEndDate && (
                      <span>
                        Ends:{" "}
                        {formatDate(
                          task.recurrenceEndDate
                        )}
                      </span>
                    )}

                  </div>

                )}

                {/* ACTION BUTTONS */}

                <div className="task-actions">

                  <button
                    type="button"
                    className="edit-btn"
                    onClick={() =>
                      openEditModal(task)
                    }
                  >
                    ✏️ Edit
                  </button>

                  {(
                    task.status ||
                    "PENDING"
                  ).toUpperCase() !==
                    "COMPLETED" && (

                    <button
                      type="button"
                      className="complete-btn"
                      onClick={() =>
                        completeTask(
                          task.id
                        )
                      }
                    >
                      ✓ Complete
                    </button>

                  )}

                  <button
                    type="button"
                    className="delete-btn"
                    onClick={() =>
                      deleteTask(
                        task.id
                      )
                    }
                  >
                    🗑 Delete
                  </button>

                </div>

              </div>
            )
          )}

        </div>
      )}

      {/* EDIT MODAL */}

      {showEditModal &&
        selectedTask && (

          <div
            className="modal-overlay"
            onClick={closeEditModal}
          >

            <div
              className="edit-modal"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {/* MODAL HEADER */}

              <div className="modal-header">

                <div>

                  <h2>
                    Edit Study Task
                  </h2>

                  <p>
                    {selectedTask.subject}
                    {" - "}
                    {selectedTask.topic}
                  </p>

                </div>

                <button
                  type="button"
                  className="close-modal-btn"
                  onClick={closeEditModal}
                >
                  ×
                </button>

              </div>

              {/* MODAL ERROR */}

              {editError && (

                <div className="edit-modal-error">

                  <span>!</span>

                  {editError}

                </div>

              )}

              {/* MODAL SUCCESS */}

              {editSuccess && (

                <div className="edit-modal-success">

                  <span>✓</span>

                  {editSuccess}

                </div>

              )}

              {/* EDIT MODE */}

              {isRecurring(
                selectedTask
              ) && (

                <div className="edit-mode-section">

                  <h3>
                    What do you want to edit?
                  </h3>

                  <div className="edit-mode-buttons">

                    <button
                      type="button"
                      className={
                        editMode === "SERIES"
                          ? "mode-btn active"
                          : "mode-btn"
                      }
                      onClick={() => {

                        setEditMode(
                          "SERIES"
                        );

                        setSelectedOccurrence(
                          null
                        );

                        setEditStartTime(
                          selectedTask.startTime ||
                            ""
                        );

                        setEditEndTime(
                          selectedTask.endTime ||
                            ""
                        );

                        setEditError("");
                        setEditSuccess("");

                      }}
                    >
                      🔁 Entire Series
                    </button>

                    <button
                      type="button"
                      className={
                        editMode ===
                        "OCCURRENCE"
                          ? "mode-btn active"
                          : "mode-btn"
                      }
                      onClick={() => {

                        setEditMode(
                          "OCCURRENCE"
                        );

                        setSelectedOccurrence(
                          null
                        );

                        setEditError("");
                        setEditSuccess("");

                      }}
                    >
                      📅 One Occurrence
                    </button>

                  </div>

                </div>
              )}

              {/* OCCURRENCES */}

              {isRecurring(
                selectedTask
              ) &&
                editMode ===
                  "OCCURRENCE" && (

                  <div className="occurrence-section">

                    <h3>
                      Select a date
                    </h3>

                    {occurrences.length ===
                    0 ? (

                      <p className="no-occurrences">
                        No future occurrences
                        available.
                      </p>

                    ) : (

                      <div className="occurrence-list">

                        {occurrences.map(
                          (occurrence) => (

                            <button
                              type="button"
                              key={
                                occurrence.id
                              }
                              className={
                                selectedOccurrence &&
                                selectedOccurrence.id ===
                                  occurrence.id
                                  ? "occurrence-btn selected"
                                  : "occurrence-btn"
                              }
                              onClick={() =>
                                selectOccurrence(
                                  occurrence
                                )
                              }
                            >

                              <span>
                                📅{" "}
                                {formatDate(
                                  occurrence.occurrenceDate
                                )}
                              </span>

                              <span>
                                {formatTime(
                                  occurrence.startTime
                                )}
                                {" - "}
                                {formatTime(
                                  occurrence.endTime
                                )}
                              </span>

                            </button>

                          )
                        )}

                      </div>
                    )}

                  </div>
                )}

              {/* TIME EDIT */}

              {(editMode ===
                "SERIES" ||
                selectedOccurrence) && (

                <div className="time-edit-section">

                  <h3>
                    {editMode ===
                    "OCCURRENCE"
                      ? "Change Occurrence Time"
                      : "Change Study Time"}
                  </h3>

                  {editMode ===
                    "OCCURRENCE" &&
                    selectedOccurrence && (

                      <p className="selected-date">

                        Editing:{" "}

                        <strong>
                          {formatDate(
                            selectedOccurrence.occurrenceDate
                          )}
                        </strong>

                      </p>

                    )}

                  <div className="time-inputs">

                    <div>

                      <label>
                        Start Time
                      </label>

                      <input
                        type="time"
                        value={
                          editStartTime
                        }
                        onChange={(e) => {

                          setEditStartTime(
                            e.target.value
                          );

                          setEditError("");
                          setEditSuccess("");

                        }}
                      />

                    </div>

                    <div>

                      <label>
                        End Time
                      </label>

                      <input
                        type="time"
                        value={
                          editEndTime
                        }
                        onChange={(e) => {

                          setEditEndTime(
                            e.target.value
                          );

                          setEditError("");
                          setEditSuccess("");

                        }}
                      />

                    </div>

                  </div>

                  <small className="edit-time-hint">
                    Study session must be at
                    least 30 minutes.
                  </small>

                </div>
              )}

              {/* MODAL ACTIONS */}

              <div className="modal-actions">

                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeEditModal}
                >
                  Cancel
                </button>

                {editMode ===
                "OCCURRENCE" ? (

                  <button
                    type="button"
                    className="save-btn"
                    disabled={
                      !selectedOccurrence
                    }
                    onClick={
                      saveOccurrence
                    }
                  >
                    Save This Occurrence
                  </button>

                ) : (

                  <button
                    type="button"
                    className="save-btn"
                    onClick={saveSeries}
                  >
                    Save Changes
                  </button>

                )}

              </div>

            </div>

          </div>
        )}

    </div>
  );
}

export default MyTasks;