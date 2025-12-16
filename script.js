document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".copy-btn");

    buttons.forEach(button => {
        button.addEventListener("click", function() {
            const parentDiv = button.closest(".ordo1");
            const textToCopy = parentDiv.querySelector(".ordo2").innerText;
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