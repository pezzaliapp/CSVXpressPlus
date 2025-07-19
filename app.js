
let listino = [];
let articoliAggiunti = [];

document.addEventListener("DOMContentLoaded", function () {
  document.getElementById("csvFileInput").addEventListener("change", handleCSVUpload);
  document.getElementById("searchListino").addEventListener("input", aggiornaListinoSelect);
});

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    const rows = text.split("\n").filter(Boolean).map(row => row.split("\t"));
    listino = rows.map(campi => ({
      codice: campi[0],
      descrizione: campi[1],
      prezzo: parseFloat(campi[2].replace(',', '.'))
    }));
    aggiornaListinoSelect();
  };
  reader.readAsText(file);
}

function aggiornaListinoSelect() {
  const select = document.getElementById("selectArticolo");
  const search = document.getElementById("searchListino").value.toLowerCase();
  select.innerHTML = "";
  listino.filter(item => item.codice.toLowerCase().includes(search) || item.descrizione.toLowerCase().includes(search))
         .forEach(item => {
    const option = document.createElement("option");
    option.text = `${item.codice} - ${item.descrizione} - €${item.prezzo}`;
    option.value = item.codice;
    select.add(option);
  });
}

function aggiungiArticolo() {
  const codice = document.getElementById("selectArticolo").value;
  const articolo = listino.find(item => item.codice === codice);
  if (!articolo || articoliAggiunti.some(a => a.codice === codice)) return;
  articoliAggiunti.push({ ...articolo, sconto: 0, margine: 0, qty: 1, trasporto: 0, installazione: 0 });
  renderArticoli();
}

function renderArticoli() {
  const tbody = document.querySelector("#articoli-table tbody");
  tbody.innerHTML = "";
  let totaleNetto = 0;
  let totaleComplessivo = 0;

  articoliAggiunti.forEach((art, index) => {
    const row = document.createElement("tr");
    const totale = art.prezzo * (1 - art.sconto / 100);
    const granTot = (totale + +art.trasporto + +art.installazione) * art.qty;
    totaleNetto += totale * art.qty;
    totaleComplessivo += granTot;

    row.innerHTML = `
      <td>${art.codice}</td>
      <td>${art.descrizione}</td>
      <td>${art.prezzo}€</td>
      <td><input type="number" value="${art.sconto}" onchange="aggiornaCampo(${index}, 'sconto', this.value)" /></td>
      <td><input type="number" value="${art.margine}" onchange="aggiornaCampo(${index}, 'margine', this.value)" /></td>
      <td>${totale.toFixed(2)}€</td>
      <td><input type="number" value="${art.trasporto}" onchange="aggiornaCampo(${index}, 'trasporto', this.value)" /></td>
      <td><input type="number" value="${art.installazione}" onchange="aggiornaCampo(${index}, 'installazione', this.value)" /></td>
      <td><input type="number" value="${art.qty}" onchange="aggiornaCampo(${index}, 'qty', this.value)" /></td>
      <td>${granTot.toFixed(2)}€</td>
      <td><button onclick="rimuoviArticolo(${index})">Rimuovi</button></td>
    `;
    tbody.appendChild(row);
  });

  document.getElementById("totaleGenerale").innerHTML = `
    <p>Totale Netto (senza Trasporto/Installazione): ${totaleNetto.toFixed(2)}€</p>
    <p>Totale Complessivo (inclusi Trasporto/Installazione): ${totaleComplessivo.toFixed(2)}€</p>
  `;
}

function aggiornaCampo(index, campo, valore) {
  articoliAggiunti[index][campo] = parseFloat(valore);
  renderArticoli();
}

function rimuoviArticolo(index) {
  articoliAggiunti.splice(index, 1);
  renderArticoli();
}

function generaReport() {
  const righe = articoliAggiunti.map(a => `${a.codice} - ${a.descrizione} - €${a.prezzo} x${a.qty}`);
  const blob = new Blob([righe.join("\n")], { type: "text/plain" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "report.txt";
  link.click();
}
