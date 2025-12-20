package com.simracingapps.telemetryreader.controller;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

/**
 * Main REST controller for the Telemetry Reader application.
 * 
 * Provides basic health check and application information endpoints.
 */
@RestController
@RequestMapping("/v1")
public class TelemetryController {
    
    private static final Logger logger = LoggerFactory.getLogger(TelemetryController.class);
    
    /**
     * Health check endpoint.
     * 
     * @return Health status of the application
     */
    @GetMapping("/health")
    public ResponseEntity<Map<String, Object>> health() {
        logger.debug("Health check requested");
        
        Map<String, Object> response = new HashMap<>();
        response.put("status", "UP");
        response.put("timestamp", LocalDateTime.now());
        response.put("application", "telemetry-reader");
        response.put("version", "0.0.1-SNAPSHOT");
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Application information endpoint.
     * 
     * @return Basic information about the telemetry reader
     */
    @GetMapping("/info")
    public ResponseEntity<Map<String, Object>> info() {
        logger.debug("Application info requested");
        
        Map<String, Object> response = new HashMap<>();
        response.put("application", "Racing Telemetry Manager");
        response.put("description", "Spring Boot application for managing UDP telemetry data from racing simulators");
        response.put("version", "0.0.1-SNAPSHOT");
        response.put("supportedSimulators", new String[]{"Automobilista 2", "Project CARS 1", "Project CARS 2"});
        response.put("udpPort", 5606);
        response.put("timestamp", LocalDateTime.now());
        
        return ResponseEntity.ok(response);
    }
    
    /**
     * Test endpoint to verify API is working.
     * 
     * @return Simple test message
     */
    @GetMapping("/test")
    public ResponseEntity<Map<String, String>> test() {
        logger.debug("Test endpoint requested");
        
        Map<String, String> response = new HashMap<>();
        response.put("message", "Telemetry Reader API is working!");
        response.put("timestamp", LocalDateTime.now().toString());
        
        return ResponseEntity.ok(response);
    }
}