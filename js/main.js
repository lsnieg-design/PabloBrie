// Año automático del footer

document.getElementById("year").textContent =
    new Date().getFullYear();


// Menú mobile

const menuToggle = document.querySelector(".menu-toggle");
const nav = document.querySelector(".nav");

if (menuToggle) {

    menuToggle.addEventListener("click", () => {

        nav.classList.toggle("mobile-open");

    });

}
