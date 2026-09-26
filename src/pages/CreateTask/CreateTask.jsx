import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./CreateTask.css";
import API_URL from "../../api/api";

function CreateTask() {
  const navigate = useNavigate();

  /* =========================================================
     TODAY
  ========================================================= */

  const getToday = () => {
    const todayDate = new Date();

    const year = todayDate.getFullYear();
    const month = String(todayDate.getMonth() + 1).padStart(2, "0");
    const day = String(todayDate.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = getToday();


  /* =========================================================
     10-MINUTE TIME OPTIONS
     
     00:00
     00:10
     00:20
     00:30
     ...
     23:40
     23:50
  ========================================================= */

  const timeOptions = [];

  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 10) {
      const value =
        `${String(hour).padStart(2, "0")}:` +
        `${String(minute).padStart(2, "0")}`;

      const displayHour = hour % 12 || 12;

      const period = hour >= 12 ? "PM" : "AM";

      const label =
        `${displayHour}:` +
        `${String(minute).padStart(2, "0")} ${period}`;

      timeOptions.push({
        value,
        label
      });
    }
  }


  /* =========================================================
     FORM DATA
  ========================================================= */

  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    description: "",
    priority: "MEDIUM",
    readingDate: "",
    startTime: "",
    endTime: "",
    deadline: "",
    recurrenceType: "ONE_TIME",
    recurrenceDays: [],
    recurrenceDayOfMonth: "",
    recurrenceEndDate: ""
  });


  /* =========================================================
     STATES
  ========================================================= */

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);


  /* =========================================================
     CLEAR MESSAGES
  ========================================================= */

  const clearMessages = () => {
    setMessage("");
    setError("");
  };


  /* =========================================================
     COMMON INPUT CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    clearMessages();

    setFormData((previousData) => ({
      ...previousData,
      [name]: value
    }));
  };


  /* =========================================================
     STUDY DATE CHANGE
  ========================================================= */

  const handleReadingDateChange = (event) => {
    const selectedDate = event.target.value;

    clearMessages();

    if (!selectedDate) {
      setFormData((previousData) => ({
        ...previousData,
        readingDate: "",
        recurrenceEndDate: ""
      }));

      return;
    }

    if (selectedDate < today) {
      setError(
        "You cannot create a study task for a past date."
      );

      return;
    }

    setFormData((previousData) => ({
      ...previousData,

      readingDate: selectedDate,

      deadline:
        previousData.deadline &&
        previousData.deadline < selectedDate
          ? ""
          : previousData.deadline,

      recurrenceEndDate:
        previousData.recurrenceEndDate &&
        previousData.recurrenceEndDate < selectedDate
          ? ""
          : previousData.recurrenceEndDate
    }));
  };


  /* =========================================================
     DEADLINE CHANGE
  ========================================================= */

  const handleDeadlineChange = (event) => {
    const selectedDeadline = event.target.value;

    clearMessages();

    if (!selectedDeadline) {
      setFormData((previousData) => ({
        ...previousData,
        deadline: ""
      }));

      return;
    }

    if (selectedDeadline < today) {
      setError("Deadline cannot be a past date.");

      return;
    }

    if (
      formData.readingDate &&
      selectedDeadline < formData.readingDate
    ) {
      setError(
        "Deadline cannot be before the study date."
      );

      return;
    }

    setFormData((previousData) => ({
      ...previousData,
      deadline: selectedDeadline
    }));
  };


  /* =========================================================
     RECURRENCE END DATE CHANGE
  ========================================================= */

  const handleRecurrenceEndDateChange = (event) => {
    const selectedEndDate = event.target.value;

    clearMessages();

    if (!selectedEndDate) {
      setFormData((previousData) => ({
        ...previousData,
        recurrenceEndDate: ""
      }));

      return;
    }

    if (selectedEndDate < today) {
      setError(
        "Recurrence end date cannot be in the past."
      );

      return;
    }

    if (
      formData.readingDate &&
      selectedEndDate < formData.readingDate
    ) {
      setError(
        "Recurrence end date cannot be before the study date."
      );

      return;
    }

    setFormData((previousData) => ({
      ...previousData,
      recurrenceEndDate: selectedEndDate
    }));
  };


  /* =========================================================
     RECURRENCE TYPE CHANGE
  ========================================================= */

  const handleRecurrenceChange = (event) => {
    const recurrenceType = event.target.value;

    clearMessages();

    setFormData((previousData) => ({
      ...previousData,

      recurrenceType,

      recurrenceDays: [],

      recurrenceDayOfMonth: "",

      recurrenceEndDate: ""
    }));
  };


  /* =========================================================
     WEEKLY DAY CHANGE
  ========================================================= */

  const handleDayChange = (day) => {
    clearMessages();

    setFormData((previousData) => {
      const currentDays = previousData.recurrenceDays;

      let updatedDays;

      if (currentDays.includes(day)) {
        updatedDays = currentDays.filter(
          (item) => item !== day
        );
      } else {
        updatedDays = [
          ...currentDays,
          day
        ];
      }

      return {
        ...previousData,
        recurrenceDays: updatedDays
      };
    });
  };


  /* =========================================================
     MONTHLY DAY CHANGE
  ========================================================= */

  const handleMonthlyDayChange = (event) => {
    const value = event.target.value;

    clearMessages();

    setFormData((previousData) => ({
      ...previousData,
      recurrenceDayOfMonth: value
    }));
  };


  /* =========================================================
     RESET FORM
  ========================================================= */

  const resetForm = () => {
    setFormData({
      subject: "",
      topic: "",
      description: "",
      priority: "MEDIUM",
      readingDate: "",
      startTime: "",
      endTime: "",
      deadline: "",
      recurrenceType: "ONE_TIME",
      recurrenceDays: [],
      recurrenceDayOfMonth: "",
      recurrenceEndDate: ""
    });
  };


  /* =========================================================
     VALIDATE RECURRENCE
  ========================================================= */

  const validateRecurrence = () => {
    const recurrenceType = formData.recurrenceType;

    if (recurrenceType === "ONE_TIME") {
      return true;
    }

    if (recurrenceType === "DAILY") {
      if (!formData.recurrenceEndDate) {
        setError(
          "Please select a recurrence end date for daily study."
        );

        return false;
      }

      return true;
    }

    if (recurrenceType === "WEEKLY") {
      if (formData.recurrenceDays.length === 0) {
        setError(
          "Please select at least one day for weekly recurrence."
        );

        return false;
      }

      if (!formData.recurrenceEndDate) {
        setError(
          "Please select a recurrence end date for weekly study."
        );

        return false;
      }

      return true;
    }

    if (recurrenceType === "MONTHLY") {
      if (!formData.recurrenceDayOfMonth) {
        setError(
          "Please select a day of the month for monthly recurrence."
        );

        return false;
      }

      const monthlyDay = Number(
        formData.recurrenceDayOfMonth
      );

      if (monthlyDay < 1 || monthlyDay > 31) {
        setError(
          "Monthly day must be between 1 and 31."
        );

        return false;
      }

      if (!formData.recurrenceEndDate) {
        setError(
          "Please select a recurrence end date for monthly study."
        );

        return false;
      }

      return true;
    }

    setError(
      "Please select a valid occurrence type."
    );

    return false;
  };


  /* =========================================================
     SUBMIT
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    clearMessages();


    /* -------------------------------------------------------
       REQUIRED FIELDS
    ------------------------------------------------------- */

    if (
      !formData.subject.trim() ||
      !formData.topic.trim() ||
      !formData.readingDate ||
      !formData.startTime ||
      !formData.endTime
    ) {
      setError(
        "Please fill in all required fields."
      );

      return;
    }


    /* -------------------------------------------------------
       STUDY DATE VALIDATION
    ------------------------------------------------------- */

    if (formData.readingDate < today) {
      setError(
        "You cannot create a study task for a past date."
      );

      return;
    }


    /* -------------------------------------------------------
       DEADLINE VALIDATION
    ------------------------------------------------------- */

    if (formData.deadline) {
      if (formData.deadline < today) {
        setError(
          "Deadline cannot be a past date."
        );

        return;
      }

      if (
        formData.deadline <
        formData.readingDate
      ) {
        setError(
          "Deadline cannot be before the study date."
        );

        return;
      }
    }


    /* -------------------------------------------------------
       TIME VALIDATION
    ------------------------------------------------------- */

    if (
      formData.endTime <=
      formData.startTime
    ) {
      setError(
        "End time must be after start time."
      );

      return;
    }


    /* -------------------------------------------------------
       CALCULATE DURATION
    ------------------------------------------------------- */

    const startParts =
      formData.startTime
        .split(":")
        .map(Number);

    const endParts =
      formData.endTime
        .split(":")
        .map(Number);

    const startHour = startParts[0];
    const startMinute = startParts[1];

    const endHour = endParts[0];
    const endMinute = endParts[1];

    const startTotalMinutes =
      startHour * 60 +
      startMinute;

    const endTotalMinutes =
      endHour * 60 +
      endMinute;

    const studyDurationMinutes =
      endTotalMinutes -
      startTotalMinutes;


    /* -------------------------------------------------------
       MINIMUM 30 MINUTES
    ------------------------------------------------------- */

    if (studyDurationMinutes < 30) {
      setError(
        "Please make sure your study session is at least 30 minutes long."
      );

      return;
    }


    /* -------------------------------------------------------
       RECURRENCE DATE VALIDATION
    ------------------------------------------------------- */

    if (
      formData.recurrenceType !==
      "ONE_TIME"
    ) {
      if (!formData.recurrenceEndDate) {
        setError(
          "Please select the recurrence end date."
        );

        return;
      }

      if (
        formData.recurrenceEndDate <
        formData.readingDate
      ) {
        setError(
          "Recurrence end date cannot be before the study date."
        );

        return;
      }
    }


    /* -------------------------------------------------------
       RECURRENCE VALIDATION
    ------------------------------------------------------- */

    if (!validateRecurrence()) {
      return;
    }


    /* -------------------------------------------------------
       TOKEN
    ------------------------------------------------------- */

    const token =
      localStorage.getItem("token");

    if (!token) {
      setError(
        "Your session has expired. Please login again."
      );

      return;
    }


    setLoading(true);


    try {

      /* -----------------------------------------------------
         WEEKLY DAYS
      ----------------------------------------------------- */

      const recurrenceDays =
        formData.recurrenceType === "WEEKLY" &&
        formData.recurrenceDays.length > 0
          ? formData.recurrenceDays.join(",")
          : null;


      /* -----------------------------------------------------
         MONTHLY DAY
      ----------------------------------------------------- */

      const recurrenceDayOfMonth =
        formData.recurrenceType === "MONTHLY"
          ? Number(
              formData.recurrenceDayOfMonth
            )
          : null;


      /* -----------------------------------------------------
         RECURRENCE END DATE
      ----------------------------------------------------- */

      const recurrenceEndDate =
        formData.recurrenceType !==
        "ONE_TIME"
          ? formData.recurrenceEndDate
          : null;


      /* -----------------------------------------------------
         REQUEST BODY
      ----------------------------------------------------- */

      const requestBody = {

        subject:
          formData.subject.trim(),

        topic:
          formData.topic.trim(),

        description:
          formData.description.trim(),

        priority:
          formData.priority,

        readingDate:
          formData.readingDate,

        /*
         * IMPORTANT
         *
         * Value remains HH:mm.
         *
         * Example:
         * 05:00
         * 05:10
         * 05:20
         */

        startTime:
          formData.startTime,

        endTime:
          formData.endTime,

        deadline:
          formData.deadline || null,

        recurrenceType:
          formData.recurrenceType,

        recurrenceDays:
          recurrenceDays,

        recurrenceDayOfMonth:
          recurrenceDayOfMonth,

        recurrenceEndDate:
          recurrenceEndDate
      };


      console.log(
        "Creating study task:",
        requestBody
      );


      /* -----------------------------------------------------
         API REQUEST
      ----------------------------------------------------- */

      const response =
        await fetch(
          `${API_URL}/api/tasks`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              "Authorization":
                `Bearer ${token}`
            },

            body:
              JSON.stringify(
                requestBody
              )
          }
        );


      /* -----------------------------------------------------
         ERROR RESPONSE
      ----------------------------------------------------- */

      if (!response.ok) {

        let errorMessage =
          "Unable to create study task.";

        try {

          const contentType =
            response.headers.get(
              "content-type"
            );


          if (
            contentType &&
            contentType.includes(
              "application/json"
            )
          ) {

            const errorData =
              await response.json();


            if (errorData.message) {

              errorMessage =
                errorData.message;

            } else if (
              errorData.error
            ) {

              errorMessage =
                errorData.error;
            }

          } else {

            const text =
              await response.text();

            if (text) {
              errorMessage = text;
            }
          }

        } catch (parseError) {

          console.error(
            "Error reading server response:",
            parseError
          );
        }


        console.error(
          "BACKEND STATUS:",
          response.status
        );

        console.error(
          "BACKEND ERROR:",
          errorMessage
        );


        throw new Error(
          errorMessage
        );
      }


      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

      const savedTask =
        await response.json();


      console.log(
        "Study task created:",
        savedTask
      );


      setMessage(
        "Study task created successfully! 🎉"
      );


      resetForm();


    } catch (error) {

      console.error(
        "Create task error:",
        error
      );


      const errorText =
        error.message?.toLowerCase() ||
        "";


      /* -----------------------------------------------------
         OVERLAP ERROR
      ----------------------------------------------------- */

      if (
        errorText.includes(
          "another study task"
        ) ||
        errorText.includes(
          "scheduled during this time"
        ) ||
        errorText.includes(
          "overlap"
        ) ||
        errorText.includes(
          "schedule conflict"
        ) ||
        errorText.includes(
          "already have"
        )
      ) {

        setError(
          "⚠️ Schedule conflict! You already have another study task scheduled during this time. Please choose a different time."
        );

      }


      /* -----------------------------------------------------
         OTHER ERRORS
      ----------------------------------------------------- */

      else {

        setError(
          error.message ||
          "Unable to connect to the server. Please try again."
        );
      }


    } finally {

      setLoading(false);

    }
  };


  /* =========================================================
     JSX
  ========================================================= */

  return (
    <div className="create-task-page">


      {/* =====================================================
          HEADER
      ===================================================== */}

      <header className="create-task-header">

        <button
          type="button"
          className="create-task-back-button"
          onClick={() =>
            navigate("/Homepage")
          }
        >
          ← Home
        </button>


        <div className="create-task-header-content">

          <h1>
            Create Study Task
          </h1>

          <p>
            Plan and organize your study sessions
          </p>

        </div>


        <div className="create-task-header-space"></div>

      </header>



      {/* =====================================================
          MAIN
      ===================================================== */}

      <main className="create-task-main">

        <div className="create-task-card">


          {/* =================================================
              CARD HEADER
          ================================================= */}

          <div className="create-task-card-header">

            <div className="create-task-icon">
              ➕
            </div>

            <div>

              <h2>
                New Study Task
              </h2>

              <p>
                Add the details of your study session.
              </p>

            </div>

          </div>



          {/* =================================================
              INFO
          ================================================= */}

          <div className="create-task-info">

            💡 You can create one-time or recurring
            study tasks. Make sure study timings do
            not overlap.

          </div>



          {/* =================================================
              SUCCESS
          ================================================= */}

          {message && (

            <div className="create-task-success">

              <span>✓</span>

              {message}

            </div>

          )}



          {/* =================================================
              ERROR
          ================================================= */}

          {error && (

            <div className="create-task-error">

              <span>!</span>

              {error}

            </div>

          )}



          {/* =================================================
              FORM
          ================================================= */}

          <form
            className="create-task-form"
            onSubmit={handleSubmit}
          >


            {/* ===============================================
                SUBJECT
            =============================================== */}

            <div className="create-task-form-group">

              <label htmlFor="subject">

                Subject <span>*</span>

              </label>

              <input
                id="subject"
                type="text"
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                placeholder="Example: Java"
                maxLength="100"
              />

            </div>



            {/* ===============================================
                TOPIC
            =============================================== */}

            <div className="create-task-form-group">

              <label htmlFor="topic">

                Topic <span>*</span>

              </label>

              <input
                id="topic"
                type="text"
                name="topic"
                value={formData.topic}
                onChange={handleChange}
                placeholder="Example: Collections"
                maxLength="150"
              />

            </div>



            {/* ===============================================
                DESCRIPTION
            =============================================== */}

            <div className="create-task-form-group create-task-full-width">

              <label htmlFor="description">

                Description

              </label>

              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="What do you want to study in this session?"
                rows="4"
                maxLength="500"
              />

            </div>



            {/* ===============================================
                PRIORITY
            =============================================== */}

            <div className="create-task-form-group">

              <label htmlFor="priority">

                Priority

              </label>

              <select
                id="priority"
                name="priority"
                value={formData.priority}
                onChange={handleChange}
              >

                <option value="HIGH">
                  🔴 High
                </option>

                <option value="MEDIUM">
                  🟡 Medium
                </option>

                <option value="LOW">
                  🟢 Low
                </option>

              </select>

            </div>



            {/* ===============================================
                OCCURRENCE
            =============================================== */}

            <div className="create-task-form-group">

              <label htmlFor="recurrenceType">

                Occurrence

              </label>

              <select
                id="recurrenceType"
                name="recurrenceType"
                value={formData.recurrenceType}
                onChange={handleRecurrenceChange}
              >

                <option value="ONE_TIME">
                  One Time
                </option>

                <option value="DAILY">
                  Daily
                </option>

                <option value="WEEKLY">
                  Weekly
                </option>

                <option value="MONTHLY">
                  Monthly
                </option>

              </select>

            </div>



            {/* ===============================================
                STUDY DATE
            =============================================== */}

            <div className="create-task-form-group">

              <label htmlFor="readingDate">

                Study Date <span>*</span>

              </label>

              <input
                id="readingDate"
                type="date"
                name="readingDate"
                value={formData.readingDate}
                onChange={
                  handleReadingDateChange
                }
                min={today}
              />

              <small className="create-task-field-hint">

                Starting date of the study task.

              </small>

            </div>



            {/* ===============================================
                START TIME - 10 MINUTE INTERVAL
            =============================================== */}

            <div className="create-task-form-group">

              <label htmlFor="startTime">

                Start Time <span>*</span>

              </label>

              <select
                id="startTime"
                name="startTime"
                value={formData.startTime}
                onChange={handleChange}
                className="create-task-time-select"
              >

                <option value="">
                  Select start time
                </option>

                {timeOptions.map((time) => (

                  <option
                    key={time.value}
                    value={time.value}
                  >
                    {time.label}
                  </option>

                ))}

              </select>

            </div>



            {/* ===============================================
                END TIME - 10 MINUTE INTERVAL
            =============================================== */}

            <div className="create-task-form-group">

              <label htmlFor="endTime">

                End Time <span>*</span>

              </label>

              <select
                id="endTime"
                name="endTime"
                value={formData.endTime}
                onChange={handleChange}
                className="create-task-time-select"
              >

                <option value="">
                  Select end time
                </option>

                {timeOptions.map((time) => (

                  <option
                    key={time.value}
                    value={time.value}
                  >
                    {time.label}
                  </option>

                ))}

              </select>

              <small className="create-task-field-hint">

                Study session must be at least 30 minutes.

              </small>

            </div>



            {/* ===============================================
                DEADLINE
            =============================================== */}

            <div className="create-task-form-group">

              <label htmlFor="deadline">

                Deadline

              </label>

              <input
                id="deadline"
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={
                  handleDeadlineChange
                }
                min={
                  formData.readingDate ||
                  today
                }
              />

              <small className="create-task-field-hint">

                Optional.

              </small>

            </div>



            {/* =================================================
                DAILY
            ================================================= */}

            {formData.recurrenceType ===
              "DAILY" && (

              <div className="create-task-full-width recurrence-section">

                <div className="recurrence-title">

                  🔄 Daily Study

                </div>

                <small className="create-task-field-hint">

                  This task will repeat every day at
                  the selected study time until the
                  recurrence end date.

                </small>


                <div className="create-task-form-group">

                  <label htmlFor="dailyRecurrenceEndDate">

                    Recurrence End Date
                    <span>*</span>

                  </label>

                  <input
                    id="dailyRecurrenceEndDate"
                    type="date"
                    value={
                      formData.recurrenceEndDate
                    }
                    onChange={
                      handleRecurrenceEndDateChange
                    }
                    min={
                      formData.readingDate ||
                      today
                    }
                  />

                </div>

              </div>

            )}



            {/* =================================================
                WEEKLY
            ================================================= */}

            {formData.recurrenceType ===
              "WEEKLY" && (

              <div className="create-task-full-width recurrence-section">

                <label className="recurrence-title">

                  Select Days
                  <span>*</span>

                </label>


                <div className="recurrence-days">

                  {[
                    "MONDAY",
                    "TUESDAY",
                    "WEDNESDAY",
                    "THURSDAY",
                    "FRIDAY",
                    "SATURDAY",
                    "SUNDAY"
                  ].map((day) => (

                    <label
                      key={day}
                      className={
                        formData.recurrenceDays.includes(
                          day
                        )
                          ? "day-option selected"
                          : "day-option"
                      }
                    >

                      <input
                        type="checkbox"
                        checked={
                          formData.recurrenceDays.includes(
                            day
                          )
                        }
                        onChange={() =>
                          handleDayChange(day)
                        }
                      />

                      {day.charAt(0) +
                        day
                          .slice(1)
                          .toLowerCase()}

                    </label>

                  ))}

                </div>


                <small className="create-task-field-hint">

                  Select the days on which this task
                  should repeat.

                </small>


                <div className="create-task-form-group">

                  <label htmlFor="weeklyRecurrenceEndDate">

                    Recurrence End Date
                    <span>*</span>

                  </label>

                  <input
                    id="weeklyRecurrenceEndDate"
                    type="date"
                    value={
                      formData.recurrenceEndDate
                    }
                    onChange={
                      handleRecurrenceEndDateChange
                    }
                    min={
                      formData.readingDate ||
                      today
                    }
                  />

                </div>

              </div>

            )}



            {/* =================================================
                MONTHLY
            ================================================= */}

            {formData.recurrenceType ===
              "MONTHLY" && (

              <div className="create-task-full-width recurrence-section">

                <div className="recurrence-title">

                  📅 Monthly Study

                </div>


                <div className="create-task-form-group">

                  <label htmlFor="recurrenceDayOfMonth">

                    Day of Month
                    <span>*</span>

                  </label>

                  <select
                    id="recurrenceDayOfMonth"
                    value={
                      formData.recurrenceDayOfMonth
                    }
                    onChange={
                      handleMonthlyDayChange
                    }
                  >

                    <option value="">
                      Select day
                    </option>

                    {Array.from(
                      { length: 31 },
                      (_, index) =>
                        index + 1
                    ).map((day) => (

                      <option
                        key={day}
                        value={day}
                      >

                        {day}

                        {day === 1
                          ? "st"
                          : day === 2
                          ? "nd"
                          : day === 3
                          ? "rd"
                          : "th"}

                      </option>

                    ))}

                  </select>

                </div>


                <small className="create-task-field-hint">

                  The task will repeat on this day of
                  every month. If the selected day does
                  not exist in a month, the last day of
                  that month will be used.

                </small>


                <div className="create-task-form-group">

                  <label htmlFor="monthlyRecurrenceEndDate">

                    Recurrence End Date
                    <span>*</span>

                  </label>

                  <input
                    id="monthlyRecurrenceEndDate"
                    type="date"
                    value={
                      formData.recurrenceEndDate
                    }
                    onChange={
                      handleRecurrenceEndDateChange
                    }
                    min={
                      formData.readingDate ||
                      today
                    }
                  />

                </div>

              </div>

            )}



            {/* =================================================
                BUTTONS
            ================================================= */}

            <div className="create-task-actions">

              <button
                type="button"
                className="create-task-cancel-button"
                onClick={() =>
                  navigate("/Homepage")
                }
                disabled={loading}
              >
                Cancel
              </button>


              <button
                type="submit"
                className="create-task-submit-button"
                disabled={loading}
              >

                {loading ? (
                  <>
                    <span className="create-task-spinner"></span>

                    Creating...
                  </>
                ) : (
                  <>
                    ➕ Create Study Task
                  </>
                )}

              </button>

            </div>

          </form>

        </div>

      </main>

    </div>
  );
}

export default CreateTask;