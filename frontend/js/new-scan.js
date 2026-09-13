const API_URL = "https://repoguard-backend-5tde.onrender.com";

const scanForm = document.getElementById("scanForm");
const scanMessage = document.getElementById("scanMessage");
const startScanButton = document.getElementById("startScanButton");


scanForm.addEventListener("submit", async function (event) {

    event.preventDefault();

    const repositoryUrl =
        document.getElementById("repositoryUrl").value.trim();


    // -------------------------
    // Validate URL
    // -------------------------

    if (!repositoryUrl) {
        showMessage("Please enter a GitHub repository URL.");
        return;
    }

    if (!repositoryUrl.startsWith("https://github.com/")) {
        showMessage("Please enter a valid GitHub repository URL.");
        return;
    }


    // -------------------------
    // Disable button
    // -------------------------

    startScanButton.disabled = true;
    startScanButton.textContent = "Starting scan...";

    showMessage("Connecting to GitHub...");


    try {

        // =========================================
        // STEP 1 — Save / find repository
        // =========================================

        const repositoryResponse = await fetch(
            `${API_URL}/api/repositories/?repository_url=${encodeURIComponent(repositoryUrl)}`,
            {
                method: "POST"
            }
        );


        const repositoryData =
            await repositoryResponse.json();


        console.log("Repository response:", repositoryData);


        if (!repositoryResponse.ok) {

            throw new Error(
                getErrorMessage(repositoryData)
            );

        }


        const repositoryId =
            repositoryData.repository_id;


        if (!repositoryId) {

            throw new Error(
                "Repository ID was not returned by the server."
            );

        }

        console.log("Repository ID:", repositoryId);

        showMessage(
            "Repository found. Starting security scan..."
        );


        // =========================================
        // STEP 2 — Create scan
        // =========================================

        const scanResponse = await fetch(
            `${API_URL}/api/scans/?repository_id=${repositoryId}`,
            {
                method: "POST"
            }
        );


        const scanData =
            await scanResponse.json();


        console.log("Scan response:", scanData);


        if (!scanResponse.ok) {

            throw new Error(
                getErrorMessage(scanData)
            );

        }


        // =========================================
        // STEP 3 — Save scan ID
        // =========================================

        const scanId =
            scanData.scan_id;


        if (!scanId) {

            throw new Error(
                "Scan ID was not returned by the server."
            );

        }


        localStorage.setItem(
            "repoguard_scan_id",
            scanId
        );


        // =========================================
        // STEP 4 — Move to progress page
        // =========================================

        showMessage(
            "Scan started successfully. RepoGuard is analyzing the repository..."
        );


        setTimeout(function () {

            window.location.href =
                "scan-progress.html";

        }, 800);


    } catch (error) {

        console.error("RepoGuard scan error:", error);


        showMessage(
            error.message ||
            "Something went wrong while starting the scan."
        );


        startScanButton.disabled = false;

        startScanButton.textContent =
            "Start Security Scan";

    }

});


// =========================================
// Convert API error into readable text
// =========================================

function getErrorMessage(data) {

    if (!data) {
        return "Unknown server error.";
    }


    // FastAPI normal string error
    if (typeof data.detail === "string") {
        return data.detail;
    }


    // FastAPI validation error
    if (Array.isArray(data.detail)) {

        return data.detail
            .map(function (error) {

                if (typeof error === "string") {
                    return error;
                }

                if (error.msg) {
                    return error.msg;
                }

                return JSON.stringify(error);

            })
            .join(", ");

    }


    // Object error
    if (
        data.detail &&
        typeof data.detail === "object"
    ) {

        if (data.detail.message) {
            return data.detail.message;
        }

        return JSON.stringify(data.detail);
    }


    // Generic message
    if (typeof data.message === "string") {
        return data.message;
    }


    // Last fallback
    return JSON.stringify(data);

}


// =========================================
// Display message
// =========================================

function showMessage(message) {

    scanMessage.textContent = String(message);

}
