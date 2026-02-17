document.addEventListener("DOMContentLoaded", function () {
    // ===============================
    // Copy buttons
    // ===============================
    const buttons = document.querySelectorAll(".copy-btn");

    function normalizeCopiedText(text) {
        const normalized = (text || "")
            // If "<br>" has been inserted as plain text (e.g. via textContent), convert it.
            .replace(/<br\s*\/?>/gi, "\n")
            .replace(/\r\n/g, "\n")
            // Normalise les espaces insécables
            .replace(/\u00A0/g, " ")
            .split("\n")
            // Enlève l'indentation liée au formatage du HTML
            .map(line => line.trim())
            .join("\n")
            // Évite les blocs de lignes vides énormes
            .replace(/\n{3,}/g, "\n\n")
            .trim();

        return normalized;
    }

    buttons.forEach(button => {
        // évite de doubler les écouteurs si le script est évalué plusieurs fois
        if (button.dataset.bound === "1") return;
        button.dataset.bound = "1";

        button.addEventListener("click", function () {
            const parentDiv = button.closest(".ordo1");
            const ordoBlock = parentDiv ? parentDiv.querySelector(".ordo2:not(.no-copy)") : null;
            if (!ordoBlock) return;

            const clone = ordoBlock.cloneNode(true);
            clone.querySelectorAll(".no-copy").forEach(el => el.remove());

            // IMPORTANT: innerText sur un noeud non inséré peut "aplatir" les retours à la ligne.
            // On insère temporairement le clone hors-écran pour récupérer le texte tel qu'affiché.
            clone.style.position = "fixed";
            clone.style.left = "-9999px";
            clone.style.top = "0";
            clone.style.width = getComputedStyle(ordoBlock).width || "auto";
            clone.style.whiteSpace = getComputedStyle(ordoBlock).whiteSpace || "normal";
            document.body.appendChild(clone);

            const rawText = clone.innerText;

            document.body.removeChild(clone);

            // Notepad Windows attend souvent des fins de ligne CRLF
            const textToCopy = normalizeCopiedText(rawText).replace(/\n/g, "\r\n");

            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    button.textContent = "Copié !";
                    setTimeout(() => {
                        button.textContent = "Copier";
                    }, 1500);
                })
                .catch(err => {
                    console.error("Erreur de copie :", err);

                    // Fallback : textarea temporaire
                    const textarea = document.createElement("textarea");
                    textarea.value = textToCopy;
                    textarea.style.position = "fixed";
                    textarea.style.left = "-9999px";
                    textarea.style.top = "0";
                    document.body.appendChild(textarea);
                    textarea.select();
                    try {
                        document.execCommand("copy");
                        button.textContent = "Copié !";
                        setTimeout(() => {
                            button.textContent = "Copier";
                        }, 1500);
                    } catch (e) {
                        console.error("Fallback copy failed:", e);
                    }
                    document.body.removeChild(textarea);
                });
        });
    });

    // ===============================
    // Load header
    // ===============================
    const headerContainer = document.getElementById("site-header");
    if (headerContainer) {
        fetch("header.html")
            .then(response => response.text())
            .then(data => {
                headerContainer.innerHTML = data;

                // Active menu dropdown on click (mobile)
                const dropdownToggles = headerContainer.querySelectorAll(".dropdown-toggle");
                dropdownToggles.forEach(toggle => {
                    toggle.addEventListener("click", (e) => {
                        e.preventDefault();
                        const parent = toggle.closest(".dropdown");
                        if (!parent) return;
                        parent.classList.toggle("open");
                    });
                });

                // Close dropdowns on outside click
                document.addEventListener("click", (e) => {
                    const dropdowns = headerContainer.querySelectorAll(".dropdown.open");
                    dropdowns.forEach(dd => {
                        if (!dd.contains(e.target)) dd.classList.remove("open");
                    });
                });

                // Initialise la recherche maintenant que le header est dans le DOM
                initSearch(headerContainer);
            })
            .catch(err => console.error("Erreur chargement header:", err));
    }

    // ===============================
    // Search — initialisé après le fetch du header
    // ===============================
    function initSearch(container) {
        const searchBtn = container.querySelector(".search-btn");
        const searchPopover = container.querySelector("#search-popover");
        const searchInput = container.querySelector("#site-search");
        const resultsContainer = container.querySelector("#search-results");

        // Ouvre/ferme le popover au clic sur le bouton loupe
        if (searchBtn && searchPopover) {
            searchBtn.addEventListener("click", () => {
                const isHidden = searchPopover.hasAttribute("hidden");
                if (isHidden) {
                    searchPopover.removeAttribute("hidden");
                    searchBtn.setAttribute("aria-expanded", "true");
                    if (searchInput) searchInput.focus();
                } else {
                    searchPopover.setAttribute("hidden", "");
                    searchBtn.setAttribute("aria-expanded", "false");
                }
            });

            // Ferme le popover si clic en dehors
            document.addEventListener("click", (e) => {
                if (!container.contains(e.target)) {
                    searchPopover.setAttribute("hidden", "");
                    searchBtn.setAttribute("aria-expanded", "false");
                }
            });

            // Raccourci Ctrl+K
            document.addEventListener("keydown", (e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                    e.preventDefault();
                    searchPopover.removeAttribute("hidden");
                    searchBtn.setAttribute("aria-expanded", "true");
                    if (searchInput) searchInput.focus();
                }
                if (e.key === "Escape") {
                    searchPopover.setAttribute("hidden", "");
                    searchBtn.setAttribute("aria-expanded", "false");
                }
            });
        }

        if (!searchInput || !resultsContainer) return;
        if (typeof window.SEARCH_INDEX === "undefined") return;

        function escapeHtml(str) {
            return (str || "")
                .replace(/&/g, "&amp;")
                .replace(/</g, "&lt;")
                .replace(/>/g, "&gt;")
                .replace(/"/g, "&quot;")
                .replace(/'/g, "&#039;");
        }

        function renderResults(results) {
            resultsContainer.innerHTML = "";
            if (!results.length) {
                resultsContainer.innerHTML = "<div class='search-empty'>Aucun résultat</div>";
                return;
            }
            results.forEach(item => {
                const a = document.createElement("a");
                a.className = "search-result";
                a.href = item.url;
                a.innerHTML = `
                    <div class="sr-title">${escapeHtml(item.title)}</div>
                    ${item.section ? `<div class="sr-section">${escapeHtml(item.section)}</div>` : ""}
                `;
                resultsContainer.appendChild(a);
            });
        }

        searchInput.addEventListener("input", () => {
            const q = searchInput.value.trim().toLowerCase();
            if (!q) {
                resultsContainer.innerHTML = "";
                return;
            }
            // Correction : utilisation de item.tokens (et non item.keywords)
            const results = window.SEARCH_INDEX
                .filter(item => {
                    const tokens = Array.isArray(item.tokens) ? item.tokens.join(" ") : "";
                    const hay = (item.title + " " + (item.section || "") + " " + tokens).toLowerCase();
                    return hay.includes(q);
                })
                .slice(0, 30);
            renderResults(results);
        });
    }

    // ===============================
    // Dropdown open/close (generic)
    // ===============================
    document.querySelectorAll(".dropdown-toggle").forEach(toggle => {
        toggle.addEventListener("click", function (e) {
            e.preventDefault();
            const parent = toggle.closest(".dropdown");
            if (parent) parent.classList.toggle("open");
        });
    });

    document.addEventListener("click", function (e) {
        document.querySelectorAll(".dropdown.open").forEach(dd => {
            if (!dd.contains(e.target)) dd.classList.remove("open");
        });
    });
});
