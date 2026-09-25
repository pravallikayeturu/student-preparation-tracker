import React, { useEffect, useState } from "react";
import "./Chatbot.css";
import API_URL from "../../api/api";

function Chatbot() {

    // =====================================================
    // STATE
    // =====================================================

    // Current chat messages
    const [messages, setMessages] = useState([]);

    // Saved chat history from database
    const [chatHistory, setChatHistory] = useState([]);

    const [question, setQuestion] = useState("");

    const [loading, setLoading] = useState(false);

    const [copiedIndex, setCopiedIndex] = useState(null);

    const [menuOpen, setMenuOpen] = useState(false);


    // =====================================================
    // GET JWT TOKEN
    // =====================================================

    const getToken = () => {
        return localStorage.getItem("token");
    };


    // =====================================================
    // HANDLE API ERROR
    // =====================================================

    const handleApiError = async (response) => {

        if (response.status === 401) {
            throw new Error(
                "Your session has expired. Please login again."
            );
        }

        if (response.status === 403) {
            throw new Error(
                "You are not authorized to access this information."
            );
        }

        let errorMessage =
            `Request failed with status ${response.status}`;

        try {

            const text = await response.text();

            if (text && text.trim()) {
                errorMessage = text;
            }

        } catch (error) {

            console.error(
                "Error reading API error:",
                error
            );
        }

        throw new Error(errorMessage);
    };


    // =====================================================
    // LOAD SAVED CHAT HISTORY
    // =====================================================

    const loadChatHistory = async () => {

        try {

            const token = getToken();

            if (!token) {

                console.log(
                    "No login token found. Chat history not loaded."
                );

                return;
            }

            const response = await fetch(
                `${API_URL}/api/chatbot/history`,
                {
                    method: "GET",

                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );

            if (!response.ok) {
                await handleApiError(response);
            }

            const history = await response.json();

            if (!Array.isArray(history)) {

                console.error(
                    "Invalid chat history received:",
                    history
                );

                return;
            }

            // IMPORTANT:
            // Keep history separate from current chat.
            // Previous messages will NOT automatically appear
            // in the main chatbot window.

            setChatHistory(history);

        } catch (error) {

            console.error(
                "Chat History Error:",
                error
            );
        }
    };


    // =====================================================
    // LOAD HISTORY WHEN CHATBOT OPENS
    // =====================================================

    useEffect(() => {

        // Start with a fresh chat
        setMessages([]);

        setQuestion("");

        setCopiedIndex(null);

        // Load old chats only into sidebar history
        loadChatHistory();

    }, []);


    // =====================================================
    // ASK AI
    // =====================================================

    const askAI = async () => {

        if (!question.trim() || loading) {
            return;
        }

        const userQuestion = question.trim();


        // =================================================
        // SHOW USER QUESTION
        // =================================================

        setMessages(prev => [
            ...prev,
            {
                sender: "user",
                text: userQuestion
            }
        ]);

        setQuestion("");

        setLoading(true);


        try {

            const token = getToken();


            // =================================================
            // CHECK LOGIN
            // =================================================

            if (!token) {

                throw new Error(
                    "Please login to use the chatbot."
                );
            }


            // =================================================
            // SEND QUESTION
            // =================================================

            const response = await fetch(
                `${API_URL}/api/chatbot/ask`,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${token}`
                    },

                    body: JSON.stringify({
                        question: userQuestion
                    })
                }
            );


            // =================================================
            // CHECK RESPONSE
            // =================================================

            if (!response.ok) {
                await handleApiError(response);
            }


            // =================================================
            // READ RESPONSE
            // =================================================

            const data = await response.json();

            const answer =
                data.answer ||
                "I couldn't generate an answer.";


            // =================================================
            // SHOW AI ANSWER
            // =================================================

            setMessages(prev => [
                ...prev,
                {
                    sender: "ai",
                    text: answer
                }
            ]);


            // Refresh history sidebar
            await loadChatHistory();

        } catch (error) {

            console.error(
                "Chatbot Error:",
                error
            );

            setMessages(prev => [
                ...prev,
                {
                    sender: "ai",
                    text:
                        error.message ||
                        "Sorry, I couldn't connect to the AI."
                }
            ]);

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // TASK DATA
    // =====================================================

    const getTaskData = async (type) => {

        if (loading) {
            return;
        }

        setLoading(true);

        const token = getToken();


        // =================================================
        // TASK LABELS
        // =================================================

        const labels = {

            today: "Today",

            tomorrow: "Tomorrow",

            pending: "Pending",

            completed: "Completed",

            upcoming: "Upcoming",

            overdue: "Overdue",

            all: "All Tasks"

        };


        const selectedLabel =
            labels[type] || "Tasks";


        const userMessage =
            `Show my ${selectedLabel} tasks`;


        // =================================================
        // SHOW USER ACTION
        // =================================================

        setMessages(prev => [
            ...prev,
            {
                sender: "user",
                text: userMessage
            }
        ]);


        try {

            // =================================================
            // CHECK TOKEN
            // =================================================

            if (!token) {

                throw new Error(
                    "Please login to view your task data."
                );
            }


            // =================================================
            // GET TASKS
            // =================================================

            const response = await fetch(
                `${API_URL}/api/chatbot/tasks/${type}`,
                {
                    method: "GET",

                    headers: {
                        "Authorization": `Bearer ${token}`,
                        "Content-Type": "application/json"
                    }
                }
            );


            // =================================================
            // CHECK RESPONSE
            // =================================================

            if (!response.ok) {
                await handleApiError(response);
            }


            // =================================================
            // READ TASK DATA
            // =================================================

            const tasks = await response.json();


            // =================================================
            // NO TASKS
            // =================================================

            if (
                !Array.isArray(tasks) ||
                tasks.length === 0
            ) {

                setMessages(prev => [
                    ...prev,
                    {
                        sender: "ai",
                        text:
                            `You have no ${selectedLabel.toLowerCase()} tasks.`
                    }
                ]);

                return;
            }


            // =================================================
            // FORMAT TASK DATA
            // =================================================

            let taskText =
                `📚 ${selectedLabel} Tasks\n\n`;


            tasks.forEach((task, index) => {

                taskText +=
                    `${index + 1}. ${task.subject || "No subject"}\n`;


                if (task.topic) {

                    taskText +=
                        `   Topic: ${task.topic}\n`;
                }


                if (task.description) {

                    taskText +=
                        `   Description: ${task.description}\n`;
                }


                if (task.readingDate) {

                    taskText +=
                        `   Date: ${task.readingDate}\n`;
                }


                if (
                    task.startTime &&
                    task.endTime
                ) {

                    taskText +=
                        `   Time: ${task.startTime} - ${task.endTime}\n`;
                }


                if (task.deadline) {

                    taskText +=
                        `   Deadline: ${task.deadline}\n`;
                }


                if (task.priority) {

                    taskText +=
                        `   Priority: ${task.priority}\n`;
                }


                if (task.status) {

                    taskText +=
                        `   Status: ${task.status}\n`;
                }


                if (task.recurrenceType) {

                    taskText +=
                        `   Recurrence: ${task.recurrenceType}\n`;
                }


                taskText += "\n";

            });


            // =================================================
            // SHOW TASK DATA
            // =================================================

            setMessages(prev => [
                ...prev,
                {
                    sender: "ai",
                    text: taskText
                }
            ]);

        } catch (error) {

            console.error(
                "Task Data Error:",
                error
            );

            setMessages(prev => [
                ...prev,
                {
                    sender: "ai",
                    text:
                        error.message ||
                        "Sorry, I couldn't load your task data."
                }
            ]);

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // COPY AI RESPONSE
    // =====================================================

    const copyResponse = async (
        text,
        index
    ) => {

        try {

            await navigator.clipboard.writeText(text);

            setCopiedIndex(index);

            setTimeout(() => {

                setCopiedIndex(null);

            }, 1500);

        } catch (error) {

            console.error(
                "Copy failed:",
                error
            );
        }
    };


    // =====================================================
    // NEW CHAT
    // =====================================================

    const startNewChat = () => {

        if (loading) {
            return;
        }

        // Clear current conversation
        setMessages([]);

        setQuestion("");

        setCopiedIndex(null);

        setMenuOpen(false);
    };


    // =====================================================
    // OPEN PREVIOUS CHAT
    // =====================================================

    const openPreviousQuestion = (selectedChat) => {

        if (loading) {
            return;
        }

        setMessages([
            {
                sender: "user",
                text:
                    selectedChat.question ||
                    "Previous question"
            },
            {
                sender: "ai",
                text:
                    selectedChat.answer ||
                    "No answer available."
            }
        ]);

        setQuestion("");

        setCopiedIndex(null);

        setMenuOpen(false);
    };


    // =====================================================
    // ENTER KEY
    // =====================================================

    const handleKeyDown = (event) => {

        if (
            event.key === "Enter" &&
            !event.shiftKey
        ) {

            event.preventDefault();

            askAI();
        }
    };


    // =====================================================
    // PREVIOUS QUESTIONS
    // =====================================================

    const previousQuestions =
        chatHistory.filter(
            chat =>
                chat.question &&
                chat.question.trim()
        );


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="chatbot-page">

            <div className="chatbot-layout">


                {/* =================================================
                    LEFT INFORMATION PANEL
                ================================================== */}

                <section className="chatbot-info">

                    <div className="chatbot-info-content">

                        <div className="chatbot-info-icon">
                            🤖
                        </div>

                        <h1>
                            Your StudyMate AI
                        </h1>

                        <p>
                            Learn smarter, understand concepts
                            clearly, and stay organized with your
                            personal AI study companion.
                        </p>


                        {/* STUDY SUPPORT */}

                        <div className="info-points">

                            <div className="info-point">

                                <span>
                                    📚
                                </span>

                                <div>

                                    <strong>
                                        Study Support
                                    </strong>

                                    <p>
                                        Ask questions about Java,
                                        Python, DSA, DBMS,
                                        Operating Systems and
                                        other subjects.
                                    </p>

                                </div>

                            </div>


                            {/* PERSONAL TASKS */}

                            <div className="info-point">

                                <span>
                                    🎯
                                </span>

                                <div>

                                    <strong>
                                        Your Study Tasks
                                    </strong>

                                    <p>
                                        Quickly check your Today,
                                        Tomorrow, Pending,
                                        Completed and Upcoming tasks.
                                    </p>

                                </div>

                            </div>


                            {/* LANGUAGE */}

                            <div className="info-point">

                                <span>
                                    🌐
                                </span>

                                <div>

                                    <strong>
                                        Natural Language
                                    </strong>

                                    <p>
                                        Ask questions in English,
                                        Telugu, or a combination
                                        of both.
                                    </p>

                                </div>

                            </div>


                            {/* SECURITY */}

                            <div className="info-point">

                                <span>
                                    🔒
                                </span>

                                <div>

                                    <strong>
                                        Private & Secure
                                    </strong>

                                    <p>
                                        Your personal task data is
                                        available only to your
                                        authenticated account.
                                    </p>

                                </div>

                            </div>


                            {/* SMART ANSWERS */}

                            <div className="info-point">

                                <span>
                                    ⚡
                                </span>

                                <div>

                                    <strong>
                                        Smart Answers
                                    </strong>

                                    <p>
                                        Simple questions get short
                                        answers, while detailed
                                        questions get deeper answers.
                                    </p>

                                </div>

                            </div>

                        </div>


                        {/* FOOTER */}

                        <div className="chatbot-info-footer">

                            <span>
                                🎓 Learn consistently
                            </span>

                            <span>
                                🚀 Achieve your goals
                            </span>

                        </div>

                    </div>

                </section>


                {/* =================================================
                    RIGHT CHATBOT AREA
                ================================================== */}

                <section className="chatbot-section">

                    <div className="chatbot-container">


                        {/* =================================================
                            HEADER
                        ================================================== */}

                        <div className="chatbot-header">

                            <div className="chatbot-header-title">

                                <span className="chatbot-header-icon">
                                    🤖
                                </span>

                                <div>

                                    <strong>
                                        StudyMate AI
                                    </strong>

                                    <small>
                                        Your AI-powered study companion
                                    </small>

                                </div>

                            </div>


                            {/* HISTORY MENU */}

                            <button
                                className="chatbot-menu-button"
                                onClick={() =>
                                    setMenuOpen(true)
                                }
                                title="Chat History"
                            >
                                ☰
                            </button>

                        </div>


                        {/* =================================================
                            CHAT HISTORY MENU
                        ================================================== */}

                        {menuOpen && (

                            <div className="chat-history-overlay">

                                <aside className="chat-history-menu">


                                    {/* MENU HEADER */}

                                    <div className="chat-history-header">

                                        <strong>
                                            💬 Chat History
                                        </strong>

                                        <button
                                            onClick={() =>
                                                setMenuOpen(false)
                                            }
                                            className="history-close-button"
                                        >
                                            ×
                                        </button>

                                    </div>


                                    {/* NEW CHAT */}

                                    <button
                                        className="new-chat-button"
                                        onClick={startNewChat}
                                        disabled={loading}
                                    >
                                        ＋ New Chat
                                    </button>


                                    {/* PREVIOUS QUESTIONS */}

                                    <div className="history-section">

                                        <div className="history-title">
                                            Previous Questions
                                        </div>


                                        {previousQuestions.length === 0 ? (

                                            <div className="no-history">
                                                No questions yet.
                                            </div>

                                        ) : (

                                            previousQuestions.map(
                                                (
                                                    chat,
                                                    index
                                                ) => (

                                                    <button
                                                        key={
                                                            chat.id ||
                                                            index
                                                        }
                                                        className="history-item"
                                                        onClick={() =>
                                                            openPreviousQuestion(
                                                                chat
                                                            )
                                                        }
                                                        title={
                                                            chat.question
                                                        }
                                                    >

                                                        <span>
                                                            💭
                                                        </span>

                                                        <span>
                                                            {chat.question}
                                                        </span>

                                                    </button>

                                                )
                                            )

                                        )}

                                    </div>


                                    {/* SECURITY */}

                                    <div className="sidebar-security">

                                        🔒 Your task data is private
                                        and belongs only to your account.

                                    </div>

                                </aside>

                            </div>

                        )}


                        {/* =================================================
                            CHAT MESSAGES
                        ================================================== */}

                        <div className="chatbot-messages">


                            {/* EMPTY CHAT */}

                            {messages.length === 0 && (

                                <div className="chatbot-empty-state">

                                    <div className="empty-icon">
                                        🤖
                                    </div>

                                    <h2>
                                        StudyMate AI
                                    </h2>

                                    <p>
                                        Ask your study question
                                        or select an option from
                                        My Task Data.
                                    </p>

                                </div>

                            )}


                            {/* MESSAGES */}

                            {messages.map(
                                (
                                    message,
                                    index
                                ) => (

                                    <div
                                        key={index}
                                        className={
                                            message.sender === "user"
                                                ? "message-wrapper user-wrapper"
                                                : "message-wrapper ai-wrapper"
                                        }
                                    >

                                        <div
                                            className={
                                                message.sender === "user"
                                                    ? "message user-message"
                                                    : "message ai-message"
                                            }
                                        >
                                            {message.text}
                                        </div>


                                        {/* COPY */}

                                        {message.sender === "ai" && (

                                            <button
                                                className="copy-button"
                                                onClick={() =>
                                                    copyResponse(
                                                        message.text,
                                                        index
                                                    )
                                                }
                                            >

                                                {copiedIndex === index
                                                    ? "✓ Copied"
                                                    : "📋 Copy"}

                                            </button>

                                        )}

                                    </div>

                                )
                            )}


                            {/* LOADING */}

                            {loading && (

                                <div className="message-wrapper ai-wrapper">

                                    <div className="message ai-message">
                                        🤔 Thinking...
                                    </div>

                                </div>

                            )}

                        </div>


                        {/* =================================================
                            MY TASK DATA
                        ================================================== */}

                        <div className="task-data-section">

                            <div className="task-data-title">
                                📚 My Task Data
                            </div>


                            <div className="task-buttons">

                                <button
                                    onClick={() =>
                                        getTaskData("today")
                                    }
                                    disabled={loading}
                                >
                                    Today
                                </button>


                                <button
                                    onClick={() =>
                                        getTaskData("tomorrow")
                                    }
                                    disabled={loading}
                                >
                                    Tomorrow
                                </button>


                                <button
                                    onClick={() =>
                                        getTaskData("pending")
                                    }
                                    disabled={loading}
                                >
                                    Pending
                                </button>


                                <button
                                    onClick={() =>
                                        getTaskData("completed")
                                    }
                                    disabled={loading}
                                >
                                    Completed
                                </button>


                                <button
                                    onClick={() =>
                                        getTaskData("upcoming")
                                    }
                                    disabled={loading}
                                >
                                    Upcoming
                                </button>


                                <button
                                    onClick={() =>
                                        getTaskData("overdue")
                                    }
                                    disabled={loading}
                                >
                                    Overdue
                                </button>


                                <button
                                    onClick={() =>
                                        getTaskData("all")
                                    }
                                    disabled={loading}
                                >
                                    All Tasks
                                </button>

                            </div>

                        </div>


                        {/* =================================================
                            INPUT
                        ================================================== */}

                        <div className="chatbot-input">

                            <input
                                type="text"
                                value={question}
                                onChange={(e) =>
                                    setQuestion(
                                        e.target.value
                                    )
                                }
                                onKeyDown={handleKeyDown}
                                placeholder="Ask StudyMate AI anything about your studies..."
                                disabled={loading}
                            />


                            <button
                                onClick={askAI}
                                disabled={
                                    loading ||
                                    !question.trim()
                                }
                            >
                                {loading
                                    ? "..."
                                    : "Send"}
                            </button>

                        </div>

                    </div>

                </section>

            </div>

        </div>
    );
}

export default Chatbot;