package com.simracingapps.telemetryreader.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.simracingapps.telemetryreader.model.packet.TelemetryPacket;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class TelemetryEventListener {

    private final TelemetryWebSocketHandler webSocketHandler;
    private final ObjectMapper objectMapper;

    @EventListener
    public void handleTelemetryPacket(TelemetryPacket packet) {
        try {
            String json = objectMapper.writeValueAsString(packet);
            log.debug("Broadcasting JSON (length={}): {}", json.length(), json);
            webSocketHandler.broadcastTelemetry(json);
            log.debug("Broadcasted telemetry packet: speed={}, rpm={}, gear={}, throttle={}, brake={}, fuel={}, steering={}", 
                packet.getSpeedKmh(), packet.getRpm(), packet.getGear(), 
                packet.getThrottle(), packet.getBrake(), packet.getFuelLevel(), packet.getSteering());
        } catch (Exception e) {
            log.error("Error broadcasting telemetry packet: {}", e.getMessage());
        }
    }
}
