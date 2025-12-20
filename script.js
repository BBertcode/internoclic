document.addEventListener("DOMContentLoaded", function () {
    // ===============================
    // Copy buttons
    // ===============================
    const buttons = document.querySelectorAll(".copy-btn");

    function normalizeCopiedText(text) {
        return text
            .replace(/\r\n/g, "\n")
            .split("\n")
            .map(line => line.trimStart())
            .join("\n")
            .trim();
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

            const rawText = clone.innerText;
            const textToCopy = normalizeCopiedText(rawText);

            navigator.clipboard.writeText(textToCopy)
                .then(() => {
                    button.textContent = "Copié !";
                    setTimeout(() => {
                        button.textContent = "Copier";
                    }, 1000);
                })
                .catch(err => {
                    console.error("Erreur lors de la copie:", err);
                });
        });
    });

    // ===============================
    // Header injection (shared header)
    // ===============================
    loadSharedHeader();
});

async function loadSharedHeader() {
    const mount = document.getElementById("site-header");
    if (!mount) return;

    try {
        const res = await fetch("header.html", { cache: "no-store" });
        if (!res.ok) return;

        mount.innerHTML = await res.text();

        // Rebranche les dropdowns après injection
        initHeaderDropdownsMobileOnly();
    } catch (e) {
        // silence
    }
}

// ===============================
// Header dropdowns — MOBILE ONLY
// ===============================
function initHeaderDropdownsMobileOnly() {
    // On n’active le clic QUE sur les appareils sans hover (tactile)
    if (!window.matchMedia("(hover: none)").matches) return;

    // Évite de rebinder les listeners globaux
    if (!window.__internoclicNavMobile) window.__internoclicNavMobile = { globalsBound: false };

    const state = window.__internoclicNavMobile;
    const triggers = document.querySelectorAll(".nav-trigger");

    function closeAll(exceptItem) {
        document.querySelectorAll(".nav-item.has-dropdown.open").forEach((item) => {
            if (exceptItem && item === exceptItem) return;
            item.classList.remove("open");
            const btn = item.querySelector(".nav-trigger");
            if (btn) btn.setAttribute("aria-expanded", "false");
        });
    }

    triggers.forEach((btn) => {
        const item = btn.closest(".nav-item.has-dropdown");
        if (!item) return;

        // évite de doubler les écouteurs sur les mêmes boutons
        if (btn.dataset.navBound === "1") return;
        btn.dataset.navBound = "1";

        btn.addEventListener("click", (e) => {
            e.preventDefault();
            e.stopPropagation();

            const willOpen = !item.classList.contains("open");
            closeAll(item);

            item.classList.toggle("open", willOpen);
            btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
        });
    });

    if (!state.globalsBound) {
        state.globalsBound = true;

        document.addEventListener("click", (e) => {
            if (!e.target.closest(".nav-item.has-dropdown")) closeAll();
        });

        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape") closeAll();
        });
    }
}
