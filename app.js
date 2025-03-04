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
        sconto: "",
        margine: "",
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
    const totale = articolo.prezzoLordo * (1 - (parseFloat(articolo.sconto) || 0) / 100);
    const granTotale = totale / (1 - (parseFloat(articolo.margine) || 0) / 100) + (parseFloat(articolo.costoTrasporto) || 0) + (parseFloat(articolo.costoInstallazione) || 0);
    
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${articolo.codice}</td>
      <td>${articolo.descrizione}</td>
      <td>${articolo.prezzoLordo}€</td>
      <td><input type="number" value="${articolo.sconto}" placeholder="%" oninput="aggiornaCalcoli(${index}, this)"></td>
      <td><input type="number" value="${articolo.margine}" placeholder="%" oninput="aggiornaCalcoli(${index}, this)"></td>
      <td>${totale.toFixed(2)}€</td>
      <td><input type="number" value="${articolo.costoTrasporto}" placeholder="€" oninput="aggiornaCalcoli(${index}, this)"></td>
      <td><input type="number" value="${articolo.costoInstallazione}" placeholder="€" oninput="aggiornaCalcoli(${index}, this)"></td>
      <td>${granTotale.toFixed(2)}€</td>
      <td><button onclick="rimuoviArticolo(${index})">Rimuovi</button></td>
    `;
    tableBody.appendChild(row);
  });
}

function aggiornaCalcoli(index, input) {
  const value = input.value;
  if (value === "") return;
  const numericValue = parseFloat(value);
  if (isNaN(numericValue)) return;
  
  if (input.placeholder === "%") {
    if (input.parentElement.previousElementSibling.previousElementSibling.textContent.includes("€")) {
      articoliAggiunti[index].sconto = numericValue;
    } else {
      articoliAggiunti[index].margine = numericValue;
    }
  } else {
    if (input.placeholder.includes("€")) {
      if (input.parentElement.previousElementSibling.textContent.includes("€")) {
        articoliAggiunti[index].costoTrasporto = numericValue;
      } else {
        articoliAggiunti[index].costoInstallazione = numericValue;
      }
    }
  }
  aggiornaTabellaArticoli();
}
