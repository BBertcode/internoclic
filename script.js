document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".copy-btn");

    buttons.forEach(button => {
        button.addEventListener("click", function() {
            const parentDiv = button.closest(".ordo1");

            // Prend la première zone .ordo2 qui n'est pas marquée no-copy
            const ordoBlock = parentDiv.querySelector(".ordo2:not(.no-copy)");

            if (!ordoBlock) return;

            // Clone pour ne pas modifier le DOM réel
            const clone = ordoBlock.cloneNode(true);

            // Retire les éléments non copiables (ex: liens Biomnis si marqués no-copy)
            clone.querySelectorAll(".no-copy").forEach(el => el.remove());

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
