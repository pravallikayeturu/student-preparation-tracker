import React, { useEffect, useState } from "react";
import "./Settings.css";

const Settings = () => {
    const [darkMode, setDarkMode] = useState(false);
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [taskReminders, setTaskReminders] = useState(true);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");

    const [savingSettings, setSavingSettings] = useState(false);
    const [savingName, setSavingName] = useState(false);

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const [showChangePassword, setShowChangePassword] = useState(false);

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [changingPassword, setChangingPassword] = useState(false);


    // =========================================================
    // GET ERROR MESSAGE FROM BACKEND
    // =========================================================

    const getErrorMessage = async (response, fallbackMessage) => {
        try {
            const data = await response.json();

            if (
                data &&
                typeof data.message === "string" &&
                data.message.trim()
            ) {
                return data.message;
            }

            return fallbackMessage;

        } catch (err) {
            return fallbackMessage;
        }
    };


    // =========================================================
    // FETCH PROFILE / SETTINGS
    // =========================================================

    useEffect(() => {

        const fetchProfile = async () => {

            try {

                const token = localStorage.getItem("token");

                if (!token) {
                    setError("Please login again.");
                    return;
                }

                const response = await fetch(
                    "http://localhost:8080/api/auth/profile",
                    {
                        method: "GET",
                        headers: {
                            Authorization: `Bearer ${token}`,
                            "Content-Type": "application/json",
                        },
                    }
                );

                if (!response.ok) {

                    const errorMessage =
                        await getErrorMessage(
                            response,
                            "Failed to load profile."
                        );

                    setError(errorMessage);
                    return;
                }

                const data = await response.json();

                setName(data.name || "");
                setEmail(data.email || "");


                // =====================================================
                // LOAD DARK MODE FROM BACKEND
                // =====================================================

                const backendDarkMode =
                    data.darkMode === true;

                setDarkMode(backendDarkMode);


                // Save backend dark mode to localStorage
                localStorage.setItem(
                    "darkMode",
                    backendDarkMode
                        ? "true"
                        : "false"
                );


                // Notify App.jsx and other components
                window.dispatchEvent(
                    new Event("darkModeChanged")
                );


                // =====================================================
                // LOAD NOTIFICATION SETTINGS
                // =====================================================

                setEmailNotifications(
                    data.emailNotifications !== false
                );

                setTaskReminders(
                    data.taskReminders !== false
                );

            } catch (err) {

                console.error(
                    "Profile fetch error:",
                    err
                );

                setError(
                    "Unable to load profile."
                );
            }
        };

        fetchProfile();

    }, []);


    // =========================================================
    // APPLY DARK MODE
    // =========================================================

    useEffect(() => {

        if (darkMode) {

            document.body.classList.add(
                "dark-mode"
            );

        } else {

            document.body.classList.remove(
                "dark-mode"
            );
        }

    }, [darkMode]);


    // =========================================================
    // SAVE USER NAME
    // =========================================================

    const handleNameSave = async () => {

        setMessage("");
        setError("");

        const trimmedName =
            name.trim();

        if (!trimmedName) {

            setError(
                "Name cannot be empty."
            );

            return;
        }

        try {

            setSavingName(true);

            const token =
                localStorage.getItem("token");

            if (!token) {

                setError(
                    "Please login again."
                );

                return;
            }

            const response = await fetch(
                "http://localhost:8080/api/auth/update-name",
                {
                    method: "PUT",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        name: trimmedName,
                    }),
                }
            );

            if (!response.ok) {

                const errorMessage =
                    await getErrorMessage(
                        response,
                        "Failed to update name."
                    );

                setError(errorMessage);

                return;
            }

            setMessage(
                "Name updated successfully."
            );

        } catch (err) {

            console.error(
                "Name update error:",
                err
            );

            setError(
                "Unable to update name."
            );

        } finally {

            setSavingName(false);
        }
    };


    // =========================================================
    // SAVE ALL SETTINGS
    // =========================================================

    const handleSave = async () => {

        setMessage("");
        setError("");

        try {

            setSavingSettings(true);

            const token =
                localStorage.getItem("token");

            if (!token) {

                setError(
                    "Please login again."
                );

                return;
            }

            const response = await fetch(
                "http://localhost:8080/api/auth/update-settings",
                {
                    method: "PUT",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        darkMode: darkMode,
                        emailNotifications:
                            emailNotifications,
                        taskReminders:
                            taskReminders,
                    }),
                }
            );

            if (!response.ok) {

                const errorMessage =
                    await getErrorMessage(
                        response,
                        "Failed to save settings."
                    );

                setError(errorMessage);

                return;
            }


            // =====================================================
            // READ UPDATED SETTINGS FROM BACKEND
            // =====================================================

            const data =
                await response.json();


            // =====================================================
            // SYNC SETTINGS RETURNED FROM BACKEND
            // =====================================================

            const backendDarkMode =
                data.darkMode === true;

            setDarkMode(
                backendDarkMode
            );

            setEmailNotifications(
                data.emailNotifications !== false
            );

            setTaskReminders(
                data.taskReminders !== false
            );


            // =====================================================
            // SAVE DARK MODE TO LOCAL STORAGE
            // =====================================================

            localStorage.setItem(
                "darkMode",
                backendDarkMode
                    ? "true"
                    : "false"
            );


            // =====================================================
            // APPLY DARK MODE IMMEDIATELY
            // =====================================================

            if (backendDarkMode) {

                document.body.classList.add(
                    "dark-mode"
                );

            } else {

                document.body.classList.remove(
                    "dark-mode"
                );
            }


            // =====================================================
            // NOTIFY OTHER COMPONENTS
            // =====================================================

            window.dispatchEvent(
                new Event("darkModeChanged")
            );


            setMessage(
                "Settings saved successfully."
            );

        } catch (err) {

            console.error(
                "Settings save error:",
                err
            );

            setError(
                "Unable to save settings."
            );

        } finally {

            setSavingSettings(false);
        }
    };


    // =========================================================
    // CHANGE PASSWORD
    // =========================================================

    const handleChangePassword = async () => {

        setMessage("");
        setError("");


        if (!currentPassword.trim()) {

            setError(
                "Please enter your current password."
            );

            return;
        }


        if (!newPassword.trim()) {

            setError(
                "Please enter your new password."
            );

            return;
        }


        if (newPassword.length < 6) {

            setError(
                "New password must contain at least 6 characters."
            );

            return;
        }


        if (!confirmPassword.trim()) {

            setError(
                "Please confirm your new password."
            );

            return;
        }


        if (newPassword !== confirmPassword) {

            setError(
                "New password and confirm password do not match."
            );

            return;
        }


        if (currentPassword === newPassword) {

            setError(
                "New password must be different from the current password."
            );

            return;
        }


        try {

            setChangingPassword(true);

            const token =
                localStorage.getItem("token");

            if (!token) {

                setError(
                    "Please login again."
                );

                return;
            }


            const response = await fetch(
                "http://localhost:8080/api/auth/change-password",
                {
                    method: "POST",

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        "Content-Type":
                            "application/json",
                    },

                    body: JSON.stringify({
                        currentPassword:
                            currentPassword,

                        newPassword:
                            newPassword,
                    }),
                }
            );


            if (!response.ok) {

                const errorMessage =
                    await getErrorMessage(
                        response,
                        "Unable to change password."
                    );

                setError(errorMessage);

                return;
            }


            setMessage(
                "Password changed successfully."
            );


            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");


            setShowCurrentPassword(false);
            setShowNewPassword(false);
            setShowConfirmPassword(false);

        } catch (err) {

            console.error(
                "Change password error:",
                err
            );

            setError(
                "Something went wrong. Please try again later."
            );

        } finally {

            setChangingPassword(false);
        }
    };


    // =========================================================
    // JSX
    // =========================================================

    return (

        <div className="settings-page">

            <div className="settings-container">

                <h1>
                    Settings
                </h1>


                {/* SUCCESS MESSAGE */}

                {message && (

                    <div className="settings-success-message">

                        {message}

                    </div>
                )}


                {/* ERROR MESSAGE */}

                {error && (

                    <div className="settings-error-message">

                        {error}

                    </div>
                )}


                {/* =================================================
                    PROFILE CARD
                ================================================== */}

                <div className="settings-card">

                    <h2>
                        Profile
                    </h2>


                    <div className="profile-row">

                        <div className="profile-info">

                            <label>
                                Name
                            </label>


                            <input
                                type="text"
                                value={name}
                                onChange={(e) =>
                                    setName(
                                        e.target.value
                                    )
                                }
                                placeholder="Enter your name"
                            />

                        </div>


                        <button
                            type="button"
                            className="save-name-button"
                            onClick={handleNameSave}
                            disabled={savingName}
                        >

                            {savingName
                                ? "Saving..."
                                : "Save Name"}

                        </button>

                    </div>


                    <div className="profile-row">

                        <div className="profile-info">

                            <label>
                                Email
                            </label>


                            <input
                                type="email"
                                value={email}
                                readOnly
                            />

                        </div>

                    </div>

                </div>


                {/* =================================================
                    APPEARANCE CARD
                ================================================== */}

                <div className="settings-card">

                    <h2>
                        Appearance
                    </h2>


                    <div className="setting-row">

                        <div className="setting-text">

                            <h3>
                                Dark Mode
                            </h3>


                            <p>
                                Switch between light and dark
                                appearance.
                            </p>

                        </div>


                        <label className="switch">

                            <input
                                type="checkbox"
                                checked={darkMode}
                                onChange={(e) =>
                                    setDarkMode(
                                        e.target.checked
                                    )
                                }
                            />

                            <span className="slider"></span>

                        </label>

                    </div>

                </div>


                {/* =================================================
                    NOTIFICATIONS CARD
                ================================================== */}

                <div className="settings-card">

                    <h2>
                        Notifications
                    </h2>


                    <div className="setting-row">

                        <div className="setting-text">

                            <h3>
                                Email Notifications
                            </h3>


                            <p>
                                Receive important updates through
                                email.
                            </p>

                        </div>


                        <label className="switch">

                            <input
                                type="checkbox"
                                checked={emailNotifications}
                                onChange={(e) =>
                                    setEmailNotifications(
                                        e.target.checked
                                    )
                                }
                            />

                            <span className="slider"></span>

                        </label>

                    </div>


                    <div className="setting-row">

                        <div className="setting-text">

                            <h3>
                                Task Reminders
                            </h3>


                            <p>
                                Receive reminders before your
                                scheduled tasks.
                            </p>

                        </div>


                        <label className="switch">

                            <input
                                type="checkbox"
                                checked={taskReminders}
                                onChange={(e) =>
                                    setTaskReminders(
                                        e.target.checked
                                    )
                                }
                            />

                            <span className="slider"></span>

                        </label>

                    </div>

                </div>


                {/* =================================================
                    CHANGE PASSWORD CARD
                ================================================== */}

                <div
                    className="settings-card change-password-card"
                    onClick={() => {

                        if (showChangePassword) {

                            setShowChangePassword(false);
                        }
                    }}
                >

                    <div
                        className="change-password-header"
                        onClick={(e) =>
                            e.stopPropagation()
                        }
                    >

                        <div>

                            <h2>
                                Change Password
                            </h2>


                            <p>
                                Update your account password
                                securely.
                            </p>

                        </div>


                        <button
                            type="button"
                            className="change-password-toggle"
                            onClick={(e) => {

                                e.stopPropagation();

                                setShowChangePassword(
                                    true
                                );
                            }}
                        >
                            Change Password
                        </button>

                    </div>


                    {/* =================================================
                        CHANGE PASSWORD FORM
                    ================================================== */}

                    {showChangePassword && (

                        <div
                            className="change-password-form"
                            onClick={(e) =>
                                e.stopPropagation()
                            }
                        >

                            {/* CURRENT PASSWORD */}

                            <div className="password-field">

                                <label>
                                    Current Password
                                </label>


                                <div className="password-input-wrapper">

                                    <input
                                        type={
                                            showCurrentPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={
                                            currentPassword
                                        }
                                        onChange={(e) =>
                                            setCurrentPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter current password"
                                    />


                                    <i
                                        className={
                                            showCurrentPassword
                                                ? "fa fa-eye-slash password-eye-icon"
                                                : "fa fa-eye password-eye-icon"
                                        }
                                        onClick={() =>
                                            setShowCurrentPassword(
                                                !showCurrentPassword
                                            )
                                        }
                                    ></i>

                                </div>

                            </div>


                            {/* NEW PASSWORD */}

                            <div className="password-field">

                                <label>
                                    New Password
                                </label>


                                <div className="password-input-wrapper">

                                    <input
                                        type={
                                            showNewPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={
                                            newPassword
                                        }
                                        onChange={(e) =>
                                            setNewPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Enter new password"
                                    />


                                    <i
                                        className={
                                            showNewPassword
                                                ? "fa fa-eye-slash password-eye-icon"
                                                : "fa fa-eye password-eye-icon"
                                        }
                                        onClick={() =>
                                            setShowNewPassword(
                                                !showNewPassword
                                            )
                                        }
                                    ></i>

                                </div>

                            </div>


                            {/* CONFIRM NEW PASSWORD */}

                            <div className="password-field">

                                <label>
                                    Confirm New Password
                                </label>


                                <div className="password-input-wrapper">

                                    <input
                                        type={
                                            showConfirmPassword
                                                ? "text"
                                                : "password"
                                        }
                                        value={
                                            confirmPassword
                                        }
                                        onChange={(e) =>
                                            setConfirmPassword(
                                                e.target.value
                                            )
                                        }
                                        placeholder="Confirm new password"
                                    />


                                    <i
                                        className={
                                            showConfirmPassword
                                                ? "fa fa-eye-slash password-eye-icon"
                                                : "fa fa-eye password-eye-icon"
                                        }
                                        onClick={() =>
                                            setShowConfirmPassword(
                                                !showConfirmPassword
                                            )
                                        }
                                    ></i>

                                </div>

                            </div>


                            {/* UPDATE PASSWORD BUTTON */}

                            <button
                                type="button"
                                className="change-password-button"
                                onClick={(e) => {

                                    e.stopPropagation();

                                    handleChangePassword();
                                }}
                                disabled={
                                    changingPassword
                                }
                            >

                                {changingPassword
                                    ? "Changing Password..."
                                    : "Update Password"}

                            </button>

                        </div>
                    )}

                </div>


                {/* =================================================
                    SAVE SETTINGS - LAST
                ================================================== */}

                <div className="settings-save-section">

                    <button
                        type="button"
                        className="save-settings-button"
                        onClick={handleSave}
                        disabled={savingSettings}
                    >

                        {savingSettings
                            ? "Saving..."
                            : "Save Settings"}

                    </button>

                </div>

            </div>

        </div>
    );
};


export default Settings;