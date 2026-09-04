import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./ChangePassword.css";

const ChangePassword = () => {
    const navigate = useNavigate();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const handleChangePassword = (e) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            alert("New password and confirm password do not match!");
            return;
        }

        if (newPassword.length < 6) {
            alert("Password must be at least 6 characters!");
            return;
        }

        // Backend API will be connected here
        console.log({
            currentPassword,
            newPassword
        });

        alert("Password changed successfully!");

        navigate("/settings");
    };

    return (
        <div className="change-password-page">

            <div className="change-password-container">

                <div className="change-password-header">
                    <h1>🔐 Change Password</h1>
                    <p>
                        Update your account password securely
                    </p>
                </div>

                <form
                    className="change-password-card"
                    onSubmit={handleChangePassword}
                >

                    <div className="password-field">
                        <label>Current Password</label>

                        <input
                            type="password"
                            placeholder="Enter current password"
                            value={currentPassword}
                            onChange={(e) =>
                                setCurrentPassword(e.target.value)
                            }
                            required
                        />
                    </div>


                    <div className="password-field">
                        <label>New Password</label>

                        <input
                            type="password"
                            placeholder="Enter new password"
                            value={newPassword}
                            onChange={(e) =>
                                setNewPassword(e.target.value)
                            }
                            required
                        />
                    </div>


                    <div className="password-field">
                        <label>Confirm New Password</label>

                        <input
                            type="password"
                            placeholder="Confirm new password"
                            value={confirmPassword}
                            onChange={(e) =>
                                setConfirmPassword(e.target.value)
                            }
                            required
                        />
                    </div>


                    <div className="password-actions">

                        <button
                            type="button"
                            className="cancel-button"
                            onClick={() => navigate("/settings")}
                        >
                            Cancel
                        </button>

                        <button
                            type="submit"
                            className="change-button"
                        >
                            Change Password
                        </button>

                    </div>

                </form>

            </div>

        </div>
    );
};

export default ChangePassword;