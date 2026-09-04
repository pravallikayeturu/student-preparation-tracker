import { useEffect, useMemo, useState } from "react";
import "./Progress.css";

function Progress() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =====================================================
  // GET TOKEN
  // =====================================================

  const getToken = () => {
    return (
      localStorage.getItem("token") ||
      localStorage.getItem("jwtToken") ||
      localStorage.getItem("jwt")
    );
  };

  // =====================================================
  // TIME HELPERS
  // =====================================================

  const parseTimeToMinutes = (time) => {
    if (!time) return null;

    const parts = time.split(":");

    const hours = Number(parts[0]);
    const minutes = Number(parts[1]);

    if (
      Number.isNaN(hours) ||
      Number.isNaN(minutes)
    ) {
      return null;
    }

    return hours * 60 + minutes;
  };

  const calculateHours = (startTime, endTime) => {
    const start = parseTimeToMinutes(startTime);
    const end = parseTimeToMinutes(endTime);

    if (
      start === null ||
      end === null ||
      end <= start
    ) {
      return 0;
    }

    return (end - start) / 60;
  };

  const formatHours = (hours) => {
    if (!hours || hours <= 0) {
      return "0h";
    }

    if (Number.isInteger(hours)) {
      return `${hours}h`;
    }

    return `${Number(hours.toFixed(1))}h`;
  };

  const getStatus = (status) => {
    return String(status || "")
      .trim()
      .toUpperCase();
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
        throw new Error("Please login again.");
      }

      const response = await fetch(
        "http://localhost:8080/api/tasks",
        {
          method: "GET",

          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      );

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          throw new Error(
            "Access denied. Please login again."
          );
        }

        throw new Error(
          `Failed to load progress. Status: ${response.status}`
        );
      }

      const data = await response.json();

      setTasks(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Progress load error:",
        err
      );

      setError(
        err.message ||
          "Failed to load progress."
      );
    } finally {
      setLoading(false);
    }
  };

  // =====================================================
  // FLATTEN TASKS / OCCURRENCES
  // =====================================================

  const occurrences = useMemo(() => {
    const result = [];

    tasks.forEach((task) => {
      if (
        Array.isArray(task.occurrences) &&
        task.occurrences.length > 0
      ) {
        task.occurrences.forEach(
          (occurrence) => {
            result.push({
              ...occurrence,

              subject:
                occurrence.subject ||
                task.subject ||
                "Unknown Subject",

              topic:
                occurrence.topic ||
                task.topic ||
                "",

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
            });
          }
        );
      } else {
        result.push({
          ...task,

          subject:
            task.subject ||
            "Unknown Subject",

          status:
            task.status ||
            "PENDING",
        });
      }
    });

    return result;
  }, [tasks]);

  // =====================================================
  // SUBJECT-WISE PROGRESS
  // =====================================================

  const subjectProgress = useMemo(() => {
    const subjectMap = {};

    occurrences.forEach(
      (occurrence) => {
        const subject =
          occurrence.subject?.trim() ||
          "Unknown Subject";

        const plannedHours =
          calculateHours(
            occurrence.startTime,
            occurrence.endTime
          );

        const completed =
          getStatus(
            occurrence.status
          ) === "COMPLETED";

        if (!subjectMap[subject]) {
          subjectMap[subject] = {
            subject,
            plannedHours: 0,
            completedHours: 0,
            totalSessions: 0,
            completedSessions: 0,
          };
        }

        subjectMap[subject]
          .plannedHours += plannedHours;

        subjectMap[subject]
          .totalSessions += 1;

        if (completed) {
          subjectMap[subject]
            .completedHours += plannedHours;

          subjectMap[subject]
            .completedSessions += 1;
        }
      }
    );

    return Object.values(
      subjectMap
    )
      .map((item) => {
        const progress =
          item.plannedHours > 0
            ? Math.round(
                (item.completedHours /
                  item.plannedHours) *
                  100
              )
            : 0;

        return {
          ...item,
          progress: Math.min(
            progress,
            100
          ),
        };
      })
      .sort(
        (a, b) =>
          b.plannedHours -
          a.plannedHours
      );
  }, [occurrences]);

  // =====================================================
  // OVERALL PROGRESS
  // =====================================================

  const overallProgress = useMemo(() => {
    const planned = subjectProgress.reduce(
      (total, subject) =>
        total + subject.plannedHours,
      0
    );

    const completed =
      subjectProgress.reduce(
        (total, subject) =>
          total +
          subject.completedHours,
        0
      );

    const percentage =
      planned > 0
        ? Math.round(
            (completed / planned) *
              100
          )
        : 0;

    return {
      planned,
      completed,
      percentage: Math.min(
        percentage,
        100
      ),
    };
  }, [subjectProgress]);

  // =====================================================
  // TOTAL SESSIONS
  // =====================================================

  const totalSessions =
    occurrences.length;

  const completedSessions =
    occurrences.filter(
      (occurrence) =>
        getStatus(
          occurrence.status
        ) === "COMPLETED"
    ).length;

  // =====================================================
  // BEST SUBJECT
  // =====================================================

  const bestSubject = useMemo(() => {
    if (
      subjectProgress.length === 0
    ) {
      return null;
    }

    return [...subjectProgress]
      .filter(
        (subject) =>
          subject.plannedHours > 0
      )
      .sort(
        (a, b) =>
          b.progress - a.progress
      )[0];
  }, [subjectProgress]);

  // =====================================================
  // NEEDS IMPROVEMENT
  // =====================================================

  const weakSubject = useMemo(() => {
    if (
      subjectProgress.length === 0
    ) {
      return null;
    }

    return [...subjectProgress]
      .filter(
        (subject) =>
          subject.plannedHours > 0
      )
      .sort(
        (a, b) =>
          a.progress - b.progress
      )[0];
  }, [subjectProgress]);

  // =====================================================
  // PROGRESS CLASS
  // =====================================================

  const getProgressClass = (
    percentage
  ) => {
    if (percentage >= 80) {
      return "progress-good";
    }

    if (percentage >= 50) {
      return "progress-medium";
    }

    return "progress-low";
  };

  // =====================================================
  // LOADING
  // =====================================================

  if (loading) {
    return (
      <div className="progress-page">
        <div className="progress-loading">
          <div className="progress-spinner"></div>

          <p>
            Loading your progress...
          </p>
        </div>
      </div>
    );
  }

  // =====================================================
  // ERROR
  // =====================================================

  if (error) {
    return (
      <div className="progress-page">
        <div className="progress-error">
          <div>⚠️</div>

          <h2>
            Unable to load progress
          </h2>

          <p>{error}</p>

          <button
            onClick={loadTasks}
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // =====================================================
  // UI
  // =====================================================

  return (
    <div className="progress-page">

      {/* =================================================
          HEADER
      ================================================= */}

      <div className="progress-header">

        <div>
          <h1>
            📈 Study Progress
          </h1>

          <p>
            Track your performance
            subject by subject
          </p>
        </div>

      </div>


      {/* =================================================
          OVERALL SUMMARY
      ================================================= */}

      <div className="progress-summary">

        <div className="summary-card">

          <div className="summary-icon">
            🎯
          </div>

          <div>
            <span>
              Overall Progress
            </span>

            <strong>
              {overallProgress.percentage}%
            </strong>
          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            ⏱️
          </div>

          <div>
            <span>
              Completed Hours
            </span>

            <strong>
              {formatHours(
                overallProgress.completed
              )}
            </strong>
          </div>

        </div>


        <div className="summary-card">

          <div className="summary-icon">
            📚
          </div>

          <div>
            <span>
              Total Sessions
            </span>

            <strong>
              {totalSessions}
            </strong>

            <small>
              {completedSessions} completed
            </small>
          </div>

        </div>

      </div>


      {/* =================================================
          INSIGHTS
      ================================================= */}

      <div className="progress-insights">

        <div className="insight-card best-card">

          <div className="insight-icon">
            🏆
          </div>

          <div>
            <span>
              Best Performing Subject
            </span>

            <strong>
              {bestSubject
                ? bestSubject.subject
                : "No data"}
            </strong>

            {bestSubject && (
              <small>
                {bestSubject.progress}%
                completed
              </small>
            )}
          </div>

        </div>


        <div className="insight-card weak-card">

          <div className="insight-icon">
            📌
          </div>

          <div>
            <span>
              Needs More Attention
            </span>

            <strong>
              {weakSubject
                ? weakSubject.subject
                : "No data"}
            </strong>

            {weakSubject && (
              <small>
                {weakSubject.progress}%
                completed
              </small>
            )}
          </div>

        </div>

      </div>


      {/* =================================================
          SUBJECT-WISE PROGRESS
      ================================================= */}

      <div className="progress-card">

        <div className="progress-card-header">

          <div>
            <h2>
              📚 Subject-wise Progress
            </h2>

            <p>
              See how you are performing
              in each subject
            </p>
          </div>

        </div>


        {subjectProgress.length === 0 ? (

          <div className="no-progress">

            <div>
              📚
            </div>

            <h3>
              No study data yet
            </h3>

            <p>
              Create study tasks to
              start tracking your
              progress.
            </p>

          </div>

        ) : (

          <div className="subject-list">

            {subjectProgress.map(
              (subject) => (

                <div
                  className="subject-item"
                  key={subject.subject}
                >

                  <div className="subject-top">

                    <div className="subject-name">

                      <span className="subject-dot">
                        📖
                      </span>

                      <strong>
                        {subject.subject}
                      </strong>

                    </div>

                    <strong
                      className={`subject-percentage ${getProgressClass(
                        subject.progress
                      )}`}
                    >
                      {subject.progress}%
                    </strong>

                  </div>


                  <div className="subject-bar">

                    <div
                      className={`subject-fill ${getProgressClass(
                        subject.progress
                      )}`}
                      style={{
                        width: `${subject.progress}%`,
                      }}
                    ></div>

                  </div>


                  <div className="subject-bottom">

                    <span>
                      {formatHours(
                        subject.completedHours
                      )}{" "}
                      completed
                    </span>

                    <span>
                      /{" "}
                      {formatHours(
                        subject.plannedHours
                      )}{" "}
                      planned
                    </span>

                    <span>
                      {subject.completedSessions}
                      {" "}
                      completed
                    </span>

                    <span>
                      {subject.totalSessions}
                      {" "}
                      total sessions
                    </span>

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

export default Progress;