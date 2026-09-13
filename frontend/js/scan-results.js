const API_URL = "http://https://repoguard-backend-5tde.onrender.com";

const scanId =
    localStorage.getItem("repoguard_scan_id");


const repositoryName =
    document.getElementById("repositoryName");

const repositoryUrl =
    document.getElementById("repositoryUrl");

const overallScore =
    document.getElementById("overallScore");

const securityScore =
    document.getElementById("securityScore");

const dependencyScore =
    document.getElementById("dependencyScore");

const secretScore =
    document.getElementById("secretScore");

const healthScore =
    document.getElementById("healthScore");

const riskLevel =
    document.getElementById("riskLevel");

const findingsTableBody =
    document.getElementById("findingsTableBody");

const severityFilter =
    document.getElementById("severityFilter");

const categoryFilter =
    document.getElementById("categoryFilter");

const findingSearch =
    document.getElementById("findingSearch");

const findingResultCount =
    document.getElementById("findingResultCount");


let allFindings = [];


if (!scanId) {

    repositoryName.textContent =
        "No scan selected";

    findingResultCount.textContent =
        "No scan is available.";

    findingsTableBody.innerHTML = `
        <tr>
            <td colspan="4">
                No scan is available.
            </td>
        </tr>
    `;

} else {

    (async function () {
        await loadScanResults();
    })();
}


/* ==========================================================
   LOAD SCAN
========================================================== */

