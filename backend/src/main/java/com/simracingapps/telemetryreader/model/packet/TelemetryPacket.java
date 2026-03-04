package com.simracingapps.telemetryreader.model.packet;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class TelemetryPacket {
    private PacketType packetType;
    private LocalDateTime timestamp;
    private int sequenceNumber;

    @JsonProperty("speed")
    private float speedKmh;
    private float rpm;
    private int maxRpm;
    private int gear;
    private float throttle;
    private float brake;
    private float clutch;
    private float steering;
    private float fuelLevel;

    @JsonProperty("tireTemps")
    private float[] tireTemps;
    @JsonProperty("tirePressures")
    private float[] tirePressures;
    @JsonProperty("tireWear")
    private float[] tireWear;
    @JsonProperty("tireRPS")
    private float[] tyreRPS;
    @JsonProperty("wheelRPM")
    private float[] wheelRPM;
    private float[] tireGrip;

    private float engineTemp;
    private float oilTemp;
    private float oilPressure;
    private float waterTemp;
    private float waterPressure;
    private float fuelPressure;

    private float posX;
    private float posY;
    private float posZ;

    @JsonProperty("orientation")
    private float[] orientation;
    private float pitch;
    private float roll;
    private float yaw;

    @JsonProperty("localVelocity")
    private float[] localVelocity;
    @JsonProperty("worldVelocity")
    private float[] worldVelocity;

    @JsonProperty("angularVelocity")
    private float[] angularVelocity;

    @JsonProperty("localAcceleration")
    private float[] localAcceleration;
    @JsonProperty("worldAcceleration")
    private float[] worldAcceleration;

    private float wheelAngle;
    private float heading;

    @JsonProperty("currentLap")
    private int lapNumber;
    private int lapTimeMs;
    private int racePosition;

    private boolean headlightsOn;
    private boolean engineRunning;
    private boolean pitLimiterOn;

    private String carName;
    private String trackName;

    private float airDensity;
    private float airPressure;
    private float aerodynamicDrag;
    private float aerodynamicDownforce;
    private float odometerKM;
}
