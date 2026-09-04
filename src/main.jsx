import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

const savedDarkMode =
    localStorage.getItem("darkMode") === "true";

if (savedDarkMode) {
    document.body.classList.add("dark-mode");
} else {
    document.body.classList.remove("dark-mode");
}

createRoot(document.getElementById("root")).render(
    <StrictMode>
        <App />
    </StrictMode>
);