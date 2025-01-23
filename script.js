// Inicializar el mapa
var map = L.map('map').setView([0, 0], 2);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution: '© OpenStreetMap contributors'
}).addTo(map);

// Manejar el doble clic en el mapa para agregar un marcador
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
    showMarkerDetails(marker);
  });

  saveMarkers();
}

function showMarkerDetails(marker) {
  var content = '';
  if (marker.image) {
    content += '<img src="' + marker.image + '" alt="Imagen" width="200"><br>';
  }
  if (marker.description) {
    content += '<p>' + marker.description + '</p>';
  }
  if (marker.date) {
    content += '<p class="marker-date">' + marker.date + '</p>';
  }

  content += '<button class="edit-marker-btn" onclick="editMarker(' + marker._leaflet_id + ')">Modificar</button>';
  content += '<button class="delete-marker-btn" onclick="deleteMarker(' + marker._leaflet_id + ')">Borrar</button>';

  marker.bindPopup(content).openPopup();
}

window.deleteMarker = function(markerId) {
  var marker = map._layers[markerId];
  if (marker) {
    var confirmation = confirm("¿Estás seguro de que quieres borrar este marcador?");
    if (confirmation) {
      map.removeLayer(marker);
      saveMarkers();
    }
  }
};

window.editMarker = function(markerId) {
  var marker = map._layers[markerId];
  if (marker) {
    openModal(marker.getLatLng(), marker, true);
  }
};

function openModal(latlng, marker, isEdit = false) {
  var modal = document.getElementById('modal');
  modal.style.display = "block";

  // Obtener elementos del formulario
  var imageInput = document.getElementById('image-file');
  var descriptionInput = document.getElementById('image-description');
  var dateInput = document.getElementById('image-date');
  var form = document.getElementById('image-form');

  // Si estamos editando, rellenamos los campos con la información existente
  if (isEdit) {
    descriptionInput.value = marker.description || '';
    dateInput.value = marker.date || '';
    imageInput.value = ''; // Vaciar el campo de imagen para evitar conflictos
  } else {
    // Si es un nuevo marcador, limpiamos los campos
    descriptionInput.value = '';
    dateInput.value = '';
    imageInput.value = '';
  }

  // Manejar el cierre del modal
  var closeBtn = document.getElementsByClassName("close")[0];
  closeBtn.onclick = function() {
    closeModal();
  };

  window.onclick = function(event) {
    if (event.target == modal) {
      closeModal();
    }
  };

  // Manejar el envío del formulario
  form.onsubmit = function(event) {
    event.preventDefault();
    var imageFile = imageInput.files[0];

    if (imageFile && imageFile.type.startsWith('image/')) {
      var reader = new FileReader();
      reader.onload = function(e) {
        marker.image = e.target.result;
        updateMarkerData(marker);
      };
      reader.readAsDataURL(imageFile);
    } else {
      // Si no se seleccionó una nueva imagen, mantenemos la existente
      if (!isEdit) {
        alert("Por favor, selecciona una imagen.");
        return;
      }
      updateMarkerData(marker);
    }
  };

  function updateMarkerData(marker) {
    marker.description = descriptionInput.value;
    marker.date = dateInput.value;
    showMarkerDetails(marker);
    closeModal();
    saveMarkers();
  }
}

function closeModal() {
  var modal = document.getElementById('modal');
  modal.style.display = "none";
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
  var markers = JSON.parse(localStorage.getItem('markers')) || [];
  markers.forEach(function(markerData) {
    addMarker(markerData.latlng, markerData.image, markerData.description, markerData.date);
  });
}

// Cargar los marcadores al iniciar
loadMarkers();
