# Racing Telemetry Reader - Agent Guidelines

## Direttive AI
Dopo ogni esecuzione devo aggiornare tutti i file README.md che sono presenti nel progetto
Dopo ogni esecuzione devo aggiornare il file "_plan.md" per marcare i progressi eseguiti e nuovi task eseguiti

## Build/Test Commands
```bash
# Build project
mvn clean compile

# Run all tests
mvn test

# Run single test class
mvn test -Dtest=TelemetryReaderApplicationTests

# Run single test method
mvn test -Dtest=TelemetryControllerTests#healthCheck

# Run with coverage
mvn test jacoco:report

# Run application
mvn spring-boot:run

# Package
mvn clean package
```

## Code Style Guidelines

### Java Conventions
- **Java Version**: 21+ (compatible with Java 25)
- **Framework**: Spring Boot 3.2.0, use Spring annotations (@RestController, @Service, @Repository, @Component)
- **Packages**: `com.simracingapps.telemetryreader.*` (lowercase, dot-separated)
- **Classes**: PascalCase (e.g., `TelemetryController`, `UdpPacketParser`)
- **Methods**: camelCase (e.g., `parseTelemetryData()`, `handleUdpPacket()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_UDP_PORT`, `PACKET_HEADER_SIZE`)
- **Variables**: camelCase with descriptive names

### Import Organization
1. `java.*` imports
2. `javax.*` imports  
3. Third-party imports (org.springframework, com.fasterxml, etc.)
4. Project imports (com.simracingapps.*)
Use wildcard imports sparingly; prefer explicit imports.

### Documentation
- **JavaDoc**: Required for all public classes and methods with @param, @return, @throws
- **Comments**: Explain business logic, complex algorithms, and protocol-specific details
- **Logging**: Use SLF4J with class-level static loggers: `private static final Logger log = LoggerFactory.getLogger(ClassName.class);`

### Error Handling
- **REST APIs**: Use `ResponseEntity` with appropriate HTTP status codes
- **Exceptions**: Create custom exceptions for domain-specific errors
- **Validation**: Use `@Valid` and Spring Validation annotations
- **Logging**: Log errors at ERROR level with context, debug at DEBUG level

### Configuration Management
- **Properties**: Use `@ConfigurationProperties(prefix = "telemetry")` pattern
- **Nested Configs**: Use static inner classes for grouped settings
- **Profiles**: Use `@ActiveProfiles("test")` for test configurations

### Testing Standards
- **Framework**: JUnit 5 with Spring Boot Test
- **TestContainers**: Use for integration tests with real database
- **Naming**: `[ClassName]Tests` for test classes, `[methodName]()` for test methods
- **Annotations**: `@SpringBootTest`, `@Test`, `@MockBean`, `@TestPropertySource`

### UDP/Telemetry Specific
- **Packet Processing**: Handle binary data with ByteBuffer, respect endianness
- **Performance**: Use reactive programming (WebFlux) for high-frequency data
- **Validation**: Always validate packet size and structure before parsing
- **Logging**: Log packet counts, sizes, and errors; don't log raw packet data

### Code Quality
- **Lombok**: Use `@Data` for DTOs, `@Slf4j` for logging, `@Builder` for complex objects
- **Immutability**: Use `final` where possible, prefer immutable data structures
- **Null Safety**: Use `@NonNull`, `Optional<T>`, and proper null checks
- **Coverage**: Maintain >80% test coverage (JaCoCo reports in target/site/jacoco)

### Domain Context
- **Simulators**: Automobilista 2, Project CARS 1/2 using Project CARS 1 UDP protocol
- **Protocol**: UDP port 5606, packet types 0-4 (Telemetry, Race, Participants, Timings, GameState)
- **Data Flow**: UDP reception → binary parsing → domain objects → persistence → REST/WebSocket APIs