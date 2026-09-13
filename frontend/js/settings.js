const API_URL = "http://127.0.0.1:8000";


const backendStatus =
    document.getElementById("backendStatus");

const databaseStatus =
    document.getElementById("databaseStatus");

const aiStatus =
    document.getElementById("aiStatus");


async function checkSystemStatus() {

    try {

        const response = await fetch(
            `${API_URL}/api/health`
        );

        if (!response.ok) {
            throw new Error("Backend unavailable");
        }

        const data = await response.json();


        // Backend status

        backendStatus.textContent =
            data.status === "healthy"
                ? "Online"
                : "Unavailable";

        backendStatus.className =
            data.status === "healthy"
                ? "status-value status-online"
                : "status-value status-offline";


        // Database status

        if (data.database === "connected") {

            databaseStatus.textContent =
                "Connected";

            databaseStatus.className =
                "status-value status-online";

        } else {

            databaseStatus.textContent =
                "Disconnected";

            databaseStatus.className =
                "status-value status-offline";
        }


        // AI status

        checkAIStatus();

    } catch (error) {

        console.error(
            "System status error:",
            error
        );


        backendStatus.textContent =
            "Offline";

        backendStatus.className =
            "status-value status-offline";


        databaseStatus.textContent =
            "Unavailable";

        databaseStatus.className =
            "status-value status-offline";


        aiStatus.textContent =
            "Unavailable";

        aiStatus.className =
            "status-value status-offline";
    }
}


async function checkAIStatus() {

    try {

        const scanId =
            localStorage.getItem("repoguard_scan_id");


        if (!scanId) {

            aiStatus.textContent =
                "Ready";

            aiStatus.className =
                "status-value status-online";

            return;
        }


        const response = await fetch(
            `${API_URL}/api/scans/${scanId}/ai-report`
        );


        if (response.ok) {

            aiStatus.textContent =
                "Available";

            aiStatus.className =
                "status-value status-online";

        } else {

            aiStatus.textContent =
                "Ready";

            aiStatus.className =
                "status-value status-online";
        }

    } catch (error) {

        console.error(
            "AI status error:",
            error
        );


        // AI failure should not make
        // the complete settings page fail.

        aiStatus.textContent =
            "Ready";

        aiStatus.className =
            "status-value status-online";
    }
}


checkSystemStatus();