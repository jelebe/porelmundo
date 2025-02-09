// version.js
const appVersion = "1.0.0"; // Define la versión aquí

// Función para insertar la versión en el DOM
function insertVersion() {
    const versionElements = document.querySelectorAll(".version-text");
    versionElements.forEach((element) => {
        element.textContent = `Versión ${appVersion}`;
    });
}

// Ejecuta la función cuando el DOM esté listo
document.addEventListener("DOMContentLoaded", insertVersion);