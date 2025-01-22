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
  marker.image = image;
  marker.description = description;

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

  var closeBtn = document.getElementsByClassName("close")[0];
  closeBtn.onclick = function() {
    closeModal(marker);
  };

  var form = document.getElementById('image-form');
  form.onsubmit = function(event) {
    event.preventDefault();
    var imageDescription = document.getElementById('image-description').value;
    if (marker.image || imageDescription) {
      marker.description = imageDescription;
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
  saveMarkers();
}

function handleDragOver(event) {
  event.preventDefault();
  event.target.classList.add('dragover');
}

function handleDragLeave(event) {
  event.preventDefault();
  event.target.classList.remove('dragover');
}

function handleFileDrop(event, marker) {
  event.preventDefault();
  event.target.classList.remove('dragover');
  var file = event.dataTransfer.files[0];
  if (file && file.type.startsWith('image/')) {
    readFile(file, function(result) {
      marker.image = result;
      saveMarkers();
    });
  }
}

function handleFileSelect(event, marker) {
  var file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    readFile(file, function(result) {
      marker.image = result;
      saveMarkers();
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
  saveMarkers();
}

function updateMarkerPopup(latlng, marker) {
  L.popup()
    .setLatLng(latlng)
    .setContent((marker.image ? '<img src="' + marker.image + '" alt="Imagen" width="200"><br>' : '') +
                (marker.description ? '<p>' + marker.description + '</p><br>' : '') +
                '<button class="edit-marker-btn" onclick="editMarker(' + marker._leaflet_id + ')">✎</button>' +
                '<button class="delete-marker-btn" onclick="deleteMarker(' + marker._leaflet_id + ')">✖</button>')
    .openOn(map);
}

function hasContent(marker) {
  return marker.image || marker.description;
}

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

loadMarkers();
