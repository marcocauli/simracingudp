package com.simracingapps.telemetryreader.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.simracingapps.telemetryreader.config.TelemetryProperties;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import java.net.DatagramPacket;
import java.net.DatagramSocket;
import java.net.SocketException;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * UDP Server service for receiving telemetry data from racing simulators.
 * Listens on configured port (default 5606 for Automobilista 2) and processes
 * incoming UDP packets asynchronously.
 */
@Slf4j
@Service
public class UdpServerService {

    private final TelemetryProperties telemetryProperties;
    private final TelemetryWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;
    private final ExecutorService executorService;
    private DatagramSocket serverSocket;
    private final AtomicBoolean isRunning = new AtomicBoolean(false);

    public UdpServerService(TelemetryProperties telemetryProperties, 
                           TelemetryWebSocketHandler webSocketHandler) {
        this.telemetryProperties = telemetryProperties;
        this.webSocketHandler = webSocketHandler;
        this.objectMapper = new ObjectMapper();
        this.executorService = Executors.newCachedThreadPool(r -> {
            Thread thread = new Thread(r, "udp-server-thread");
            thread.setDaemon(true);
            return thread;
        });
    }

    /**
     * Starts the UDP server and begins listening for incoming packets.
     */
    @PostConstruct
    public void startServer() {
        try {
            serverSocket = new DatagramSocket(telemetryProperties.getUdp().getPort());
            isRunning.set(true);
            
            log.info("UDP Server started on port {}", telemetryProperties.getUdp().getPort());
            log.info("Listening for telemetry data from racing simulators...");
            
            // Start listening for packets asynchronously
            CompletableFuture.runAsync(this::listenForPackets, executorService);
            
        } catch (SocketException e) {
            log.error("Failed to start UDP server on port {}", telemetryProperties.getUdp().getPort(), e);
            throw new RuntimeException("Could not start UDP server", e);
        }
    }

    /**
     * Main packet receiving loop. Runs asynchronously and listens for incoming UDP packets.
     */
    private void listenForPackets() {
        byte[] receiveBuffer = new byte[2048]; // Large enough for any packet type
        
        while (isRunning.get()) {
            try {
                DatagramPacket receivePacket = new DatagramPacket(receiveBuffer, receiveBuffer.length);
                serverSocket.receive(receivePacket);
                
                // Process packet asynchronously
                CompletableFuture.runAsync(() -> 
                    processPacket(receivePacket), executorService);
                
            } catch (Exception e) {
                if (isRunning.get()) {
                    log.error("Error receiving UDP packet", e);
                }
            }
        }
    }

    /**
     * Processes a received UDP packet.
     * 
     * @param packet the received UDP packet
     */
    private void processPacket(DatagramPacket packet) {
        try {
            int packetLength = packet.getLength();
            String senderAddress = packet.getAddress().getHostAddress();
            int senderPort = packet.getPort();
            
            log.debug("Received packet from {}: {} bytes", senderAddress, packetLength);
            
            // Parse packet type (first byte after header)
            byte[] data = packet.getData();
            int packetType = data[11] & 0xFF; // Packet type is at offset 11
            
            // Create telemetry data to send via WebSocket
            var telemetryData = new java.util.HashMap<String, Object>();
            telemetryData.put("packetType", packetType);
            telemetryData.put("timestamp", System.currentTimeMillis());
            telemetryData.put("speed", 150 + Math.random() * 100);
            telemetryData.put("rpm", 3000 + Math.random() * 4000);
            telemetryData.put("gear", (int)(Math.random() * 6) + 1);
            telemetryData.put("throttle", Math.random() * 100);
            telemetryData.put("brake", Math.random() * 50);
            telemetryData.put("steering", (Math.random() - 0.5) * 60);
            telemetryData.put("fuelLevel", 50 + Math.random() * 50);
            telemetryData.put("tireWear", new double[]{Math.random() * 30, Math.random() * 30, Math.random() * 30, Math.random() * 30});
            telemetryData.put("tireTemps", new double[]{70 + Math.random() * 20, 70 + Math.random() * 20, 70 + Math.random() * 20, 70 + Math.random() * 20});
            
            // Simulate lap/sector data (will be replaced with real parsing)
            telemetryData.put("currentLap", 1);
            telemetryData.put("currentSector", packetType == 1 ? (int)(Math.random() * 3) + 1 : 1);
            telemetryData.put("sector1Time", 25.0 + Math.random() * 5);
            telemetryData.put("sector2Time", 30.0 + Math.random() * 5);
            telemetryData.put("sector3Time", 35.0 + Math.random() * 5);
            telemetryData.put("lastLapTime", 0.0);
            telemetryData.put("lastSector1Time", 0.0);
            telemetryData.put("lastSector2Time", 0.0);
            telemetryData.put("lastSector3Time", 0.0);
            telemetryData.put("bestLapTime", 90.0 + Math.random() * 10);
            telemetryData.put("bestSector1Time", 25.0 + Math.random() * 5);
            telemetryData.put("bestSector2Time", 30.0 + Math.random() * 5);
            telemetryData.put("bestSector3Time", 35.0 + Math.random() * 5);
            
            // Send to WebSocket clients
            String json = objectMapper.writeValueAsString(telemetryData);
            webSocketHandler.broadcastTelemetry(json);
            
            log.info("UDP Packet Processed - Type: {}, Size: {} bytes", packetType, packetLength);
            
        } catch (Exception e) {
            log.error("Error processing UDP packet", e);
        }
    }

    /**
     * Stops the UDP server gracefully.
     */
    @PreDestroy
    public void stopServer() {
        log.info("Stopping UDP server...");
        isRunning.set(false);
        
        if (serverSocket != null && !serverSocket.isClosed()) {
            serverSocket.close();
        }
        
        executorService.shutdown();
        log.info("UDP server stopped");
    }

    /**
     * Returns the current status of the UDP server.
     * 
     * @return true if server is running, false otherwise
     */
    public boolean isServerRunning() {
        return isRunning.get() && serverSocket != null && !serverSocket.isClosed();
    }

    /**
     * Returns the port the server is listening on.
     * 
     * @return the listening port
     */
    public int getListeningPort() {
        return serverSocket != null ? serverSocket.getLocalPort() : -1;
    }
}