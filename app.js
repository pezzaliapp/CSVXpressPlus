
let articoli = [
  { codice: "00100208", descrizione: "PUMA CE 1ph 230V 50-60Hz", prezzo: 17000 },
  { codice: "00100302", descrizione: "F 524S CE 3ph 400V", prezzo: 3880 }
];

function aggiornaSelect() {
  const select = document.getElementById("articolo-select");
  select.innerHTML = "";
  articoli.forEach((art, idx) => {
    const opt = document.createElement("option");
    opt.value = idx;
    opt.textContent = `${art.codice} - ${art.descrizione} - €${art.prezzo}`;
    select.appendChild(opt);
  });
}

function aggiungiArticolo() {
  const idx = document.getElementById("articolo-select").value;
  const art = articoli[idx];

  const tbody = document.getElementById("articoli-body");

  const riga1 = document.createElement("tr");
  riga1.innerHTML = `
    <td>${art.codice}</td>
    <td>${art.descrizione}</td>
    <td>${art.prezzo}€</td>
    <td><input type="number" value="0" onchange="ricalcola(this)"/></td>
    <td><input type="number" value="0" onchange="ricalcola(this)"/></td>
    <td class="totale">0.00€</td>
  `;

  const riga2 = document.createElement("tr");
  riga2.innerHTML = `
    <td colspan="2"></td>
    <td colspan="1"><input type="number" value="0" placeholder="Trasporto" onchange="ricalcola(this)"/></td>
    <td colspan="1"><input type="number" value="0" placeholder="Installazione" onchange="ricalcola(this)"/></td>
    <td colspan="1"><input type="number" value="1" placeholder="Q.tà" onchange="ricalcola(this)"/></td>
    <td class="granTot">0.00€</td>
  `;

  tbody.appendChild(riga1);
  tbody.appendChild(riga2);
  ricalcola();
}

function ricalcola() {
  let totaleNetto = 0;
  let totaleComplessivo = 0;

  const tbody = document.getElementById("articoli-body");
  const rows = tbody.querySelectorAll("tr");

  for (let i = 0; i < rows.length; i += 2) {
    const r1 = rows[i];
    const r2 = rows[i+1];

    const prezzo = parseFloat(r1.cells[2].textContent.replace("€","")) || 0;
    const sconto = parseFloat(r1.cells[3].querySelector("input").value) || 0;
    const margine = parseFloat(r1.cells[4].querySelector("input").value) || 0;

    const netto = prezzo * (1 - sconto / 100);
    r1.cells[5].textContent = netto.toFixed(2) + "€";

    const trasporto = parseFloat(r2.cells[2].querySelector("input").value) || 0;
    const installazione = parseFloat(r2.cells[3].querySelector("input").value) || 0;
    const qty = parseFloat(r2.cells[4].querySelector("input").value) || 1;

    const granTot = (netto + trasporto + installazione) * qty;
    r2.cells[5].textContent = granTot.toFixed(2) + "€";

    totaleNetto += netto * qty;
    totaleComplessivo += granTot;
  }

  document.getElementById("totaleNetto").textContent = totaleNetto.toFixed(2) + "€";
  document.getElementById("totaleComplessivo").textContent = totaleComplessivo.toFixed(2) + "€";
}

document.addEventListener("DOMContentLoaded", aggiornaSelect);
