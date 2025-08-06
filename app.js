// Registra il Service Worker (PWA)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log("Service Worker registrato", reg))
    .catch(err => console.error("Service Worker non registrato", err));
}

// Variabili globali
let listino = [];
let articoliAggiunti = [];
let autoPopolaCosti = true;
let mostraDettagliServizi = true;

function roundTwo(num) {
  return Math.round(num * 100) / 100;
}

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("csvFileInput").addEventListener("change", handleCSVUpload);
  document.getElementById("searchListino").addEventListener("input", aggiornaListinoSelect);

  const checkbox1 = document.createElement("label");
  checkbox1.innerHTML = `
    <input type="checkbox" id="toggleCosti" checked onchange="togglePopolaCosti()"> Popola automaticamente Trasporto e Installazione
  `;
  document.getElementById("upload-section").appendChild(checkbox1);

  const checkbox2 = document.createElement("label");
  checkbox2.innerHTML = `
    <br><input type="checkbox" id="toggleMostraServizi" checked> Mostra dettagli Trasporto/Installazione nel report
  `;
  document.getElementById("upload-section").appendChild(checkbox2);
});
function togglePopolaCosti() {
  autoPopolaCosti = document.getElementById("toggleCosti").checked;
  const secondCheckbox = document.getElementById("toggleMostraServizi");
  secondCheckbox.disabled = !autoPopolaCosti;
  mostraDettagliServizi = secondCheckbox.checked;

  articoliAggiunti = articoliAggiunti.map(articolo => {
    const listinoOriginale = listino.find(item => item.codice === articolo.codice);
    return {
      ...articolo,
      costoTrasporto: autoPopolaCosti && listinoOriginale ? listinoOriginale.costoTrasporto : 0,
      costoInstallazione: autoPopolaCosti && listinoOriginale ? listinoOriginale.costoInstallazione : 0
    };
  });

  aggiornaTabellaArticoli();
  aggiornaTotaliGenerali();
}

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
        codice: (row["Codice"] || "").trim(),
        descrizione: (row["Descrizione"] || "").trim(),
        prezzoLordo: parseFloat((row["PrezzoLordo"] || "0").replace(",", ".")) || 0,
        sconto: 0,
        sconto2: 0,
        margine: 0,
        costoTrasporto: parseFloat((row["CostoTrasporto"] || "0").replace(",", ".")) || 0,
        costoInstallazione: parseFloat((row["CostoInstallazione"] || "0").replace(",", ".")) || 0,
        quantita: 1
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
    if (item.codice.toLowerCase().includes(searchTerm) || item.descrizione.toLowerCase().includes(searchTerm)) {
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

  const nuovoArticolo = { ...articolo };
  if (!autoPopolaCosti) {
    nuovoArticolo.costoTrasporto = 0;
    nuovoArticolo.costoInstallazione = 0;
  }

  articoliAggiunti.push(nuovoArticolo);
  aggiornaTabellaArticoli();
  aggiornaTotaliGenerali();
}
function aggiornaTabellaArticoli() {
  const tableBody = document.querySelector("#articoli-table tbody");
  tableBody.innerHTML = "";

  articoliAggiunti.forEach((articolo, index) => {
    const sconto1 = articolo.sconto || 0;
    const sconto2 = articolo.sconto2 || 0;
    const prezzoScontato = articolo.prezzoLordo * (1 - sconto1 / 100) * (1 - sconto2 / 100);
    const totale = roundTwo(prezzoScontato);

    const margine = articolo.margine || 0;
    const conMargine = totale / (1 - margine / 100);
    const conMargineRounded = roundTwo(conMargine);

    const granTotale = (conMargineRounded + (articolo.costoTrasporto || 0) + (articolo.costoInstallazione || 0)) * (articolo.quantita || 1);
    const granTotaleFinal = roundTwo(granTotale);

    const venduto = articolo.venduto || 0;
    const differenza = roundTwo(venduto - granTotaleFinal);

    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${articolo.codice}</td>
      <td>${articolo.descrizione}</td>
      <td>${articolo.prezzoLordo}€</td>
      <td><input type="number" value="${sconto1}" placeholder="%" data-index="${index}" data-field="sconto" oninput="aggiornaCampo(event)" /></td>
      <td><input type="number" value="${sconto2}" placeholder="%" data-index="${index}" data-field="sconto2" oninput="aggiornaCampo(event)" /></td>
      <td><input type="number" value="${articolo.margine}" placeholder="%" data-index="${index}" data-field="margine" oninput="aggiornaCampo(event)" /></td>
      <td>${totale.toFixed(2)}€</td>
      <td><input type="number" value="${articolo.costoTrasporto}" placeholder="€" data-index="${index}" data-field="costoTrasporto" oninput="aggiornaCampo(event)" /></td>
      <td><input type="number" value="${articolo.costoInstallazione}" placeholder="€" data-index="${index}" data-field="costoInstallazione" oninput="aggiornaCampo(event)" /></td>
      <td><input type="number" value="${articolo.quantita}" min="1" data-index="${index}" data-field="quantita" oninput="aggiornaCampo(event)" /></td>
      <td>${granTotaleFinal.toFixed(2)}€</td>
      <td><input type="number" value="${venduto}" placeholder="€" data-index="${index}" data-field="venduto" oninput="aggiornaCampo(event)" /></td>
      <td>${differenza.toFixed(2)}€</td>
      <td><button onclick="rimuoviArticolo(${index})">Rimuovi</button></td>
    `;
    tableBody.appendChild(row);
  });
}
function aggiornaCampo(event) {
  const input = event.target;
  const index = parseInt(input.getAttribute("data-index"));
  const field = input.getAttribute("data-field");

  let val = parseFloat(input.value.replace(",", ".")) || 0;
  if ((field === "sconto" || field === "sconto2" || field === "margine") && val < 0) val = 0;
  if (field === "quantita" && val < 1) val = 1;

  articoliAggiunti[index][field] = val;
  aggiornaCalcoli(index);
  aggiornaTotaliGenerali();
}
function aggiornaCalcoli(index) {
  const articolo = articoliAggiunti[index];

  const sconto1 = articolo.sconto || 0;
  const sconto2 = articolo.sconto2 || 0;
  const prezzoLordo = articolo.prezzoLordo || 0;

  const totale = roundTwo(prezzoLordo * (1 - sconto1 / 100) * (1 - sconto2 / 100));
  const margine = articolo.margine || 0;
  const conMargine = roundTwo(totale / (1 - margine / 100));

  const granTotale = (conMargine + (articolo.costoTrasporto || 0) + (articolo.costoInstallazione || 0)) * (articolo.quantita || 1);
  const granTotaleFinal = roundTwo(granTotale);

  const venduto = articolo.venduto || 0;
  const differenza = roundTwo(venduto - granTotaleFinal);

  const row = document.querySelector(`#articoli-table tbody tr:nth-child(${index + 1})`);
  row.cells[6].textContent = totale.toFixed(2) + "€";
  row.cells[10].textContent = granTotaleFinal.toFixed(2) + "€";
  row.cells[12].textContent = differenza.toFixed(2) + "€";
}
function rimuoviArticolo(index) {
  articoliAggiunti.splice(index, 1);
  aggiornaTabellaArticoli();
  aggiornaTotaliGenerali();
}
function rimuoviArticolo(index) {
  articoliAggiunti.splice(index, 1);
  aggiornaTabellaArticoli();
  aggiornaTotaliGenerali();
}
function aggiornaTotaliGenerali() {
  let totaleSenzaServizi = 0;
  let totaleConServizi = 0;
  let totaleDifferenzaSconto = 0;

  articoliAggiunti.forEach(articolo => {
    const sconto1 = articolo.sconto || 0;
    const sconto2 = articolo.sconto2 || 0;
    const prezzoScontato = articolo.prezzoLordo * (1 - sconto1 / 100) * (1 - sconto2 / 100);
    const totale = roundTwo(prezzoScontato);

    const margine = articolo.margine || 0;
    const conMargine = totale / (1 - margine / 100);
    const conMargineRounded = roundTwo(conMargine);
    const quantita = articolo.quantita || 1;

    const granTot = (conMargineRounded + (articolo.costoTrasporto || 0) + (articolo.costoInstallazione || 0)) * quantita;
    const venduto = articolo.venduto || 0;
    const differenza = venduto - roundTwo(granTot);

    totaleSenzaServizi += conMargineRounded * quantita;
    totaleConServizi += roundTwo(granTot);
    totaleDifferenzaSconto += roundTwo(differenza);
  });

  let totaleDiv = document.getElementById("totaleGenerale");
  if (!totaleDiv) {
    totaleDiv = document.createElement("div");
    totaleDiv.id = "totaleGenerale";
    totaleDiv.style.padding = "1em";
    document.getElementById("report-section").insertAdjacentElement("beforebegin", totaleDiv);
  }

  let html = `<strong>Totale Netto (senza Trasporto/Installazione):</strong> ${totaleSenzaServizi.toFixed(2)}€<br>`;
  html += `<strong>Totale Complessivo (inclusi Trasporto/Installazione):</strong> ${totaleConServizi.toFixed(2)}€<br>`;
  html += `<strong>Totale Differenza Sconto:</strong> ${totaleDifferenzaSconto.toFixed(2)}€`;

  totaleDiv.innerHTML = html;
}
function generaReportTesto() {
  let report = "Report Articoli:\n\n";
  let totaleSenzaServizi = 0;
  let totaleConServizi = 0;
  let sommaDifferenze = 0;

  const checkboxServizi = document.getElementById("toggleMostraServizi");
  mostraDettagliServizi = checkboxServizi && checkboxServizi.checked;

  articoliAggiunti.forEach((articolo, index) => {
    const sconto1 = articolo.sconto || 0;
    const sconto2 = articolo.sconto2 || 0;
    const prezzoScontato = articolo.prezzoLordo * (1 - sconto1 / 100) * (1 - sconto2 / 100);
    const totale = roundTwo(prezzoScontato);

    const margine = articolo.margine || 0;
    const conMargine = totale / (1 - margine / 100);
    const conMargineRounded = roundTwo(conMargine);

    const quantita = articolo.quantita || 1;
    const granTotale = (conMargineRounded + (articolo.costoTrasporto || 0) + (articolo.costoInstallazione || 0)) * quantita;
    const granTotaleFinal = roundTwo(granTotale);

    const venduto = articolo.venduto || 0;
    const differenza = roundTwo(venduto - granTotaleFinal);
    sommaDifferenze += differenza;

    totaleSenzaServizi += conMargineRounded * quantita;
    totaleConServizi += granTotaleFinal;

    report += `${index + 1}. Codice: ${articolo.codice}\n`;
    report += `Descrizione: ${articolo.descrizione}\n`;
    report += `Prezzo netto (dopo sconto): ${totale.toFixed(2)}€\n`;
    report += `Sconto 1: ${sconto1}%\n`;
    report += `Sconto 2: ${sconto2}%\n`;
    report += `Quantità: ${quantita}\n`;
    if (mostraDettagliServizi && autoPopolaCosti) {
      report += `Trasporto: ${articolo.costoTrasporto}€\n`;
      report += `Installazione: ${articolo.costoInstallazione}€\n`;
    }
    report += `Totale: ${granTotaleFinal.toFixed(2)}€\n`;
    report += `Venduto A: ${venduto.toFixed(2)}€\n`;
    report += `Differenza sconto: ${differenza.toFixed(2)}€\n\n`;
  });

  report += `Totale Netto (senza Trasporto/Installazione): ${totaleSenzaServizi.toFixed(2)}€\n`;
  if (autoPopolaCosti) {
    report += `Totale Complessivo (inclusi Trasporto/Installazione): ${totaleConServizi.toFixed(2)}€\n`;
  }
  report += `Totale Differenza Sconto: ${sommaDifferenze.toFixed(2)}€`;

  return report;
}

function inviaReportWhatsApp() {
  const report = generaReportTesto();
  const whatsappUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(report);
  window.open(whatsappUrl, '_blank');
}

function generaPDFReport() {
  const report = generaReportTesto();
  const blob = new Blob([report], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "report.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
function generaReportTestoSenzaMargine() {
  let report = "Report Articoli (senza Margine):\n\n";
  let totaleSenzaServizi = 0;
  let totaleConServizi = 0;

  const checkboxServizi = document.getElementById("toggleMostraServizi");
  const mostraServizi = checkboxServizi && checkboxServizi.checked;

  articoliAggiunti.forEach((articolo, index) => {
    const sconto1 = articolo.sconto || 0;
    const sconto2 = articolo.sconto2 || 0;
    const prezzoLordo = articolo.prezzoLordo || 0;
    const prezzoScontato = roundTwo(prezzoLordo * (1 - sconto1 / 100) * (1 - sconto2 / 100));
    const quantita = articolo.quantita || 1;

    const granTotale = (prezzoScontato + (articolo.costoTrasporto || 0) + (articolo.costoInstallazione || 0)) * quantita;
    const granTotaleFinal = roundTwo(granTotale);

    totaleSenzaServizi += prezzoScontato * quantita;
    totaleConServizi += granTotaleFinal;

    report += `${index + 1}. Codice: ${articolo.codice}\n`;
    report += `Descrizione: ${articolo.descrizione}\n`;
    report += `Prezzo netto (dopo sconto): ${prezzoScontato.toFixed(2)}€\n`;
    report += `Sconto 1: ${sconto1}%\n`;
    report += `Sconto 2: ${sconto2}%\n`;
    report += `Quantità: ${quantita}\n`;
    if (mostraServizi && autoPopolaCosti) {
      report += `Trasporto: ${articolo.costoTrasporto}€\n`;
      report += `Installazione: ${articolo.costoInstallazione}€\n`;
    }
    report += `Totale: ${granTotaleFinal.toFixed(2)}€\n\n`;
  });

  report += `Totale Netto (senza Trasporto/Installazione): ${totaleSenzaServizi.toFixed(2)}€\n`;
  if (autoPopolaCosti) {
    report += `Totale Complessivo (inclusi Trasporto/Installazione): ${totaleConServizi.toFixed(2)}€\n`;
  }

  return report;
}
function inviaReportWhatsAppSenzaMargine() {
  const report = generaReportTestoSenzaMargine();
  const whatsappUrl = "https://api.whatsapp.com/send?text=" + encodeURIComponent(report);
  window.open(whatsappUrl, '_blank');
}

function generaTXTReportSenzaMargine() {
  const report = generaReportTestoSenzaMargine();
  const blob = new Blob([report], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "report_senza_margine.txt";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
