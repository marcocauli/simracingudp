package com.simracingapps.telemetryreader.model.packet;

import lombok.extern.slf4j.Slf4j;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.time.LocalDateTime;

@Slf4j
public class PacketParser {

    private static final int PACKET_HEADER_SIZE = 12;
    private static final int MAX_PARTICIPANTS = 16;

    public static Object parse(byte[] data, int length) {
        if (data == null || length < 12) {
            log.warn("Invalid packet: too short ({} bytes)", length);
            return null;
        }

        ByteBuffer buffer = ByteBuffer.wrap(data, 0, length);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        int packetType = buffer.get(10) & 0xFF;

        log.debug("Packet type raw value: {} (0x{})", packetType, Integer.toHexString(packetType));

        PacketType type = PacketType.fromId(packetType);
        if (type == null) {
            log.warn("Unknown packet type: {} (0x{})", packetType, Integer.toHexString(packetType));
            return null;
        }

        int sequenceNumber = buffer.getInt(0);
        LocalDateTime timestamp = LocalDateTime.now();

        log.debug("Parsing packet: type={}, sequence={}, size={}", type, sequenceNumber, length);

        return switch (type) {
            case TELEMETRY -> parseTelemetryPacket(buffer, sequenceNumber, timestamp, length);
            case RACE_DATA -> parseRaceDataPacket(buffer, sequenceNumber, timestamp);
            case PARTICIPANTS -> parseParticipantsPacket(buffer, sequenceNumber, timestamp);
            case TIMINGS -> parseTimingsPacket(buffer, sequenceNumber, timestamp);
            case GAME_STATE -> parseGameStatePacket(buffer, sequenceNumber, timestamp);
        };
    }

