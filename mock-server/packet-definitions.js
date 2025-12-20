/**
 * Project CARS UDP Packet Structure Definitions
 * Based on SMS_UDP_Definitions.hpp from pcars2-udp repository
 */

// UDP Configuration
const UDP_PORT = 5606;
const MAX_PACKET_SIZE = 1500;

// Packet Types
const PacketType = {
    CAR_PHYSICS: 0,
    RACE_DEFINITION: 1,
    PARTICIPANTS: 2,
    TIMINGS: 3,
    GAME_STATE: 4,
    WEATHER_STATE: 5,
    VEHICLE_NAMES: 6,
    TIME_STATS: 7,
    PARTICIPANT_VEHICLE_NAMES: 8
};

// Packet Base Structure (12 bytes)
class PacketBase {
    constructor(packetNumber = 0, categoryPacketNumber = 0, packetType = 0, packetVersion = 1) {
        this.mPacketNumber = packetNumber;
        this.mCategoryPacketNumber = categoryPacketNumber;
        this.mPartialPacketIndex = 0;
        this.mPartialPacketNumber = 1;
        this.mPacketType = packetType;
        this.mPacketVersion = packetVersion;
    }
}

// Car Physics Packet Type 0 (556 bytes total)
class TelemetryData {
    constructor() {
        this.sBase = new PacketBase(0, 0, PacketType.CAR_PHYSICS, 2);
        this.sViewedParticipantIndex = 0;
        this.sUnfilteredThrottle = 0;
        this.sUnfilteredBrake = 0;
        this.sUnfilteredSteering = 0;
        this.sUnfilteredClutch = 0;
        this.sCarFlags = 0;
        this.sOilTempCelsius = 80;
        this.sOilPressureKPa = 400;
        this.sWaterTempCelsius = 85;
        this.sWaterPressureKpa = 120;
        this.sFuelPressureKpa = 600;
        this.sFuelCapacity = 100;
        this.sBrake = 0;
        this.sThrottle = 0;
        this.sClutch = 0;
        this.sFuelLevel = 100;
        this.sSpeed = 0;
        this.sRpm = 1000;
        this.sMaxRpm = 8000;
        this.sSteering = 0;
        this.sGearNumGears = 6;
        this.sBoostAmount = 0;
        this.sCrashState = 0;
        this.sOdometerKM = 0;
        this.sOrientation = [0, 0, 0]; // pitch, roll, yaw
        this.sLocalVelocity = [0, 0, 0];
        this.sWorldVelocity = [0, 0, 0];
        this.sAngularVelocity = [0, 0, 0];
        this.sLocalAcceleration = [0, 0, 0];
        this.sWorldAcceleration = [0, 0, 0];
        this.sExtentsCentre = [0, 0, 0];
        this.sTyreFlags = [0, 0, 0, 0];
        this.sTerrain = [0, 0, 0, 0];
        this.sTyreY = [0, 0, 0, 0];
        this.sTyreRPS = [0, 0, 0, 0];
        this.sTyreTemp = [70, 70, 70, 70];
        this.sTyreHeightAboveGround = [0.2, 0.2, 0.2, 0.2];
        this.sTyreWear = [0, 0, 0, 0];
        this.sBrakeDamage = [0, 0, 0, 0];
        this.sSuspensionDamage = [0, 0, 0, 0];
        this.sBrakeTempCelsius = [50, 50, 50, 50];
        this.sTyreTreadTemp = [70, 70, 70, 70];
        this.sTyreLayerTemp = [60, 60, 60, 60];
        this.sTyreCarcassTemp = [55, 55, 55, 55];
        this.sWheelRPM = [0, 0, 0, 0];
        this.sWheelInPuddle = [0, 0, 0, 0];
        this.sWheelOnRumbleStrip = [0, 0, 0, 0];
        this.sWheelInSlipperyArea = [0, 0, 0, 0];
        this.sSurfaceRumble = [0, 0, 0];
        this.sTyreSlipSpeed = [0, 0, 0, 0];
        this.sTyreSlipAngle = [0, 0, 0, 0];
        this.sTyreCombinedSlip = [0, 0, 0, 0];
        this.sSuspensionTravel = [0, 0, 0, 0];
        this.sAirDensity = 1.2;
        this.sAirPressure = 101.3;
        this.sAerodynamicDrag = 0;
        this.sAerodynamicDownforce = 0;
    }
}

// Race Definition Packet Type 1 (308 bytes total)
class RaceData {
    constructor() {
        this.sBase = new PacketBase(0, 0, PacketType.RACE_DEFINITION, 1);
        this.mTrackLength = 5000;
        this.mNumParticipants = 1;
        this.mGameMode = 0;
        this.mGameSessionTimeLeft = 3600;
        this.mGameSessionTimeDuration = 3600;
        this.mPitSpeedLimit = 80;
        this.mGamePaused = 0;
        this.mIsGameOnline = 0;
        this.mGameWeather = 1;
        this.mTrackTemperature = 25;
        this.mAirTemperature = 20;
        this.mGameRainDensity = 0;
        this.mGameSnowDensity = 0;
        this.mServerRate = 60;
        this.mSessionType = 4;
        this.mCurrentLap = 0;
        this.mMaximumLaps = 0;
        this.mIsTimedRace = 1;
        this.mFinished = 0;
        this.mMaxRaceTime = 3600;
        this.mReplaySpeedMultiplier = 1;
        this.mIsRedFlag = 0;
        this.mIsYellowFlag = 0;
        this.mIsGreenFlag = 1;
        this.mIsWhiteFlag = 0;
        this.mIsGreenFlagLap = 0;
        this.mIsSector1 = 0;
        this.mIsSector2 = 0;
        this.mIsSector3 = 0;
        this.mIsLastLap = 0;
        this.mShouldPit = 0;
        this.mCurrentDriverIndex = 0;
        this.mSuggestedGear = 1;
        this.mUnfilteredThrottle = 0;
        this.mUnfilteredBrake = 0;
        this.mUnfilteredSteering = 0;
        this.mUnfilteredClutch = 0;
    }
}

module.exports = {
    UDP_PORT,
    MAX_PACKET_SIZE,
    PacketType,
    PacketBase,
    TelemetryData,
    RaceData
};