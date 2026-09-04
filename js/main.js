/* ==================================================
   PABLO BRIE
   JAVASCRIPT PRINCIPAL
================================================== */


/* ==================================================
   MENÚ MOBILE
================================================== */

const menuButton = document.querySelector(".menu-button");
const mobileMenu = document.querySelector(".mobile-menu");


if (menuButton && mobileMenu) {

    menuButton.addEventListener("click", () => {

        const isOpen =
            mobileMenu.classList.toggle("open");

        menuButton.setAttribute(
            "aria-expanded",
            isOpen
        );

        /* Animación de las dos líneas */

        const lines =
            menuButton.querySelectorAll("span");

        if (isOpen) {

            lines[0].style.transform =
                "translateY(10px) rotate(45deg)";

            lines[1].style.transform =
                "translateY(-10px) rotate(-45deg)";

        } else {

            lines[0].style.transform =
                "translateY(0) rotate(0)";

            lines[1].style.transform =
                "translateY(0) rotate(0)";

        }

    });


    /* Cerrar menú al hacer click en un enlace */

    const mobileLinks =
        mobileMenu.querySelectorAll("a");


    mobileLinks.forEach(link => {

        link.addEventListener("click", () => {

            mobileMenu.classList.remove("open");

            menuButton.setAttribute(
                "aria-expanded",
                "false"
            );

            const lines =
                menuButton.querySelectorAll("span");

            lines[0].style.transform =
                "translateY(0) rotate(0)";

            lines[1].style.transform =
                "translateY(0) rotate(0)";

        });

    });

}
