# Racing Telemetry Mock Server

Mock server realistico per la generazione di dati di telemetria da simulatori di corse (Automobilista 2, Project CARS 1/2) per sessioni prolungate.

## 🚀 Caratteristiche

### 🏁 Sessioni Realistiche
- **Hot Lap**: 5-15 minuti - Tentativi di giro veloce
- **Practice**: 20-30 minuti - Sessioni libere con strategia carburante
- **Qualifying**: 15-25 minuti - Qualifiche per posizione in griglia
- **Race**: 45-60 minuti - Gara completa con simulazione strategia

### ⚙️ Motore Fisico Avanzato
- **Curve e Rettilinei**: Tracciato realistico con geometria precisa
- **Gestione Pneumatici**: Degradazione, temperature e usura
- **Consumo Carburante**: Calcolo realistico basato su stile di guida
- **Affaticamento Pilota**: Declino performance in sessioni lunghe
- **Forze G**: Laterali e longitudinali realistiche

### 📊 Pacchetti UDP Supportati
- **Type 0**: Telemetry Data (60Hz) - Dati fisici auto in tempo reale
- **Type 1**: Race Data (1Hz) - Informazioni sessione e gara
- **Type 2**: Participants Data (1Hz) - Dati piloti partecipanti
- **Type 3**: Timings Data (0.5Hz) - Tempi e posizioni
- **Type 4**: Game State Data (0.2Hz) - Stato gioco

## 🛠️ Installazione e Utilizzo

### Prerequisiti
- Node.js 14+ 
- Porta UDP 5606 disponibile

### Installazione
```bash
cd mock-server
npm install
```

### Utilizzo Base
```bash
# Sessione di pratica di 30 minuti
npm start

# Sessione specifica
SESSION_TYPE=practice SESSION_DURATION=1800 npm start
```

### Configurazione Avanzata
```bash
# Sessioni di 1 ora con tutte le features
SESSION_TYPE=race \
SESSION_DURATION=3600 \
UPDATE_RATE=60 \
ENABLE_TIRE_DEGRADATION=true \
ENABLE_FUEL_CONSUMPTION=true \
AI_DRIVERS_COUNT=19 \
VERBOSITY=info \
npm start
```

## 🔧 Variabili d'Ambiente

| Variabile | Default | Descrizione |
|-----------|---------|-------------|
| `UDP_PORT` | 5606 | Porta UDP per invio pacchetti |
| `TARGET_HOST` | 127.0.0.1 | Host di destinazione |
| `SESSION_TYPE` | race | Tipo sessione: hotlap, practice, qualifying, race |
| `SESSION_DURATION` | 1800 | Durata in secondi (60-3600+) |
| `UPDATE_RATE` | 60 | Frequenza aggiornamenti Hz |
| `TRACK_COMPLEXITY` | medium | Complessità tracciato: simple, medium, high |
| `ENABLE_TIRE_DEGRADATION` | true | Abilita degradazione pneumatici |
| `ENABLE_FUEL_CONSUMPTION` | true | Abilita consumo carburante |
| `ENABLE_WEATHER_CHANGES` | false | Abilita variazioni meteo |
| `AI_DRIVERS_COUNT` | 19 | Numero di piloti AI |
| `VERBOSITY` | info | Livello log: quiet, info, debug |

## 🧪 Test e Validazione

### Test Client
```bash
# Avvia client di test su porta 5606
npm run test

# Test su porta differente
npm run test 5607
```

### Esempio di Sessione Completa
```bash
# Sessione di gara realistica di 1 ora
SESSION_TYPE=race \
SESSION_DURATION=3600 \
UPDATE_RATE=60 \
ENABLE_TIRE_DEGRADATION=true \
ENABLE_FUEL_CONSUMPTION=true \
VERBOSITY=info \
npm start
```

Output atteso:
```
🏁 Racing Telemetry Mock Server
================================
Session Type: race
Duration: 3600s (60 minutes)
Update Rate: 60 Hz
Target: 127.0.0.1:5606
================================

🚀 Starting Racing Telemetry Mock Server...
📡 Sending UDP packets to 127.0.0.1:5606
🎯 Session Type: race
✅ Mock server started successfully

⏱️  150s | 4.2% | Lap 1 | Speed: 245.3 km/h | RPM: 6500 | Fuel: 98.2%
```

## 📦 Struttura Pacchetti

### Pacchetto Base (12 bytes)
```javascript
{
    mPacketNumber: 0,              // Progressivo pacchetti totali
    mCategoryPacketNumber: 0,      // Progressivo per tipo
    mPartialPacketIndex: 0,        // Indice pacchetto parziale
    mPartialPacketNumber: 1,       // Numero pacchetti parziali
    mPacketType: 0,               // Tipo pacchetto (0-4)
    mPacketVersion: 1              // Versione protocollo
}
```

### Dati Telemetria Principali
- **Speed**: Velocità attuale veicolo (km/h)
- **RPM**: Regime motore con curve realistiche
- **Gear**: Marcia inserita basata su velocità/RPM
- **Throttle/Brake**: Input pilota basato su tracciato
- **Steering**: Angolo sterzata per curve
- **Fuel Level**: Livello carburante con consumo
- **Tire Wear**: Usura pneumatici perlocalizzazione
- **Tire Temperatures**: Temperature con gestione termica
- **G-Forces**: Accelerazioni laterali/longitudinali

## 🔄 Integrazione con Spring Boot

Il mock server è progettato per funzionare con il server UDP Spring Boot:

1. **Avvia il server Spring Boot**:
   ```bash
   cd .. && mvn spring-boot:run
   ```

2. **Avvia il mock server**:
   ```bash
   cd mock-server && npm start
   ```

3. **Verifica ricezione dati**:
   ```bash
    curl http://localhost:18888/v1/udp-status
   ```

## 🐳 Docker Support

```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
EXPOSE 5606/udp
CMD ["npm", "start"]
```

Build e run:
```bash
docker build -t racing-telemetry-mock .
docker run -p 5606:5606/udp racing-telemetry-mock
```

## 📊 Monitoraggio Sessione

Il server fornisce aggiornamenti in tempo reale:
- Progresso sessione (tempo e percentuale)
- Numero giro attuale
- Velocità e RPM istantanei
- Livello carburante
- Statistiche pacchetti inviati

## 🏁 Validazione

Il test client valida:
- Integrità struttura pacchetti
- Sequenza numerazione corretta
- Frequenza ricezione pacchetti
- Tipologie dati ricevuti

## 🤝 Contributi

Il framework è modulare ed estensibile per:
- Nuovi tipi di sessione
- Algoritmi fisici avanzati
- Condizioni meteo dinamiche
- Strategie gara complesse

---

**Compatibilità**: Automobilista 2, Project CARS 1/2  
**Protocollo**: Project CARS UDP (porta 5606)  
**Durata Supportata**: 1 minuto - 1+ ora  
**Frequenza**: Fino a 60Hz per telemetria