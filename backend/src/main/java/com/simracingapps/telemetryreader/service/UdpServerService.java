package com.simracingapps.telemetryreader.service;

import com.simracingapps.telemetryreader.config.TelemetryProperties;
import com.simracingapps.telemetryreader.model.packet.PacketParser;
import com.simracingapps.telemetryreader.model.packet.TelemetryPacket;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.ApplicationEventPublisher;
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
import java.util.concurrent.atomic.AtomicLong;

/**
 * UDP Server service for receiving telemetry data from racing simulators.
 * Listens on configured port (default 5606 for Automobilista 2) and processes
 * incoming UDP packets asynchronously.
 */
@Slf4j
@Service
public class UdpServerService {

    private final TelemetryProperties telemetryProperties;
    private final ApplicationEventPublisher eventPublisher;
    private final ExecutorService executorService;
    private DatagramSocket serverSocket;
    private final AtomicBoolean isRunning = new AtomicBoolean(false);
    private final AtomicLong packetsReceived = new AtomicLong(0);
    private final AtomicLong packetsProcessed = new AtomicLong(0);
    private final AtomicLong lastProcessedCount = new AtomicLong(0);
    private long lastPpsUpdate = System.currentTimeMillis();

    public UdpServerService(TelemetryProperties telemetryProperties, ApplicationEventPublisher eventPublisher) {
        this.telemetryProperties = telemetryProperties;
        this.eventPublisher = eventPublisher;
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
            packetsReceived.incrementAndGet();
            
            // DEBUG: Log source address
            String sourceAddress = packet.getAddress().getHostAddress();
            int sourcePort = packet.getPort();
            
            // Show hex of first 32 bytes for debugging
            StringBuilder hex = new StringBuilder();
            byte[] data = packet.getData();
            log.debug("UDP packet received: length={}", packetLength);
            for (int i = 0; i < Math.min(32, packetLength); i++) {
                hex.append(String.format("%02X ", data[i]));
            }
            log.debug("UDP from {}:{} - hex: {}", sourceAddress, sourcePort, hex);

            Object parsedData = PacketParser.parse(packet.getData(), packetLength);

            if (parsedData != null) {
                packetsProcessed.incrementAndGet();

                if (parsedData instanceof TelemetryPacket telemetryPacket) {
                    eventPublisher.publishEvent(telemetryPacket);
                }

                long now = System.currentTimeMillis();
                if (now - lastPpsUpdate > 1000) {
                    long pps = packetsProcessed.get() - lastProcessedCount.get();
                    log.info("UDP: {} packets/sec, {} total processed", pps, packetsProcessed.get());
                    lastProcessedCount.set(packetsProcessed.get());
                    lastPpsUpdate = now;
                }
            }
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

    public long getPacketsReceived() {
        return packetsReceived.get();
    }

    public long getPacketsProcessed() {
        return packetsProcessed.get();
    }

    public long getPacketsPerSecond() {
        long now = System.currentTimeMillis();
        if (now - lastPpsUpdate > 2000) {
            return 0;
        }
        return packetsProcessed.get() - lastProcessedCount.get();
    }
}
