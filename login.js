document.getElementById('login-form').addEventListener('submit', function(event) {
    event.preventDefault();
    var username = document.getElementById('username').value;
    var password = document.getElementById('password').value;

    // Aquí puedes agregar la lógica de autenticación
    if (username === 'usuario' && password === 'contraseña') {
        // Redirigir a la página con el mapa
        window.location.href = 'mapa.html';
    } else {
        document.getElementById('error-message').textContent = 'Usuario o contraseña incorrectos';
    }
    console.log('Supabase conectado:', supabase);

});
