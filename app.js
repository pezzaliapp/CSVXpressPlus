
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
    complete: function (results) {
      listino = results.data.map(row => ({
        codice: row.Codice,
        descrizione: row.Descrizione,
        prezzo: parseFloat(row.Prezzo.replace(",", ".")) || 0
      }));
      aggiornaListinoSelect();
    },
    error: function () {
      document.getElementById("csvError").style.display = "block";
    }
  });
}

function aggiornaListinoSelect() {
  const select = document.getElementById("listinoSelect");
  const filtro = document.getElementById("searchListino").value.toLowerCase();
  select.innerHTML = "";

  listino
    .filter(item =>
      item.codice.toLowerCase().includes(filtro) ||
      item.descrizione.toLowerCase().includes(filtro)
    )
    .forEach((item, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = `${item.codice} - ${item.descrizione} - €${item.prezzo.toFixed(2)}`;
      select.appendChild(option);
    });
}

function aggiungiArticoloDaListino() {
  const index = document.getElementById("listinoSelect").value;
  const articolo = listino[index];
  if (!articolo) return;

  const tbody = document.querySelector("#articoli-table tbody");

  const riga1 = document.createElement("tr");
  riga1.innerHTML = `
    <td>${articolo.codice}</td>
    <td>${articolo.descrizione}</td>
    <td>${articolo.prezzo.toFixed(2)}</td>
    <td><input type="number" value="0" onchange="ricalcola()"></td>
    <td><input type="number" value="0" onchange="ricalcola()"></td>
    <td class="totale">0.00</td>
    <td colspan="5"></td>
  `;

  const riga2 = document.createElement("tr");
  riga2.innerHTML = `
    <td colspan="6"></td>
    <td><input type="number" value="0" onchange="ricalcola()"></td>
    <td><input type="number" value="0" onchange="ricalcola()"></td>
    <td><input type="number" value="1" onchange="ricalcola()"></td>
    <td class="grantot">0.00</td>
    <td><button onclick="rimuoviRighe(this)">🗑️</button></td>
  `;

  tbody.appendChild(riga1);
  tbody.appendChild(riga2);
  ricalcola();
}

function rimuoviRighe(button) {
  const row = button.closest("tr");
  const prevRow = row.previousElementSibling;
  row.remove();
  if (prevRow) prevRow.remove();
  ricalcola();
}

function ricalcola() {
  const tbody = document.querySelector("#articoli-table tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  for (let i = 0; i < rows.length; i += 2) {
    const r1 = rows[i];
    const r2 = rows[i + 1];
    if (!r1 || !r2) continue;

    const prezzo = parseFloat(r1.cells[2].textContent) || 0;
    const sconto = parseFloat(r1.cells[3].querySelector("input").value) || 0;
    const margine = parseFloat(r1.cells[4].querySelector("input").value) || 0;

    const trasporto = parseFloat(r2.cells[6].querySelector("input").value) || 0;
    const installazione = parseFloat(r2.cells[7].querySelector("input").value) || 0;
    const qta = parseFloat(r2.cells[8].querySelector("input").value) || 1;

    const prezzoNetto = prezzo * (1 - sconto / 100);
    const totale = prezzoNetto;
    const grantot = (prezzoNetto + trasporto + installazione) * qta;

    r1.querySelector(".totale").textContent = totale.toFixed(2);
    r2.querySelector(".grantot").textContent = grantot.toFixed(2);
  }
}
