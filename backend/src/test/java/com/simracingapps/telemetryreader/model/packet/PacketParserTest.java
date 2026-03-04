package com.simracingapps.telemetryreader.model.packet;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PacketParserTest {

    @Test
    void testParseInvalidPacket_NullData() {
        Object result = PacketParser.parse(null, 0);
        assertNull(result);
    }

    @Test
    void testParseInvalidPacket_TooShort() {
        byte[] data = new byte[10];
        Object result = PacketParser.parse(data, 10);
        assertNull(result);
    }

    @Test
    void testParseUnknownPacketType() {
        byte[] data = new byte[64];
        data[0] = 99; 
        data[1] = 0;
        data[2] = 0;
        data[3] = 0;
        
        Object result = PacketParser.parse(data, 64);
        assertNull(result);
    }

    @Test
    void testPacketTypeFromId() {
        assertEquals(PacketType.TELEMETRY, PacketType.fromId(0));
        assertEquals(PacketType.RACE_DATA, PacketType.fromId(1));
        assertEquals(PacketType.PARTICIPANTS, PacketType.fromId(2));
        assertEquals(PacketType.TIMINGS, PacketType.fromId(3));
        assertEquals(PacketType.GAME_STATE, PacketType.fromId(4));
        assertNull(PacketType.fromId(99));
    }

    @Test
    void testPacketTypeGetters() {
        assertEquals(0, PacketType.TELEMETRY.getId());
        assertEquals("Telemetry", PacketType.TELEMETRY.getName());
        assertEquals(559, PacketType.TELEMETRY.getExpectedSize());
    }
}
