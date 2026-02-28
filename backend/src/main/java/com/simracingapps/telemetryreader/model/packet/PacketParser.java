package com.simracingapps.telemetryreader.model.packet;

import lombok.extern.slf4j.Slf4j;

import java.nio.ByteBuffer;
import java.nio.ByteOrder;
import java.time.LocalDateTime;

@Slf4j
public class PacketParser {

    private static final int PACKET_HEADER_SIZE = 24;
    private static final int MAX_PARTICIPANTS = 16;

    public static Object parse(byte[] data, int length) {
        if (data == null || length < PACKET_HEADER_SIZE) {
            log.warn("Invalid packet: too short ({} bytes)", length);
            return null;
        }

        ByteBuffer buffer = ByteBuffer.wrap(data, 0, length);
        buffer.order(ByteOrder.LITTLE_ENDIAN);

        int packetType = buffer.getInt(0);

        PacketType type = PacketType.fromId(packetType);
        if (type == null) {
            log.warn("Unknown packet type: {}", packetType);
            return null;
        }

        if (length < type.getExpectedSize()) {
            log.warn("Packet size mismatch for type {}: expected {}, got {}", 
                    type, type.getExpectedSize(), length);
        }

        int sequenceNumber = buffer.getInt(4);
        LocalDateTime timestamp = LocalDateTime.now();

        return switch (type) {
            case TELEMETRY -> parseTelemetryPacket(buffer, sequenceNumber, timestamp);
            case RACE_DATA -> parseRaceDataPacket(buffer, sequenceNumber, timestamp);
            case PARTICIPANTS -> parseParticipantsPacket(buffer, sequenceNumber, timestamp);
            case TIMINGS -> parseTimingsPacket(buffer, sequenceNumber, timestamp);
            case GAME_STATE -> parseGameStatePacket(buffer, sequenceNumber, timestamp);
        };
    }

    private static TelemetryPacket parseTelemetryPacket(ByteBuffer buffer, int sequenceNumber, LocalDateTime timestamp) {
        TelemetryPacket.TelemetryPacketBuilder builder = TelemetryPacket.builder()
                .packetType(PacketType.TELEMETRY)
                .timestamp(timestamp)
                .sequenceNumber(sequenceNumber);

        try {
            float speed = buffer.getFloat(24);
            builder.speedKmh(speed * 3.6f);

            float rpm = buffer.getFloat(28);
            builder.rpm(rpm);

            int gear = buffer.get(32);
            builder.gear(gear);

            builder.throttle(normalizeUByte(buffer.get(33)));
            builder.brake(normalizeUByte(buffer.get(34)));
            builder.steering(normalizeSignedByte(buffer.get(35)));

            builder.fuelLevel(normalizeUByte(buffer.get(36)));

            float[] tireTemps = new float[4];
            tireTemps[0] = buffer.getFloat(37);
            tireTemps[1] = buffer.getFloat(41);
            tireTemps[2] = buffer.getFloat(45);
            tireTemps[3] = buffer.getFloat(49);
            builder.tireTemps(tireTemps);

            float[] tirePressures = new float[4];
            tirePressures[0] = buffer.getFloat(53);
            tirePressures[1] = buffer.getFloat(57);
            tirePressures[2] = buffer.getFloat(61);
            tirePressures[3] = buffer.getFloat(65);
            builder.tirePressures(tirePressures);

            builder.engineTemp(buffer.getFloat(69));
            builder.oilTemp(buffer.getFloat(73));
            builder.waterTemp(buffer.getFloat(77));

            builder.posX(buffer.getFloat(81));
            builder.posY(buffer.getFloat(85));
            builder.posZ(buffer.getFloat(89));

            builder.pitch(buffer.getFloat(93));
            builder.roll(buffer.getFloat(97));
            builder.yaw(buffer.getFloat(101));

            builder.velocityX(buffer.getFloat(105));
            builder.velocityY(buffer.getFloat(109));
            builder.velocityZ(buffer.getFloat(113));

            builder.accelX(buffer.getFloat(117));
            builder.accelY(buffer.getFloat(121));
            builder.accelZ(buffer.getFloat(125));

            builder.wheelAngle(buffer.getFloat(129));

            builder.oilPressure(buffer.getFloat(153));

            float[] tireWear = new float[4];
            tireWear[0] = buffer.getFloat(233);
            tireWear[1] = buffer.getFloat(237);
            tireWear[2] = buffer.getFloat(241);
            tireWear[3] = buffer.getFloat(245);
            builder.tireWear(tireWear);

            int lapTimeMs = buffer.getInt(253);
            builder.lapTimeMs(lapTimeMs);

            int lapNumber = buffer.getInt(257);
            builder.lapNumber(lapNumber);

            builder.racePosition(buffer.get(261));

            int flags = buffer.get(262);
            builder.headlightsOn((flags & 0x01) != 0);
            builder.engineRunning((flags & 0x02) != 0);
            builder.pitLimiterOn((flags & 0x04) != 0);

            builder.carName(readString(buffer, 298, 64));
            builder.trackName(readString(buffer, 362, 64));

            float[] tireGrip = new float[4];
            tireGrip[0] = buffer.getFloat(475);
            tireGrip[1] = buffer.getFloat(479);
            tireGrip[2] = buffer.getFloat(483);
            tireGrip[3] = buffer.getFloat(487);
            builder.tireGrip(tireGrip);

        } catch (Exception e) {
            log.error("Error parsing telemetry packet", e);
        }

        return builder.build();
    }

