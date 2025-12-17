document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".copy-btn");

    buttons.forEach(button => {
        button.addEventListener("click", function() {
            const parentDiv = button.closest(".ordo1");

            // On clone le bloc .ordo2 pour pouvoir retirer des éléments sans toucher à la page
            const ordoBlock = parentDiv.querySelector(".ordo2");
            const clone = ordoBlock.cloneNode(true);

            // Retire tout ce que tu ne veux jamais copier
            clone.querySelectorAll(".no-copy").forEach(el => el.remove());

            // Optionnel : retire aussi tous les liens (si tu veux un comportement global)
            // clone.querySelectorAll("a").forEach(el => el.remove());

            const textToCopy = clone.innerText.trim();

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
