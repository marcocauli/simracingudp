# 🔧 Piano Sviluppo Backend Spring Boot - Racing Telemetry Manager

## 📊 **Stato Attuale del Progetto Backend**

### ✅ **Infrastruttura Completata (90%)**
- **Spring Boot 3.2.0**: Configurato con Java 21
- **Maven Project**: Setup completo con dependencies necessarie
- **Docker Container**: Image JAR pronta e funzionante
- **Configuration**: UDP port 5606, CORS, application properties
- **Testing Framework**: JUnit 5 + TestContainers configurato
- **REST Endpoints**: Health endpoint `/api/v1/health` funzionante
- **Application Status**: JAR deployato e attivo su porta 8080

### 🔄 **Implementazione Parziale (65%)**
- **UDP Server**: Listener di base su porta 5606 implementato
- **REST Controller**: TelemetryController con health endpoint
- **Error Handling**: Gestione errori configurata
- **Mock Server**: Node.js server con fisica realistica funzionante

### ❌ **Feature Principali Mancanti (35%)**
- **Packet Parsing**: Manca parsing binario UDP completo
- **WebSocket Endpoints**: Nessun endpoint WebSocket implementato
- **Data Persistence**: Nessun database o storage configurato
- **REST API Completa**: Solo endpoint base, mancano API complete

### ✅ **Deployment Completato (100%)**
- **Docker Deployment**: Container attivo e funzionante
- **Health Check**: Endpoint `/api/v1/health` funzionante
- **Network Configuration**: Comunicazione stabile con frontend
- **Application Status**: UP e in ascolto su porta 8080

---

## 🎯 **Obiettivi Principali Backend**

### 1. **UDP Packet Processing System**
Implementare parsing completo dei pacchetti UDP per protocollo Project CARS

### 2. **Real-time WebSocket Streaming**
Fornire streaming dati real-time ai client frontend

### 3. **Data Persistence Layer**
Gestire storage e recupero dati telemetria con performance ottimali

### 4. **REST API Completa**
Esporre API complete per gestione sessioni e analisi dati

---

## 📋 **Fase 1: UDP Packet Processing System**

### 1.1 **Packet Protocol Implementation**
```java
// Packet types definition
public enum PacketType {
    TELEMETRY(0),      // 559 bytes
    RACE_DATA(1),     // 308 bytes  
    PARTICIPANTS(2),   // 1136 bytes
    TIMINGS(3),       // 1063 bytes
    GAME_STATE(4)      // 24 bytes
}
```

### 1.2 **Binary Packet Parser**
- **ByteBuffer Wrapper**: Gestione endianness (little-endian)
- **Packet Type Router**: Dispatch basato su packet type
- **Validation**: Size checks, checksum validation
- **Error Handling**: Graceful degradation per pacchetti corrotti

### 1.3 **Packet Models**
```java
@Entity
public class TelemetryPacket {
    private Long id;
    private Long timestamp;
    private Integer packetType;
    private Float speed;           // km/h
    private Float rpm;             // engine RPM
    private Integer gear;           // current gear (0=N, 1=1st, etc.)
    private Float throttle;         // 0.0-1.0
    private Float brake;            // 0.0-1.0
    private Float steering;         // -1.0 to 1.0 (-left to +right)
    private Float fuelLevel;        // fuel percentage
    private Float[] tireTemps;     // 4 tires
    private Float[] tireWear;      // 4 tires
    // ... other telemetry fields
}
```

---

## 📋 **Fase 2: Real-time WebSocket Implementation**

### 2.1 **WebSocket Configuration**
```java
@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    
    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry.addHandler(new TelemetryWebSocketHandler(), "/ws/telemetry")
                .setAllowedOrigins("*");
    }
}
```

### 2.2 **Telemetry WebSocket Handler**
- **Connection Management**: Track active connections
- **Broadcast Strategy**: Multi-client data distribution
- **Message Format**: JSON telemetry data packets
- **Heartbeat**: Keep-alive mechanism
- **Rate Limiting**: 60Hz maximum broadcast rate

### 2.3 **Data Broadcasting Service**
```java
@Service
public class TelemetryBroadcastService {
    
    private final Set<WebSocketSession> sessions = ConcurrentHashMap.newKeySet();
    
    @Async
    public void broadcastTelemetry(TelemetryData data) {
        sessions.removeIf(session -> !session.isOpen());
        
        String message = JsonUtils.toJson(data);
        sessions.parallelStream().forEach(session -> {
            try {
                session.sendMessage(new TextMessage(message));
            } catch (IOException e) {
                log.warn("Failed to send telemetry to session", e);
            }
        });
    }
}
```

---

## 📋 **Fase 3: Data Persistence Layer**

