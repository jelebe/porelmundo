# BesosporelMundo
Se trata de una página web sencilla donde ir localizando imágenes por el mundo.


Versión alpha:
- Inclusión de mapa desde openstreetmaps. Uso de Leaflet.
- Creación de marcador al clicar dos veces en una localización.
- Inclusión de botones para modificar y borrar marcadores.
- Inclusión de mensaje de seguridad en el botón de borrar marcador.
- Inclusión de calendario. Permite añadir la fecha en la que se hizo la fotografía.
- Modificación del css para ajuste en móvil.
>
>
>
Versión 1.0:
- Inclusión de Firebase.
- Inclusión de Firebase Authentication.
- Visual estilo Polaroid.
- Cuando se intenta acceder directamente a mapa.html, primero asegura que el usuario esté autenticado.
- Cambios en las reglas de Firebase. Ya solo usuarios identificados pueden subir y modificar marcadores.



-cosas a hacer. Ocultar la API Key de Firebase: Es una buena práctica no exponer directamente la API Key de Firebase en el código del frontend. Podrías mover la lógica de autenticación a un backend (por ejemplo, usando Node.js con Express) y hacer las llamadas a Firebase desde allí.
-Agregar un Botón de Cerrar Sesión