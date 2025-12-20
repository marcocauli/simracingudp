package com.simracingapps.telemetryreader.config;

import lombok.Data;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.annotation.Configuration;

/**
 * Configuration properties for telemetry reader application.
 * 
 * Reads custom configuration values from application.properties.
 */
@Data
@Configuration
@ConfigurationProperties(prefix = "telemetry")
public class TelemetryProperties {
    
    /**
     * UDP configuration settings.
     */
    private Udp udp = new Udp();
    
    /**
     * Data retention settings.
     */
    private int dataRetentionDays = 30;
    
    /**
     * Rate limiting settings.
     */
    private RateLimit rateLimit = new RateLimit();
    
    @Data
    public static class Udp {
        private int port = 5606;
        private String host = "0.0.0.0";
        private int bufferSize = 2048;
    }
    
    @Data
    public static class RateLimit {
        private int requestsPerMinute = 1000;
    }
}