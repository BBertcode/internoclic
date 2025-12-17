document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".copy-btn");

    buttons.forEach(button => {
        button.addEventListener("click", function () {
            const parentDiv = button.closest(".ordo1");
            const ordoBlock = parentDiv.querySelector(".ordo2");

            // Clone pour ne pas modifier le DOM réel
            const clone = ordoBlock.cloneNode(true);

            // Supprimer les liens (ex: Biomnis) de la copie
            clone.querySelectorAll("a").forEach(el => el.remove());

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
