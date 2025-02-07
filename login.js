// login.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: import.meta.env.REACT_APP_API_KEY,
  authDomain: import.meta.env.REACT_APP_AUTH_DOMAIN,
  databaseURL: import.meta.env.REACT_APP_DATABASE_URL,
  projectId: import.meta.env.REACT_APP_PROJECT_ID,
  storageBucket: import.meta.env.REACT_APP_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.REACT_APP_MESSAGING_SENDER_ID,
  appId: import.meta.env.REACT_APP_APP_ID,
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

document.getElementById('login-form').addEventListener('submit', function (event) {
  event.preventDefault();

  const emailElement = document.getElementById('email');
  const passwordElement = document.getElementById('password');

  if (!emailElement || !passwordElement) {
    console.error('Elemento(s) no encontrado(s)');
    return;
  }

  const email = emailElement.value;
  const password = passwordElement.value;

  signInWithEmailAndPassword(auth, email, password)
    .then((userCredential) => {
      const user = userCredential.user;
      console.log('Usuario autenticado:', user);
      window.location.href = 'mapa.html';
    })
    .catch((error) => {
      const errorMessage = error.message;
      document.getElementById('auth-message').textContent = `Error: ${errorMessage}`;
    });
});