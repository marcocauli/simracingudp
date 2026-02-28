# Racing Telemetry Reader

A comprehensive racing telemetry management system with Spring Boot backend and Angular frontend for receiving, processing, and visualizing real-time UDP data from racing simulators.

## Quick Start

### Prerequisites
- Docker + Docker Compose
- Java 21 (for local development)
- Node.js 20+ (for local development)

### Avvio Veloce

```bash
# Primo avvio - build + start
./reset-stack.sh start

# Sviluppo con hot reload (consigliato)
./reset-stack.sh dev

# Fast restart (dopo modifiche al codice)
./reset-stack.sh fast
```

### Servizi

| Servizio | URL | Descrizione |
|----------|-----|-------------|
| Frontend | http://localhost:4200 | Dashboard Angular |
| Backend API | http://localhost:8080 | REST API Spring Boot |
| Mock Server | UDP:5606 | Simulator UDP data |

---

## Comandi Stack

| Comando | Tempo | Uso |
|---------|-------|-----|
| `./reset-stack.sh start` | ~3-5 min | Primo avvio o dopo modifiche strutturali |
| `./reset-stack.sh dev` | ~10 sec | Sviluppo quotidiano con hot reload |
| `./reset-stack.sh fast` | ~15 sec | Restart veloce (no rebuild) |
| `./reset-stack.sh stop` | - | Ferma tutti i servizi |
| `./reset-stack.sh restart` | ~3-5 min | Rebuild completo |
| `./reset-stack.sh reset` | - | Rimuove tutto (clean slate) |
| `./reset-stack.sh logs` | - | Mostra i log |

---

## Development Workflow Consigliato

### Sviluppo Backend/Frontend
```bash
./reset-stack.sh dev
# Hot reload attivo su:
# - Backend: http://localhost:8080
# - Frontend: http://localhost:4200
```

### Test Rapidi (dopo modifiche al codice)
```bash
# Solo restart container (usa immagini già buildate)
./reset-stack.sh fast
```

### Modifiche a Dockerfile o dipendenze
```bash
# Rebuild completo
./reset-stack.sh start
# oppure
./reset-stack.sh restart
```

---

## Features

- Real-time UDP telemetry data reception
- REST API for accessing telemetry data
- WebSocket support for live telemetry streaming
- Data persistence and analytics
- Web dashboard for visualization

## Supported Simulators

- Automobilista 2 (using Project CARS 1 UDP protocol)
- Project CARS 1
- Project CARS 2

---

## Technology Stack

### Backend
- **Framework**: Spring Boot 3.2.0, Java 21
- **Web**: Spring Web + WebSocket
- **Database**: H2 (dev), PostgreSQL (prod)
- **Build**: Maven

### Frontend
- **Framework**: Angular 17 (Standalone)
- **Charts**: NGX-Charts
- **UI**: Angular Material + SCSS
- **Build**: Angular CLI

### Infrastructure
- **Container**: Docker + Docker Compose
- **Mock Server**: Node.js (simulatore dati UDP)

### API Endpoints

- `GET /api/v1/health` - Health check
- `GET /api/v1/info` - Application information
- `GET /api/v1/test` - Test endpoint

### Configuration

Default UDP settings:
- Port: 5606
- Host: 0.0.0.0
- Buffer Size: 2048 bytes

## Racing Simulator Setup

### Automobilista 2

1. Open Options > System
2. Set UDP Protocol Version to "Project Cars 1"
3. Set UDP Frequency to "5" (adjust as needed)
4. Configure UDP output to point to your machine's IP

### Database

The application uses H2 in-memory database for development.
H2 console is available at: `http://localhost:8080/api/h2-console`

- JDBC URL: `jdbc:h2:mem:telemetrydb`
- Username: `sa`
- Password: `password`

## Development

### Running Tests

```bash
mvn test
```

### Code Coverage

```bash
mvn jacoco:report
```

Coverage report will be generated in `target/site/jacoco/index.html`

## Project Structure

```
src/
├── main/
│   ├── java/com/simracingapps/telemetryreader/
│   │   ├── TelemetryReaderApplication.java
│   │   ├── config/
│   │   ├── controller/
│   │   ├── service/
│   │   ├── model/
│   │   └── repository/
│   └── resources/
│       └── application.properties
└── test/
    └── java/com/simracingapps/telemetryreader/
```

## UDP Protocol

The application implements Project CARS 1 UDP protocol with support for:

- Packet Type 0: Telemetry Data
- Packet Type 1: Race Data
- Packet Type 2: Participants Data
- Packet Type 3: Timings Data
- Packet Type 4: Game State Data

## License

This project is licensed under the MIT License.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests
5. Submit a pull request