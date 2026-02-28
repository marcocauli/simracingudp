package com.simracingapps.telemetryreader.model.packet;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TelemetryPacket {
    private PacketType packetType;
    private LocalDateTime timestamp;
    private int sequenceNumber;

    private float speedKmh;
    private float rpm;
    private int gear;
    private float throttle;
    private float brake;
    private float steering;
    private float fuelLevel;

    private float[] tireTemps;
    private float[] tirePressures;
    private float[] tireWear;
    private float[] tireGrip;

    private float engineTemp;
    private float oilTemp;
    private float oilPressure;
    private float waterTemp;

    private float posX;
    private float posY;
    private float posZ;

    private float pitch;
    private float roll;
    private float yaw;

    private float velocityX;
    private float velocityY;
    private float velocityZ;

    private float accelX;
    private float accelY;
    private float accelZ;

    private float wheelAngle;
    private float heading;

    private int lapNumber;
    private int lapTimeMs;
    private int racePosition;

    private boolean headlightsOn;
    private boolean engineRunning;
    private boolean pitLimiterOn;

    private String carName;
    private String trackName;
}
