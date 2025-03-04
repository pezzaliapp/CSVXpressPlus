// app.js
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('service-worker.js')
    .then(reg => console.log("Service Worker registrato", reg))
    .catch(err => console.error("Service Worker non registrato", err));
}

let listino = [];

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
        prezzoLordo: row["PrezzoLordo"]?.trim() || "0"
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
  listino.filter(item => item.codice.toLowerCase().includes(searchTerm) ||
                         item.descrizione.toLowerCase().includes(searchTerm))
         .forEach((item, index) => {
           const option = document.createElement("option");
           option.value = index;
           option.textContent = `${item.codice} - ${item.descrizione} - €${item.prezzoLordo}`;
           select.appendChild(option);
         });
}

function aggiungiArticoloDaListino() {
  const select = document.getElementById("listinoSelect");
  if (!select.value) return;
  const articolo = listino[parseInt(select.value)];
  console.log("Articolo selezionato:", articolo);
}
