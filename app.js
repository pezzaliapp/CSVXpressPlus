
let listino = [];
let articoliAggiunti = [];

document.getElementById("csvFileInput").addEventListener("change", handleCSVUpload);
document.getElementById("searchListino").addEventListener("input", aggiornaListinoSelect);

function handleCSVUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    listino = parseCSV(text);
    aggiornaListinoSelect();
  };
  reader.readAsText(file);
}

function parseCSV(text) {
  const righe = text.split("\n");
  return righe.map(r => {
    const c = r.split("\t");
    return { codice: c[0], descrizione: c[1], prezzo: parseFloat(c[2].replace('€','').replace(',','.')) };
  }).filter(r => r.codice && r.descrizione && !isNaN(r.prezzo));
}

function aggiornaListinoSelect() {
  const select = document.getElementById("selectArticolo");
  const search = document.getElementById("searchListino").value.toLowerCase();
  select.innerHTML = "";
  listino
    .filter(a => a.codice.toLowerCase().includes(search) || a.descrizione.toLowerCase().includes(search))
    .forEach(a => {
      const opt = document.createElement("option");
      opt.value = a.codice;
      opt.textContent = `${a.codice} – ${a.descrizione} – €${a.prezzo}`;
      opt.dataset.prezzo = a.prezzo;
      opt.dataset.descrizione = a.descrizione;
      select.appendChild(opt);
    });
}

function aggiungiArticolo() {
  const select = document.getElementById("selectArticolo");
  const codice = select.value;
  if (!codice) return;
  const option = select.selectedOptions[0];
  const descrizione = option.dataset.descrizione;
  const prezzo = parseFloat(option.dataset.prezzo);
  articoliAggiunti.push({ codice, descrizione, prezzo, sconto: 0, margine: 0, trasporto: 0, installazione: 0, quantita: 1 });
  aggiornaTabella();
}

function aggiornaTabella() {
  const tbody = document.getElementById("tabellaArticoli");
  tbody.innerHTML = "";
  let totaleNetto = 0;
  let totaleComplessivo = 0;

  articoliAggiunti.forEach((art, index) => {
    const tr = document.createElement("tr");
    const totale = art.prezzo * (1 - art.sconto / 100);
    const granTot = (totale + art.trasporto + art.installazione) * art.quantita;
    totaleNetto += totale * art.quantita;
    totaleComplessivo += granTot;

    tr.innerHTML = \`
      <td>\${art.codice}</td>
      <td>\${art.descrizione}</td>
      <td>\${art.prezzo}€</td>
      <td><input type="number" value="\${art.sconto}" onchange="modificaCampo(\${index}, 'sconto', this.value)"></td>
      <td><input type="number" value="\${art.margine}" onchange="modificaCampo(\${index}, 'margine', this.value)"></td>
      <td>\${totale.toFixed(2)}€</td>
      <td><input type="number" value="\${art.trasporto}" onchange="modificaCampo(\${index}, 'trasporto', this.value)"></td>
      <td><input type="number" value="\${art.installazione}" onchange="modificaCampo(\${index}, 'installazione', this.value)"></td>
      <td><input type="number" value="\${art.quantita}" onchange="modificaCampo(\${index}, 'quantita', this.value)"></td>
      <td>\${granTot.toFixed(2)}€</td>
      <td><button onclick="rimuoviArticolo(\${index})">Rimuovi</button></td>
    \`;
    tbody.appendChild(tr);
  });

  document.getElementById("totaleGenerale").innerHTML = \`
    <strong>Totale Netto (senza Trasporto/Installazione):</strong> \${totaleNetto.toFixed(2)}€<br>
    <strong>Totale Complessivo (inclusi Trasporto/Installazione):</strong> \${totaleComplessivo.toFixed(2)}€
  \`;
}

function modificaCampo(index, campo, valore) {
  articoliAggiunti[index][campo] = parseFloat(valore) || 0;
  aggiornaTabella();
}

function rimuoviArticolo(index) {
  articoliAggiunti.splice(index, 1);
  aggiornaTabella();
}
