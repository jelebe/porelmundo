// script.js

// Inicializar Firebase
var firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
firebase.initializeApp(firebaseConfig);

// Referencia a la base de datos de Firebase
var database = firebase.database();

// Inicializar el mapa
var map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

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

  saveMarkers(); // Guardar localmente y en Firebase
}

// Guardar marcadores en Firebase
function saveMarkersToDB(markerData) {
  database.ref('markers').push(markerData, function(error) {
    if (error) {
      console.error('Error saving marker:', error);
    } else {
      console.log('Marker saved successfully');
    }
  });
}

function saveMarkers() {
  var markers = [];
  map.eachLayer(function(layer) {
    if (layer instanceof L.Marker) {
      let markerData = {
        lat: layer.getLatLng().lat,
        lng: layer.getLatLng().lng,
        image: layer.image,
        description: layer.description,
        date: layer.date
      };
      markers.push(markerData);
      saveMarkersToDB(markerData); // Guardar en Firebase
    }
  });
  localStorage.setItem('markers', JSON.stringify(markers));
}

// Cargar marcadores desde Firebase
function loadMarkers() {
  database.ref('markers').once('value', function(snapshot) {
    snapshot.forEach(function(childSnapshot) {
      var markerData = childSnapshot.val();
      addMarker([markerData.lat, markerData.lng], markerData.image, markerData.description, markerData.date);
    });
  });
}

// Llamar a la función loadMarkers al cargar la página
loadMarkers();

function showMarkerMenu(latlng, marker) {
  var popupContent = (marker.image ? '<img src="' + marker.image + '" alt="Imagen" width="200"><br>' : '') + 
                     (marker.description ? '<p>' + marker.description + '</p><br>' : '') +
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
    }
  }
};

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
      updateMarkerPopup(latlng, marker);
    }
    closeModal(marker);
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
  saveMarkers(); // Guardar localmente y en Firebase
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
    readFile(file, function(result) {
      marker.image = result;
      saveMarkers(); // Guardar localmente y en Firebase
    });
  }
}

function handleFileSelect(event, marker) {
  var file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    readFile(file, function(result) {
      marker.image = result;
      saveMarkers(); // Guardar localmente y en Firebase
    });
  }
}

function readFile(file, callback) {
  var reader = new FileReader();
  reader.onload = function(event) {
    callback(event.target.result);
  };
  reader.readAsDataURL(file);
}

window.editMarker = function(markerId) {
  var marker = map._layers[markerId];
  if (marker) {
    openModal(marker.getLatLng(), marker, true);
  }
};

function removeMarker(marker) {
  map.removeLayer(marker);
  saveMarkers(); // Guardar localmente y en Firebase
}

function updateMarkerPopup(latlng, marker) {
  L.popup()
    .setLatLng(latlng)
    .setContent((marker.date ? '<p class="marker-date">' + marker.date + '</p><br>' : '') +
                (marker.image ? '<img src="' + marker.image + '" alt="Imagen" width="200"><br>' : '') +
                (marker.description ? '<p>' + marker.description + '</p><br>' : '') +
                '<button class="edit-marker-btn" onclick="editMarker(' + marker._leaflet_id + ')">✎</button>' +
                '<button class="delete-marker-btn" onclick="deleteMarker(' + marker._leaflet_id + ')">✖</button>')
    .openOn(map);
}

function hasContent(marker) {
  return marker.image || marker.description || marker.date;
}