    private static RaceDataPacket parseRaceDataPacket(ByteBuffer buffer, int sequenceNumber, LocalDateTime timestamp) {
        RaceDataPacket.RaceDataPacketBuilder builder = RaceDataPacket.builder()
                .packetType(PacketType.RACE_DATA)
                .timestamp(timestamp)
                .sequenceNumber(sequenceNumber);

        try {
            builder.lapNumber(buffer.getInt(24));
            builder.racePosition(buffer.getInt(28));
            builder.currentSector(buffer.getInt(32));
            builder.totalLaps(buffer.getInt(36));

            builder.raceTimeMs(buffer.getFloat(40));

            float[] lapTimesMs = new float[3];
            lapTimesMs[0] = buffer.getFloat(44);
            lapTimesMs[1] = buffer.getFloat(48);
            lapTimesMs[2] = buffer.getFloat(52);
            builder.lapTimesMs(lapTimesMs);

            builder.bestLapTimeMs(buffer.getFloat(56));
            builder.lastLapTimeMs(buffer.getFloat(60));

            builder.inPits(buffer.get(64) != 0);
            builder.isRacing(buffer.get(65) != 0);
            builder.isMenu(buffer.get(66) != 0);
            builder.isPaused(buffer.get(67) != 0);

            builder.numberOfParticipants(buffer.get(68));

        } catch (Exception e) {
            log.error("Error parsing race data packet", e);
        }

        return builder.build();
    }

    private static TimingsPacket parseTimingsPacket(ByteBuffer buffer, int sequenceNumber, LocalDateTime timestamp) {
        TimingsPacket.TimingsPacketBuilder builder = TimingsPacket.builder()
                .packetType(PacketType.TIMINGS)
                .timestamp(timestamp)
                .sequenceNumber(sequenceNumber);

        try {
            builder.lapNumber(buffer.getInt(24));
            builder.currentLapTimeMs(buffer.getFloat(28));
            builder.lastLapTimeMs(buffer.getFloat(32));
            builder.bestLapTimeMs(buffer.getFloat(36));
            builder.sessionTimeMs(buffer.getFloat(40));

        } catch (Exception e) {
            log.error("Error parsing timings packet", e);
        }

        return builder.build();
    }

    private static GameStatePacket parseGameStatePacket(ByteBuffer buffer, int sequenceNumber, LocalDateTime timestamp) {
        GameStatePacket.GameStatePacketBuilder builder = GameStatePacket.builder()
                .packetType(PacketType.GAME_STATE)
                .timestamp(timestamp)
                .sequenceNumber(sequenceNumber);

        try {
            builder.gameState(buffer.getInt(24));
            builder.sessionState(buffer.getInt(28));

            builder.ambientTemperature(buffer.getFloat(32));
            builder.trackTemperature(buffer.getFloat(36));
            builder.rainDensity(buffer.getFloat(40));
            builder.windSpeed(buffer.getFloat(44));
            builder.windDirectionX(buffer.getFloat(48));
            builder.windDirectionY(buffer.getFloat(52));

        } catch (Exception e) {
            log.error("Error parsing game state packet", e);
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
