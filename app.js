// Registrazione del Service Worker
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js')
      .then(registration => {
        console.log('Service Worker registrato con successo:', registration);
      })
      .catch(error => {
        console.error('Registrazione Service Worker fallita:', error);
      });
  });
}

// Quando il DOM è pronto
document.addEventListener('DOMContentLoaded', () => {
  // Variabili globali
  let csvData = [];              // Array dei dati CSV (ogni elemento è una riga come oggetto)
  let selectedColumns = {};      // Mapping tra campo atteso e colonna CSV selezionata
  let catalogs = {};             // Oggetto per memorizzare i listini salvati
  let currentCatalogName = null; // Nome del listino attualmente caricato

  // Carico eventuali listini salvati in LocalStorage
  if (localStorage.getItem('catalogs')) {
    catalogs = JSON.parse(localStorage.getItem('catalogs'));
  }

  // Elementi della UI
  const csvFileInput = document.getElementById('csvFileInput');
  const columnsSelectionSection = document.getElementById('columns-selection');
  const columnsOptionsDiv = document.getElementById('columns-options');
  const confirmColumnsButton = document.getElementById('confirm-columns');
  const catalogNameInput = document.getElementById('catalogName');
  const saveCatalogButton = document.getElementById('saveCatalog');
  const deleteCatalogButton = document.getElementById('deleteCatalog');
  const productDropdown = document.getElementById('productDropdown');
  const productCodeInput = document.getElementById('productCode');
  const productDescriptionInput = document.getElementById('productDescription');
  const productGrossPriceInput = document.getElementById('productGrossPrice');
  const productNetPriceInput = document.getElementById('productNetPrice');

  // 1. Parsing del CSV con PapaParse
  csvFileInput.addEventListener('change', (e) => {
    let files = e.target.files;
    if (files.length === 0) return;
    // Per semplicità, gestiamo solo il primo file
    let file = files[0];

    Papa.parse(file, {
      header: true,         // Considera la prima riga come header
      skipEmptyLines: true, // Salta le righe vuote
      complete: function (results) {
        csvData = results.data; // Array di oggetti (una riga per ogni elemento)
        // Visualizza l'interfaccia per la selezione delle colonne usando gli header
        displayColumnSelection(Object.keys(results.data[0]));
      },
      error: function (err) {
        console.error('Errore nel parsing del CSV:', err);
      }
    });
  });

  // Funzione per mostrare la sezione di selezione delle colonne
  function displayColumnSelection(headers) {
    columnsOptionsDiv.innerHTML = '';
    columnsSelectionSection.style.display = 'block';
    // Campi attesi dall'app: Codice, Descrizione, Prezzo Lordo, Prezzo Netto
    let fields = ['Codice', 'Descrizione', 'Prezzo Lordo', 'Prezzo Netto'];
    fields.forEach(field => {
      let div = document.createElement('div');
      let label = document.createElement('label');
      label.textContent = `Seleziona la colonna per ${field}: `;
      let select = document.createElement('select');
      // Opzione di default
      let defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Seleziona --';
      select.appendChild(defaultOption);
      // Aggiungo un'opzione per ogni header del CSV
      headers.forEach(header => {
        let option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        select.appendChild(option);
      });
      // Imposto un ID per recuperare il valore in seguito
      select.id = `select-${field.replace(' ', '').toLowerCase()}`;
      div.appendChild(label);
      div.appendChild(select);
      columnsOptionsDiv.appendChild(div);
    });
  }

  // 2. Conferma della selezione delle colonne
  confirmColumnsButton.addEventListener('click', () => {
    let fields = ['Codice', 'Descrizione', 'Prezzo Lordo', 'Prezzo Netto'];
    let mapping = {};
    let valid = true;
    fields.forEach(field => {
      let select = document.getElementById(`select-${field.replace(' ', '').toLowerCase()}`);
      let value = select.value;
      if (value === '') {
        alert(`Seleziona una colonna per ${field}`);
        valid = false;
      } else {
        mapping[field] = value;
      }
    });
    if (!valid) return;
    selectedColumns = mapping;
    // Nascondo la sezione di selezione delle colonne
    columnsSelectionSection.style.display = 'none';
    // Popolo il menu a tendina dei prodotti
    populateProductDropdown();
  });

  // 3. Popolazione del menu a tendina dei prodotti
  function populateProductDropdown() {
    productDropdown.innerHTML = '';
    // Opzione di default
    let defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Seleziona Prodotto --';
    productDropdown.appendChild(defaultOption);
    // Per ogni riga del CSV, creo un'opzione nel dropdown
    csvData.forEach((row, index) => {
      let option = document.createElement('option');
      // Visualizza ad esempio il valore del campo "Codice" e "Descrizione"
      option.value = index; // uso l'indice per identificare la riga
      option.textContent = `${row[selectedColumns['Codice']]} - ${row[selectedColumns['Descrizione']]}`;
      productDropdown.appendChild(option);
    });
  }

  // 4. Visualizzazione dei dettagli del prodotto selezionato
  productDropdown.addEventListener('change', () => {
    let index = productDropdown.value;
    if (index === '') {
      // Pulisco i campi se non c'è selezione
      productCodeInput.value = '';
      productDescriptionInput.value = '';
      productGrossPriceInput.value = '';
      productNetPriceInput.value = '';
      return;
    }
    let row = csvData[index];
    productCodeInput.value = row[selectedColumns['Codice']] || '';
    productDescriptionInput.value = row[selectedColumns['Descrizione']] || '';
    productGrossPriceInput.value = row[selectedColumns['Prezzo Lordo']] || '';
    productNetPriceInput.value = row[selectedColumns['Prezzo Netto']] || '';
  });

  // 5. Salvataggio del listino in LocalStorage
  saveCatalogButton.addEventListener('click', () => {
    let catalogName = catalogNameInput.value.trim();
    if (catalogName === '') {
      alert('Inserisci un nome per il listino.');
      return;
    }
    if (csvData.length === 0) {
      alert('Nessun dato CSV caricato.');
      return;
    }
    // Salvo il listino con il mapping delle colonne e i dati CSV
    catalogs[catalogName] = {
      columns: selectedColumns,
      data: csvData
    };
    localStorage.setItem('catalogs', JSON.stringify(catalogs));
    currentCatalogName = catalogName;
    alert(`Listino '${catalogName}' salvato correttamente.`);
  });

  // 6. Eliminazione di un listino salvato
  deleteCatalogButton.addEventListener('click', () => {
    let catalogName = catalogNameInput.value.trim();
    if (catalogName === '') {
      alert('Inserisci il nome del listino da eliminare.');
      return;
    }
    if (catalogs[catalogName]) {
      delete catalogs[catalogName];
      localStorage.setItem('catalogs', JSON.stringify(catalogs));
      alert(`Listino '${catalogName}' eliminato.`);
      // Se il listino eliminato era quello caricato, resetto i dati
      if (currentCatalogName === catalogName) {
        csvData = [];
        selectedColumns = {};
        productDropdown.innerHTML = '';
      }
    } else {
      alert(`Listino '${catalogName}' non trovato.`);
    }
  });

  // 7. Caricamento di un listino salvato quando l'utente inserisce il nome
  catalogNameInput.addEventListener('change', () => {
    let catalogName = catalogNameInput.value.trim();
    if (catalogs[catalogName]) {
      let catalog = catalogs[catalogName];
      selectedColumns = catalog.columns;
      csvData = catalog.data;
      populateProductDropdown();
      currentCatalogName = catalogName;
      alert(`Listino '${catalogName}' caricato.`);
    }
  });
});
