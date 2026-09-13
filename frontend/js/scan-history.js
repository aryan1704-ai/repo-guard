const API_URL = "http://https://repoguard-backend-5tde.onrender.com";

let allScans = [];


// -------------------------
// Elements
// -------------------------

const tableBody = document.getElementById("historyTableBody");
const searchInput = document.getElementById("searchInput");
const statusFilter = document.getElementById("statusFilter");
const scanCount = document.getElementById("scanCount");
const newScanButton = document.getElementById("newScanButton");


// -------------------------
// New Scan
// -------------------------

if (newScanButton) {
    newScanButton.addEventListener("click", function () {
        window.location.href = "new-scan.html";
    });
}


// -------------------------
// Load scans
// -------------------------

async function loadScans() {

    try {

        const response = await fetch(`${API_URL}/api/scans/`);

        if (!response.ok) {
            throw new Error("Unable to load scan history");
        }

        const data = await response.json();

        allScans = data.scans || [];

        displayScans(allScans);

    } catch (error) {

        console.error("Scan history error:", error);

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    Unable to load scan history.
                </td>
            </tr>
        `;

        scanCount.textContent = "Failed to load scans";
    }
}


// -------------------------
// Display scans
// -------------------------

function displayScans(scans) {

    tableBody.innerHTML = "";

    scanCount.textContent =
        `${scans.length} scan${scans.length === 1 ? "" : "s"}`;


    if (scans.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="8">
                    No scans found.
                </td>
            </tr>
        `;

        return;
    }


    scans.forEach(function (scan) {

        const row = document.createElement("tr");

        const repository = scan.repository
            ? `${scan.repository.owner}/${scan.repository.name}`
            : "--";

        const scores = scan.scores || {};

        const status = scan.status || "--";

        const date = scan.created_at
            ? new Date(scan.created_at).toLocaleString()
            : "--";


        row.innerHTML = `
            <td>${escapeHTML(repository)}</td>

            <td>
                <span class="status ${getStatusClass(status)}">
                    ${escapeHTML(status)}
                </span>
            </td>

            <td>${escapeHTML(String(scores.overall ?? "--"))}</td>

            <td>${escapeHTML(String(scores.security ?? "--"))}</td>

            <td>${escapeHTML(String(scores.dependency ?? "--"))}</td>

            <td>${escapeHTML(String(scores.health ?? "--"))}</td>

            <td>${escapeHTML(date)}</td>

            <td>
                <button
                    class="view-button"
                    data-scan-id="${escapeHTML(String(scan.id))}">
                    View
                </button>
            </td>
        `;

        tableBody.appendChild(row);

    });


    attachViewButtons();
}


// -------------------------
// View scan
// -------------------------

function attachViewButtons() {

    const buttons =
        document.querySelectorAll(".view-button");


    buttons.forEach(function (button) {

        button.addEventListener("click", function () {

            const scanId =
                button.getAttribute("data-scan-id");

            if (!scanId) {
                return;
            }

            localStorage.setItem(
                "repoguard_scan_id",
                scanId
            );

            window.location.href = "scan-results.html";

        });

    });
}


// -------------------------
// Search + filter
// -------------------------

function filterScans() {

    const searchTerm =
        searchInput.value.trim().toLowerCase();

    const selectedStatus =
        statusFilter.value;


    const filteredScans = allScans.filter(function (scan) {

        const repository = scan.repository
            ? `${scan.repository.owner}/${scan.repository.name}`.toLowerCase()
            : "";

        const status =
            String(scan.status || "").toUpperCase();


        const matchesSearch =
            repository.includes(searchTerm);

        const matchesStatus =
            selectedStatus === "ALL" ||
            status === selectedStatus;


        return matchesSearch && matchesStatus;

    });


    displayScans(filteredScans);
}


// -------------------------
// Status class
// -------------------------

function getStatusClass(status) {

    return String(status)
        .toLowerCase()
        .replace(/[^a-z0-9_-]/g, "-");

}


// -------------------------
// HTML safety
// -------------------------

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


// -------------------------
// Events
// -------------------------

searchInput.addEventListener(
    "input",
    filterScans
);

statusFilter.addEventListener(
    "change",
    filterScans
);


// -------------------------
// Start
// -------------------------

loadScans();