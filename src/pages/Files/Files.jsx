import React, { useEffect, useState } from "react";
import "./Files.css";
import API_URL from "../../api/api";

function Files() {

    const [files, setFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");


    // =====================================================
    // GET TOKEN
    // =====================================================

    const getToken = () => {
        return localStorage.getItem("token");
    };


    // =====================================================
    // LOAD USER FILES
    // =====================================================

    const loadFiles = async () => {

        const token = getToken();

        if (!token) {
            setMessage("Please login first.");
            return;
        }

        try {

            const response = await fetch(
                `${API_URL}/api/files`,
                {
                    method: "GET",
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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
                    "Failed to load files."
                );
            }


            const data = await response.json();

            setFiles(data);

        } catch (error) {

            console.error(
                "Load files error:",
                error
            );

            setMessage(
                error.message ||
                "Failed to load files."
            );
        }
    };


    // =====================================================
    // LOAD FILES WHEN PAGE OPENS
    // =====================================================

    useEffect(() => {

        loadFiles();

    }, []);


    // =====================================================
    // SELECT FILE
    // =====================================================

    const handleFileChange = (event) => {

        const file = event.target.files[0];

        if (file) {

            setSelectedFile(file);

            setMessage("");
        }
    };


    // =====================================================
    // UPLOAD FILE
    // =====================================================

    const handleUpload = async () => {

        if (!selectedFile) {

            setMessage(
                "Please select a file first."
            );

            return;
        }


        const token = getToken();

        if (!token) {

            setMessage(
                "Please login first."
            );

            return;
        }


        setLoading(true);
        setMessage("");


        const formData = new FormData();

        formData.append(
            "file",
            selectedFile
        );


        try {

            const response = await fetch(
                  `${API_URL}/api/files/upload`,
                {
                    method: "POST",

                    headers: {
                        Authorization: `Bearer ${token}`
                    },

                    body: formData
                }
            );


            const result =
                await response.text();


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
                    result ||
                    "Failed to upload file."
                );
            }


            setMessage(
                "File uploaded successfully."
            );


            setSelectedFile(null);


            // =================================================
            // RESET FILE INPUT
            // =================================================

            const fileInput =
                document.getElementById(
                    "fileInput"
                );

            if (fileInput) {

                fileInput.value = "";
            }


            // =================================================
            // RELOAD FILES
            // =================================================

            await loadFiles();

        } catch (error) {

            console.error(
                "Upload error:",
                error
            );

            setMessage(
                error.message ||
                "Failed to upload file."
            );

        } finally {

            setLoading(false);
        }
    };


    // =====================================================
    // VIEW FILE
    // =====================================================

    const handleView = async (
        id,
        fileName
    ) => {

        const token = getToken();

        if (!token) {

            setMessage(
                "Please login first."
            );

            return;
        }


        try {

            setMessage(
                "Opening file..."
            );


            // =================================================
            // GET FILE FROM SPRING BOOT
            // =================================================

            const response = await fetch(
                  `${API_URL}/api/files/download/${id}`,
                {
                    method: "GET",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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
                    "Failed to open file."
                );
            }


            // =================================================
            // CONVERT RESPONSE TO BLOB
            // =================================================

            const blob =
                await response.blob();


            // =================================================
            // CREATE TEMPORARY BLOB URL
            // =================================================

            const blobUrl =
                window.URL.createObjectURL(
                    blob
                );


            // =================================================
            // OPEN IN NEW TAB
            // =================================================

            const newWindow =
                window.open(
                    blobUrl,
                    "_blank"
                );


            if (!newWindow) {

                window.URL.revokeObjectURL(
                    blobUrl
                );

                throw new Error(
                    "Please allow pop-ups to view the file."
                );
            }


            // =================================================
            // CLEANUP
            // =================================================

            setTimeout(() => {

                window.URL.revokeObjectURL(
                    blobUrl
                );

            }, 60000);


            setMessage(
                `Opened ${fileName}`
            );


        } catch (error) {

            console.error(
                "View file error:",
                error
            );

            setMessage(
                error.message ||
                "Failed to open file."
            );
        }
    };


    // =====================================================
    // DOWNLOAD FILE
    // =====================================================

    const handleDownload = async (
        id,
        fileName
    ) => {

        const token = getToken();

        if (!token) {

            setMessage(
                "Please login first."
            );

            return;
        }


        try {

            setMessage(
                "Downloading file..."
            );


            const response = await fetch(
                `${API_URL}/api/files/download/${id}`,
                {
                    method: "GET",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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
                    "Failed to download file."
                );
            }


            const blob =
                await response.blob();


            // =================================================
            // CREATE DOWNLOAD URL
            // =================================================

            const url =
                window.URL.createObjectURL(
                    blob
                );


            // =================================================
            // CREATE DOWNLOAD LINK
            // =================================================

            const link =
                document.createElement("a");


            link.href = url;

            link.download =
                fileName;


            document.body.appendChild(
                link
            );


            link.click();


            link.remove();


            window.URL.revokeObjectURL(
                url
            );


            setMessage(
                "File downloaded successfully."
            );


        } catch (error) {

            console.error(
                "Download error:",
                error
            );

            setMessage(
                error.message ||
                "Failed to download file."
            );
        }
    };


    // =====================================================
    // DELETE FILE
    // =====================================================

    const handleDelete = async (id) => {

        const confirmed =
            window.confirm(
                "Are you sure you want to delete this file?"
            );


        if (!confirmed) {
            return;
        }


        const token = getToken();

        if (!token) {

            setMessage(
                "Please login first."
            );

            return;
        }


        try {

            const response = await fetch(
                  `${API_URL}/api/files/${id}`,
                {
                    method: "DELETE",

                    headers: {
                        Authorization: `Bearer ${token}`
                    }
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
                    "Failed to delete file."
                );
            }


            setMessage(
                "File deleted successfully."
            );


            // =================================================
            // RELOAD FILES
            // =================================================

            await loadFiles();


        } catch (error) {

            console.error(
                "Delete error:",
                error
            );

            setMessage(
                error.message ||
                "Failed to delete file."
            );
        }
    };


    // =====================================================
    // FORMAT FILE SIZE
    // =====================================================

    const formatFileSize = (bytes) => {

        if (!bytes) {
            return "0 KB";
        }


        const kb =
            bytes / 1024;


        if (kb < 1024) {

            return `${kb.toFixed(1)} KB`;
        }


        const mb =
            kb / 1024;


        if (mb < 1024) {

            return `${mb.toFixed(1)} MB`;
        }


        const gb =
            mb / 1024;


        return `${gb.toFixed(2)} GB`;
    };


    // =====================================================
    // GET FILE ICON
    // =====================================================

    const getFileIcon = (
        fileType,
        fileName
    ) => {

        const type =
            fileType?.toLowerCase() || "";


        const name =
            fileName?.toLowerCase() || "";


        // PDF

        if (
            type.includes("pdf") ||
            name.endsWith(".pdf")
        ) {

            return "📕";
        }


        // CSV

        if (
            type.includes("csv") ||
            name.endsWith(".csv")
        ) {

            return "📊";
        }


        // IMAGE

        if (
            type.includes("image") ||
            name.endsWith(".png") ||
            name.endsWith(".jpg") ||
            name.endsWith(".jpeg") ||
            name.endsWith(".gif") ||
            name.endsWith(".webp")
        ) {

            return "🖼️";
        }


        // TEXT

        if (
            type.includes("text") ||
            name.endsWith(".txt")
        ) {

            return "📝";
        }


        // WORD

        if (
            type.includes("word") ||
            name.endsWith(".doc") ||
            name.endsWith(".docx")
        ) {

            return "📘";
        }


        // EXCEL

        if (
            type.includes("excel") ||
            name.endsWith(".xls") ||
            name.endsWith(".xlsx")
        ) {

            return "📗";
        }


        // POWERPOINT

        if (
            type.includes("powerpoint") ||
            type.includes("presentation") ||
            name.endsWith(".ppt") ||
            name.endsWith(".pptx")
        ) {

            return "📙";
        }


        return "📄";
    };


    // =====================================================
    // UI
    // =====================================================

    return (

        <div className="files-page">

            <div className="files-container">


                {/* =================================================
                    PAGE HEADER
                ================================================= */}

                <h1>
                    📁 My Files
                </h1>


                <p className="files-subtitle">
                    Upload and manage your study materials.
                </p>


                {/* =================================================
                    UPLOAD SECTION
                ================================================= */}

                <div className="upload-card">

                    <input
                        id="fileInput"
                        type="file"
                        onChange={handleFileChange}
                    />


                    {selectedFile && (

                        <p className="selected-file">

                            Selected:
                            {" "}

                            {selectedFile.name}

                        </p>
                    )}


                    <button
                        onClick={handleUpload}
                        disabled={loading}
                    >

                        {loading
                            ? "Uploading..."
                            : "⬆ Upload File"
                        }

                    </button>

                </div>


                {/* =================================================
                    MESSAGE
                ================================================= */}

                {message && (

                    <div className="file-message">

                        {message}

                    </div>

                )}


                {/* =================================================
                    FILE LIST
                ================================================= */}

                <div className="file-list">

                    <h2>
                        Your Files
                    </h2>


                    {files.length === 0 ? (

                        <div className="empty-files">

                            <div className="empty-icon">
                                📂
                            </div>


                            <p>
                                No files uploaded yet.
                            </p>

                        </div>

                    ) : (

                        files.map((file) => (

                            <div
                                className="file-item"
                                key={file.id}
                            >


                                {/* =================================================
                                    FILE INFORMATION
                                ================================================= */}

                                <div className="file-info">


                                    <div className="file-icon">

                                        {getFileIcon(
                                            file.fileType,
                                            file.fileName
                                        )}

                                    </div>


                                    <div>

                                        <div className="file-name">

                                            {file.fileName}

                                        </div>


                                        <div className="file-details">

                                            {formatFileSize(
                                                file.fileSize
                                            )}

                                            {" • "}

                                            {file.fileType ||
                                                "Unknown type"
                                            }

                                        </div>

                                    </div>

                                </div>


                                {/* =================================================
                                    FILE ACTIONS
                                ================================================= */}

                                <div className="file-actions">


                                    {/* VIEW */}

                                    <button
                                        className="view-button"
                                        onClick={() =>
                                            handleView(
                                                file.id,
                                                file.fileName
                                            )
                                        }
                                    >

                                        👁 View

                                    </button>


                                    {/* DOWNLOAD */}

                                    <button
                                        className="download-button"
                                        onClick={() =>
                                            handleDownload(
                                                file.id,
                                                file.fileName
                                            )
                                        }
                                    >

                                        ⬇ Download

                                    </button>


                                    {/* DELETE */}

                                    <button
                                        className="delete-button"
                                        onClick={() =>
                                            handleDelete(
                                                file.id
                                            )
                                        }
                                    >

                                        🗑 Delete

                                    </button>

                                </div>

                            </div>

                        ))

                    )}

                </div>

            </div>

        </div>
    );
}


export default Files;