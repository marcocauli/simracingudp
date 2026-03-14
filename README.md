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
| Backend API | http://localhost:18888 | REST API Spring Boot |
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
# - Backend: http://localhost:18888
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

- Real-time UDP telemetry data reception (port 5606)
- Binary packet parsing for Project CARS 1 UDP protocol
- REST API for accessing telemetry data
- WebSocket support for live telemetry streaming (planned)
- Data persistence and analytics (planned)
- Web dashboard for visualization (planned)

## Implemented

### Backend (Phase 1 Complete)
- UDP Server listening on port 5606
- Packet Type enum (5 packet types: Telemetry, Race Data, Participants, Timings, Game State)
- Packet models: TelemetryPacket, RaceDataPacket, TimingsPacket, GameStatePacket
- PacketParser utility with ByteBuffer little-endian parsing
- Event publishing for telemetry data
- Packet statistics (packets received, processed, packets/sec)

### Frontend (Planned)
- Angular 17 standalone application ready
- WebSocket service implemented
- Telemetry service implemented
- Dashboard components to be implemented

## Supported Simulators

- Automobilista 2 (using Project CARS 1 UDP protocol)
- Project CARS 1
- Project CARS 2
- Any simulator supported by SimHub (see below)

---

## Architecture: Direct UDP vs SimHub Middleware

### Direct UDP (Native Protocol)

Simulators that natively support Project CARS 1 UDP protocol can send data directly to this backend:

```
┌─────────────────┐      UDP (Project CARS 1)      ┐
│   Simulatore    │ ──────────────────────────────────►│
│                 │                                   │   Backend Server
│ (es. AMS2, PC2) │                                   │   (UDP receiver)
└─────────────────┘                                   └─────────────────────┘
```

### SimHub Middleware Architecture

For simulators that use **shared memory** instead of UDP (iRacing, ACC, rFactor 2, etc.), use SimHub as middleware:

```
┌─────────────────────────────────────────────────────────────┐
│                     Macchina Simulator                       │
│  ┌─────────────────┐         ┌─────────────────────────┐   │
│  │   Simulatore    │         │        SimHub           │   │
│  │                 │◄───────►│   - Legge shared mem    │   │
│  │   (shared mem)  │         │   - Invia UDP custom    │   │
│  └─────────────────┘         └───────────┬─────────────┘   │
│                                          │                  │
└──────────────────────────────────────────┼──────────────────┘
                                           │ UDP
                                           ▼
                              ┌────────────────────────────┐
                              │      Backend Server        │
                              │   (UDP receiver simracing)│
                              └────────────────────────────┘
```

#### Why Use SimHub?

- **Universal compatibility**: Reads shared memory from 100+ simulators
- **No custom client needed**: Avoids developing a client for each simulator
- **Flexible UDP output**: Can send data in Project CARS 1 format or custom format
- **Active development**: Maintained by community

#### SimHub Configuration

1. Download SimHub from https://www.simhubdash.com/
2. Configure your simulator in SimHub (it automatically detects shared memory)
3. Enable **UDP Custom** output plugin:
   - Set destination IP to your backend server IP
   - Set destination port to `5606` (or your configured port)
   - Choose format: **Project CARS 1** (recommended - no backend changes needed)
   - Alternatively, define custom format if needed

4. Start SimHub and the backend - data will flow automatically

#### Supported Simulators via SimHub

SimHub supports shared memory reading for:
- iRacing
- Assetto Corsa Competizione
- rFactor 2
- F1 Series (EA)
- Gran Turismo 7
- And many more...

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

- `GET /v1/health` - Health check
- `GET /v1/info` - Application information
- `GET /v1/test` - Test endpoint
- `GET /v1/udp-status` - UDP server status with packets/sec metrics

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
H2 console is available at: `http://localhost:18888/api/h2-console`

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
backend/
├── src/main/java/com/simracingapps/telemetryreader/
│   ├── TelemetryReaderApplication.java
│   ├── config/
│   │   ├── TelemetryProperties.java
│   │   └── CorsConfig.java
│   ├── controller/
│   │   └── TelemetryController.java
│   ├── service/
│   │   └── UdpServerService.java
│   ├── model/packet/
│   │   ├── PacketType.java
│   │   ├── TelemetryPacket.java
│   │   ├── RaceDataPacket.java
│   │   ├── TimingsPacket.java
│   │   ├── GameStatePacket.java
│   │   └── PacketParser.java
│   └── repository/
└── src/test/
    └── java/.../model/packet/
        └── PacketParserTest.java

frontend/
├── src/app/
│   ├── services/
│   │   ├── telemetry.service.ts
│   │   ├── websocket.service.ts
│   │   ├── config.service.ts
│   │   └── notification.service.ts
│   └── models/
│       └── telemetry.models.ts
└── ...
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