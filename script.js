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
        initSearch();
        initSearchPopover();
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


// ===============================
// Search (header) — desktop
// ===============================
function initSearch() {
  const input = document.getElementById("site-search");
  const results = document.getElementById("search-results");
  if (!input || !results) return;

  if (input.dataset.bound === "1") return;
  input.dataset.bound = "1";

  const index = Array.isArray(window.SEARCH_INDEX) ? window.SEARCH_INDEX : [];

  function normalize(s) {
    return (s || "")
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
  }

  function hide() {
    results.style.display = "none";
    results.innerHTML = "";
  }

  function render(items) {
    if (!items.length) {
      results.innerHTML = `<div style="padding:10px 12px; color:var(--muted);">Aucun résultat</div>`;
      results.style.display = "block";
      return;
    }

    results.innerHTML = items
      .slice(0, 10)
      .map((it) => {
        return `
          <a href="${it.url}"
             role="option"
             style="display:block; padding:10px 12px; border-bottom:1px solid var(--border);">
            <strong>${it.title}</strong>
            <div style="color:var(--muted); font-size:12px;">${it.url}</div>
          </a>`;
      })
      .join("");

    const last = results.querySelector("a:last-child");
    if (last) last.style.borderBottom = "none";

    results.style.display = "block";
  }

  function search(q) {
    const nq = normalize(q).trim();
    if (!nq) return [];

    const nqParts = nq.split(/\s+/).filter(Boolean);

    return index
      .map((it) => {
        const title = normalize(it.title);
        const url = normalize(it.url);
        const tokens = (it.tokens || []).map(normalize);
        const hay = [title, url, ...tokens].join(" ");

        let score = 0;
        if (hay.includes(nq)) score += 3;
        if (title.includes(nq)) score += 5;
        if (tokens.some((t) => t.includes(nq))) score += 2;
        if (nqParts.length > 1 && nqParts.every((p) => hay.includes(p))) score += 2;

        return { it, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .map((x) => x.it);
  }

  input.addEventListener("input", () => render(search(input.value)));

  input.addEventListener("focus", () => {
    if (input.value.trim()) render(search(input.value));
  });

  document.addEventListener("click", (e) => {
    const inside = e.target.closest(".header-search");
    if (!inside) hide();
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      hide();
      input.blur();
    }
  });

  if (!document.body.dataset.searchHotkeysBound) {
    document.body.dataset.searchHotkeysBound = "1";

    document.addEventListener("keydown", (e) => {
      const isMac = navigator.platform.toUpperCase().includes("MAC");
      const modK = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k";
      const slash = e.key === "/" && !e.ctrlKey && !e.metaKey && !e.altKey;

      if (modK || slash) {
        const tag = (document.activeElement && document.activeElement.tagName) || "";
        const typing =
          ["INPUT", "TEXTAREA"].includes(tag) || document.activeElement?.isContentEditable;
        if (slash && typing) return;

        e.preventDefault();
        input.focus();
        input.select();
      }
    });
  }
}


function initSearchPopover() {
  const btn = document.querySelector(".search-btn");
  const pop = document.getElementById("search-popover");
  const input = document.getElementById("site-search");
  const results = document.getElementById("search-results");

  if (!btn || !pop || !input) return;
  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";

  function openPopover() {
    pop.hidden = false;
    btn.setAttribute("aria-expanded", "true");
    input.focus();
    input.select();
  }

  function closePopover() {
    pop.hidden = true;
    btn.setAttribute("aria-expanded", "false");
    if (results) results.style.display = "none";
  }

  btn.addEventListener("click", (e) => {
    e.preventDefault();
    const isOpen = btn.getAttribute("aria-expanded") === "true";
    if (isOpen) closePopover();
    else openPopover();
  });

  document.addEventListener("click", (e) => {
    const inside = e.target.closest(".header-search");
    if (!inside) closePopover();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closePopover();

    const isMac = navigator.platform.toUpperCase().includes("MAC");
    const modK = (isMac ? e.metaKey : e.ctrlKey) && e.key.toLowerCase() === "k";

    if (modK) {
      e.preventDefault();
      openPopover();
    }
  });
}
