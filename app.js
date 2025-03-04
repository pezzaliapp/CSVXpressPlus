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
        costoTrasporto: 0,
        costoInstallazione: 0
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
  
  articolo.sconto = 0;
  articolo.margine = 0;
  articolo.costoTrasporto = 0;
  articolo.costoInstallazione = 0;
  
  articoliAggiunti.push(articolo);
  aggiornaTabellaArticoli();
}

function aggiornaTabellaArticoli() {
  const tableBody = document.querySelector("#articoli-table tbody");
  tableBody.innerHTML = "";
  
  articoliAggiunti.forEach((articolo, index) => {
    const totale = articolo.prezzoLordo * (1 - articolo.sconto / 100);
    const granTotale = totale / (1 - articolo.margine / 100) + articolo.costoTrasporto + articolo.costoInstallazione;
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${articolo.codice}</td>
      <td>${articolo.descrizione}</td>
      <td><input type="number" value="${articolo.prezzoLordo}" disabled></td>
      <td><input type="number" value="${articolo.sconto}" oninput="aggiornaCalcoli(${index})"></td>
      <td><input type="number" value="${articolo.margine}" oninput="aggiornaCalcoli(${index})"></td>
      <td>${totale.toFixed(2)}€</td>
      <td><input type="number" value="${articolo.costoTrasporto}" oninput="aggiornaCalcoli(${index})"></td>
      <td><input type="number" value="${articolo.costoInstallazione}" oninput="aggiornaCalcoli(${index})"></td>
      <td>${granTotale.toFixed(2)}€</td>
      <td><button onclick="rimuoviArticolo(${index})">Rimuovi</button></td>
    `;
    tableBody.appendChild(row);
  });
}

function aggiornaCalcoli(index) {
  articoliAggiunti[index].sconto = parseFloat(event.target.parentElement.parentElement.children[3].children[0].value) || 0;
  articoliAggiunti[index].margine = parseFloat(event.target.parentElement.parentElement.children[4].children[0].value) || 0;
  articoliAggiunti[index].costoTrasporto = parseFloat(event.target.parentElement.parentElement.children[6].children[0].value) || 0;
  articoliAggiunti[index].costoInstallazione = parseFloat(event.target.parentElement.parentElement.children[7].children[0].value) || 0;
  aggiornaTabellaArticoli();
}
