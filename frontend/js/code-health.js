const API_URL = "http://127.0.0.1:8000";

const scanId =
    localStorage.getItem("repoguard_scan_id");


const repositoryName =
    document.getElementById("repositoryName");

const repositoryUrl =
    document.getElementById("repositoryUrl");

const repositorySubtitle =
    document.getElementById("repositorySubtitle");

const healthScore =
    document.getElementById("healthScore");

const healthRisk =
    document.getElementById("healthRisk");

const totalFiles =
    document.getElementById("totalFiles");

const codeFiles =
    document.getElementById("codeFiles");

const totalLines =
    document.getElementById("totalLines");

const testFiles =
    document.getElementById("testFiles");

const readmeStatus =
    document.getElementById("readmeStatus");

const dependencyFiles =
    document.getElementById("dependencyFiles");

const todoCount =
    document.getElementById("todoCount");

const largeFiles =
    document.getElementById("largeFiles");

const languageList =
    document.getElementById("languageList");


if (!scanId) {

    showNoScanState();

} else {

    loadCodeHealth();

}


/* =========================================
   LOAD CODE HEALTH
========================================= */

async function loadCodeHealth() {

    try {

        await loadScanInformation();

        await loadHealthMetrics();

    } catch (error) {

        console.error(
            "Code Health error:",
            error
        );

        showErrorState();

    }

}


/* =========================================
   LOAD SCAN INFORMATION
========================================= */

async function loadScanInformation() {

    const response = await fetch(
        `${API_URL}/api/scans/${scanId}`
    );


    if (!response.ok) {

        throw new Error(
            "Unable to load scan information"
        );

    }


    const scan =
        await response.json();


    if (scan.repository) {

        const repository =
            scan.repository;

        const fullName =
            `${repository.owner}/${repository.name}`;

        repositoryName.textContent =
            fullName;

        repositorySubtitle.textContent =
            `Code health analysis for ${fullName}`;

        repositoryUrl.textContent =
            repository.github_url || "";

    }


    if (
        scan.scores &&
        scan.scores.health !== null &&
        scan.scores.health !== undefined
    ) {

        const score =
            scan.scores.health;

        healthScore.textContent =
            score;

        updateHealthRisk(score);

    }

}


/* =========================================
   LOAD HEALTH METRICS
========================================= */

async function loadHealthMetrics() {

    const response = await fetch(
        `${API_URL}/api/scans/${scanId}/health`
    );


    if (!response.ok) {

        throw new Error(
            "Unable to load health metrics"
        );

    }


    const data =
        await response.json();


    const health =
        data.health;


    if (!health) {

        showNoHealthData();

        return;

    }


    updateMetrics(health);

}


/* =========================================
   UPDATE METRICS
========================================= */

function updateMetrics(health) {

    totalFiles.textContent =
        formatNumber(health.total_files);


    codeFiles.textContent =
        formatNumber(health.code_files);


    totalLines.textContent =
        formatNumber(health.total_lines);


    testFiles.textContent =
        formatNumber(health.test_files);


    dependencyFiles.textContent =
        formatNumber(health.dependency_files);


    todoCount.textContent =
        formatNumber(health.todo_count);


    largeFiles.textContent =
        formatNumber(health.large_files);


    updateReadmeStatus(
        health.readme_found
    );


    displayLanguages(
        health.languages
    );

}


/* =========================================
   README STATUS
========================================= */

function updateReadmeStatus(found) {

    if (found) {

        readmeStatus.textContent =
            "Found";

        readmeStatus.className =
            "health-status status-good";

    } else {

        readmeStatus.textContent =
            "Not Found";

        readmeStatus.className =
            "health-status status-missing";

    }

}


/* =========================================
   DISPLAY LANGUAGES
========================================= */

function displayLanguages(languages) {

    languageList.innerHTML = "";


    if (
        !languages ||
        Object.keys(languages).length === 0
    ) {

        languageList.innerHTML = `
            <div class="metric-row">
                <span class="metric-name">
                    No recognized languages
                </span>
            </div>
        `;

        return;

    }


    const sortedLanguages =
        Object.entries(languages)
            .sort(function (a, b) {

                return b[1] - a[1];

            });


    sortedLanguages.forEach(
        function ([language, count]) {

            const row =
                document.createElement("div");

            row.className =
                "language-row";

            row.innerHTML = `

                <span class="language-name">
                    ${escapeHTML(language)}
                </span>

                <span class="language-count">
                    ${formatNumber(count)} files
                </span>

            `;

            languageList.appendChild(row);

        }
    );

}


/* =========================================
   HEALTH RISK
========================================= */

function updateHealthRisk(score) {

    healthRisk.className =
        "health-status";


    if (score >= 90) {

        healthRisk.textContent =
            "Excellent";

        healthRisk.classList.add(
            "status-good"
        );

        return;

    }


    if (score >= 75) {

        healthRisk.textContent =
            "Good";

        healthRisk.classList.add(
            "status-good"
        );

        return;

    }


    if (score >= 50) {

        healthRisk.textContent =
            "Needs Attention";

        healthRisk.classList.add(
            "status-warning"
        );

        return;

    }


    healthRisk.textContent =
        "Poor";

    healthRisk.classList.add(
        "status-missing"
    );

}


/* =========================================
   NO SCAN STATE
========================================= */

function showNoScanState() {

    repositoryName.textContent =
        "No scan selected";

    repositorySubtitle.textContent =
        "Please run a repository scan first.";

    repositoryUrl.textContent =
        "";

    healthScore.textContent =
        "--";

    healthRisk.textContent =
        "--";

    totalFiles.textContent =
        "--";

    codeFiles.textContent =
        "--";

    totalLines.textContent =
        "--";

    testFiles.textContent =
        "--";

    dependencyFiles.textContent =
        "--";

    todoCount.textContent =
        "--";

    largeFiles.textContent =
        "--";

    readmeStatus.textContent =
        "--";

    languageList.innerHTML = `
        <div class="metric-row">
            <span class="metric-name">
                No scan available
            </span>
        </div>
    `;

}


/* =========================================
   NO HEALTH DATA
========================================= */

function showNoHealthData() {

    totalFiles.textContent =
        "--";

    codeFiles.textContent =
        "--";

    totalLines.textContent =
        "--";

    testFiles.textContent =
        "--";

    dependencyFiles.textContent =
        "--";

    todoCount.textContent =
        "--";

    largeFiles.textContent =
        "--";

    readmeStatus.textContent =
        "No Data";

    readmeStatus.className =
        "health-status status-warning";

    languageList.innerHTML = `
        <div class="metric-row">
            <span class="metric-name">
                No health metrics available
            </span>
        </div>
    `;

}


/* =========================================
   ERROR STATE
========================================= */

function showErrorState() {

    repositorySubtitle.textContent =
        "Unable to load code health information.";

    healthScore.textContent =
        "--";

    healthRisk.textContent =
        "Unavailable";

    healthRisk.className =
        "health-status status-warning";

}


/* =========================================
   NUMBER FORMAT
========================================= */

function formatNumber(value) {

    if (
        value === null ||
        value === undefined
    ) {

        return "0";

    }

    return Number(value).toLocaleString();

}


/* =========================================
   HTML ESCAPING
========================================= */

function escapeHTML(value) {

    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");

}


/* =========================================
   NEW SCAN BUTTON
========================================= */

document
    .getElementById("newScanButton")
    .addEventListener(
        "click",
        function () {

            window.location.href =
                "new-scan.html";

        }
    );