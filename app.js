// app.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log("Service Worker registrato", reg))
    .catch(err => console.error("Service Worker non registrato", err));
}

let listino = [];
let articoliAggiunti = [];

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("csvFileInput").addEventListener("change", handleCSVUpload);
  document.getElementById("searchListino").addEventListener("input", aggiornaListinoSelect);
});

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;

  Papa.parse(file, {
    header: true,
    skipEmptyLines: true,
    complete: function(results) {
      if (!results.data.length) {
        document.getElementById("csvError").style.display = "block";
        return;
      }
      listino = results.data.map(row => ({
        codice: row["Codice"]?.trim() || "",
        descrizione: row["Descrizione"]?.trim() || "",
        prezzoLordo: parseFloat(row["PrezzoLordo"]?.trim()) || 0,
        sconto: 0,
        margine: 0,
        costoTrasporto: parseFloat(row["CostoTrasporto"]?.trim()) || 0,
        costoInstallazione: parseFloat(row["CostoInstallazione"]?.trim()) || 0
      }));
      aggiornaListinoSelect();
    },
    error: function(err) {
      console.error("Errore CSV:", err);
      document.getElementById("csvError").style.display = "block";
    }
  });
}

function aggiornaListinoSelect() {
  const select = document.getElementById("listinoSelect");
  const searchTerm = document.getElementById("searchListino").value.toLowerCase();
  select.innerHTML = "";
  listino.forEach((item) => {
    if (item.codice.toLowerCase().includes(searchTerm) ||
        item.descrizione.toLowerCase().includes(searchTerm)) {
      const option = document.createElement("option");
      option.value = item.codice;
      option.textContent = `${item.codice} - ${item.descrizione} - €${item.prezzoLordo}`;
      select.appendChild(option);
    }
  });
}

function aggiungiArticoloDaListino() {
  const select = document.getElementById("listinoSelect");
  if (!select.value) return;
  const articolo = listino.find(item => item.codice === select.value);
  
  if (!articolo) {
    alert("Errore: articolo non trovato nel listino.");
    return;
  }
  
  articoliAggiunti.push({ ...articolo });
  aggiornaTabellaArticoli();
}

function aggiornaTabellaArticoli() {
  const tableBody = document.querySelector("#articoli-table tbody");
  tableBody.innerHTML = "";
  
  articoliAggiunti.forEach((articolo, index) => {
    const totale = articolo.prezzoLordo * (1 - (articolo.sconto || 0) / 100);
    const granTotale = totale / (1 - (articolo.margine || 0) / 100) + (articolo.costoTrasporto || 0) + (articolo.costoInstallazione || 0);
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${articolo.codice}</td>
      <td>${articolo.descrizione}</td>
      <td>${articolo.prezzoLordo}€</td>
      <td><input type="number" value="${articolo.sconto}" placeholder="%" data-index="${index}" data-field="sconto" oninput="aggiornaCampo(event)"></td>
      <td><input type="number" value="${articolo.margine}" placeholder="%" data-index="${index}" data-field="margine" oninput="aggiornaCampo(event)"></td>
      <td><input type="number" value="${articolo.costoTrasporto}" placeholder="€" data-index="${index}" data-field="costoTrasporto" oninput="aggiornaCampo(event)"></td>
      <td><input type="number" value="${articolo.costoInstallazione}" placeholder="€" data-index="${index}" data-field="costoInstallazione" oninput="aggiornaCampo(event)"></td>
      <td>${totale.toFixed(2)}€</td>
      <td>${granTotale.toFixed(2)}€</td>
      <td><button onclick="rimuoviArticolo(${index})">Rimuovi</button></td>
    `;
    tableBody.appendChild(row);
  });
}

// ✅ FIX: Ora il valore si aggiorna senza refresh continuo della tabella
function aggiornaCampo(event) {
  const input = event.target;
  const index = parseInt(input.getAttribute("data-index"));
  const field = input.getAttribute("data-field");
  const value = input.value;

  // Evita il reset dell'input mentre scrivi
  if (!isNaN(value) && value !== "") {
    articoliAggiunti[index][field] = parseFloat(value);
  }

  // Aggiorna solo il calcolo senza ridisegnare tutta la tabella
  aggiornaCalcoli(index);
}

// Funzione per aggiornare solo il calcolo, senza ridisegnare la tabella
function aggiornaCalcoli(index) {
  const articolo = articoliAggiunti[index];
  const totale = articolo.prezzoLordo * (1 - (articolo.sconto || 0) / 100);
  const granTotale = totale / (1 - (articolo.margine || 0) / 100) + (articolo.costoTrasporto || 0) + (articolo.costoInstallazione || 0);

  // Aggiorna solo i campi che cambiano
  const row = document.querySelector(`#articoli-table tbody tr:nth-child(${index + 1})`);
  row.cells[7].textContent = `${totale.toFixed(2)}€`; // Spostato dopo Installazione
  row.cells[8].textContent = `${granTotale.toFixed(2)}€`;
}

function rimuoviArticolo(index) {
  articoliAggiunti.splice(index, 1);
  aggiornaTabellaArticoli();
}
