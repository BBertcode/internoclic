document.addEventListener("DOMContentLoaded", function () {
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
        button.addEventListener("click", function() {
            const parentDiv = button.closest(".ordo1");
            const ordoBlock = parentDiv.querySelector(".ordo2:not(.no-copy)");
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
});


// ===============================
// Header dropdowns — MOBILE ONLY
// ===============================

(function () {
  // On n’active le clic QUE sur les appareils sans hover (tactile)
  if (!window.matchMedia("(hover: none)").matches) return;

  const triggers = document.querySelectorAll('.nav-trigger');

  function closeAll(exceptItem) {
    document.querySelectorAll('.nav-item.has-dropdown.open').forEach((item) => {
      if (exceptItem && item === exceptItem) return;
      item.classList.remove('open');
      const btn = item.querySelector('.nav-trigger');
      if (btn) btn.setAttribute('aria-expanded', 'false');
    });
  }

  triggers.forEach((btn) => {
    const item = btn.closest('.nav-item.has-dropdown');
    if (!item) return;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();

      const willOpen = !item.classList.contains('open');
      closeAll(item);

      item.classList.toggle('open', willOpen);
      btn.setAttribute('aria-expanded', willOpen ? 'true' : 'false');
    });
  });

  document.addEventListener('click', (e) => {
    if (!e.target.closest('.nav-item.has-dropdown')) closeAll();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAll();
  });
})();
