// script.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";
import { getDatabase, ref as dbRef, push, onValue } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";
import { 
    getAuth, 
    signInWithEmailAndPassword,
    sendPasswordResetEmail,
    createUserWithEmailAndPassword
} from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";

document.addEventListener('DOMContentLoaded', (event) => {
  // Inicializa Firebase
  const firebaseConfig = {
    apiKey: "AIzaSyCLHKZmeUUahOD9pCG9HGRed9zxwP5vHb0",
    authDomain: "besosporelmundo.firebaseapp.com",
    databaseURL: "https://besosporelmundo-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "besosporelmundo",
    storageBucket: "besosporelmundo.firebasestorage.app",
    messagingSenderId: "716617534132",
    appId: "1:716617534132:web:77b9372971f803fcdd25e1"
  };
// Login con Firebase
document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const loginBtn = document.getElementById('login-btn');
  
  try {
      loginBtn.disabled = true;
      loginBtn.textContent = 'Ingresando...';
      
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      window.location.href = 'mapa.html';
      
  } catch (error) {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Entrar';
      const errorMessage = {
          'auth/user-not-found': 'Usuario no registrado',
          'auth/wrong-password': 'Contraseña incorrecta',
          'auth/invalid-email': 'Formato de email inválido'
      }[error.code] || 'Error al iniciar sesión';
      showMessage(errorMessage, true);
  }
});


  const app = initializeApp(firebaseConfig);
  const storage = getStorage(app);
  const database = getDatabase(app);

  // Inicializar el mapa de Leaflet
  var map = L.map('map').setView([0, 0], 2);

  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    attribution: '© OpenStreetMap contributors'
  }).addTo(map);

  
    // Función para añadir un marcador al hacer doble clic en el mapa
    map.on('dblclick', function(e) {
      var lat = e.latlng.lat;
      var lng = e.latlng.lng;
      addMarker([lat, lng]);
    });
  
    function addMarker(latlng, image = null, description = null, date = null) {
      var marker = L.marker(latlng).addTo(map);
      marker.image = image;
      marker.description = description;
      marker.date = date;
  
      marker.on('click', function() {
        if (hasContent(marker)) {
          showMarkerMenu(latlng, marker);
        } else {
          openModal(latlng, marker);
        }
      });
  
      marker.on('popupclose', function() {
        if (!hasContent(marker)) {
          removeMarker(marker);
        }
      });
  
      saveMarkers();
    }
  
    function showMarkerMenu(latlng, marker) {
      var popupContent = (marker.image ? '<img src="' + marker.image + '" alt="Imagen" width="200"><br>' : '') + 
                         (marker.description ? '<p>' + marker.description + '</p><br>' : '') +
                         (marker.date ? '<p class="marker-date">' + marker.date + '</p><br>' : '') +
                         '<button class="edit-marker-btn" onclick="editMarker(' + marker._leaflet_id + ')">✎</button>' +
                         '<button class="delete-marker-btn" onclick="deleteMarker(' + marker._leaflet_id + ')">✖</button>';
      L.popup()
        .setLatLng(latlng)
        .setContent(popupContent)
        .openOn(map);
    }
  
    window.deleteMarker = function(markerId) {
      var marker = map._layers[markerId];
      if (marker) {
        var confirmation = confirm("¿Estás seguro de que quieres borrar este marcador?");
        if (confirmation) {
          removeMarker(marker);
          deleteMarkerFromFirebase(marker);
        }
      }
    };
    
    
    function deleteMarkerFromFirebase(marker) {
      const markersRef = dbRef(database, 'markers');
      onValue(markersRef, (snapshot) => {
        snapshot.forEach((childSnapshot) => {
          const childData = childSnapshot.val();
          const childKey = childSnapshot.key;
          if (childData.latlng && childData.latlng.lat === marker.getLatLng().lat && childData.latlng.lng === marker.getLatLng().lng) {
            const specificRef = dbRef(database, 'markers/' + childKey);
            remove(specificRef)
              .then(() => {
                console.log('Marcador eliminado de Firebase');
              })
              .catch((error) => {
                console.error('Error al eliminar el marcador de Firebase: ', error);
              });
          }
        });
      });
    }
    
    

    function openModal(latlng, marker, isEdit = false) {
      var modal = document.getElementById('modal');
      modal.style.display = "block";
  
      document.getElementById('image-file').value = '';
      document.getElementById('image-description').value = isEdit ? marker.description || '' : '';
      document.getElementById('image-date').value = isEdit ? marker.date || '' : '';
  
      var closeBtn = document.getElementsByClassName("close")[0];
      closeBtn.onclick = function() {
        closeModal(marker);
      };
  
      var form = document.getElementById('image-form');
      form.onsubmit = function(event) {
        event.preventDefault();
        var imageDescription = document.getElementById('image-description').value;
        var imageDate = document.getElementById('image-date').value;
        if (marker.image || imageDescription) {
          marker.description = imageDescription;
          marker.date = imageDate;
  
          // Guarda los detalles del marcador en la base de datos
          push(dbRef(database, 'markers'), {
            latlng: marker.getLatLng(),
            image: marker.image,
            description: marker.description,
            date: marker.date
          }).then(() => {
            updateMarkerPopup(latlng, marker);
          }).catch((error) => {
            console.error("Error al guardar los detalles del marcador en la base de datos: ", error);
          });
  
          closeModal(marker);
        }
      };
  
      window.onclick = function(event) {
        if (event.target == modal) {
          closeModal(marker);
        }
      };
  
      var dropArea = document.getElementById('drop-area');
      dropArea.addEventListener('dragover', handleDragOver);
      dropArea.addEventListener('dragleave', handleDragLeave);
      dropArea.addEventListener('drop', function(event) {
        handleFileDrop(event, marker);
      });
  
      document.getElementById('image-file').addEventListener('change', function(event) {
        handleFileSelect(event, marker);
      });
    }
    function closeModal(marker) {
      var modal = document.getElementById('modal');
      modal.style.display = "none";
      if (!hasContent(marker)) {
        removeMarker(marker);
      }
      saveMarkers();
    }
  
    function handleDragOver(event) {
      event.preventDefault();
      event.target.classList.add('dragover');
      document.getElementById('drag-confirmation').style.display = 'block';
    }
  
    function handleDragLeave(event) {
      event.preventDefault();
      event.target.classList.remove('dragover');
      document.getElementById('drag-confirmation').style.display = 'none';
    }
  
    function handleFileDrop(event, marker) {
      event.preventDefault();
      event.target.classList.remove('dragover');
      document.getElementById('drag-confirmation').style.display = 'none';
      var file = event.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        // Sube la imagen a Firebase Storage
        var storageRef = ref(storage, 'images/' + file.name);
        uploadBytes(storageRef, file).then((snapshot) => {
          // Obtén la URL de descarga de la imagen
          getDownloadURL(snapshot.ref).then((url) => {
            marker.image = url; // Almacena la URL en el marcador
            saveMarkers();
          }).catch((error) => {
            console.error("Error al obtener la URL de descarga: ", error);
          });
        }).catch((error) => {
          console.error("Error al subir la imagen: ", error);
        });
      }
    }
  
    function handleFileSelect(event, marker) {
      var file = event.target.files[0];
      if (file && file.type.startsWith('image/')) {
        var storageRef = ref(storage, 'images/' + file.name);
        uploadBytes(storageRef, file).then((snapshot) => {
          console.log('Imagen subida:', snapshot);
          getDownloadURL(snapshot.ref).then((url) => {
            console.log('URL de descarga:', url);
            marker.image = url; // Almacena la URL en el marcador
            saveMarkers();
          }).catch((error) => {
            console.error("Error al obtener la URL de descarga: ", error);
          });
        }).catch((error) => {
          console.error("Error al subir la imagen: ", error);
        });
      }
    }
    
    window.editMarker = function(markerId) {
      var marker = map._layers[markerId];
      if (marker) {
        openModal(marker.getLatLng(), marker, true);
      }
    };
  
    function removeMarker(marker) {
      map.removeLayer(marker);
      saveMarkers();
    }
    
  
    function updateMarkerPopup(latlng, marker) {
      L.popup()
        .setLatLng(latlng)
        .setContent((marker.image ? '<img src="' + marker.image + '" alt="Imagen" width="200"><br>' : '') +
                    (marker.description ? '<p>' + marker.description + '</p><br>' : '') +
                    (marker.date ? '<p class="marker-date">' + marker.date + '</p><br>' : '') +
                    '<button class="edit-marker-btn" onclick="editMarker(' + marker._leaflet_id + ')">✎</button>' +
                    '<button class="delete-marker-btn" onclick="deleteMarker(' + marker._leaflet_id + ')">✖</button>')
        .openOn(map);
    }
  
    function hasContent(marker) {
      return marker.image || marker.description || marker.date;
    }
  
    function saveMarkers() {
      var markers = [];
      map.eachLayer(function(layer) {
        if (layer instanceof L.Marker) {
          markers.push({
            latlng: layer.getLatLng(),
            image: layer.image,
            description: layer.description,
            date: layer.date
          });
        }
      });
      localStorage.setItem('markers', JSON.stringify(markers));
    }
  
    function loadMarkers() {
      // Carga los marcadores desde la base de datos
      const markersRef = dbRef(database, 'markers');
      onValue(markersRef, (snapshot) => {
        const markers = snapshot.val();
        for (let key in markers) {
          if (markers.hasOwnProperty(key)) {
            let markerData = markers[key];
            addMarker(markerData.latlng, markerData.image, markerData.description, markerData.date);
          }
        }
      });
    }
  
    // Llama a loadMarkers para cargar los marcadores al iniciar
    loadMarkers();
  });
    