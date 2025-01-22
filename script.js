// Import the functions you need from the SDKs you need

import { initializeApp } from "firebase/app";

// Firebase configuration
var firebaseConfig = {
  apiKey: "AIzaSyCLHKZmeUUahOD9pCG9HGRed9zxwP5vHb0",
  authDomain: "besosporelmundo.firebaseapp.com",
  projectId: "besosporelmundo",
  storageBucket: "besosporelmundo.firebasestorage.app",
  messagingSenderId: "716617534132",
  appId: "1:716617534132:web:0a28680cf49aa1fcdd25e1"
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Initialize Firestore
var db = firebase.firestore();

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
 [_{{{CITATION{{{_1{](https://github.com/la9una/web/tree/ba1073ae044ebb7b538a3b13f0f9598f7c410bb6/docs%2Fbootstrap%2Falignci.md)[_{{{CITATION{{{_2{](https://github.com/Alefrankie/Miranda/tree/8e6197eb99daa5f79524b0363e52c7b6d5e34c9b/app%2Fviews%2Ftemplates%2Fusuarios%2Flogin.php)[_{{{CITATION{{{_3{](https://github.com/angeldavid06/gestor_de_archivos/tree/ca6e8bac430129589557a48e7f74fd91d9143739/index.php)[_{{{CITATION{{{_4{](https://github.com/SeanCena123/test-project-viola/tree/66037dd59ce3ad042e431600ef674f0cc66797d8/public%2Fjs%2Fsignin.js)[_{{{CITATION{{{_5{](https://github.com/alyzadiaz/medella/tree/db61480eb264d0869bec504687e228535076b457/HTML-CSS%2Fsearch.php)[_{{{CITATION{{{_6{](https://github.com/alyzadiaz/medella/tree/db61480eb264d0869bec504687e228535076b457/HTML-CSS%2Fhome.php)[_{{{CITATION{{{_7{](https://github.com/izaakbc/izaakbc.github.io/tree/b028145610b876ca22b983d8c24f653950cb4b1d/LeafletWMS.js)[_{{{CITATION{{{_8{](https://github.com/CarlosFTG/weatherapp/tree/05f5b98653e767c14fa9c50ae51ee620133b5c64/front%2Fsrc%2Fapp%2Fcomponents%2Fmap%2Fmap.component.ts)
