const API_URL = "https://repoguard-backend-5tde.onrender.com";

const scanId =
    localStorage.getItem("repoguard_scan_id");


const repositoryName =
    document.getElementById("repositoryName");

const repositoryUrl =
    document.getElementById("repositoryUrl");

const repositorySubtitle =
    document.getElementById("repositorySubtitle");

const dependencyScore =
    document.getElementById("dependencyScore");

const totalDependencies =
    document.getElementById("totalDependencies");

const vulnerableDependencies =
    document.getElementById("vulnerableDependencies");

const totalVulnerabilities =
    document.getElementById("totalVulnerabilities");

const dependencyTableBody =
    document.getElementById("dependencyTableBody");

const ecosystemFilter =
    document.getElementById("ecosystemFilter");

const dependencySearch =
    document.getElementById("dependencySearch");

const dependencyResultCount =
    document.getElementById("dependencyResultCount");


let dependencies = [];


if (!scanId) {

    repositoryName.textContent =
        "No scan selected";

    repositorySubtitle.textContent =
        "Please run a repository scan first.";

    dependencyResultCount.textContent =
        "No scan is available.";

    dependencyTableBody.innerHTML = `
        <tr>
            <td colspan="4">
                No scan is available.
            </td>
        </tr>
    `;

} else {

    loadDependencyData();

}


/* =========================================
   LOAD DEPENDENCY DATA
========================================= */

async function loadDependencyData() {

    try {

        await loadScanInformation();

        await loadDependencies();

    } catch (error) {

        console.error(
            "Dependency page error:",
            error
        );

        dependencyResultCount.textContent =
            "Unable to load dependency data.";

        dependencyTableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    Unable to load dependency data.
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
            `Dependency analysis for ${fullName}`;

        repositoryUrl.textContent =
            repository.github_url || "";
    }


    const scores =
        scan.scores;


    if (
        scores &&
        scores.dependency !== null &&
        scores.dependency !== undefined
    ) {

        dependencyScore.textContent =
            scores.dependency;

    }

}


/* =========================================
   LOAD DEPENDENCIES
========================================= */

async function loadDependencies() {

    const response = await fetch(
        `${API_URL}/api/scans/${scanId}/dependencies`
    );


    if (!response.ok) {

        throw new Error(
            "Unable to load dependencies"
        );

    }


    const data =
        await response.json();


    dependencies =
        data.dependencies || [];


    updateSummary();

    populateEcosystemFilter();

    displayDependencies();

}


/* =========================================
   UPDATE SUMMARY
========================================= */

function updateSummary() {

    const total =
        dependencies.length;


    const vulnerable =
        dependencies.filter(
            function (dependency) {

                return (
                    Number(
                        dependency.vulnerability_count
                    ) > 0
                );

            }
        ).length;


    const vulnerabilities =
        dependencies.reduce(
            function (total, dependency) {

                return total +
                    Number(
                        dependency.vulnerability_count || 0
                    );

            },
            0
        );


    totalDependencies.textContent =
        total;

    vulnerableDependencies.textContent =
        vulnerable;

    totalVulnerabilities.textContent =
        vulnerabilities;

}


/* =========================================
   ECOSYSTEM FILTER
========================================= */

function populateEcosystemFilter() {

    const ecosystems =
        new Set();


    dependencies.forEach(
        function (dependency) {

            if (dependency.ecosystem) {

                ecosystems.add(
                    dependency.ecosystem
                );

            }

        }
    );


    Array.from(ecosystems)
        .sort(function (a, b) {
            return a.localeCompare(b);
        })
        .forEach(
            function (ecosystem) {

                const option =
                    document.createElement("option");

                option.value =
                    ecosystem;

                option.textContent =
                    ecosystem;

                ecosystemFilter.appendChild(
                    option
                );

            }
        );

}


/* =========================================
   DISPLAY DEPENDENCIES
========================================= */

function displayDependencies() {

    const selectedEcosystem =
        ecosystemFilter.value;


    const searchText =
        dependencySearch.value
            .trim()
            .toLowerCase();


    const filteredDependencies =
        dependencies.filter(
            function (dependency) {

                const matchesEcosystem =
                    selectedEcosystem === "ALL" ||
                    dependency.ecosystem ===
                    selectedEcosystem;


                const name =
                    String(
                        dependency.name || ""
                    ).toLowerCase();


                const version =
                    String(
                        dependency.version || ""
                    ).toLowerCase();


                const matchesSearch =
                    !searchText ||
                    name.includes(searchText) ||
                    version.includes(searchText);


                return (
                    matchesEcosystem &&
                    matchesSearch
                );

            }
        );


    dependencyResultCount.textContent =
        `Showing ${filteredDependencies.length} of ${dependencies.length} dependencies`;


    if (filteredDependencies.length === 0) {

        dependencyTableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    No dependencies found.
                </td>
            </tr>
        `;

        return;
    }


    dependencyTableBody.innerHTML = "";


    filteredDependencies.forEach(
        function (dependency) {

            const row =
                document.createElement("tr");


            const vulnerabilityCount =
                Number(
                    dependency.vulnerability_count || 0
                );


            const vulnerabilityHTML =
                vulnerabilityCount > 0
                    ? `<span class="vulnerable">${vulnerabilityCount}</span>`
                    : `<span class="safe">0</span>`;


            row.innerHTML = `

                <td>
                    <span class="dependency-name">
                        ${escapeHTML(
                            dependency.name || "--"
                        )}
                    </span>
                </td>


                <td>
                    <span class="dependency-version">
                        ${escapeHTML(
                            dependency.version || "Not pinned"
                        )}
                    </span>
                </td>


                <td>
                    ${escapeHTML(
                        dependency.ecosystem || "--"
                    )}
                </td>


                <td>
                    ${vulnerabilityHTML}
                </td>

            `;


            dependencyTableBody.appendChild(
                row
            );

        }
    );

}


/* =========================================
   EVENT LISTENERS
========================================= */

ecosystemFilter.addEventListener(
    "change",
    function () {

        displayDependencies();

    }
);


dependencySearch.addEventListener(
    "input",
    function () {

        displayDependencies();

    }
);


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
