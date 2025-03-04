// =====================================================
// Variabile globale per i dati del listino CSV
// =====================================================
let listino = [];

// =====================================================
// Event Listener per l'inizializzazione della pagina
// =====================================================
document.addEventListener("DOMContentLoaded", function () {
  // Se hai altre funzioni (es. per i preventivi) puoi chiamarle qui:
  // caricaPreventiviSalvati();
  // aggiornaTotaleGenerale();
  initCSVImport();
});

// =====================================================
// 1) FUNZIONI DI PARSING/FORMATTAZIONE ALL'ITALIANA
// =====================================================

/** 
 * parseNumberITA(str)
 * Interpreta "4.000,50" come 4000.50
 */
function parseNumberITA(str) {
  if (!str) return 0;
  let pulito = str.replace(/[^\d.,-]/g, ""); // Elimina simboli non numerici
  pulito = pulito.replace(/\./g, "");         // Rimuove i punti
  pulito = pulito.replace(",", ".");          // Virgola -> Punto
  let val = parseFloat(pulito);
  return isNaN(val) ? 0 : val;
}

/**
 * formatNumberITA(num)
 * Restituisce un numero in stile it-IT, es. 4000.5 => "4.000,50"
 */
function formatNumberITA(num) {
  if (isNaN(num)) num = 0;
  return new Intl.NumberFormat("it-IT", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
}

// =====================================================
// 2) INIZIALIZZAZIONE IMPORT CSV
// =====================================================
function initCSVImport() {
  const fileInput = document.getElementById("csvFileInput");
  if (!fileInput) {
    console.error("Elemento 'csvFileInput' non trovato.");
    return;
  }

  fileInput.addEventListener("change", function(e) {
    const file = e.target.files[0];
    console.log("File selezionato:", file);
    if (!file) return;

    Papa.parse(file, {
      // Se il CSV utilizza il punto e virgola come delimitatore, decommenta la seguente riga:
      // delimiter: ';',
      // Se il CSV è separato da tab, decommenta la seguente riga:
      // delimiter: "\t",
      header: false,         // Gestiamo manualmente l'header
      skipEmptyLines: true,
      complete: function(results) {
        console.log("Risultati PapaParse:", results.data);
        if (!results.data || results.data.length === 0) {
          console.error("Nessun dato trovato nel CSV.");
          return;
        }
        // Mappiamo i dati: saltiamo la prima riga (header) e leggiamo le prime 5 colonne
        listino = results.data.map((row, idx) => {
          if (idx === 0) return null; // Salta la riga di header
          return {
            codice: (row[0] || "").trim(),
            descrizione: (row[1] || "").trim(),
            prezzoLordo: (row[2] || "").trim(),
            costoInstallazione: (row[3] || "").trim(),
            costoTrasporto: (row[4] || "").trim()
          };
        }).filter(Boolean);
        console.log("CSV importato, elementi:", listino.length);
        aggiornaListinoSelect();
      },
      error: function(err) {
        console.error("Errore nel parsing del CSV:", err);
      }
    });
  });

  // Aggiorna la select in tempo reale quando l'utente digita nel campo di ricerca
  const searchInput = document.getElementById("searchListino");
  if (searchInput) {
    searchInput.addEventListener("input", function() {
      aggiornaListinoSelect();
    });
  }
}

// =====================================================
// Aggiorna il menù a tendina filtrato
// =====================================================
function aggiornaListinoSelect() {
  const select = document.getElementById("listinoSelect");
  const searchTerm = document.getElementById("searchListino").value.toLowerCase();
  if (!select) return;
  select.innerHTML = "";

  // Filtra gli articoli in base a codice o descrizione
  const filtered = listino.filter(item => {
    const codice = item.codice.toLowerCase();
    const desc = item.descrizione.toLowerCase();
    return codice.includes(searchTerm) || desc.includes(searchTerm);
  });

  // Popola la select con le opzioni filtrate
  filtered.forEach((item, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = `${item.codice} - ${item.descrizione} - €${item.prezzoLordo}`;
    select.appendChild(option);
  });
}

// =====================================================
// Al click su "Aggiungi Articolo Selezionato"
// =====================================================
function aggiungiArticoloDaListino() {
  const select = document.getElementById("listinoSelect");
  if (!select || !select.value) return;

  // Filtra di nuovo in base al termine di ricerca
  const searchTerm = document.getElementById("searchListino").value.toLowerCase();
  const filtered = listino.filter(item => {
    const codice = item.codice.toLowerCase();
    const desc = item.descrizione.toLowerCase();
    return codice.includes(searchTerm) || desc.includes(searchTerm);
  });

  const item = filtered[parseInt(select.value)];
  if (!item) return;

  // Crea l'oggetto articolo
  const datiArticolo = {
    codice: item.codice,
    descrizione: item.descrizione,
    prezzoLordo: item.prezzoLordo,
    sconto: "",
    prezzoNetto: "",
    quantita: "1",
    prezzoTotale: ""
  };

  aggiungiArticoloConDati(datiArticolo);
}

// =====================================================
// 3) GESTIONE ARTICOLI
// =====================================================
function aggiungiArticolo() {
  const container = document.getElementById("articoli-container");
  if (!container) return;
  const idUnico = Date.now();
  const div = document.createElement("div");
  div.classList.add("articolo");
  div.innerHTML = `
    <details id="articolo-${idUnico}" open>
      <summary>Nuovo Articolo</summary>
      <label>Codice: 
        <input type="text" class="codice" oninput="aggiornaTitolo(this, ${idUnico})">
      </label>
      <label>Descrizione: 
        <input type="text" class="descrizione">
      </label>
      <label>Prezzo Lordo (€): 
        <input type="text" class="prezzoLordo" oninput="calcolaPrezzo(this)">
      </label>
      <label>Sconto (%): 
        <input type="number" class="sconto" step="0.01" oninput="calcolaPrezzo(this)">
      </label>
      <label>Prezzo Netto (€):
        <input type="text" class="prezzoNetto" oninput="calcolaPrezzo(this)">
      </label>
      <label>Quantità:
        <input type="text" class="quantita" value="1" oninput="calcolaPrezzo(this)">
      </label>
      <label>Prezzo Totale (€):
        <input type="text" class="prezzoTotale" readonly>
      </label>
      <button onclick="salvaArticolo(${idUnico})">Salva</button>
      <button onclick="rimuoviArticolo(this)">Rimuovi</button>
    </details>
  `;
  container.appendChild(div);
}

function aggiungiArticoloConDati(dati) {
  const container = document.getElementById("articoli-container");
  if (!container) return;
  const idUnico = Date.now() + Math.floor(Math.random() * 1000);
  const div = document.createElement("div");
  div.classList.add("articolo");
  div.innerHTML = `
    <details id="articolo-${idUnico}" open>
      <summary>${dati.codice || "Nuovo Articolo"}</summary>
      <label>Codice:
        <input type="text" class="codice" 
          value="${dati.codice || ""}" 
          oninput="aggiornaTitolo(this, ${idUnico})">
      </label>
      <label>Descrizione:
        <input type="text" class="descrizione" 
          value="${dati.descrizione || ""}">
      </label>
      <label>Prezzo Lordo (€):
        <input type="text" class="prezzoLordo" 
          value="${dati.prezzoLordo || ""}" 
          oninput="calcolaPrezzo(this)">
      </label>
      <label>Sconto (%):
        <input type="number" class="sconto" step="0.01"
          value="${dati.sconto || ""}" 
          oninput="calcolaPrezzo(this)">
      </label>
      <label>Prezzo Netto (€):
        <input type="text" class="prezzoNetto" 
          value="${dati.prezzoNetto || ""}" 
          oninput="calcolaPrezzo(this)">
      </label>
      <label>Quantità:
        <input type="text" class="quantita" value="${dati.quantita || 1}"
          oninput="calcolaPrezzo(this)">
      </label>
      <label>Prezzo Totale (€):
        <input type="text" class="prezzoTotale"
          value="${dati.prezzoTotale || ""}" 
          readonly>
      </label>
      <button onclick="salvaArticolo(${idUnico})">Salva</button>
      <button onclick="rimuoviArticolo(this)">Rimuovi</button>
    </details>
  `;
  container.appendChild(div);
}

function aggiornaTitolo(input, id) {
  const summary = document.querySelector(`#articolo-${id} summary`);
  if (!summary) return;
  summary.textContent = input.value || "Nuovo Articolo";
}

function salvaArticolo(id) {
  const details = document.getElementById(`articolo-${id}`);
  if (details) details.open = false;
}

function rimuoviArticolo(btn) {
  btn.parentElement.parentElement.remove();
  aggiornaTotaleGenerale();
}

// =====================================================
// 4) CALCOLO PREZZI ARTICOLO
// =====================================================
function calcolaPrezzo(input) {
  const row = input.closest(".articolo");
  if (!row) return;

  let prezzoLordo = parseNumberITA(row.querySelector(".prezzoLordo").value);
  let sconto      = parseFloat(row.querySelector(".sconto").value) || 0;
  let quantita    = parseNumberITA(row.querySelector(".quantita").value);

  const prezzoNettoEl = row.querySelector(".prezzoNetto");
  let prezzoNetto     = parseNumberITA(prezzoNettoEl.value);

  if (input.classList.contains("prezzoLordo") || input.classList.contains("sconto")) {
    prezzoNetto = prezzoLordo * (1 - sconto / 100);
    prezzoNettoEl.value = formatNumberITA(prezzoNetto);
  }
  const manualNetto = parseNumberITA(prezzoNettoEl.value) || 0;
  let prezzoTotale = manualNetto * quantita;
  row.querySelector(".prezzoTotale").value = formatNumberITA(prezzoTotale);

  aggiornaTotaleGenerale();
}

// =====================================================
// 5) CALCOLO TOTALI (Articoli, Margine, Trasporto, etc.)
// =====================================================
function aggiornaTotaleGenerale() {
  let totaleGenerale = 0;
  document.querySelectorAll(".prezzoTotale").forEach(input => {
    totaleGenerale += parseNumberITA(input.value);
  });
  document.getElementById("totaleArticoli").textContent =
    `Totale Articoli: ${formatNumberITA(totaleGenerale)}€`;
  calcolaMarginalita();
}

function calcolaMarginalita() {
  const testoTotale = document.getElementById("totaleArticoli").textContent;
  let match = testoTotale.match(/([\d.,]+)/);
  let totaleArticoli = 0;
  if (match) {
    totaleArticoli = parseNumberITA(match[1]);
  }
  const margine = parseFloat(document.getElementById("margine").value) || 0;
  let nuovoTotale = totaleArticoli;
  if (margine > 0) {
    nuovoTotale = totaleArticoli / (1 - margine / 100);
  }
  document.getElementById("totaleMarginalita").textContent =
    `Nuovo Totale Articoli: ${formatNumberITA(nuovoTotale)}€`;
  calcolaTotaleFinale();
}

function calcolaTotaleFinale() {
  const trasportoVal     = document.getElementById("costoTrasporto").value;
  const installazioneVal = document.getElementById("costoInstallazione").value;
  let trasportoNum      = parseNumberITA(trasportoVal);
  let installazioneNum  = parseNumberITA(installazioneVal);

  const testoMarginalita = document.getElementById("totaleMarginalita").textContent;
  let match = testoMarginalita.match(/([\d.,]+)/);
  let nuovoTotale = 0;
  if (match) {
    nuovoTotale = parseNumberITA(match[1]);
  }

  let finale = nuovoTotale + trasportoNum + installazioneNum;
  document.getElementById("totaleFinale").textContent =
    `Totale Finale: ${formatNumberITA(finale)}€`;
}
