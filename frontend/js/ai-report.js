/* =========================================================
   RepoGuard - AI Security Report
   ========================================================= */

const API_BASE_URL = "http://127.0.0.1:8000";

const scanId = getScanId();

const loadingState = document.getElementById("loadingState");
const errorState = document.getElementById("errorState");
const reportContent = document.getElementById("reportContent");

const errorMessage = document.getElementById("errorMessage");

const backButton = document.getElementById("backButton");
const refreshButton = document.getElementById("refreshButton");
const retryButton = document.getElementById("retryButton");
const printButton = document.getElementById("printButton");


/* =========================================================
   INITIALIZATION
========================================================= */

document.addEventListener("DOMContentLoaded", function () {
    setupEventListeners();
    loadAIReport();
});


/* =========================================================
   GET SCAN ID
========================================================= */

function getScanId() {
    const params = new URLSearchParams(window.location.search);
    const queryScanId = params.get("scan_id");

    if (queryScanId) {
        return queryScanId;
    }

    const storedScanId = localStorage.getItem("repoguard_scan_id");

    return storedScanId;
}


/* =========================================================
   EVENT LISTENERS
========================================================= */

function setupEventListeners() {

    if (backButton) {
        backButton.addEventListener("click", function () {
            goBack();
        });
    }

    if (refreshButton) {
        refreshButton.addEventListener("click", function () {
            loadAIReport();
        });
    }

    if (retryButton) {
        retryButton.addEventListener("click", function () {
            loadAIReport();
        });
    }

    if (printButton) {
        printButton.addEventListener("click", function () {
            window.print();
        });
    }
}


/* =========================================================
   LOAD AI REPORT
========================================================= */

async function loadAIReport() {

    showLoading();

    if (!scanId) {
        showError("No scan ID was found. Please run a repository scan first.");
        return;
    }

    try {

        const response = await fetch(
            `${API_BASE_URL}/api/scans/${encodeURIComponent(scanId)}/ai-report`
        );

        const data = await response.json();

        if (!response.ok) {
            const message = data.detail || "Failed to generate AI report.";
            throw new Error(message);
        }

        if (!data.ai_report) {
            throw new Error("The server returned an empty AI report.");
        }

        displayReport(data);

    } catch (error) {

        console.error("AI report error:", error);

        showError(
            error.message || "Unable to generate the AI security report."
        );
    }
}


/* =========================================================
   DISPLAY REPORT
========================================================= */

function displayReport(data) {

    const report = data.ai_report;

    /*
     * The backend currently returns the Gemini response
     * as plain text.
     *
     * First display the complete report safely.
     */
    const formattedReport = formatAIReport(report);

    setElementHTML(
        "executiveSummary",
        extractSection(
            formattedReport,
            "Executive Summary",
            "Overall Risk"
        )
    );

    setElementHTML(
        "overallRisk",
        extractSection(
            formattedReport,
            "Overall Risk",
            "Top Security Risks"
        )
    );

    setElementHTML(
        "securityRisks",
        extractSection(
            formattedReport,
            "Top Security Risks",
            "Dependency Risks"
        )
    );

    setElementHTML(
        "dependencyRisks",
        extractSection(
            formattedReport,
            "Dependency Risks",
            "Secret Detection Summary"
        )
    );

    setElementHTML(
        "secretSummary",
        extractSection(
            formattedReport,
            "Secret Detection Summary",
            "CI/CD Security"
        )
    );

    setElementHTML(
        "cicdSecurity",
        extractSection(
            formattedReport,
            "CI/CD Security",
            "Code Health"
        )
    );

    setElementHTML(
        "codeHealth",
        extractSection(
            formattedReport,
            "Code Health",
            "Recommended Actions"
        )
    );

    setElementHTML(
        "recommendedActions",
        extractSection(
            formattedReport,
            "Recommended Actions",
            null
        )
    );

    updateScanInformation(data);

    hideElement(loadingState);
    hideElement(errorState);
    showElement(reportContent);
}


/* =========================================================
   FORMAT AI TEXT
========================================================= */

