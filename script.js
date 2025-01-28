import { initializeApp } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-storage.js";
import { getDatabase, ref as dbRef, push, onValue, remove } from "https://www.gstatic.com/firebasejs/11.2.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyCLHKZmeUUahOD9pCG9HGRed9zxwP5vHb0",
    authDomain: "besosporelmundo.firebaseapp.com",
    databaseURL: "https://besosporelmundo-default-rtdb.europe-west1.firebasedatabase.app/",
    projectId: "besosporelmundo",
    storageBucket: "besosporelmundo.firebasestorage.app",
    messagingSenderId: "716617534132",
    appId: "1:716617534132:web:77b9372971f803fcdd25e1"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const storage = getStorage(app);
const database = getDatabase(app);

onAuthStateChanged(auth, (user) => {
    if (user) {
        console.log('Usuario autenticado:', user);
        inicializarMapa();
    } else {
        window.location.href = 'index.html';
    }
});

function inicializarMapa() {
    var map = L.map('map').setView([0, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    map.on('dblclick', function(e) {
        var lat = e.latlng.lat;
        var lng = e.latlng.lng;
        addMarker([lat, lng]);
    });

    // Icono predeterminado para marcadores
    const defaultIcon = L.icon({
        iconUrl: 'https://cdn-icons-png.flaticon.com/512/684/684908.png', // Icono de corazón
        iconSize: [32, 32],
        iconAnchor: [16, 32]
    });

    function addMarker(latlng, image = null, description = null, date = null) {
        var marker = L.marker(latlng, {
            icon: defaultIcon
        }).addTo(map);

        // Almacenar datos del marcador
        marker.image = image;
        marker.description = description;
        marker.date = date;

        // Evento click para mostrar polaroid
        marker.on('click', function(e) {
            if (hasContent(marker)) {
                showPolaroidPopup(e.latlng, marker);
            } else {
                openModal(e.latlng, marker);
            }
        });

        marker.on('popupclose', function() {
            if (!hasContent(marker)) {
                removeMarker(marker);
            }
        });

        saveMarkers();
    }

    function showPolaroidPopup(latlng, marker) {
      const popupContent = `
          <div class="polaroid-popup-wrapper">
              <div class="polaroid-popup">
                  ${marker.image ? `
                  <div class="image-container">
                      <img src="${marker.image}" class="polaroid-image">
                  </div>` : ''}
                  ${marker.description ? `<div class="polaroid-description">${marker.description}</div>` : ''}
                  ${marker.date ? `<div class="polaroid-date">${marker.date}</div>` : ''}
                  <div class="polaroid-actions">
                      <button class="edit-marker-btn" onclick="editMarker(${marker._leaflet_id})">Editar</button>
                      <button class="delete-marker-btn" onclick="deleteMarker(${marker._leaflet_id})">Borrar</button>
                  </div>
              </div>
          </div>
      `;

      L.popup({
          className: 'polaroid-popup-wrapper',
          closeButton: false,
          autoClose: false,
          closeOnEscapeKey: true
      })
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
            // Validar la longitud de la descripción
            if (imageDescription.length > 50) {
            alert("La descripción no puede exceder los 50 caracteres.");
            return; // Detener el envío del formulario si la descripción es demasiado larga
             }

            if (marker.image || imageDescription) {
                marker.description = imageDescription;
                marker.date = imageDate;

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
            var storageRef = ref(storage, 'images/' + file.name);
            uploadBytes(storageRef, file).then((snapshot) => {
                getDownloadURL(snapshot.ref).then((url) => {
                    marker.image = url;
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
                getDownloadURL(snapshot.ref).then((url) => {
                    marker.image = url;
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
        if (hasContent(marker)) {
            showPolaroidPopup(latlng, marker);
        }
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

    loadMarkers();
};