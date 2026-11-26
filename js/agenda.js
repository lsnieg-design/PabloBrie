
document.addEventListener("DOMContentLoaded", async () => {
    const popup = document.getElementById("shows-popup");
    const list = document.getElementById("shows-list");
    const closeButton = document.getElementById("shows-popup-close");

    if (!popup || !list || !closeButton) return;

    // Formatear fecha sin problemas de zona horaria
    function formatDate(dateString) {
        const [year, month, day] = dateString.split("-");
        const date = new Date(Number(year), Number(month) - 1, Number(day));

        return {
            day: date.toLocaleDateString("es-AR", { day: "2-digit" }),
            month: date.toLocaleDateString("es-AR", { month: "short" }).replace(".", "").toUpperCase(),
            full: date.toLocaleDateString("es-AR", {
                weekday: "long",
                day: "numeric",
                month: "long"
            })
        };
    }

    function escapeHTML(value = "") {
        return String(value).replace(/[&<>"']/g, char => ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        })[char]);
    }

    // Cargar agenda
    try {
        const response = await fetch(`/data/funciones.json?v=${Date.now()}`, {
            cache: "no-store"
        });

        if (!response.ok) return;

        const functions = await response.json();
        if (!Array.isArray(functions)) return;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayKey = [
            today.getFullYear(),
            String(today.getMonth() + 1).padStart(2, "0"),
            String(today.getDate()).padStart(2, "0")
        ].join("-");

        const upcoming = functions
            .filter(item =>
                item &&
                item.visible !== false &&
                item.date &&
                item.date >= todayKey
            )
            .sort((a, b) => a.date.localeCompare(b.date));

        if (!upcoming.length) return;

        // Crear contenido del popup
        list.innerHTML = upcoming.map(show => {
            const date = formatDate(show.date);

            const ticket = show.ticketUrl
                ? `<a class="show-ticket-link" href="${escapeHTML(show.ticketUrl)}" target="_blank" rel="noopener noreferrer">RESERVAR / ENTRADAS ↗</a>`
                : "";

            return `
                <article class="show-item">
                    <div class="show-date">
                        ${date.day}<br>${date.month}
                    </div>
                    <div class="show-info">
                        <strong>${escapeHTML(show.city)}</strong>
                        <span>${escapeHTML(show.venue)}</span>
                        <span>${escapeHTML(show.time)} hs · ${date.full}</span>
                        ${ticket}
                    </div>
                </article>
            `;
        }).join("");

        // Crear tarjeta pequeña automáticamente
        const miniCard = document.createElement("button");
        miniCard.type = "button";
        miniCard.id = "shows-mini-card";
        miniCard.className = "shows-mini-card";
        miniCard.setAttribute("aria-label", "Ver próximas funciones");

        const next = upcoming[0];
        const nextDate = formatDate(next.date);

        miniCard.innerHTML = `
            <span class="mini-kicker">PRÓXIMA FUNCIÓN</span>
            <span class="mini-content">
                <span class="mini-date">
                    <strong>${nextDate.day}</strong>
                    <small>${nextDate.month}</small>
                </span>
                <span class="mini-info">
                    <strong>${escapeHTML(next.city)}</strong>
                    <small>${escapeHTML(next.venue)}</small>
                    <small>${escapeHTML(next.time)} hs</small>
                </span>
            </span>
            <span class="mini-link">VER AGENDA ↗</span>
        `;

        document.body.appendChild(miniCard);

        // Abrir popup
        function openPopup() {
            popup.classList.add("is-visible");
            popup.setAttribute("aria-hidden", "false");
            miniCard.classList.remove("is-visible");
        }

        // Cerrar popup y mostrar tarjeta pequeña
        function closePopup() {
            popup.classList.remove("is-visible");
            popup.setAttribute("aria-hidden", "true");

            miniCard.classList.add("is-visible");
        }

        closeButton.addEventListener("click", closePopup);

        miniCard.addEventListener("click", openPopup);

        popup.addEventListener("click", event => {
            if (event.target === popup) {
                closePopup();
            }
        });

        document.addEventListener("keydown", event => {
            if (event.key === "Escape" && popup.classList.contains("is-visible")) {
                closePopup();
            }
        });

        // Mostrar popup a los 5 segundos
        window.setTimeout(openPopup, 5000);

    } catch (error) {
        console.error("No se pudo cargar la agenda:", error);
    }
});
