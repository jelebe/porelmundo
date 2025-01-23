// Inicialización de Supabase
const SUPABASE_URL = 'https://xwtggolgjirvemmvxjsy.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh3dGdnb2xnamlydmVtbXZ4anN5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzc1NTQ1MjQsImV4cCI6MjA1MzEzMDUyNH0.dviH9wIFaIpFolnVHEuECslVF6ZwwyqgLGbZvGeSYnA';
const supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Mapa
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

// Guardar Marcadores en Supabase
async function saveMarkers() {
  const markers = [];
  map.eachLayer(function(layer) {
    if (layer instanceof L.Marker) {
      markers.push({
        lat: layer.getLatLng().lat,
        lng: layer.getLatLng().lng,
        image: layer.image,
        description: layer.description,
        date: layer.date
      });
    }
  });

  const { data, error } = await supabase
    .from('markers')
    .insert(markers);

  if (error) {
    console.error('Error al guardar los marcadores:', error);
  } else {
    console.log('Marcadores guardados:', data);
  }
}


// Cargar Marcadores desde Supabase
async function loadMarkers() {
  const { data: markers, error } = await supabase
    .from('markers')
    .select('*');

  if (error) {
    console.error('Error al cargar los marcadores:', error);
    alert('Hubo un error al cargar los marcadores. Por favor, intenta de nuevo más tarde.');
    return;
  }

  markers.forEach(function(markerData) {
    addMarker([markerData.lat, markerData.lng], markerData.image, markerData.description, markerData.date);
  });
}

// Remover Marcadores desde Supabase
async function removeMarker(marker) {
  map.removeLayer(marker);

  const { data, error } = await supabase
    .from('markers')
    .delete()
    .eq('lat', marker.getLatLng().lat)
    .eq('lng', marker.getLatLng().lng);

  if (error) {
    console.error('Error al eliminar el marcador:', error);
  } else {
    console.log('Marcador eliminado:', data);
  }
}


// Cargar los marcadores al inicio
loadMarkers();