    private static TelemetryPacket parseTelemetryPacket(ByteBuffer buffer, int sequenceNumber, LocalDateTime timestamp, int length) {
        log.debug("parseTelemetryPacket: buffer.capacity={}, length={}", buffer.capacity(), length);

        if (log.isDebugEnabled()) {
            StringBuilder hex = new StringBuilder();
            for (int i = 0; i < Math.min(length, 64); i++) {
                hex.append(String.format("%02X ", buffer.get(i)));
            }
            log.debug("Packet bytes (first 64): {}", hex);
        }

        TelemetryPacket.TelemetryPacketBuilder builder = TelemetryPacket.builder()
                .packetType(PacketType.TELEMETRY)
                .timestamp(timestamp)
                .sequenceNumber(sequenceNumber);

        try {
            // Controls (Offset 34-40)
            // sBrake: offset 34
            // sThrottle: offset 35
            // sClutch: offset 36
            // sSteering: offset 37
            // sGearNumGears: offset 38
            // sBoostAmount: offset 39
            // sCrashState: offset 40
            int rawBrake = buffer.get(34) & 0xFF;
            int rawThrottle = buffer.get(35) & 0xFF;
            int rawClutch = buffer.get(36) & 0xFF;
            int rawSteering = buffer.get(37) & 0xFF;
            int rawGear = buffer.get(38) & 0x0F;  // Lower nibble = current gear
            int numGears = (buffer.get(38) >> 4) & 0x0F;  // Upper nibble = number of gears

            // Fuel, Speed, RPM (Offset 45-56)
            // Padding: offset 41-44 (4 bytes)
            // sFuelLevel: offset 45 (float)
            // sSpeed: offset 49 (float)
            // sRpm: offset 53 (uint16)
            // sMaxRpm: offset 55 (uint16)
            float rawFuel = buffer.getFloat(45);
            float rawSpeed = buffer.getFloat(49);
            int rawRpm = buffer.getShort(53) & 0xFFFF;
            int rawMaxRpm = buffer.getShort(55) & 0xFFFF;

            log.debug("Parsed values - rawFuel={}, rawSpeed={}, rawRpm={}, rawSteering={}", rawFuel, rawSpeed, rawRpm, rawSteering);

            builder.speedKmh(rawSpeed * 3.6f);
            builder.rpm(rawRpm);
            builder.maxRpm(rawMaxRpm);
            builder.gear(rawGear);
            builder.throttle(normalizeUByte(rawThrottle));
            builder.brake(normalizeUByte(rawBrake));
            builder.clutch(normalizeUByte(rawClutch));
            builder.steering(normalizeSignedByte(rawSteering));
            builder.fuelLevel(normalizeFuel(rawFuel));

            // Orientation (Offset 57-68) - pitch, roll, yaw
            float pitch = buffer.getFloat(57);
            float roll = buffer.getFloat(61);
            float yaw = buffer.getFloat(65);
            builder.orientation(new float[]{pitch, roll, yaw});
            builder.pitch(pitch);
            builder.roll(roll);
            builder.yaw(yaw);

            // Local Velocity (Offset 69-80)
            float localVelX = buffer.getFloat(69);
            float localVelY = buffer.getFloat(73);
            float localVelZ = buffer.getFloat(77);
            builder.localVelocity(new float[]{localVelX, localVelY, localVelZ});

            // World Velocity (Offset 81-92)
            float worldVelX = buffer.getFloat(81);
            float worldVelY = buffer.getFloat(85);
            float worldVelZ = buffer.getFloat(89);
            builder.worldVelocity(new float[]{worldVelX, worldVelY, worldVelZ});

            // Angular Velocity (Offset 93-104)
            float angVelX = buffer.getFloat(93);
            float angVelY = buffer.getFloat(97);
            float angVelZ = buffer.getFloat(101);
            builder.angularVelocity(new float[]{angVelX, angVelY, angVelZ});

            // Local Acceleration (Offset 105-116)
            float localAccX = buffer.getFloat(105);
            float localAccY = buffer.getFloat(109);
            float localAccZ = buffer.getFloat(113);
            builder.localAcceleration(new float[]{localAccX, localAccY, localAccZ});

            // World Acceleration (Offset 117-128)
            float worldAccX = buffer.getFloat(117);
            float worldAccY = buffer.getFloat(121);
            float worldAccZ = buffer.getFloat(125);
            builder.worldAcceleration(new float[]{worldAccX, worldAccY, worldAccZ});

            // Engine & Liquids (Offset 20-33)
            int oilTemp = buffer.getShort(20);
            int oilPressure = buffer.getShort(22) & 0xFFFF;
            int waterTemp = buffer.getShort(24);
            int waterPressure = buffer.getShort(26) & 0xFFFF;
            int fuelPressure = buffer.getShort(28) & 0xFFFF;
            builder.oilTemp(oilTemp);
            builder.oilPressure(oilPressure);
            builder.waterTemp(waterTemp);
            builder.waterPressure(waterPressure);
            builder.fuelPressure(fuelPressure);

            // Tire Data
            // sTyreFlags: offset 145 (4 bytes)
            // sTerrain: offset 149 (4 bytes)
            // sTyreY: offset 153-168 (16 bytes)
            // sTyreRPS: offset 169-184 (16 bytes)
            // sTyreTemp: offset 181-184 (4 bytes, uint8)
            // sTyreHeight: offset 185-200 (16 bytes)
            // sTyreWear: offset 201-204 (4 bytes, uint8)

            float[] tireTemps = null;
            float[] tireWear = null;

            if (length >= 185) {
                tireTemps = new float[4];
                for (int i = 0; i < 4; i++) {
                    tireTemps[i] = buffer.get(181 + i) & 0xFF;
                }
                builder.tireTemps(tireTemps);
            }

            if (length >= 209) {
                tireWear = new float[4];
                for (int i = 0; i < 4; i++) {
                    tireWear[i] = buffer.get(201 + i) & 0xFF;
                }
                builder.tireWear(tireWear);
            }

            if (tireTemps != null && tireWear != null) {
                log.debug("Tire temps: FL={}, FR={}, RL={}, RR={}, Wear: FL={}, FR={}, RL={}, RR={}", 
                    tireTemps[0], tireTemps[1], tireTemps[2], tireTemps[3],
                    tireWear[0], tireWear[1], tireWear[2], tireWear[3]);
            }

            if (length >= 185) {
                float[] tyreRPS = new float[4];
                for (int i = 0; i < 4; i++) {
                    tyreRPS[i] = buffer.getFloat(165 + i * 4);
                }
                builder.tyreRPS(tyreRPS);
            }

            if (length >= 245) {
                float[] wheelRPM = new float[4];
                for (int i = 0; i < 4; i++) {
                    wheelRPM[i] = buffer.getFloat(229 + i * 4);
                }
                builder.wheelRPM(wheelRPM);
            }

            // Aero data (Offset 393-408)
            if (length >= 408) {
                float airDensity = buffer.getFloat(393);
                float airPressure = buffer.getFloat(397);
                float aeroDrag = buffer.getFloat(401);
                float aeroDownforce = buffer.getFloat(405);
                builder.airDensity(airDensity);
                builder.airPressure(airPressure);
                builder.aerodynamicDrag(aeroDrag);
                builder.aerodynamicDownforce(aeroDownforce);
            }

            // Odometer (Offset 409)
            if (length >= 413) {
                float odometer = buffer.getFloat(409);
                builder.odometerKM(odometer);
            }

        } catch (Exception e) {
            log.error("Error parsing telemetry packet: {}", e.getMessage(), e);
        }

        TelemetryPacket packet = builder.build();
        log.debug("TelemetryPacket built: speed={}, rpm={}, gear={}",
            packet.getSpeedKmh(), packet.getRpm(), packet.getGear());
        return packet;
    }