async function loadScanResults() {

    try {

        const response = await fetch(
            `${API_URL}/api/scans/${scanId}`
        );

        if (!response.ok) {

            throw new Error(
                "Unable to load scan"
            );

        }

        const scan =
            await response.json();

        displayScan(scan);

        await loadFindings();

    } catch (error) {

        console.error(
            "Results error:",
            error
        );

        repositoryName.textContent =
            "Unable to load scan";

        findingResultCount.textContent =
            "Unable to load findings.";

        findingsTableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to load scan results.
                </td>
            </tr>
        `;

    }

}


/* ==========================================================
   DISPLAY SCAN
========================================================== */

function displayScan(scan) {

    const repository =
        scan.repository;


    if (repository) {

        repositoryName.textContent =
            `${repository.owner}/${repository.name}`;

        repositoryUrl.textContent =
            repository.github_url || "";

        document.getElementById(
            "repositorySubtitle"
        ).textContent =
            `${repository.owner}/${repository.name}`;

    }


    const scores =
        scan.scores;


    if (!scores) {

        return;

    }


    overallScore.textContent =
        scores.overall ?? "--";


    securityScore.textContent =
        scores.security ?? "--";


    dependencyScore.textContent =
        scores.dependency ?? "--";


    secretScore.textContent =
        scores.secret ?? "--";


    healthScore.textContent =
        scores.health ?? "--";


    if (
        scores.overall !== null &&
        scores.overall !== undefined
    ) {

        riskLevel.textContent =
            getRiskLevel(
                scores.overall
            );

    }

}


/* ==========================================================
   LOAD FINDINGS
========================================================== */

async function loadFindings() {

    const response = await fetch(
        `${API_URL}/api/scans/${scanId}/findings`
    );


    if (!response.ok) {

        throw new Error(
            "Unable to load findings"
        );

    }


    const data =
        await response.json();


    allFindings =
        data.findings || [];


    updateFindingCounts(
        allFindings
    );


    populateCategoryFilter(
        allFindings
    );


    applyFilters();

}


/* ==========================================================
   FINDING COUNTS
========================================================== */

function updateFindingCounts(
    findings
) {

    let critical = 0;

    let high = 0;

    let medium = 0;

    let low = 0;


    findings.forEach(
        function (finding) {

            const severity =
                (
                    finding.severity ||
                    ""
                ).toLowerCase();


            if (severity === "critical") {

                critical++;

            } else if (severity === "high") {

                high++;

            } else if (severity === "medium") {

                medium++;

            } else if (severity === "low") {

                low++;

            }

        }
    );


    document.getElementById(
        "criticalCount"
    ).textContent = critical;


    document.getElementById(
        "highCount"
    ).textContent = high;


    document.getElementById(
        "mediumCount"
    ).textContent = medium;


    document.getElementById(
        "lowCount"
    ).textContent = low;

}


/* ==========================================================
   CATEGORY FILTER
========================================================== */

function populateCategoryFilter(
    findings
) {

    const categories =
        new Set();


    findings.forEach(
        function (finding) {

            if (finding.category) {

                categories.add(
                    finding.category
                );

            }

        }
    );


    categoryFilter.innerHTML = `
        <option value="ALL">
            All Categories
        </option>
    `;


    Array.from(categories)
        .sort(function (a, b) {
            return a.localeCompare(b);
        })
        .forEach(
            function (category) {

                const option =
                    document.createElement(
                        "option"
                    );

                option.value =
                    category;

                option.textContent =
                    category;

                categoryFilter.appendChild(
                    option
                );

            }
        );

}


/* ==========================================================
   APPLY FILTERS
========================================================== */

function applyFilters() {

    const selectedSeverity =
        severityFilter.value;


    const selectedCategory =
        categoryFilter.value;


    const searchText =
        findingSearch.value
            .trim()
            .toLowerCase();


    const filteredFindings =
        allFindings.filter(
            function (finding) {

                const severity =
                    (
                        finding.severity ||
                        ""
                    ).toUpperCase();


                const category =
                    (
                        finding.category ||
                        ""
                    );


                const title =
                    (
                        finding.title ||
                        ""
                    ).toLowerCase();


                const description =
                    (
                        finding.description ||
                        ""
                    ).toLowerCase();


                const file =
                    (
                        finding.file_path ||
                        ""
                    ).toLowerCase();


                const severityMatches =
                    selectedSeverity === "ALL" ||
                    severity === selectedSeverity;


                const categoryMatches =
                    selectedCategory === "ALL" ||
                    category === selectedCategory;


                const searchMatches =
                    !searchText ||
                    title.includes(searchText) ||
                    description.includes(searchText) ||
                    file.includes(searchText) ||
                    category.toLowerCase()
                        .includes(searchText);


                return (
                    severityMatches &&
                    categoryMatches &&
                    searchMatches
                );

            }
        );


    displayFindings(
        filteredFindings
    );

}


/* ==========================================================
   DISPLAY FINDINGS
========================================================== */

function displayFindings(
    findings
) {

    findingResultCount.textContent =
        `Showing ${findings.length} of ${allFindings.length} findings`;


    if (findings.length === 0) {

        findingsTableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    No findings match the selected filters.
                </td>
            </tr>
        `;

        return;

    }


    findingsTableBody.innerHTML = "";


    findings.forEach(
        function (finding) {

            const row =
                document.createElement(
                    "tr"
                );


            const severity =
                (
                    finding.severity ||
                    "UNKNOWN"
                ).toUpperCase();


            const category =
                finding.category ||
                "GENERAL";


            const title =
                finding.title ||
                "Security issue";


            const file =
                finding.file_path ||
                "--";


            const severityClass =
                getSeverityClass(
                    severity
                );


            row.innerHTML = `

                <td>

                    <span class="severity-badge ${severityClass}">
                        ${escapeHtml(severity)}
                    </span>

                </td>

                <td>
                    ${escapeHtml(category)}
                </td>

                <td>

                    <span class="finding-title">
                        ${escapeHtml(title)}
                    </span>

                </td>

                <td>

                    <span class="finding-file">
                        ${escapeHtml(file)}
                    </span>

                </td>

            `;


            findingsTableBody.appendChild(
                row
            );

        }
    );

}


/* ==========================================================
   SEVERITY CLASS
========================================================== */

function getSeverityClass(
    severity
) {

    switch (severity) {

        case "CRITICAL":
            return "severity-critical";

        case "HIGH":
            return "severity-high";

        case "MEDIUM":
            return "severity-medium";

        case "LOW":
            return "severity-low";

        default:
            return "";

    }

}


/* ==========================================================
   HTML ESCAPE
========================================================== */

function escapeHtml(
    value
) {

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}


/* ==========================================================
   RISK LEVEL
========================================================== */

function getRiskLevel(
    score
) {

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


/* ==========================================================
   FILTER EVENTS
========================================================== */

severityFilter.addEventListener(
    "change",
    applyFilters
);


categoryFilter.addEventListener(
    "change",
    applyFilters
);


findingSearch.addEventListener(
    "input",
    applyFilters
);


/* ==========================================================
   NEW SCAN
========================================================== */

document
    .getElementById("newScanButton")
    .addEventListener(
        "click",
        function () {

            window.location.href =
                "new-scan.html";

        }
    );