### 3.1 **Database Schema Design**
```sql
-- Sessions table
CREATE TABLE racing_sessions (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_type VARCHAR(20) NOT NULL,
    track_name VARCHAR(100),
    car_name VARCHAR(100),
    start_time TIMESTAMP,
    end_time TIMESTAMP,
    duration_seconds INTEGER,
    weather_conditions VARCHAR(50)
);

-- Laps table  
CREATE TABLE laps (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    session_id BIGINT REFERENCES racing_sessions(id),
    lap_number INTEGER NOT NULL,
    lap_time DECIMAL(10,3), -- seconds.milliseconds
    sector1_time DECIMAL(8,3),
    sector2_time DECIMAL(8,3),
    sector3_time DECIMAL(8,3),
    is_valid_lap BOOLEAN DEFAULT TRUE
);

-- Telemetry data points
CREATE TABLE telemetry_points (
    id BIGINT PRIMARY KEY AUTO_INCREMENT,
    lap_id BIGINT REFERENCES laps(id),
    timestamp_ms BIGINT,
    speed_kmh DECIMAL(6,2),
    rpm INTEGER,
    gear INTEGER,
    throttle_pct DECIMAL(5,2),
    brake_pct DECIMAL(5,2),
    steering_pct DECIMAL(5,2),
    fuel_level_pct DECIMAL(5,2),
    tire_temp_fl DECIMAL(5,2),
    tire_temp_fr DECIMAL(5,2),
    tire_temp_rl DECIMAL(5,2),
    tire_temp_rr DECIMAL(5,2),
    tire_wear_fl DECIMAL(5,2),
    tire_wear_fr DECIMAL(5,2),
    tire_wear_rl DECIMAL(5,2),
    tire_wear_rr DECIMAL(5,2)
);
```

### 3.2 **JPA Entities**
- **Session Entity**: Session management con lifecycle
- **Lap Entity**: Lap times e sector data
- **TelemetryPoint Entity**: High-frequency data points
- **Relationships**: One-to-many session->laps->telemetry

### 3.3 **Repository Layer**
```java
@Repository
public interface SessionRepository extends JpaRepository<Session, Long> {
    List<Session> findBySessionTypeOrderByStartTimeDesc(String sessionType);
    List<Session> findByStartTimeBetween(LocalDateTime start, LocalDateTime end);
    
    @Query("SELECT COUNT(s) FROM Session s WHERE s.startTime > :since")
    long countSessionsSince(@Param("since") LocalDateTime since);
}

@Repository  
public interface TelemetryPointRepository extends JpaRepository<TelemetryPoint, Long> {
    @Query("SELECT t FROM TelemetryPoint t WHERE t.lap.id = :lapId ORDER BY t.timestampMs")
    List<TelemetryPoint> findByLapIdOrderByTimestamp(@Param("lapId") Long lapId);
    
    @Query("SELECT t FROM TelemetryPoint t WHERE t.lap.session.id = :sessionId AND t.timestampMs BETWEEN :start AND :end")
    List<TelemetryPoint> findSessionTelemetryInTimeRange(@Param("sessionId") Long sessionId, 
                                                            @Param("start") Long startMs, 
                                                            @Param("end") Long endMs);
}
```

---

## 📋 **Fase 4: REST API Completa**

### 4.1 **Session Management API**
```java
@RestController
@RequestMapping("/api/v1/sessions")
public class SessionController {
    
    @GetMapping
    public ResponseEntity<Page<SessionSummary>> getSessions(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String sessionType,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime endDate) {
        // Implementation
    }
    
    @GetMapping("/{id}")
    public ResponseEntity<SessionDetails> getSession(@PathVariable Long id) {
        // Implementation  
    }
    
    @PostMapping
    public ResponseEntity<Session> createSession(@Valid @RequestBody CreateSessionRequest request) {
        // Implementation
    }
    
    @GetMapping("/{id}/laps")
    public ResponseEntity<List<LapSummary>> getSessionLaps(@PathVariable Long id) {
        // Implementation
    }
}
```

### 4.2 **Telemetry Data API**
```java
@RestController
@RequestMapping("/api/v1/telemetry")
public class TelemetryController {
    
    @GetMapping("/sessions/{sessionId}/latest")
    public ResponseEntity<TelemetryData> getLatestTelemetry(@PathVariable Long sessionId) {
        // Implementation
    }
    
    @GetMapping("/laps/{lapId}")
    public ResponseEntity<List<TelemetryDataPoint>> getLapTelemetry(@PathVariable Long lapId) {
        // Implementation
    }
    
    @GetMapping("/sessions/{sessionId}/export/csv")
    public ResponseEntity<Resource> exportSessionTelemetryCsv(@PathVariable Long sessionId) {
        // Implementation
    }
    
    @GetMapping("/sessions/{sessionId}/statistics")
    public ResponseEntity<SessionStatistics> getSessionStatistics(@PathVariable Long sessionId) {
        // Implementation
    }
}
```

### 4.3 **Configuration & Health API**
```java
@RestController
@RequestMapping("/api/v1")
public class ManagementController {
    
    @GetMapping("/health")
    public ResponseEntity<HealthStatus> health() {
        // Implementation
    }
    
    @GetMapping("/info")  
    public ResponseEntity<AppInfo> info() {
        // Implementation
    }
    
    @GetMapping("/udp-status")
    public ResponseEntity<UdpServerStatus> udpServerStatus() {
        // Implementation
    }
    
    @GetMapping("/config")
    public ResponseEntity<ServerConfig> getConfiguration() {
        // Implementation
    }
    
    @PutMapping("/config")
    public ResponseEntity<ServerConfig> updateConfiguration(@Valid @RequestBody ServerConfig config) {
        // Implementation
    }
}
```

