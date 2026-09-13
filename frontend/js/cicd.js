const API_URL = "http://127.0.0.1:8000";

const scanId =
    localStorage.getItem("repoguard_scan_id");


const repositoryName =
    document.getElementById("repositoryName");

const repositoryUrl =
    document.getElementById("repositoryUrl");

const repositorySubtitle =
    document.getElementById("repositorySubtitle");

const cicdScore =
    document.getElementById("cicdScore");

const workflowCount =
    document.getElementById("workflowCount");

const totalFindings =
    document.getElementById("totalFindings");

const highFindings =
    document.getElementById("highFindings");

const mediumLowFindings =
    document.getElementById("mediumLowFindings");

const severityFilter =
    document.getElementById("severityFilter");

const cicdSearch =
    document.getElementById("cicdSearch");

const cicdResultCount =
    document.getElementById("cicdResultCount");

const cicdTableBody =
    document.getElementById("cicdTableBody");


let cicdFindings = [];


if (!scanId) {

    repositoryName.textContent =
        "No scan selected";

    repositorySubtitle.textContent =
        "Please run a repository scan first.";

    cicdResultCount.textContent =
        "No scan is available.";

    cicdTableBody.innerHTML = `
        <tr>
            <td colspan="4">
                No scan is available.
            </td>
        </tr>
    `;

} else {

    loadCicdData();

}


/* =========================================
   LOAD CI/CD DATA
========================================= */

async function loadCicdData() {

    try {

        await loadScanInformation();

        await loadCicdFindings();

    } catch (error) {

        console.error(
            "CI/CD page error:",
            error
        );

        cicdResultCount.textContent =
            "Unable to load CI/CD data.";

        cicdTableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to load CI/CD findings.
                </td>
            </tr>
        `;
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


    const repository =
        scan.repository;


    if (repository) {

        const fullName =
            `${repository.owner}/${repository.name}`;

        repositoryName.textContent =
            fullName;

        repositorySubtitle.textContent =
            `CI/CD security analysis for ${fullName}`;

        repositoryUrl.textContent =
            repository.github_url || "";

    }


    const scores =
        scan.scores;


    if (
        scores &&
        scores.cicd !== null &&
        scores.cicd !== undefined
    ) {

        cicdScore.textContent =
            scores.cicd;

    }

}


/* =========================================
   LOAD CI/CD FINDINGS
========================================= */

async function loadCicdFindings() {

    const response = await fetch(
        `${API_URL}/api/scans/${scanId}/cicd`
    );


    if (!response.ok) {

        throw new Error(
            "Unable to load CI/CD findings"
        );

    }


    const data =
        await response.json();


    cicdFindings =
        data.findings || [];


    workflowCount.textContent =
        countWorkflows(cicdFindings);


    updateSummary();

    displayFindings();

}


/* =========================================
   COUNT WORKFLOWS
========================================= */

function countWorkflows(findings) {

    const workflows =
        new Set();


    findings.forEach(
        function (finding) {

            if (finding.file_path) {

                workflows.add(
                    finding.file_path
                );

            } else if (finding.workflow) {

                workflows.add(
                    finding.workflow
                );

            }

        }
    );


    return workflows.size;

}


/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary() {

    const total =
        cicdFindings.length;


    const high =
        cicdFindings.filter(
            function (finding) {

                return (
                    String(
                        finding.severity || ""
                    ).toUpperCase() === "HIGH"
                );

            }
        ).length;


    const medium =
        cicdFindings.filter(
            function (finding) {

                return (
                    String(
                        finding.severity || ""
                    ).toUpperCase() === "MEDIUM"
                );

            }
        ).length;


    const low =
        cicdFindings.filter(
            function (finding) {

                return (
                    String(
                        finding.severity || ""
                    ).toUpperCase() === "LOW"
                );

            }
        ).length;


    totalFindings.textContent =
        total;

    highFindings.textContent =
        high;

    mediumLowFindings.textContent =
        medium + low;

}


/* =========================================
   DISPLAY FINDINGS
========================================= */

function displayFindings() {

    const selectedSeverity =
        severityFilter.value;


    const searchText =
        cicdSearch.value
            .trim()
            .toLowerCase();


    const filteredFindings =
        cicdFindings.filter(
            function (finding) {

                const severity =
                    String(
                        finding.severity || ""
                    ).toUpperCase();


                const matchesSeverity =
                    selectedSeverity === "ALL" ||
                    severity === selectedSeverity;


                const workflow =
                    String(
                        finding.workflow ||
                        finding.file_path ||
                        ""
                    ).toLowerCase();


                const rule =
                    String(
                        finding.rule_id ||
                        finding.rule ||
                        ""
                    ).toLowerCase();


                const title =
                    String(
                        finding.title || ""
                    ).toLowerCase();


                const description =
                    String(
                        finding.description || ""
                    ).toLowerCase();


                const matchesSearch =
                    !searchText ||
                    workflow.includes(searchText) ||
                    rule.includes(searchText) ||
                    title.includes(searchText) ||
                    description.includes(searchText);


                return (
                    matchesSeverity &&
                    matchesSearch
                );

            }
        );


    cicdResultCount.textContent =
        `Showing ${filteredFindings.length} of ${cicdFindings.length} CI/CD findings`;


    if (filteredFindings.length === 0) {

        if (cicdFindings.length === 0) {

            cicdTableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        <div class="no-findings">
                            No CI/CD security findings detected.
                        </div>
                    </td>
                </tr>
            `;

        } else {

            cicdTableBody.innerHTML = `
                <tr>
                    <td colspan="4">
                        No findings match your filters.
                    </td>
                </tr>
            `;

        }

        return;

    }


    cicdTableBody.innerHTML = "";


    filteredFindings.forEach(
        function (finding) {

            const row =
                document.createElement("tr");


            const severity =
                String(
                    finding.severity || "UNKNOWN"
                ).toUpperCase();


            const severityClass =
                getSeverityClass(severity);


            const workflow =
                finding.workflow ||
                finding.file_path ||
                "--";


            const rule =
                finding.rule_id ||
                finding.rule ||
                "--";


            const description =
                finding.description ||
                finding.title ||
                "CI/CD security issue detected.";


            row.innerHTML = `

                <td>
                    <span
                        class="severity-badge ${severityClass}"
                    >
                        ${escapeHTML(severity)}
                    </span>
                </td>


                <td>
                    <span class="workflow-name">
                        ${escapeHTML(workflow)}
                    </span>
                </td>


                <td>
                    <span class="rule-name">
                        ${escapeHTML(rule)}
                    </span>
                </td>


                <td>
                    <span class="cicd-description">
                        ${escapeHTML(description)}
                    </span>
                </td>

            `;


            cicdTableBody.appendChild(row);

        }
    );

}


/* =========================================
   SEVERITY CLASS
========================================= */

function getSeverityClass(severity) {

    if (severity === "HIGH") {
        return "severity-high";
    }

    if (severity === "MEDIUM") {
        return "severity-medium";
    }

    if (severity === "LOW") {
        return "severity-low";
    }

    return "";

}


/* =========================================
   FILTER EVENTS
========================================= */

severityFilter.addEventListener(
    "change",
    function () {

        displayFindings();

    }
);


cicdSearch.addEventListener(
    "input",
    function () {

        displayFindings();

    }
);


/* =========================================
   NEW SCAN
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