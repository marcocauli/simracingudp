# Racing Telemetry Reader

A Spring Boot application for receiving, processing, and managing UDP telemetry data from racing simulators like Automobilista 2 and Project CARS.

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

## Technology Stack

- **Backend**: Spring Boot 3.2.0, Java 21
- **Web**: Spring WebFlux (reactive)
- **Database**: H2 (dev), PostgreSQL (prod)
- **WebSocket**: Spring WebSocket
- **Build Tool**: Maven

## Quick Start

### Prerequisites

- Java 21
- Maven 3.6+
- Racing simulator with UDP output enabled

### Running the Application

1. Clone the repository
2. Navigate to project directory
3. Run the application:

```bash
mvn spring-boot:run
```

The application will start on `http://localhost:8080`

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