const API_URL = "https://repoguard-backend-5tde.onrender.com";

const scanId =
    localStorage.getItem("repoguard_scan_id");


const repositoryName =
    document.getElementById("repositoryName");

const repositoryUrl =
    document.getElementById("repositoryUrl");

const repositorySubtitle =
    document.getElementById("repositorySubtitle");

const secretScore =
    document.getElementById("secretScore");

const totalSecrets =
    document.getElementById("totalSecrets");

const highSecrets =
    document.getElementById("highSecrets");

const secretTypes =
    document.getElementById("secretTypes");

const severityFilter =
    document.getElementById("severityFilter");

const secretSearch =
    document.getElementById("secretSearch");

const secretResultCount =
    document.getElementById("secretResultCount");

const secretTableBody =
    document.getElementById("secretTableBody");


let secrets = [];


if (!scanId) {

    repositoryName.textContent =
        "No scan selected";

    repositorySubtitle.textContent =
        "Please run a repository scan first.";

    secretResultCount.textContent =
        "No scan is available.";

    secretTableBody.innerHTML = `
        <tr>
            <td colspan="5">
                No scan is available.
            </td>
        </tr>
    `;

} else {

    loadSecretData();

}


/* =========================================
   LOAD SECRET DATA
========================================= */

async function loadSecretData() {

    try {

        await loadScanInformation();

        await loadSecrets();

    } catch (error) {

        console.error(
            "Secret page error:",
            error
        );

        secretResultCount.textContent =
            "Unable to load secret data.";

        secretTableBody.innerHTML = `
            <tr>
                <td colspan="5">
                    Unable to load secret findings.
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
            `Secret detection for ${fullName}`;

        repositoryUrl.textContent =
            repository.github_url || "";

    }


    const scores =
        scan.scores;


    if (
        scores &&
        scores.secret !== null &&
        scores.secret !== undefined
    ) {

        secretScore.textContent =
            scores.secret;

    }

}


/* =========================================
   LOAD SECRETS
========================================= */

async function loadSecrets() {

    const response = await fetch(
        `${API_URL}/api/scans/${scanId}/secrets`
    );


    if (!response.ok) {

        throw new Error(
            "Unable to load secrets"
        );

    }


    const data =
        await response.json();


    secrets =
        data.secrets || [];


    updateSummary();

    displaySecrets();

}


/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary() {

    const total =
        secrets.length;


    const high =
        secrets.filter(
            function (secret) {

                return (
                    String(
                        secret.severity || ""
                    ).toUpperCase() === "HIGH"
                );

            }
        ).length;


    const types =
        new Set();


    secrets.forEach(
        function (secret) {

            if (secret.secret_type) {

                types.add(
                    secret.secret_type
                );

            }

        }
    );


    totalSecrets.textContent =
        total;

    highSecrets.textContent =
        high;

    secretTypes.textContent =
        types.size;

}


/* =========================================
   DISPLAY SECRETS
========================================= */

function displaySecrets() {

    const selectedSeverity =
        severityFilter.value;


    const searchText =
        secretSearch.value
            .trim()
            .toLowerCase();


    const filteredSecrets =
        secrets.filter(
            function (secret) {

                const severity =
                    String(
                        secret.severity || ""
                    ).toUpperCase();


                const matchesSeverity =
                    selectedSeverity === "ALL" ||
                    severity === selectedSeverity;


                const secretType =
                    String(
                        secret.secret_type || ""
                    ).toLowerCase();


                const filePath =
                    String(
                        secret.file_path || ""
                    ).toLowerCase();


                const description =
                    String(
                        secret.description || ""
                    ).toLowerCase();


                const matchesSearch =
                    !searchText ||
                    secretType.includes(searchText) ||
                    filePath.includes(searchText) ||
                    description.includes(searchText);


                return (
                    matchesSeverity &&
                    matchesSearch
                );

            }
        );


    secretResultCount.textContent =
        `Showing ${filteredSecrets.length} of ${secrets.length} secret findings`;


    if (filteredSecrets.length === 0) {

        if (secrets.length === 0) {

            secretTableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        <div class="no-secrets">
                            No exposed secrets detected.
                        </div>
                    </td>
                </tr>
            `;

        } else {

            secretTableBody.innerHTML = `
                <tr>
                    <td colspan="5">
                        No secret findings match your filters.
                    </td>
                </tr>
            `;

        }

        return;

    }


    secretTableBody.innerHTML = "";


    filteredSecrets.forEach(
        function (secret) {

            const row =
                document.createElement("tr");


            const severity =
                String(
                    secret.severity || "UNKNOWN"
                ).toUpperCase();


            const severityClass =
                getSeverityClass(severity);


            row.innerHTML = `

                <td>
                    <span
                        class="severity-badge ${severityClass}"
                    >
                        ${escapeHTML(severity)}
                    </span>
                </td>


                <td>
                    <span class="secret-type">
                        ${escapeHTML(
                            secret.secret_type ||
                            "Unknown Secret"
                        )}
                    </span>
                </td>


                <td>
                    <span class="secret-file">
                        ${escapeHTML(
                            secret.file_path ||
                            "--"
                        )}
                    </span>
                </td>


                <td>
                    <span class="secret-line">
                        ${escapeHTML(
                            secret.line_number ??
                            "--"
                        )}
                    </span>
                </td>


                <td>
                    ${escapeHTML(
                        secret.description ||
                        "Potential exposed credential detected."
                    )}
                </td>

            `;


            secretTableBody.appendChild(row);

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

        displaySecrets();

    }
);


secretSearch.addEventListener(
    "input",
    function () {

        displaySecrets();

    }
);


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
