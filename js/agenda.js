/* ==================================================
   PABLO BRIE — AGENDA PÚBLICA
   Lee las funciones publicadas en data/funciones.json
================================================== */

document.addEventListener("DOMContentLoaded", async () => {
    const popup = document.getElementById("shows-popup");
    const list = document.getElementById("shows-list");
    const closeButton = document.getElementById("shows-popup-close");

    if (!popup || !list || !closeButton) return;

    const closePopup = () => {
        popup.classList.remove("is-visible");
        popup.setAttribute("aria-hidden", "true");
    };

    closeButton.addEventListener("click", closePopup);

    popup.addEventListener("click", (event) => {
        if (event.target === popup) closePopup();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && popup.classList.contains("is-visible")) {
            closePopup();
        }
    });

    const escapeHTML = (value) => String(value ?? "").replace(/[&<>"']/g, (char) => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;"
    }[char]));

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayKey = [
        today.getFullYear(),
        String(today.getMonth() + 1).padStart(2, "0"),
        String(today.getDate()).padStart(2, "0")
    ].join("-");

    try {
        const response = await fetch(`/data/funciones.json?v=${Date.now()}`, {
            cache: "no-store"
        });

        if (!response.ok) return;

        const functions = await response.json();
        if (!Array.isArray(functions)) return;

        const upcoming = functions
            .filter((item) => item && item.visible !== false && item.date && item.date >= todayKey)
            .sort((a, b) => a.date.localeCompare(b.date));

        if (!upcoming.length) return;

        list.innerHTML = upcoming.map((item) => {
            const date = new Date(`${item.date}T12:00:00`);
            const dateLabel = new Intl.DateTimeFormat("es-AR", {
                day: "2-digit",
                month: "short"
            }).format(date).replace(".", "").toUpperCase();

            const city = escapeHTML(item.city);
            const venue = escapeHTML(item.venue);
            const time = item.time ? ` · ${escapeHTML(item.time)} hs` : "";
            const ticketUrl = typeof item.ticketUrl === "string" ? item.ticketUrl.trim() : "";
            const safeTicketUrl = /^https?:\/\/\S+$/i.test(ticketUrl) ? escapeHTML(ticketUrl) : "";

            return `
                <article class="show-item">
                    <div class="show-date">${dateLabel}</div>
                    <div class="show-info">
                        <strong>${city}${time}</strong>
                        <span>${venue}</span>
                        ${safeTicketUrl ? `<a class="show-ticket-link" href="${safeTicketUrl}" target="_blank" rel="noopener noreferrer">COMPRAR ENTRADAS ↗</a>` : ""}
                    </div>
                </article>
            `;
        }).join("");

        window.setTimeout(() => {
            popup.classList.add("is-visible");
            popup.setAttribute("aria-hidden", "false");
        }, 15000);

    } catch (error) {
        console.error("No se pudo cargar la agenda de próximas funciones.", error);
    }
});
