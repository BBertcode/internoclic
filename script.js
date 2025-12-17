document.addEventListener("DOMContentLoaded", function () {
    const buttons = document.querySelectorAll(".copy-btn");

    function normalizeCopiedText(text) {
        return text
            .replace(/\r\n/g, "\n")          // harmonise Windows/Linux
            .split("\n")
            .map(line => line.trimStart())   // enlève l'indentation en début de ligne
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
