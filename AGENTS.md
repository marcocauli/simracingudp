# Racing Telemetry Reader - Agent Guidelines

## Documentation Updates
After every execution update all README.md files and the most relevant plan file in "opencode_docs" to mark completed progress and new tasks.

## Build/Test Commands

### Backend (Java/Maven)
```bash
# Build backend
cd backend && mvn clean compile

# Run all tests
cd backend && mvn test

# Run single test class
cd backend && mvn test -Dtest=TelemetryReaderApplicationTests

# Run single test method
cd backend && mvn test -Dtest=TelemetryControllerTests#healthCheck

# Run with coverage
cd backend && mvn test jacoco:report

# Run application
cd backend && mvn spring-boot:run

# Package
cd backend && mvn clean package
```

### Frontend (Angular/TypeScript)
```bash
# Build frontend
cd frontend && npm run build

# Start development server
cd frontend && npm start

# Run tests
cd frontend && npm test

# Run tests with coverage
cd frontend && npm run test -- --code-coverage

# Lint code
cd frontend && npm run lint

# Format code
cd frontend && npx prettier --write "src/**/*.ts"

# Type check
cd frontend && npx tsc --noEmit
```

### Full Stack
```bash
# Start all services
./reset-stack.sh start

# Start development mode
./reset-stack.sh dev

# Stop all services
./reset-stack.sh stop

# Build all projects
./reset-stack.sh build
```

## Code Style Guidelines

### Java Backend Conventions
- **Java Version**: 21+ (compatible with Java 25)
- **Framework**: Spring Boot 3.2.0, use Spring annotations (@RestController, @Service, @Repository, @Component)
- **Packages**: `com.simracingapps.telemetryreader.*` (lowercase, dot-separated)
- **Classes**: PascalCase (e.g., `TelemetryController`, `UdpPacketParser`)
- **Methods**: camelCase (e.g., `parseTelemetryData()`, `handleUdpPacket()`)
- **Constants**: UPPER_SNAKE_CASE (e.g., `DEFAULT_UDP_PORT`, `PACKET_HEADER_SIZE`)
- **Variables**: camelCase with descriptive names

### Angular Frontend Conventions
- **Components**: PascalCase with .component.ts/.html/.scss files
- **Services**: PascalCase with .service.ts (e.g., `TelemetryService`)
- **Models**: PascalCase with .models.ts or interface definitions
- **Imports**: Organize 1) Angular imports 2) Third-party 3) Project imports
- **TypeScript**: Strict mode enabled, prefer explicit types over 'any'

### Import Organization
**Java**: 1) `java.*` 2) `javax.*` 3) Third-party 4) Project imports  
**TypeScript**: 1) @angular/* 2) Third-party 3) @/* project imports

### Documentation
- **JavaDoc**: Required for public classes/methods with @param, @return, @throws
- **TypeScript**: Use TSDoc for public interfaces/services
- **Comments**: Explain business logic, complex algorithms, protocol details
- **Logging**: SLF4J for backend, console.log for frontend (use appropriate levels)

### Error Handling
- **REST APIs**: Use `ResponseEntity` with proper HTTP status codes
- **Exceptions**: Create custom exceptions for domain-specific errors
- **Validation**: Use `@Valid` (backend) and Angular Validators
- **Frontend**: ErrorInterceptor + NotificationService for user feedback

### Configuration Management
- **Backend**: `@ConfigurationProperties(prefix = "telemetry")` pattern
- **Frontend**: Environment-specific configs via Angular CLI environments
- **Profiles**: `@ActiveProfiles("test")` for backend test configs

### Testing Standards
**Backend**: JUnit 5 + Spring Boot Test + TestContainers
- **Naming**: `[ClassName]Tests` for classes, `[methodName]()` for methods
- **Annotations**: `@SpringBootTest`, `@Test`, `@MockBean`, `@TestPropertySource`

**Frontend**: Jasmine + Angular Testing Library
- **Naming**: `[ComponentName].component.spec.ts`
- **Testing**: Use TestBed, fixtures, async/await for async operations

### UDP/Telemetry Specific
- **Packet Processing**: ByteBuffer with little-endian handling
- **Performance**: WebFlux for high-frequency data, OnPush change detection
- **Validation**: Always validate packet size/structure before parsing
- **Security**: Never log raw packet data, sanitize inputs

### Code Quality
- **Backend**: Lombok (`@Data`, `@Slf4j`, `@Builder`), immutability, `@NonNull`
- **Frontend**: Strict TypeScript, no implicit any, prefer interfaces
- **Coverage**: >80% for backend, comprehensive component tests for frontend
- **Linting**: ESLint + Prettier (frontend), SonarQube rules (backend)

### Performance
- **Backend**: Reactive streams, batch processing, connection pooling
- **Frontend**: OnPush change detection, trackBy functions, virtual scrolling
- **Memory**: Clean up subscriptions, use weak references where appropriate

### Domain Context
- **Simulators**: Automobilista 2, Project CARS 1/2 using Project CARS 1 UDP protocol
- **Protocol**: UDP port 5606, packet types 0-4 (Telemetry, Race, Participants, Timings, GameState)
- **Data Flow**: UDP reception → binary parsing → domain objects → persistence → WebSocket → Frontend

### Development Environment
- **Editor**: VSCode with Angular extension
- **Formatting**: EditorConfig with 2-space indentation, single quotes for TypeScript
- **Code Quality**: ESLint + Prettier (frontend), SonarQube rules (backend)

### Local Development Logs

When running the application locally (not in Docker), logs are stored in the `logs/` directory:

```bash
# Log file locations
logs/backend.log     # Spring Boot application logs
logs/frontend.log    # Frontend Nginx logs
logs/mock-server.log # Mock server logs
```

**Log configuration** (in `backend/src/main/resources/application.properties`):
```properties
logging.file.name=logs/backend.log
logging.level.com.simracingapps.telemetry-reader=DEBUG
```

To view logs in real-time:
```bash
# Watch backend logs
tail -f logs/backend.log

# Search for specific patterns
grep "Parsing packet" logs/backend.log
grep "Error" logs/backend.log
```