function formatAIReport(text) {

    if (!text) {
        return "";
    }

    let safeText = escapeHTML(String(text));

    /*
     * Convert Markdown-style headings.
     */
    safeText = safeText.replace(
        /^### (.+)$/gm,
        "<h3>$1</h3>"
    );

    safeText = safeText.replace(
        /^## (.+)$/gm,
        "<h2>$1</h2>"
    );

    safeText = safeText.replace(
        /^# (.+)$/gm,
        "<h2>$1</h2>"
    );

    /*
     * Convert bold text.
     */
    safeText = safeText.replace(
        /\*\*(.+?)\*\*/g,
        "<strong>$1</strong>"
    );

    /*
     * Convert inline code.
     */
    safeText = safeText.replace(
        /`([^`]+)`/g,
        "<code>$1</code>"
    );

    /*
     * Convert bullet points.
     */
    safeText = safeText.replace(
        /^[*-]\s+(.+)$/gm,
        "<li>$1</li>"
    );

    safeText = convertListItems(safeText);

    /*
     * Convert numbered lists.
     */
    safeText = safeText.replace(
        /^\d+\.\s+(.+)$/gm,
        "<li>$1</li>"
    );

    /*
     * Convert remaining line breaks.
     */
    safeText = safeText.replace(
        /\n{2,}/g,
        "</p><p>"
    );

    safeText = safeText.replace(
        /\n/g,
        "<br>"
    );

    return `<p>${safeText}</p>`;
}


/* =========================================================
   CONVERT LIST ITEMS
========================================================= */

function convertListItems(html) {

    return html.replace(
        /(<li>.*?<\/li>(?:<br>)?)+/gs,
        function (match) {

            const cleaned = match
                .replace(/<br>/g, "")
                .trim();

            return `<ul>${cleaned}</ul>`;
        }
    );
}


/* =========================================================
   EXTRACT REPORT SECTION
========================================================= */

function extractSection(reportHTML, sectionName, nextSectionName) {

    if (!reportHTML) {
        return "<p>No information was returned for this section.</p>";
    }

    const escapedName = escapeRegExp(sectionName);

    const startPattern = new RegExp(
        `<h[1-3]>\\s*(?:\\d+\\.\\s*)?${escapedName}\\s*<\\/h[1-3]>`,
        "i"
    );

    const startMatch = reportHTML.match(startPattern);

    if (!startMatch) {
        return "<p>No information was returned for this section.</p>";
    }

    const startIndex =
        startMatch.index + startMatch[0].length;

    let endIndex = reportHTML.length;

    if (nextSectionName) {

        const escapedNextName =
            escapeRegExp(nextSectionName);

        const nextPattern = new RegExp(
            `<h[1-3]>\\s*(?:\\d+\\.\\s*)?${escapedNextName}\\s*<\\/h[1-3]>`,
            "i"
        );

        const remainingHTML =
            reportHTML.substring(startIndex);

        const nextMatch =
            remainingHTML.match(nextPattern);

        if (nextMatch && nextMatch.index !== undefined) {
            endIndex = startIndex + nextMatch.index;
        }
    }

    const section = reportHTML
        .substring(startIndex, endIndex)
        .trim();

    if (!section) {
        return "<p>No information was returned for this section.</p>";
    }

    return section;
}


/* =========================================================
   UPDATE SCAN INFORMATION
========================================================= */

function updateScanInformation(data) {

    const scan = data.scan || data.scan_data || {};

    setElementText(
        "scanId",
        data.scan_id || scan.scan_id || scanId || "—"
    );

    setElementText(
        "overallScore",
        formatScore(scan.overall_score)
    );

    setElementText(
        "securityScore",
        formatScore(scan.security_score)
    );

    setElementText(
        "dependencyScore",
        formatScore(scan.dependency_score)
    );

    setElementText(
        "secretScore",
        formatScore(scan.secret_score)
    );

    setElementText(
        "cicdScore",
        formatScore(scan.cicd_score)
    );

    setElementText(
        "healthScore",
        formatScore(scan.health_score)
    );
}


/* =========================================================
   SCORE FORMAT
========================================================= */

function formatScore(score) {

    if (
        score === null ||
        score === undefined ||
        score === ""
    ) {
        return "—";
    }

    return `${score}/100`;
}


/* =========================================================
   NAVIGATION
========================================================= */

function goBack() {

    if (scanId) {
        window.location.href =
            `scan-results.html?scan_id=${encodeURIComponent(scanId)}`;
        return;
    }

    window.location.href = "dashboard.html";
}


/* =========================================================
   UI STATES
========================================================= */

function showLoading() {

    showElement(loadingState);
    hideElement(errorState);
    hideElement(reportContent);
}

function showError(message) {

    hideElement(loadingState);
    hideElement(reportContent);
    showElement(errorState);

    setElementText(
        "errorMessage",
        message
    );
}

function showElement(element) {

    if (element) {
        element.classList.remove("hidden");
    }
}

function hideElement(element) {

    if (element) {
        element.classList.add("hidden");
    }
}


/* =========================================================
   DOM HELPERS
========================================================= */

function setElementText(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.textContent = value;
    }
}

function setElementHTML(id, value) {

    const element = document.getElementById(id);

    if (element) {
        element.innerHTML = value;
    }
}


/* =========================================================
   SECURITY HELPERS
========================================================= */

function escapeHTML(value) {

    const element = document.createElement("div");

    element.textContent = value;

    return element.innerHTML;
}

function escapeRegExp(value) {

    return value.replace(
        /[.*+?^${}()|[\]\\]/g,
        "\\$&"
    );
}


/* =========================================================
   GLOBAL ERROR HANDLING
========================================================= */

window.addEventListener("unhandledrejection", function (event) {

    console.error(
        "Unhandled Promise rejection:",
        event.reason
    );
});