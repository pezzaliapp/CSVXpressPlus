<!-- index.html -->
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>CSVXpress</title>
  <link rel="manifest" href="manifest.json">
  <link rel="stylesheet" href="style.css">
  <meta name="theme-color" content="#ffffff">
</head>
<body>
  <header>
    <h1>CSVXpress</h1>
  </header>
  
  <main>
    <section id="upload-section">
      <h2>Carica Listino CSV</h2>
      <input type="file" id="csvFileInput" accept=".csv">
      <p id="csvError" style="color: red; display: none;">Errore nel caricamento del file CSV.</p>
    </section>

    <section id="listino-section">
      <h2>Filtra e Seleziona Articolo dal Listino</h2>
      <label for="searchListino">Cerca: </label>
      <input type="text" id="searchListino" placeholder="Inserisci codice o descrizione">
      <select id="listinoSelect"></select>
      <button onclick="aggiungiArticoloDaListino()">Aggiungi Articolo Selezionato</button>
    </section>

    <section id="articoli-section">
      <h2>Articoli Aggiunti</h2>
      <table id="articoli-table" border="1">
        <thead>
          <tr>
            <th>Codice</th>
            <th>Descrizione</th>
            <th>Trasporto</th>
            <th>Installazione</th>
            <th>Azioni</th>
          </tr>
        </thead>
        <tbody></tbody>
      </table>
    </section>
  </main>
  
  <script src="https://cdnjs.cloudflare.com/ajax/libs/PapaParse/5.3.2/papaparse.min.js"></script>
  <script src="app.js"></script>
</body>
</html>

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
        prezzoLordo: row["PrezzoLordo"]?.trim() || "0",
        costoTrasporto: row["CostoTrasporto"]?.trim() || "0",
        costoInstallazione: row["CostoInstallazione"]?.trim() || "0"
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
  
  if (articoliAggiunti.some(a => a.codice === articolo.codice)) {
    alert("Questo articolo è già stato aggiunto.");
    return;
  }
  
  articoliAggiunti.push(articolo);
  aggiornaTabellaArticoli();
}

function aggiornaTabellaArticoli() {
  const tableBody = document.querySelector("#articoli-table tbody");
  tableBody.innerHTML = "";
  
  articoliAggiunti.forEach((articolo, index) => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${articolo.codice}</td>
      <td>${articolo.descrizione}</td>
      <td>${articolo.costoTrasporto}€</td>
      <td>${articolo.costoInstallazione}€</td>
      <td><button onclick="rimuoviArticolo(${index})">Rimuovi</button></td>
    `;
    tableBody.appendChild(row);
  });
}

function rimuoviArticolo(index) {
  articoliAggiunti.splice(index, 1);
  aggiornaTabellaArticoli();
}
