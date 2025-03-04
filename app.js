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
