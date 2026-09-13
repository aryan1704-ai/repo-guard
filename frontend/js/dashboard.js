const API_URL = "http://127.0.0.1:8000";


// -------------------------
// New Scan button
// -------------------------

const newScanButton = document.getElementById("newScanButton");

if (newScanButton) {
    newScanButton.addEventListener("click", function () {
        window.location.href = "new-scan.html";
    });
}


// -------------------------
// Load scan history
// -------------------------

async function loadScanHistory() {

    try {

        const response = await fetch(`${API_URL}/api/scans/`);

        if (!response.ok) {
            throw new Error("Unable to load scan history");
        }

        const data = await response.json();
        const scans = data.scans || [];

        displayScanHistory(scans);

        if (scans.length > 0) {
            loadLatestScan(scans[0]);
        }

    } catch (error) {

        console.error("Dashboard error:", error);

    }
}


// -------------------------
// Display scan history
// -------------------------

function displayScanHistory(scans) {

    const tableBody = document.getElementById("scanTableBody");

    if (!tableBody) {
        return;
    }

    tableBody.innerHTML = "";

    if (!scans || scans.length === 0) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    No scans available yet.
                </td>
            </tr>
        `;

        return;
    }


    scans.slice(0, 5).forEach(function (scan) {

        const row = document.createElement("tr");

        const repositoryName =
            scan.repository
                ? `${scan.repository.owner}/${scan.repository.name}`
                : "--";

        const score =
            scan.scores?.overall ?? "--";

        const date =
            scan.created_at
                ? new Date(scan.created_at).toLocaleDateString()
                : "--";

        row.innerHTML = `
            <td>${escapeHTML(repositoryName)}</td>
            <td>${escapeHTML(scan.status || "--")}</td>
            <td>${escapeHTML(String(score))}</td>
            <td>${escapeHTML(date)}</td>
        `;

        tableBody.appendChild(row);

    });
}


// -------------------------
// Show latest scan
// -------------------------

async function loadLatestScan(scan) {

    const repository = scan.repository;

    if (repository) {

        document.getElementById("repositoryName").textContent =
            `${repository.owner}/${repository.name}`;

        document.getElementById("repositoryUrl").textContent =
            repository.github_url || "";
    }


    const scores = scan.scores;

    if (scores) {

        // Overall score

        if (scores.overall !== null && scores.overall !== undefined) {

            document.getElementById("overallScore").textContent =
                scores.overall;

            document.getElementById("riskLevel").textContent =
                getRiskLevel(scores.overall);
        }


        // Individual scores

        document.getElementById("securityScore").textContent =
            scores.security ?? "--";

        document.getElementById("dependencyScore").textContent =
            scores.dependency ?? "--";

        document.getElementById("healthScore").textContent =
            scores.health ?? "--";

        document.getElementById("securityLargeScore").textContent =
            scores.security ?? "--";
    }


    // Load detailed data for latest scan

    if (scan.id) {
        await loadLatestScanDetails(scan.id);
    }
}


// -------------------------
// Load latest scan details
// -------------------------

async function loadLatestScanDetails(scanId) {

    await Promise.all([
        loadFindings(scanId),
        loadHealth(scanId)
    ]);

}


// -------------------------
// Load finding counts
// -------------------------

async function loadFindings(scanId) {

    try {

        const response =
            await fetch(`${API_URL}/api/scans/${encodeURIComponent(scanId)}/findings`);

        if (!response.ok) {
            throw new Error("Unable to load findings");
        }

        const data = await response.json();

        const findings = data.findings || [];

        const counts = {
            critical: 0,
            high: 0,
            medium: 0,
            low: 0
        };


        findings.forEach(function (finding) {

            const severity =
                String(finding.severity || "").toLowerCase();

            if (Object.prototype.hasOwnProperty.call(counts, severity)) {
                counts[severity]++;
            }

        });


        document.getElementById("criticalCount").textContent =
            counts.critical;

        document.getElementById("highCount").textContent =
            counts.high;

        document.getElementById("mediumCount").textContent =
            counts.medium;

        document.getElementById("lowCount").textContent =
            counts.low;

    } catch (error) {

        console.error("Finding data error:", error);

    }
}


// -------------------------
// Load repository health
// -------------------------

async function loadHealth(scanId) {

    try {

        const response =
            await fetch(`${API_URL}/api/scans/${encodeURIComponent(scanId)}/health`);

        if (!response.ok) {
            throw new Error("Unable to load repository health");
        }

        const data = await response.json();

        const health = data.health;

        if (!health) {
            return;
        }


        document.getElementById("totalFiles").textContent =
            health.total_files ?? "--";

        document.getElementById("codeFiles").textContent =
            health.code_files ?? "--";

        document.getElementById("totalLines").textContent =
            health.total_lines ?? "--";

        document.getElementById("testFiles").textContent =
            health.test_files ?? "--";

        document.getElementById("todoCount").textContent =
            health.todo_count ?? "--";

    } catch (error) {

        console.error("Health data error:", error);

    }
}


// -------------------------
// Risk level
// -------------------------

function getRiskLevel(score) {

    if (score >= 90) {
        return "Low Risk";
    }

    if (score >= 75) {
        return "Medium Risk";
    }

    if (score >= 50) {
        return "High Risk";
    }

    return "Critical Risk";
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
// Start dashboard
// -------------------------

loadScanHistory();