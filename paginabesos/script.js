var map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

map.on('dblclick', function(e) {
  var lat = e.latlng.lat;
  var lng = e.latlng.lng;
  addMarker([lat, lng]);
});

function addMarker(latlng, image = null, description = null) {
  var marker = L.marker(latlng).addTo(map);
  marker.image = image; // Inicializar con la imagen proporcionada
  marker.description = description; // Inicializar con la descripción proporcionada

  marker.on('click', function() {
    if (marker.image || marker.description) {
      showMarkerMenu(latlng, marker);
    } else {
      openModal(latlng, marker);
    }
  });

  // Si no se sube una imagen o descripción, eliminar el marcador
  marker.on('popupclose', function() {
    if (!marker.image && !marker.description) {
      map.removeLayer(marker);
    }
  });

  saveMarkers(); // Guardar los marcadores en Local Storage
}

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
    map.removeLayer(marker);
    saveMarkers(); // Guardar los marcadores en Local Storage
  }
};

function openModal(latlng, marker, isEdit = false) {
  var modal = document.getElementById('modal');
  modal.style.display = "block";

  // Limpiar el input de archivo al abrir el modal
  document.getElementById('image-file').value = '';

  if (isEdit) {
    document.getElementById('image-description').value = marker.description || '';
  } else {
    document.getElementById('image-description').value = '';
  }

  var closeBtn = document.getElementsByClassName("close")[0];
  closeBtn.onclick = function() {
    modal.style.display = "none";
    if (!marker.image && !marker.description) {
      map.removeLayer(marker); // Eliminar el marcador si no tiene imagen ni descripción
    }
    saveMarkers(); // Guardar los marcadores en Local Storage
  };

  var form = document.getElementById('image-form');
  form.onsubmit = function(event) {
    event.preventDefault();
    var imageDescription = document.getElementById('image-description').value;
    if (marker.image || imageDescription) {
      marker.description = imageDescription; // Asignar descripción al marcador
      L.popup()
        .setLatLng(latlng)
        .setContent((marker.image ? '<img src="' + marker.image + '" alt="Imagen" width="200"><br>' : '') +
                    (imageDescription ? '<p>' + imageDescription + '</p><br>' : '') +
                    '<button class="edit-marker-btn" onclick="editMarker(' + marker._leaflet_id + ')">✎</button>' +
                    '<button class="delete-marker-btn" onclick="deleteMarker(' + marker._leaflet_id + ')">✖</button>')
        .openOn(map);
    }
    modal.style.display = "none";
    saveMarkers(); // Guardar los marcadores en Local Storage
  };

  window.onclick = function(event) {
    if (event.target == modal) {
      modal.style.display = "none";
      if (!marker.image && !marker.description) {
        map.removeLayer(marker); // Eliminar el marcador si no tiene imagen ni descripción
      }
      saveMarkers(); // Guardar los marcadores en Local Storage
    }
  };

  // Funcionalidad de arrastrar y soltar
  var dropArea = document.getElementById('drop-area');
  dropArea.addEventListener('dragover', function(event) {
    event.preventDefault();
    dropArea.classList.add('dragover');
  });
  dropArea.addEventListener('dragleave', function(event) {
    event.preventDefault();
    dropArea.classList.remove('dragover');
  });
  dropArea.addEventListener('drop', function(event) {
    event.preventDefault();
    dropArea.classList.remove('dragover');
    var file = event.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      var reader = new FileReader();
      reader.onload = function(event) {
        marker.image = event.target.result;
        saveMarkers(); // Guardar los marcadores en Local Storage
      };
      reader.readAsDataURL(file);
    }
  });

  // Agregar el evento `change` al input de archivo
  document.getElementById('image-file').addEventListener('change', function(event) {
    var file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      var reader = new FileReader();
      reader.onload = function(event) {
        marker.image = event.target.result;
        saveMarkers(); // Guardar los marcadores en Local Storage
      };
      reader.readAsDataURL(file);
    }
  });
}

window.editMarker = function(markerId) {
  var marker = map._layers[markerId];
  if (marker) {
    openModal(marker.getLatLng(), marker, true);
  }
};

function saveMarkers() {
  var markers = [];
  map.eachLayer(function(layer) {
    if (layer instanceof L.Marker) {
      markers.push({
        latlng: layer.getLatLng(),
        image: layer.image,
        description: layer.description
      });
    }
  });
  localStorage.setItem('markers', JSON.stringify(markers));
}

function loadMarkers() {
  var markers = JSON.parse(localStorage.getItem('markers')) || [];
  markers.forEach(function(markerData) {
    addMarker(markerData.latlng, markerData.image, markerData.description);
  });
}

// Cargar los marcadores guardados al iniciar la página
loadMarkers();
