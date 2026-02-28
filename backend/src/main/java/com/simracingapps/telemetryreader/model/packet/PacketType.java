package com.simracingapps.telemetryreader.model.packet;

public enum PacketType {
    TELEMETRY(0, "Telemetry", 559),
    RACE_DATA(1, "Race Data", 308),
    PARTICIPANTS(2, "Participants", 1136),
    TIMINGS(3, "Timings", 1063),
    GAME_STATE(4, "Game State", 24);

    private final int id;
    private final String name;
    private final int expectedSize;

    PacketType(int id, String name, int expectedSize) {
        this.id = id;
        this.name = name;
        this.expectedSize = expectedSize;
    }

    public int getId() {
        return id;
    }

    public String getName() {
        return name;
    }

    public int getExpectedSize() {
        return expectedSize;
    }

    public static PacketType fromId(int id) {
        for (PacketType type : values()) {
            if (type.id == id) {
                return type;
            }
        }
        return null;
    }
}
