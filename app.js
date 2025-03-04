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

document.addEventListener('DOMContentLoaded', () => {
  // Variabili globali
  let csvData = [];              // Dati CSV: ogni elemento rappresenta una riga (oggetto)
  let selectedColumns = {};      // Mappatura tra campi attesi e colonne CSV
  let catalogs = {};             // Oggetto per i listini salvati
  let currentCatalogName = null; // Nome del listino attualmente caricato

  // Carico i listini salvati da LocalStorage (se presenti)
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

  // 1. Parsing del CSV tramite PapaParse
  csvFileInput.addEventListener('change', (e) => {
    const files = e.target.files;
    if (files.length === 0) {
      console.log('Nessun file selezionato');
      return;
    }
    const file = files[0];
    console.log('File selezionato:', file.name);

    Papa.parse(file, {
      header: true,         // La prima riga contiene gli header
      skipEmptyLines: true, // Salta le righe vuote
      complete: function (results) {
        // Aggiungiamo controlli extra per CSV vuoti o non validi
        if (!results || !results.data || results.data.length === 0) {
          alert('Nessun dato CSV caricato o CSV non valido.');
          console.log('PapaParse results:', results);
          return;
        }
        if (!results.data[0]) {
          alert('Il CSV non contiene righe valide o intestazioni corrette.');
          console.log('PapaParse results:', results);
          return;
        }

        csvData = results.data;
        console.log('CSV caricato con successo. Numero di righe:', csvData.length);
        
        // Mostra la sezione per la selezione delle colonne
        displayColumnSelection(Object.keys(results.data[0]));
      },
      error: function (err) {
        console.error('Errore nel parsing del CSV:', err);
        alert('Errore nel parsing del CSV. Controlla la console per maggiori dettagli.');
      }
    });
  });

  // Funzione per visualizzare l'interfaccia di selezione delle colonne
  function displayColumnSelection(headers) {
    console.log('Intestazioni rilevate:', headers);
    columnsOptionsDiv.innerHTML = '';
    columnsSelectionSection.style.display = 'block';
    // Campi attesi: Codice, Descrizione, Prezzo Lordo, Prezzo Netto
    const fields = ['Codice', 'Descrizione', 'Prezzo Lordo', 'Prezzo Netto'];
    fields.forEach(field => {
      const div = document.createElement('div');
      const label = document.createElement('label');
      label.textContent = `Seleziona la colonna per ${field}: `;
      const select = document.createElement('select');
      
      // Opzione di default
      const defaultOption = document.createElement('option');
      defaultOption.value = '';
      defaultOption.textContent = '-- Seleziona --';
      select.appendChild(defaultOption);
      
      // Aggiungo un'opzione per ogni header presente nel CSV
      headers.forEach(header => {
        const option = document.createElement('option');
        option.value = header;
        option.textContent = header;
        select.appendChild(option);
      });

      // Assegno un ID per recuperare il valore in seguito
      select.id = `select-${field.replace(' ', '').toLowerCase()}`;
      div.appendChild(label);
      div.appendChild(select);
      columnsOptionsDiv.appendChild(div);
    });
  }

  // 2. Conferma della selezione delle colonne
  confirmColumnsButton.addEventListener('click', () => {
    const fields = ['Codice', 'Descrizione', 'Prezzo Lordo', 'Prezzo Netto'];
    let mapping = {};
    let valid = true;

    fields.forEach(field => {
      const select = document.getElementById(`select-${field.replace(' ', '').toLowerCase()}`);
      const value = select.value;
      if (value === '') {
        alert(`Seleziona una colonna per ${field}`);
        valid = false;
      } else {
        mapping[field] = value;
      }
    });

    if (!valid) {
      console.log('Selezione delle colonne non valida:', mapping);
      return;
    }

    selectedColumns = mapping;
    console.log('Mappatura colonne confermata:', selectedColumns);

    // Nascondo la sezione di selezione delle colonne
    columnsSelectionSection.style.display = 'none';
    // Popolo il menu a tendina dei prodotti
    populateProductDropdown();
  });

  // 3. Popolazione del menu a tendina dei prodotti
  function populateProductDropdown() {
    productDropdown.innerHTML = '';
    // Opzione di default
    const defaultOption = document.createElement('option');
    defaultOption.value = '';
    defaultOption.textContent = '-- Seleziona Prodotto --';
    productDropdown.appendChild(defaultOption);

    // Per ogni riga del CSV, creo un'opzione nel dropdown
    csvData.forEach((row, index) => {
      const option = document.createElement('option');
      option.value = index; // Utilizzo l'indice per identificare la riga
      // Uso "Codice - Descrizione" come testo dell'opzione
      option.textContent = `${row[selectedColumns['Codice']]} - ${row[selectedColumns['Descrizione']]}`;
      productDropdown.appendChild(option);
    });
    console.log('Menu a tendina popolato con', csvData.length, 'elementi.');
  }

  // 4. Visualizzazione dei dettagli del prodotto selezionato
  productDropdown.addEventListener('change', () => {
    const index = productDropdown.value;
    if (index === '') {
      // Se non è selezionato nessun prodotto, pulisco i campi
      productCodeInput.value = '';
      productDescriptionInput.value = '';
      productGrossPriceInput.value = '';
      productNetPriceInput.value = '';
      return;
    }
    const row = csvData[index];
    productCodeInput.value = row[selectedColumns['Codice']] || '';
    productDescriptionInput.value = row[selectedColumns['Descrizione']] || '';
    productGrossPriceInput.value = row[selectedColumns['Prezzo Lordo']] || '';
    productNetPriceInput.value = row[selectedColumns['Prezzo Netto']] || '';
  });

  // 5. Salvataggio del listino in LocalStorage
  saveCatalogButton.addEventListener('click', () => {
    const catalogName = catalogNameInput.value.trim();
    if (catalogName === '') {
      alert('Inserisci un nome per il listino.');
      return;
    }
    if (csvData.length === 0) {
      alert('Nessun dato CSV caricato.');
      return;
    }
    // Salvo il listino con i dati CSV e il mapping delle colonne
    catalogs[catalogName] = {
      columns: selectedColumns,
      data: csvData
    };
    localStorage.setItem('catalogs', JSON.stringify(catalogs));
    currentCatalogName = catalogName;
    alert(`Listino '${catalogName}' salvato correttamente.`);
    console.log('Listino salvato:', catalogs[catalogName]);
  });

  // 6. Eliminazione di un listino salvato
  deleteCatalogButton.addEventListener('click', () => {
    const catalogName = catalogNameInput.value.trim();
    if (catalogName === '') {
      alert('Inserisci il nome del listino da eliminare.');
      return;
    }
    if (catalogs[catalogName]) {
      delete catalogs[catalogName];
      localStorage.setItem('catalogs', JSON.stringify(catalogs));
      alert(`Listino '${catalogName}' eliminato.`);
      console.log(`Listino '${catalogName}' eliminato con successo.`);
      // Se il listino eliminato era quello attivo, resetto i dati
      if (currentCatalogName === catalogName) {
        csvData = [];
        selectedColumns = {};
        productDropdown.innerHTML = '';
      }
    } else {
      alert(`Listino '${catalogName}' non trovato.`);
    }
  });

  // 7. Caricamento di un listino salvato inserendo il nome nel campo
  catalogNameInput.addEventListener('change', () => {
    const catalogName = catalogNameInput.value.trim();
    if (catalogs[catalogName]) {
      const catalog = catalogs[catalogName];
      selectedColumns = catalog.columns;
      csvData = catalog.data;
      populateProductDropdown();
      currentCatalogName = catalogName;
      alert(`Listino '${catalogName}' caricato.`);
      console.log(`Listino '${catalogName}' caricato:`, catalog);
    }
  });
});
