// app.js

// Registra il Service Worker (PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log("Service Worker registrato", reg))
    .catch(err => console.error("Service Worker non registrato", err));
}

// Variabili globali
let listino = [];
let articoliAggiunti = [];

// Funzione per arrotondare a due decimali in maniera affidabile
function roundTwo(num) {
  return Math.round(num * 100) / 100;
}

// Al caricamento del DOM, colleghiamo gli eventi
document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("csvFileInput").addEventListener("change", handleCSVUpload);
  document.getElementById("searchListino").addEventListener("input", aggiornaListinoSelect);
});

// Carica e parsifica il CSV
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
      // Mappiamo ogni riga CSV in un oggetto del listino
      listino = results.data.map(row => ({
        codice: (row["Codice"] || "").trim(),
        descrizione: (row["Descrizione"] || "").trim(),
        prezzoLordo: parseFloat((row["PrezzoLordo"] || "0").replace(",", ".")) || 0,
        // Sconto e margine inizialmente a 0
        sconto: 0,
        margine: 0,
        costoTrasporto: parseFloat((row["CostoTrasporto"] || "0").replace(",", ".")) || 0,
        costoInstallazione: parseFloat((row["CostoInstallazione"] || "0").replace(",", ".")) || 0
      }));
      aggiornaListinoSelect();
    },
    error: function(err) {
      console.error("Errore CSV:", err);
      document.getElementById("csvError").style.display = "block";
    }
  });
}

// Aggiorna la tendina (select) in base alla ricerca
function aggiornaListinoSelect() {
  const select = document.getElementById("listinoSelect");
  const searchTerm = document.getElementById("searchListino").value.toLowerCase();
  select.innerHTML = "";

  listino.forEach((item) => {
    // Controllo se nel codice o descrizione c'è il testo cercato
    if (item.codice.toLowerCase().includes(searchTerm) ||
        item.descrizione.toLowerCase().includes(searchTerm)) {
      const option = document.createElement("option");
      option.value = item.codice;
      option.textContent = `${item.codice} - ${item.descrizione} - €${item.prezzoLordo}`;
      select.appendChild(option);
    }
  });
}

// Aggiunge alla tabella un articolo preso dal listino
function aggiungiArticoloDaListino() {
  const select = document.getElementById("listinoSelect");
  if (!select.value) return;

  const articolo = listino.find(item => item.codice === select.value);
  if (!articolo) {
    alert("Errore: articolo non trovato nel listino.");
    return;
  }

  // Copiamo l'articolo in articoliAggiunti
  articoliAggiunti.push({ ...articolo });
  aggiornaTabellaArticoli();
}

// Ridisegna la tabella intera degli articoli
function aggiornaTabellaArticoli() {
  const tableBody = document.querySelector("#articoli-table tbody");
  tableBody.innerHTML = "";

  articoliAggiunti.forEach((articolo, index) => {
    // Calcolo del totale scontato
    const sconto = articolo.sconto || 0;
    const prezzoScontato = articolo.prezzoLordo * (1 - sconto / 100);
    const totale = roundTwo(prezzoScontato);

    // Calcolo Gran Totale (con margine, trasporto, installazione)
    const margine = articolo.margine || 0;
    // Usando il totale scontato come base per il margine
    const conMargine = totale / (1 - margine / 100);
    const conMargineRounded = roundTwo(conMargine);
    const granTotale = conMargineRounded + (articolo.costoTrasporto || 0) + (articolo.costoInstallazione || 0);
    const granTotaleFinal = roundTwo(granTotale);

    // Creazione riga
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${articolo.codice}</td>
      <td>${articolo.descrizione}</td>
      <td>${articolo.prezzoLordo}€</td>
      <td>
        <input
          type="number"
          value="${articolo.sconto}"
          placeholder="%"
          data-index="${index}"
          data-field="sconto"
          oninput="aggiornaCampo(event)"
        />
      </td>
      <td>
        <input
          type="number"
          value="${articolo.margine}"
          placeholder="%"
          data-index="${index}"
          data-field="margine"
          oninput="aggiornaCampo(event)"
        />
      </td>
      <td>${totale.toFixed(2)}€</td>
      <td>
        <input
          type="number"
          value="${articolo.costoTrasporto}"
          placeholder="€"
          data-index="${index}"
          data-field="costoTrasporto"
          oninput="aggiornaCampo(event)"
        />
      </td>
      <td>
        <input
          type="number"
          value="${articolo.costoInstallazione}"
          placeholder="€"
          data-index="${index}"
          data-field="costoInstallazione"
          oninput="aggiornaCampo(event)"
        />
      </td>
      <td>${granTotaleFinal.toFixed(2)}€</td>
      <td><button onclick="rimuoviArticolo(${index})">Rimuovi</button></td>
    `;
    tableBody.appendChild(row);
  });
}

// Aggiorna il campo (sconto, margine, costi) di un singolo articolo senza ridisegnare l'intera tabella
function aggiornaCampo(event) {
  const input = event.target;
  const index = parseInt(input.getAttribute("data-index"));
  const field = input.getAttribute("data-field");

  // Sostituisci eventuale virgola con il punto, poi fai parseFloat
  let val = parseFloat(input.value.replace(",", ".")) || 0;
  // Nel caso di sconto e margine, non permetti valori negativi
  if ((field === "sconto" || field === "margine") && val < 0) val = 0;

  // Aggiorna in memoria l'articolo
  articoliAggiunti[index][field] = val;

  // Aggiorna i calcoli sulle celle della stessa riga
  aggiornaCalcoli(index);
}

// Aggiorna solo i calcoli di una riga, senza ridisegnare tutta la tabella
function aggiornaCalcoli(index) {
  const articolo = articoliAggiunti[index];

  const sconto = articolo.sconto || 0;
  const prezzoScontato = articolo.prezzoLordo * (1 - sconto / 100);
  const totale = roundTwo(prezzoScontato);

  const margine = articolo.margine || 0;
  const conMargine = totale / (1 - margine / 100);
  const conMargineRounded = roundTwo(conMargine);

  const granTotale = conMargineRounded + (articolo.costoTrasporto || 0) + (articolo.costoInstallazione || 0);
  const granTotaleFinal = roundTwo(granTotale);

  // Seleziona la riga corrispondente nella tabella
  const row = document.querySelector(`#articoli-table tbody tr:nth-child(${index + 1})`);
  // cella[5] = Totale
  row.cells[5].textContent = totale.toFixed(2) + "€";
  // cella[8] = Gran Totale
  row.cells[8].textContent = granTotaleFinal.toFixed(2) + "€";
}

// Rimuovi un articolo dalla lista
function rimuoviArticolo(index) {
  articoliAggiunti.splice(index, 1);
  aggiornaTabellaArticoli();
}
