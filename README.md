# CSVXpressPlus 🚀

Semplice e Immediato per chi usa Listini ogni giorno

CSVXpressPlus è una **PWA (Progressive Web App)** sviluppata per gestire e filtrare **listini CSV**, selezionare articoli, calcolare prezzi con **doppio sconto**, margine, trasporto e installazione, e generare preventivi in modo semplice ed efficiente.

---

## 📌 **Funzionalità Principali**

- 📂 **Caricamento file CSV** per importare listini di prodotti.
- 🔍 **Filtro e ricerca** per selezionare velocemente un articolo dal listino.
- ➕ **Aggiunta di articoli alla tabella** con dettagli personalizzabili.
- 📉 **Doppio sconto in cascata**: applicazione di due sconti successivi.
- 📊 **Calcolo automatico di prezzi** con gestione di sconto 1, sconto 2, margine, trasporto e installazione.
- 🧮 **Gestione venduto a € e calcolo differenza sconto** (utile per provvigioni o valutazione utile netto).
- ⚙️ **Popolamento automatico di Trasporto e Installazione** (opzionale).
- 📄 **Dettagli Trasporto/Installazione inclusi nei report** (opzionale).
- 📱 **PWA installabile** su PC e smartphone per un utilizzo rapido ovunque.
- 📤 **Generazione report** e invio tramite WhatsApp o salvataggio in TXT.

---

## 💡 **Cos'è il Margine (%)**

Il campo "Margine %" rappresenta una **maggiorazione applicata al prezzo netto scontato** (dopo Sconto 1 e Sconto 2), ed è utile per:

- Calcolare un **prezzo finale con margine di profitto**
- Simulare una **provvigione** da applicare al prezzo netto
- Stimare **costi interni aggiuntivi** in fase di preventivazione

Può essere interpretato anche come **compenso commerciale o provvigionale**.

---

## 💰 **Calcolo della Differenza Sconto (Venduto A €)**

CSVXpressPlus calcola anche la **differenza tra il prezzo venduto** (inserito manualmente) e il prezzo calcolato internamente (con sconti, margine, trasporto, installazione). Questo ti permette di:

- Valutare il **margine residuo** effettivo
- Usarlo come **calcolo di provvigione** a differenza rispetto al venduto
- Simulare la **redditività di un’offerta commerciale**

---

## 🧮 **Esempi di Calcolo**

### 🎯 Esempio 1 – Calcolo del prezzo netto e totale

**Dati articolo:**
- Prezzo Lordo: 1.000 €
- Sconto 1: 10%
- Sconto 2: 5%
- Margine: 15%
- Trasporto: 30 €
- Installazione: 20 €
- Quantità: 2

**Passaggi di calcolo:**
1. Applicazione sconti in cascata:  
   `1.000 × (1 - 0,10) × (1 - 0,05) = 855,00 €`
2. Applicazione margine:  
   `855 ÷ (1 - 0,15) = 1.005,88 €`
3. Somma servizi:  
   `1.005,88 + 30 + 20 = 1.055,88 €`
4. Totale finale (×2 pezzi):  
   `1.055,88 × 2 = 2.111,76 €`

### 💼 Esempio 2 – Provvigione positiva da differenza sconto

**Prezzo Venduto:** 2.400 €  
**Totale calcolato dalla app:** 2.111,76 €

**Differenza:**  
`2.400 - 2.111,76 = +288,24 €` → interpretabile come **provvigione o utile netto positivo**

### 💼 Esempio 3 – Provvigione negativa (venduto inferiore al calcolato)

**Prezzo Venduto:** 1.900 €  
**Totale calcolato dalla app:** 2.111,76 €

**Differenza:**  
`1.900 - 2.111,76 = -211,76 €` → **offerta in perdita o da rinegoziare**

---

## 📥 **Installazione**

### **1️⃣ Clona il repository**

```sh
git clone https://github.com/pezzaliapp/CSVXpressPlus.git
cd CSVXpressPlus
```

### **2️⃣ Apri `index.html` nel browser**

L'app funziona direttamente nel browser. Nessuna installazione aggiuntiva necessaria.

---

## ✅ **Requisiti CSV**

Assicurati che il file CSV contenga almeno queste colonne:

- `Codice`
- `Descrizione`
- `PrezzoLordo`
- `CostoTrasporto`
- `CostoInstallazione`

I valori numerici possono usare virgola o punto decimale. Gli sconti vengono gestiti direttamente dall’interfaccia.

---

## 📬 **Contatti**

Progetto open source by [Alessandro Pezzali](https://www.pezzaliapp.com)  
Condiviso su GitHub per migliorare la vita a chi lavora ogni giorno con listini e preventivi.

---

## 📄 **Licenza MIT**

Questo progetto è rilasciato sotto licenza [MIT](https://opensource.org/licenses/MIT).  

**Cosa puoi fare:**
- ✅ Usarlo liberamente per fini personali o commerciali
- ✅ Modificarlo secondo le tue esigenze
- ✅ Redistribuirlo con o senza modifiche

**Cosa è richiesto:**
- 📝 Includere sempre una copia della licenza MIT originale nei tuoi progetti derivati
- 💬 Dare credito all'autore originale (Alessandro Pezzali) nelle distribuzioni

**Cosa non è permesso:**
- ❌ Utilizzarlo per scopi ingannevoli, fraudolenti o lesivi di altri

Utilizzando questo software accetti i termini della licenza. Se crei una versione modificata, contribuisci con un *fork* o una *pull request* per supportare la community.
