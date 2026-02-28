package com.simracingapps.telemetryreader.model.packet;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class TimingsPacket {
    private PacketType packetType;
    private LocalDateTime timestamp;
    private int sequenceNumber;

    private int lapNumber;
    private float currentLapTimeMs;
    private float lastLapTimeMs;
    private float bestLapTimeMs;
    private float sessionTimeMs;

    private List<ParticipantTiming> participantTimings;
}

@Data
@Builder
class ParticipantTiming {
    private int index;
    private String name;
    private int worldPosition;
    private float currentLapTimeMs;
    private float bestLapTimeMs;
    private float sector1TimeMs;
    private float sector2TimeMs;
    private float sector3TimeMs;
    private int lapsCompleted;
    private boolean isInPits;
    private int currentSector;
}
