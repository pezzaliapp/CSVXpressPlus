
let listino = [];
let articoliAggiunti = [];

document.getElementById("csvFileInput").addEventListener("change", handleCSVUpload);
document.getElementById("searchInput").addEventListener("input", aggiornaListinoSelect);

function handleCSVUpload(event) {
  const file = event.target.files[0];
  const reader = new FileReader();
  reader.onload = function (e) {
    const rows = e.target.result.split('\n').filter(r => r.trim() !== "");
    listino = rows.map(r => {
      const [codice, descrizione, prezzo] = r.split(';');
      return { codice, descrizione, prezzo: parseFloat(prezzo) };
    });
    aggiornaListinoSelect();
  };
  reader.readAsText(file);
}

function aggiornaListinoSelect() {
  const select = document.getElementById("listinoSelect");
  const searchTerm = document.getElementById("searchInput").value.toLowerCase();
  select.innerHTML = "";
  listino.filter(item =>
    item.codice.toLowerCase().includes(searchTerm) ||
    item.descrizione.toLowerCase().includes(searchTerm)
  ).forEach(item => {
    const option = document.createElement("option");
    option.value = item.codice;
    option.textContent = `${item.codice} - ${item.descrizione} - €${item.prezzo}`;
    select.appendChild(option);
  });
}

function aggiungiArticolo() {
  const codice = document.getElementById("listinoSelect").value;
  const articolo = listino.find(a => a.codice === codice);
  if (!articolo) return;

  const tbody = document.getElementById("articoli-body");
  const row = document.createElement("tr");

  row.innerHTML = `
    <td>${articolo.codice}</td>
    <td>${articolo.descrizione}</td>
    <td>${articolo.prezzo}€</td>
    <td><input type="number" value="0" onchange="aggiornaTotali()" /></td>
    <td><input type="number" value="0" onchange="aggiornaTotali()" /></td>
    <td class="totale">0.00€</td>
    <td><input type="number" value="0" onchange="aggiornaTotali()" /></td>
    <td><input type="number" value="0" onchange="aggiornaTotali()" /></td>
    <td><input type="number" value="1" onchange="aggiornaTotali()" /></td>
    <td class="granTot">0.00€</td>
    <td><button onclick="this.parentElement.parentElement.remove(); aggiornaTotali()">Rimuovi</button></td>
  `;

  tbody.appendChild(row);
  aggiornaTotali();
}

function aggiornaTotali() {
  const rows = document.querySelectorAll("#articoli-body tr");
  let netto = 0;
  let totale = 0;

  rows.forEach(row => {
    const prezzo = parseFloat(row.cells[2].textContent.replace("€", ""));
    const sconto = parseFloat(row.cells[3].querySelector("input").value) || 0;
    const margine = parseFloat(row.cells[4].querySelector("input").value) || 0;
    const trasporto = parseFloat(row.cells[6].querySelector("input").value) || 0;
    const installazione = parseFloat(row.cells[7].querySelector("input").value) || 0;
    const quantita = parseFloat(row.cells[8].querySelector("input").value) || 1;

    const nettoRiga = (prezzo * (1 - sconto / 100)) * quantita;
    const granTot = nettoRiga + trasporto + installazione;

    row.cells[5].textContent = nettoRiga.toFixed(2) + "€";
    row.cells[9].textContent = granTot.toFixed(2) + "€";

    netto += nettoRiga;
    totale += granTot;
  });

  document.getElementById("totaleNetto").textContent = netto.toFixed(2) + "€";
  document.getElementById("totaleComplessivo").textContent = totale.toFixed(2) + "€";
}
