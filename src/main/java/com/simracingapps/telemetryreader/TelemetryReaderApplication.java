package com.simracingapps.telemetryreader;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

/**
 * Main Spring Boot application class for Racing Telemetry Manager.
 * 
 * This application receives, processes, and manages UDP telemetry data
 * from racing simulators like Automobilista 2 and Project CARS.
 * 
 * @author Telemetry Reader
 * @version 0.0.1-SNAPSHOT
 */
@SpringBootApplication
@EnableAsync
@EnableScheduling
public class TelemetryReaderApplication {

    public static void main(String[] args) {
        SpringApplication.run(TelemetryReaderApplication.class, args);
    }
}