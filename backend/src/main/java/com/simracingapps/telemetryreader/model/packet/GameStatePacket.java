package com.simracingapps.telemetryreader.model.packet;

import lombok.Builder;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Builder
public class GameStatePacket {
    private PacketType packetType;
    private LocalDateTime timestamp;
    private int sequenceNumber;

    private int gameState;
    private int sessionState;
    private float ambientTemperature;
    private float trackTemperature;
    private float rainDensity;
    private float windSpeed;
    private float windDirectionX;
    private float windDirectionY;

    public static final int GAME_STATE_EXIT = 0;
    public static final int GAME_STATE_MAIN_MENU = 1;
    public static final int GAME_STATE_RACE = 2;
    public static final int GAME_STATE_TIME_TRIAL = 3;
    public static final int GAME_STATE_SERVER_BROWSER = 4;
    public static final int GAME_STATE_SEASON_SELECT = 5;
    public static final int GAME_STATE_EVENT = 6;

    public static final int SESSION_STATE_INVALID = 0;
    public static final int SESSION_STATE_BUILDUP = 1;
    public static final int SESSION_STATE_GRID = 2;
    public static final int SESSION_STATE_RACING = 3;
    public static final int SESSION_STATE_FINISHED = 4;
}