    private static float getFloatSafely(ByteBuffer buffer, int offset) {
        try {
            if (offset + 4 <= buffer.capacity()) {
                return buffer.getFloat(offset);
            }
        } catch (Exception ignored) {}
        return 0f;
    }

    private static int getIntSafely(ByteBuffer buffer, int offset) {
        try {
            if (offset + 4 <= buffer.capacity()) {
                return buffer.getInt(offset);
            }
        } catch (Exception ignored) {}
        return 0;
    }

    private static RaceDataPacket parseRaceDataPacket(ByteBuffer buffer, int sequenceNumber, LocalDateTime timestamp) {
        RaceDataPacket.RaceDataPacketBuilder builder = RaceDataPacket.builder()
                .packetType(PacketType.RACE_DATA)
                .timestamp(timestamp)
                .sequenceNumber(sequenceNumber);

        try {
            if (buffer.capacity() >= 28) {
                builder.lapNumber(getIntSafely(buffer, 12));
                builder.racePosition(getIntSafely(buffer, 16));
            }
        } catch (Exception e) {
            log.debug("Error parsing race data packet: {}", e.getMessage());
        }

        return builder.build();
    }

    private static TimingsPacket parseTimingsPacket(ByteBuffer buffer, int sequenceNumber, LocalDateTime timestamp) {
        TimingsPacket.TimingsPacketBuilder builder = TimingsPacket.builder()
                .packetType(PacketType.TIMINGS)
                .timestamp(timestamp)
                .sequenceNumber(sequenceNumber);

        try {
            if (buffer.capacity() >= 20) {
                builder.lapNumber(getIntSafely(buffer, 12));
                builder.currentLapTimeMs(getFloatSafely(buffer, 16));
            }
        } catch (Exception e) {
            log.debug("Error parsing timings packet: {}", e.getMessage());
        }

        return builder.build();
    }

    private static GameStatePacket parseGameStatePacket(ByteBuffer buffer, int sequenceNumber, LocalDateTime timestamp) {
        GameStatePacket.GameStatePacketBuilder builder = GameStatePacket.builder()
                .packetType(PacketType.GAME_STATE)
                .timestamp(timestamp)
                .sequenceNumber(sequenceNumber);

        try {
            if (buffer.capacity() >= 20) {
                builder.gameState(getIntSafely(buffer, 12));
                builder.sessionState(getIntSafely(buffer, 16));
            }
        } catch (Exception e) {
            log.debug("Error parsing game state packet: {}", e.getMessage());
        }

        return builder.build();
    }

    private static Packet parseParticipantsPacket(ByteBuffer buffer, int sequenceNumber, LocalDateTime timestamp) {
        log.debug("Participants packet received (sequence: {})", sequenceNumber);
        return null;
    }

    private static float normalizeUByte(int value) {
        return (value & 0xFF) / 255.0f;
    }

    private static float normalizeFuel(float value) {
        return value / 100.0f;
    }

    private static float normalizeSignedByte(int value) {
        return (value - 128) / 128.0f;
    }

    private static String readString(ByteBuffer buffer, int offset, int maxLength) {
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < maxLength; i++) {
            char c = (char) buffer.get(offset + i);
            if (c == '\0') break;
            if (Character.isISOControl(c)) break;
            sb.append(c);
        }
        return sb.toString().trim();
    }

    public static class Packet {
        private final PacketType type;
        private final Object data;

        public Packet(PacketType type, Object data) {
            this.type = type;
            this.data = data;
        }

        public PacketType getType() {
            return type;
        }

        @SuppressWarnings("unchecked")
        public <T> T getData(Class<T> clazz) {
            return clazz.cast(data);
        }
    }
}
