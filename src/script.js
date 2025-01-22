import { supabase } from './supabaseClient.js';

// Tu código existente
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

  saveMarkers();
}

function showMarkerMenu(latlng, marker) {
  var popupContent = (marker.date ? '<p class="marker-date">' + marker.date + '</p><br>' : '') +
                     (marker.image ? '<img src="' + marker.image + '" alt="Imagen" width="200"><br>' : '') + 
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

async function uploadImage(file) {
  const { data, error } = await supabase
    .storage
    .from('images')
    .upload(`public/${file.name}`, file);

  if (error) {
    console.error('Error subiendo la imagen:', error.message);
    return null;
  }

  const { publicURL, error: publicError } = supabase
    .storage
    .from('images')
    .getPublicUrl(`public/${file.name}`);

  if (publicError) {
    console.error('Error obteniendo la URL pública:', publicError.message);
    return null;
  }

  return publicURL;
}

async function handleFileSelect(event, marker) {
  var file = event.target.files[0];
  if (file && file.type.startsWith('image/')) {
    readFile(file, async function(result) {
      marker.image = result;

      const publicURL = await uploadImage(file);
      if (publicURL) {
        marker.image = publicURL;
        saveMarkers();
      } else {
        console.error('No se pudo obtener la URL pública de la imagen.');
      }
    });
  }
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
  form.onsubmit = async function(event) {
    event.preventDefault();
    var imageDescription = document.getElementById('image-description').value;
    var imageDate = document.getElementById('image-date').value;

    if (marker.image || imageDescription) {
      marker.description = imageDescription;
      marker.date = imageDate;
      updateMarkerPopup(latlng, marker);

      // Guardar datos del marcador en Supabase
      const { data, error } = await supabase
        .from('markers')
        .insert([{ 
          lat: latlng.lat, 
          lng: latlng.lng, 
          image: marker.image, 
          description: marker.description, 
          date: imageDate // Asegúrate de que date sea del tipo `date` en Supabase
        }]);
      
      if (error) {
        console.error('Error guardando el marcador en Supabase:', error.message);
      } else {
        console.log('Marcador guardado en Supabase:', data);
      }
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
    readFile(file, async function(result) {
      marker.image = result;

      const publicURL = await uploadImage(file);
      if (publicURL) {
        marker.image = publicURL;
        saveMarkers();
      } else {
        console.error('No se pudo obtener la URL pública de la imagen.');
      }
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
    .setContent((marker.date ? '<p class="marker-date">' + marker.date + '</p><br>' : '') +
                (marker.image ? '<img src="' + marker.image + '" alt="Imagen" width="200"><br>' : '') +
                (marker.description ? '<p>' + marker.description + '</p><br>' : '') +
                '<button class="edit-marker-btn" onclick="editMarker(' + marker._leaflet_id + ')">✎</button>' +
                '<button class="delete-marker-btn" onclick="deleteMarker(' + marker._leaflet_id + ')">✖</button>')
    .openOn(map);
}

function hasContent(marker) {
  return Boolean(marker.image || marker.description || marker.date);
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

loadMarkers();
