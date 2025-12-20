package com.simracingapps.telemetryreader;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Basic Spring Boot application test.
 * 
 * Verifies that the Spring Boot application context loads successfully.
 */
@SpringBootTest
@ActiveProfiles("test")
class TelemetryReaderApplicationTests {

    @Test
    void contextLoads() {
        // This test verifies that the Spring application context loads successfully
        // If this test passes, it means all beans and configurations are properly set up
    }
}