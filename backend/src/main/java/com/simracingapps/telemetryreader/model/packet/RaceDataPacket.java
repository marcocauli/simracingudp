package com.simracingapps.telemetryreader.model.packet;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class RaceDataPacket {
    private PacketType packetType;
    private LocalDateTime timestamp;
    private int sequenceNumber;

    private int lapNumber;
    private int racePosition;
    private int currentSector;
    private int totalLaps;

    private float raceTimeMs;
    private float[] lapTimesMs;
    private float bestLapTimeMs;
    private float lastLapTimeMs;

    private boolean inPits;
    private boolean isRacing;
    private boolean isMenu;
    private boolean isPaused;

    private int numberOfParticipants;
    private List<ParticipantInfo> participants;
}

@Data
@Builder
class ParticipantInfo {
    private int index;
    private String name;
    private float worldPositionX;
    private float worldPositionY;
    private float worldPositionZ;
    private float speed;
    private int teamId;
    private int nationalFlag;
}