---

## 📋 **Fase 5: Advanced Backend Features**

### 5.1 **Performance Optimization**
- **Batch Processing**: Bulk inserts per telemetry data
- **Connection Pooling**: HikariCP configuration
- **Caching**: Redis per frequently accessed data
- **Async Processing**: @Async per WebSocket broadcasting

### 5.2 **Security & Configuration**
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/v1/health", "/api/v1/info", "/ws/**").permitAll()
                .anyRequest().authenticated()
            )
            .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .build();
    }
}
```

### 5.3 **Monitoring & Metrics**
- **Custom Metrics**: Packets per second, active sessions
- **Micrometer Integration**: Prometheus metrics
- **Health Checks**: Database, UDP server, WebSocket status
- **Logging**: Structured logging with correlation IDs

---

## 🛠️ **Stack Tecnologico Backend**

### **Core Framework**
- Spring Boot 3.2.0 con Java 21
- Spring Web (MVC) per REST API
- Spring WebSocket per real-time communication
- Spring Data JPA per data persistence
- Spring Security per authentication

### **Database & Storage**
- H2 (development) + PostgreSQL (production)
- JPA/Hibernate per ORM
- Flyway per database migrations
- Redis per caching (opzionale)

### **Performance & Monitoring**
- HikariCP connection pooling
- Micrometer + Prometheus metrics
- Spring Boot Actuator per health checks
- Structured logging con SLF4J + Logback

---

## ⏱️ **Timeline Sviluppo Backend**

### **Sprint 1: UDP Processing (Week 1-2)**
- [x] Spring Boot project setup (già completo)
- [ ] UDP packet parser implementation
- [ ] Packet models and entities
- [ ] Basic data validation and error handling

### **Sprint 2: WebSocket & API (Week 3-4)**
- [ ] WebSocket handler implementation
- [ ] Session management endpoints
- [ ] Basic telemetry data API
- [ ] Connection management and broadcasting

### **Sprint 3: Persistence & Advanced Features (Week 5-6)**
- [ ] Database schema and entities
- [ ] Repository layer implementation
- [ ] Data export and statistics
- [ ] Performance optimization

### **Sprint 4: Testing & Production Ready (Week 7-8)**
- [ ] Unit tests (target >85% coverage)
- [ ] Integration tests with TestContainers
- [ ] Load testing for UDP traffic
- [ ] Production configuration and deployment

---

## 🎯 **Definition of Done per Feature Backend**

### **UDP Packet Processing**
- [x] Server in ascolto su porta 5606
- [ ] Parsing di tutti i 5 tipi di pacchetto
- [ ] Validazione dimensioni e checksum
- [ ] Error handling per pacchetti malformati
- [ ] Logging statistico pacchetti ricevuti
- [ ] Unit tests per ogni packet type

### **WebSocket Streaming**
- [ ] Endpoint `/ws/telemetry` funzionante
- [ ] Broadcasting a tutti i client connessi
- [ ] Gestione connessioni/disconnessioni
- [ ] Rate limiting a 60Hz
- [ ] Heartbeat mechanism
- [ ] Error handling per connessioni fallite

### **REST API**
- [ ] Tutti gli endpoint definiti implementati
- [ ] Validazione input e error handling
- [ ] Documentazione OpenAPI/Swagger
- [ ] CORS configuration per frontend
- [ ] Unit tests per tutti i controller
- [ ] Integration tests completi

---

## 📊 **Metriche di Successo Backend**

### **Performance**
- **UDP Processing**: >500 pacchetti/secondo
- **WebSocket Latency**: <10ms da UDP a client
- **Database Performance**: <100ms per query complesse
- **Memory Usage**: <512MB per full session

### **Reliability**
- **Uptime**: >99.9% per session handling
- **Error Rate**: <0.1% packet processing errors
- **Connection Stability**: Auto-recovery per WebSocket
- **Data Integrity**: Zero data corruption

### **Code Quality**
- **Coverage**: >85% unit + integration test
- **Complexity**: Cyclomatic complexity <10 per metodo
- **Code Smells**: Zero SonarQube issues
- **Dependencies**: Up-to-date security patches

---

## 🚀 **Prossimi Passi Immediati Backend**

1. **Packet Parser Implementation**: Iniziare con Type 0 (Telemetry)
2. **WebSocket Handler**: Implementare base broadcasting service
3. **Database Schema**: Creare entities e repositories
4. **Session Management API**: Endpoint per CRUD operazioni
5. **Integration Testing**: TestContainers setup per end-to-end tests

---

Questo piano fornisce una roadmap completa per sviluppare un backend Spring Boot robusto e performante capace di gestire dati telemetria racing in tempo reale, partendo dall'ottima infrastruttura già presente e costruendo funzionalità enterprise-grade per UDP processing, WebSocket streaming, data persistence e REST API complete.