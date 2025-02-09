// firebase-init.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

// Configuración de Firebase usando variables de entorno
const firebaseConfig = {
  apiKey: "AIzaSyCLHKZmeUUahOD9pCG9HGRed9zxwP5vHb0",
  authDomain: "besosporelmundo.firebaseapp.com",
  databaseURL: "https://besosporelmundo-default-rtdb.europe-west1.firebasedatabase.app",
  projectId: "besosporelmundo",
  storageBucket: "besosporelmundo.firebasestorage.app",
  messagingSenderId: "716617534132",
  appId: "1:716617534132:web:77b9372971f803fcdd25e1"

};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa servicios
const storage = getStorage(app);
const database = getDatabase(app);

// Exporta las instancias
export { app, storage, database };
