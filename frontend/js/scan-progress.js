const API_URL = "http://https://repoguard-backend-5tde.onrender.com";

const scanId = localStorage.getItem("repoguard_scan_id");

const repositoryName = document.getElementById("repositoryName");
const statusText = document.getElementById("statusText");
const progressPercent = document.getElementById("progressPercent");
const progressFill = document.getElementById("progressFill");
const scanComplete = document.getElementById("scanComplete");
const viewDashboardButton =
    document.getElementById("viewDashboardButton");


if (!scanId) {

    statusText.textContent = "No scan was selected.";
    repositoryName.textContent = "No scan available";

} else {

    checkScanStatus();

    setInterval(checkScanStatus, 2000);
}


async function checkScanStatus() {

    try {

        const response = await fetch(
            `${API_URL}/api/scans/${scanId}/status`
        );

        if (!response.ok) {
            throw new Error("Unable to get scan status");
        }

        const data = await response.json();

        updateProgress(data);


    } catch (error) {

        console.error("Status error:", error);

        statusText.textContent =
            "Unable to connect to scan server.";

    }

}


function updateProgress(data) {

    const progress = data.progress ?? 0;
    const status = data.status ?? "QUEUED";


    progressFill.style.width = `${progress}%`;

    progressPercent.textContent =
        `${progress}%`;


    if (data.repository) {

        repositoryName.textContent =
            `${data.repository.owner}/${data.repository.name}`;

    }


    switch (status) {

        case "QUEUED":

            statusText.textContent =
                "Waiting for scan to start...";

            break;


        case "RUNNING":

            statusText.textContent =
                getProgressMessage(progress);

            break;


        case "COMPLETED":

            progressFill.style.width = "100%";
            progressPercent.textContent = "100%";

            statusText.textContent =
                "Scan completed successfully.";

            scanComplete.style.display = "block";

            break;


        case "FAILED":

            statusText.textContent =
                "Scan failed. Please try again.";

            break;


        default:

            statusText.textContent =
                "Processing repository...";

    }

}


function getProgressMessage(progress) {

    if (progress < 20) {
        return "Preparing repository...";
    }

    if (progress < 35) {
        return "Analyzing code health...";
    }

    if (progress < 55) {
        return "Checking dependencies...";
    }

    if (progress < 70) {
        return "Detecting exposed secrets...";
    }

    if (progress < 85) {
        return "Analyzing CI/CD workflows...";
    }

    return "Running static security analysis...";

}


viewDashboardButton.addEventListener(
    "click",
    function () {

        window.location.href = "dashboard.html";

    }
);