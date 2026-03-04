/**
 * Racing Telemetry Mock Server
 * Generates realistic telemetry data for extended racing sessions
 */

const dgram = require('dgram');
const { PacketType, PacketBase, TelemetryData, RaceData } = require('./packet-definitions');
const RacingPhysicsEngine = require('./racing-physics-engine');

class RacingTelemetryMockServer {
    constructor(config = {}) {
        this.config = {
            udpPort: config.udpPort || 5606,
            targetHost: config.targetHost || '127.0.0.1',
            sessionType: config.sessionType || 'race', // hotlap, practice, qualifying, race
            sessionDuration: config.sessionDuration || 1800, // seconds
            updateRate: config.updateRate || 60, // Hz
            trackComplexity: config.trackComplexity || 'medium', // simple, medium, high
            enableTireDegradation: config.enableTireDegradation !== false,
            enableFuelConsumption: config.enableFuelConsumption !== false,
            enableWeatherChanges: config.enableWeatherChanges || false,
            aiDriversCount: config.aiDriversCount || 19,
            verbosity: config.verbosity || 'info'
        };

        this.socket = dgram.createSocket('udp4');
        this.physicsEngine = new RacingPhysicsEngine();
        this.isRunning = false;
        this.packetCounters = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
        this.startTime = null;
        this.lastUpdateTime = null;
        
        // Session configuration based on type
        this.configureSession();
    }

    /**
     * Normalize steering angle to 0-255 range
     * Clamps -90..+90 degrees to 0..255
     * Formula: (clampedSteering + 90) / 180 * 255
     */
    normalizeSteering(steeringDegrees) {
        const clamped = Math.max(-90, Math.min(90, steeringDegrees));
        return Math.round((clamped + 90) / 180 * 255);
    }

    /**
     * Configure session parameters based on session type
     */
    configureSession() {
        const sessionConfigs = {
            hotlap: {
                duration: 900, // 15 minutes
                name: "Hot Lap Session",
                description: "Single lap attempts for best lap time"
            },
            practice: {
                duration: 1800, // 30 minutes
                name: "Practice Session",
                description: "Free practice with fuel strategy simulation"
            },
            qualifying: {
                duration: 1500, // 25 minutes
                name: "Qualifying Session",
                description: "Qualifying for grid position"
            },
            race: {
                duration: 3600, // 60 minutes
                name: "Race Session",
                description: "Full race with strategy simulation"
            }
        };

        const sessionConfig = sessionConfigs[this.config.sessionType] || sessionConfigs.race;
        
        // Override duration if specified
        this.sessionConfig = {
            ...sessionConfig,
            duration: this.config.sessionDuration || sessionConfig.duration
        };

        console.log(`🏁 Session Configuration: ${this.sessionConfig.name}`);
        console.log(`⏱️  Duration: ${this.sessionConfig.duration}s (${Math.floor(this.sessionConfig.duration / 60)} minutes)`);
        console.log(`📊 Update Rate: ${this.config.updateRate} Hz`);
    }

    /**
     * Start the mock server
     */
    start() {
        if (this.isRunning) {
            console.log('⚠️  Mock server is already running');
            return;
        }

        this.isRunning = true;
        this.startTime = Date.now();
        this.lastUpdateTime = Date.now();
        this.physicsEngine.resetSession();

        console.log(`🚀 Starting Racing Telemetry Mock Server...`);
        console.log(`📡 Sending UDP packets to ${this.config.targetHost}:${this.config.udpPort}`);
        console.log(`🎯 Session Type: ${this.config.sessionType}`);

        // Start packet generation loop
        this.packetGenerationInterval = setInterval(() => {
            this.generateAndSendPackets();
        }, 1000 / this.config.updateRate);

        // Start session monitoring
        this.sessionMonitorInterval = setInterval(() => {
            this.monitorSession();
        }, 1000);

        // Handle server errors
        this.socket.on('error', (err) => {
            console.error('❌ UDP Socket error:', err);
        });

        console.log('✅ Mock server started successfully');
    }

    /**
     * Stop the mock server
     */
    stop() {
        if (!this.isRunning) {
            console.log('⚠️  Mock server is not running');
            return;
        }

        this.isRunning = false;

        if (this.packetGenerationInterval) {
            clearInterval(this.packetGenerationInterval);
        }

        if (this.sessionMonitorInterval) {
            clearInterval(this.sessionMonitorInterval);
        }

        console.log('🏁 Mock server stopped');
        this.printSessionSummary();
    }

    /**
     * Generate and send UDP packets for current frame
     */
    generateAndSendPackets() {
        const currentTime = Date.now();
        const deltaTime = (currentTime - this.lastUpdateTime) / 1000; // seconds
        this.lastUpdateTime = currentTime;

        const sessionTime = (currentTime - this.startTime) / 1000; // seconds

        // Check if session should end
        if (sessionTime >= this.sessionConfig.duration) {
            this.stop();
            return;
        }

        // Generate telemetry data
        const telemetry = this.physicsEngine.generateTelemetryData(deltaTime);

        // Create and send packets - ONLY TELEMETRY for now (simplified debugging)
        this.sendTelemetryPacket(telemetry, sessionTime);
        
        // TEMPORARILY DISABLED for debugging:
        // this.sendRaceDataPacket(telemetry, sessionTime);
        
        // Send less frequent packets - DISABLED for debugging
        // if (Math.floor(sessionTime * 10) % 10 === 0) { // Every second
        //     this.sendParticipantsPacket(telemetry, sessionTime);
        // }
        // 
        // if (Math.floor(sessionTime * 2) % 2 === 0) { // Every 2 seconds
        //     this.sendTimingsPacket(telemetry, sessionTime);
        // }
        // 
        // if (Math.floor(sessionTime * 0.2) % 5 === 0) { // Every 5 seconds
        //     this.sendGameStatePacket(telemetry, sessionTime);
        // }
    }

    /**
     * Send Telemetry Data Packet (Type 0)
     */
    sendTelemetryPacket(telemetry, sessionTime) {
        const packet = new TelemetryData();
        
        // Update packet counters
        this.packetCounters[0]++;
        packet.sBase.mPacketNumber = this.packetCounters[0];
        packet.sBase.mCategoryPacketNumber = this.packetCounters[0];
        packet.sBase.mPacketType = PacketType.CAR_PHYSICS;

        // DEBUG: Log telemetry values
        console.log(`[TELEMETRY] speed=${telemetry.speed}, rpm=${telemetry.rpm}, throttle=${telemetry.throttle}, brake=${telemetry.brake}, fuel=${telemetry.fuelLevel}`);
        
        // Fill with realistic data
        packet.sViewedParticipantIndex = 0;
        packet.sUnfilteredThrottle = Math.floor(telemetry.throttle);
        packet.sUnfilteredBrake = Math.floor(telemetry.brake);
        packet.sUnfilteredSteering = this.normalizeSteering(telemetry.steering);
        packet.sUnfilteredClutch = 0;

        packet.sCarFlags = 0;
        packet.sCarFlags2 = 0;
        packet.sOilTempCelsius = 80 + Math.random() * 20;
        packet.sOilPressureKPa = 350 + Math.random() * 100;
        packet.sWaterTempCelsius = 85 + Math.random() * 15;
        packet.sWaterPressureKpa = 100 + Math.random() * 50;
        packet.sFuelPressureKpa = 550 + Math.random() * 100;

        packet.sFuelCapacity = 100;
        packet.sBrake = Math.floor(telemetry.brake);
        packet.sThrottle = Math.floor(telemetry.throttle);
        packet.sClutch = 0;

        packet.sFuelLevel = telemetry.fuelLevel;
        packet.sSpeed = telemetry.speed / 3.6; // Convert km/h to m/s
        packet.sRpm = Math.floor(telemetry.rpm);
        packet.sMaxRpm = 8000;
        packet.sSteering = this.normalizeSteering(telemetry.steering);
        packet.sCurrentGear = telemetry.gear;
        packet.sGearNumGears = 6;
        packet.sBoostAmount = 0;
        packet.sCrashState = 0;

        packet.sOdometerKM = telemetry.sessionTime * telemetry.speed / 3600;
        packet.sOrientation = [0, 0, 0]; // Simplified
        packet.sLocalVelocity = [telemetry.speed / 3.6, 0, 0]; // Convert km/h to m/s
        packet.sWorldVelocity = [telemetry.speed / 3.6, 0, 0];
        packet.sAngularVelocity = [0, 0, telemetry.steering * 0.1];
        packet.sLocalAcceleration = [telemetry.longitudinalG, telemetry.lateralG, 0];
        packet.sWorldAcceleration = [telemetry.longitudinalG, telemetry.lateralG, 0];
        packet.sExtentsCentre = [0, 0, 0];

        // Tire data
        packet.sTyreFlags = [0, 0, 0, 0];
        packet.sTerrain = [0, 0, 0, 0];
        packet.sTyreY = [0, 0, 0, 0];
        packet.sTyreRPS = [telemetry.rpm / 60 / 10, telemetry.rpm / 60 / 10, telemetry.rpm / 60 / 10, telemetry.rpm / 60 / 10];
        packet.sTyreTemp = (telemetry.tireTemps || [70, 70, 70, 70]).map(t => Math.floor(t));
        packet.sTyreHeightAboveGround = [0.2, 0.2, 0.2, 0.2];
        packet.sTyreWear = (telemetry.tireWear || [0, 0, 0, 0]).map(w => Math.floor(w));
        packet.sBrakeDamage = [0, 0, 0, 0];
        packet.sSuspensionDamage = [0, 0, 0, 0];
        packet.sBrakeTempCelsius = (telemetry.brakeTemps || [50, 50, 50, 50]).map(b => Math.floor(b));
        packet.sTyreTreadTemp = (telemetry.tireTemps || [70, 70, 70, 70]).map(t => Math.floor(t * 1.1));
        packet.sTyreLayerTemp = (telemetry.tireTemps || [70, 70, 70, 70]).map(t => Math.floor(t * 0.9));
        packet.sTyreCarcassTemp = (telemetry.tireTemps || [70, 70, 70, 70]).map(t => Math.floor(t * 0.8));
        packet.sWheelRPM = [telemetry.rpm / 10, telemetry.rpm / 10, telemetry.rpm / 10, telemetry.rpm / 10];
        packet.sWheelInPuddle = [0, 0, 0, 0];
        packet.sWheelOnRumbleStrip = [0, 0, 0, 0];
        packet.sWheelInSlipperyArea = [0, 0, 0, 0];
        packet.sSurfaceRumble = [0, 0];
        packet.sTyreSlipSpeed = [0, 0, 0, 0];
        packet.sTyreSlipAngle = [0, 0, 0, 0];
        packet.sTyreCombinedSlip = [0, 0, 0, 0];
        packet.sSuspensionTravel = [0, 0, 0, 0];
        packet.sAirDensity = 1.2;
        packet.sAirPressure = 101.3;
        packet.sAerodynamicDrag = telemetry.speed * 0.5;
        packet.sAerodynamicDownforce = telemetry.speed * 0.8;

        // Send packet
        this.sendUdpPacket(packet);
    }

    /**
     * Send Race Data Packet (Type 1)
     */
    sendRaceDataPacket(telemetry, sessionTime) {
        const packet = new RaceData();
        
        this.packetCounters[1]++;
        packet.sBase.mPacketNumber = this.packetCounters[1];
        packet.sBase.mCategoryPacketNumber = this.packetCounters[1];
        packet.sBase.mPacketType = PacketType.RACE_DEFINITION;

        packet.mTrackLength = 5000;
        packet.mNumParticipants = 1 + this.config.aiDriversCount;
        packet.mGameMode = 0;
        packet.mGameSessionTimeLeft = Math.max(0, this.sessionConfig.duration - sessionTime);
        packet.mGameSessionTimeDuration = this.sessionConfig.duration;
        packet.mPitSpeedLimit = 80;
        packet.mGamePaused = 0;
        packet.mIsGameOnline = 0;
        packet.mGameWeather = 1;
        packet.mTrackTemperature = 25 + Math.random() * 5;
        packet.mAirTemperature = 20 + Math.random() * 3;
        packet.mGameRainDensity = 0;
        packet.mGameSnowDensity = 0;
        packet.mServerRate = this.config.updateRate;
        packet.mSessionType = this.getSessionTypeCode();
        packet.mCurrentLap = telemetry.lapNumber;
        packet.mMaximumLaps = Math.floor(this.sessionConfig.duration / 120); // Approximate
        packet.mIsTimedRace = 1;
        packet.mFinished = 0;
        packet.mMaxRaceTime = this.sessionConfig.duration;
        packet.mReplaySpeedMultiplier = 1;
        packet.mIsRedFlag = 0;
        packet.mIsYellowFlag = 0;
        packet.mIsGreenFlag = 1;
        packet.mIsWhiteFlag = 0;
        packet.mIsGreenFlagLap = telemetry.lapNumber === 1;
        packet.mIsSector1 = telemetry.currentSector === 1;
        packet.mIsSector2 = telemetry.currentSector === 2;
        packet.mIsSector3 = telemetry.currentSector === 3;
        packet.mIsLastLap = sessionTime > this.sessionConfig.duration - 120;
        packet.mShouldPit = telemetry.fuelLevel < 20 || Math.max(...telemetry.tireWear) > 80;
        packet.mCurrentDriverIndex = 0;
        packet.mSuggestedGear = telemetry.gear;
        packet.mUnfilteredThrottle = Math.floor(telemetry.throttle);
        packet.mUnfilteredBrake = Math.floor(telemetry.brake);
        packet.mUnfilteredSteering = this.normalizeSteering(telemetry.steering);
        packet.mUnfilteredClutch = 0;
        
        // Sector times
        packet.mCurrentSector1Time = telemetry.sector1Time || 0;
        packet.mCurrentSector2Time = telemetry.sector2Time || 0;
        packet.mCurrentSector3Time = telemetry.sector3Time || 0;
        packet.mLastLapTime = telemetry.lastLapTime || 0;
        packet.mLastSector1Time = telemetry.lastSector1Time || 0;
        packet.mLastSector2Time = telemetry.lastSector2Time || 0;
        packet.mLastSector3Time = telemetry.lastSector3Time || 0;
        packet.mBestLapTime = telemetry.bestLapTime || 0;
        packet.mBestSector1Time = telemetry.bestSector1Time || 0;
        packet.mBestSector2Time = telemetry.bestSector2Time || 0;
        packet.mBestSector3Time = telemetry.bestSector3Time || 0;

        this.sendUdpPacket(packet, true);
    }

    /**
     * Send Participants Packet (Type 2)
     */
    sendParticipantsPacket(telemetry, sessionTime) {
        // Simplified participants packet
        const packet = {
            sBase: new PacketBase(++this.packetCounters[2], this.packetCounters[2], PacketType.PARTICIPANTS, 1),
            sNumParticipants: 1 + this.config.aiDriversCount
        };

        this.sendUdpPacket(packet, true); // Send as simplified packet
    }

    /**
     * Send Timings Packet (Type 3)
     */
    sendTimingsPacket(telemetry, sessionTime) {
        const packet = {
            sBase: new PacketBase(++this.packetCounters[3], this.packetCounters[3], PacketType.TIMINGS, 1),
            sNumParticipants: 1 + this.config.aiDriversCount
        };

        this.sendUdpPacket(packet, true);
    }

    /**
     * Send Game State Packet (Type 4)
     */
    sendGameStatePacket(telemetry, sessionTime) {
        const packet = {
            sBase: new PacketBase(++this.packetCounters[4], this.packetCounters[4], PacketType.GAME_STATE, 1),
            mGameState: 2, // Race
            mCurrentLap: telemetry.lapNumber,
            mSessionTime: sessionTime
        };

        this.sendUdpPacket(packet, true);
    }

    /**
     * Send UDP packet to target
     */
    sendUdpPacket(packet, simplified = false) {
        try {
            let buffer;
            
            if (simplified) {
                // Create simplified buffer for demonstration
                buffer = Buffer.alloc(64); // Simplified size
                buffer.writeUInt32LE(packet.sBase.mPacketNumber, 0);
                buffer.writeUInt32LE(packet.sBase.mCategoryPacketNumber, 4);
                buffer.writeUInt8(packet.sBase.mPacketType, 8);
                buffer.writeUInt8(packet.sBase.mPacketVersion, 9);
                
                // DEBUG: Log buffer hex for simplified packets
                console.log(`[BUFFER HEX SIMPLIFIED] first 32 bytes: ${buffer.slice(0, 32).toString('hex')}`);
            } else {
                // Create full buffer with all telemetry data
                buffer = Buffer.alloc(600);
                let offset = 0;
                
                // DEBUG: Log what we're about to write
                console.log(`[SEND UDP] speed=${packet.sSpeed}, rpm=${packet.sRpm}, throttle=${packet.sThrottle}, brake=${packet.sBrake}, gear=${packet.sCurrentGear}, steering=${packet.sSteering}, tireWear=${packet.sTyreWear}, tireTemp=${packet.sTyreTemp}, fuel=${packet.sFuelLevel}`);
                
                // Packet Base (12 bytes)
                buffer.writeUInt32LE(packet.sBase.mPacketNumber, offset); offset += 4;
                buffer.writeUInt32LE(packet.sBase.mCategoryPacketNumber, offset); offset += 4;
                buffer.writeUInt8(packet.sBase.mPartialPacketIndex || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sBase.mPartialPacketNumber || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sBase.mPacketType, offset); offset += 1;
                buffer.writeUInt8(packet.sBase.mPacketVersion || 21, offset); offset += 1;
                
                // Participant index + controls (4 bytes)
                buffer.writeUInt8(packet.sViewedParticipantIndex || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sUnfilteredThrottle || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sUnfilteredBrake || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sUnfilteredSteering || 0, offset); offset += 1;
                
                // Car flags (4 bytes)
                buffer.writeUInt32LE(packet.sCarFlags || 0, offset); offset += 4;
                
                // Engine & liquids temps (24 bytes)
                buffer.writeInt16LE(Math.max(0, packet.sOilTempCelsius || 0), offset); offset += 2;
                buffer.writeUInt16LE(packet.sOilPressureKPa || 0, offset); offset += 2;
                buffer.writeInt16LE(Math.max(0, packet.sWaterTempCelsius || 0), offset); offset += 2;
                buffer.writeUInt16LE(packet.sWaterPressureKpa || 0, offset); offset += 2;
                buffer.writeUInt16LE(packet.sFuelPressureKpa || 0, offset); offset += 2;
                buffer.writeUInt8(packet.sCarFlags2 || 0, offset); offset += 1;
                buffer.writeUInt8(0, offset); offset += 1; // padding
                buffer.writeUInt16LE(packet.sFuelCapacity || 100, offset); offset += 2;
                buffer.writeUInt8(packet.sBrake || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sThrottle || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sClutch || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sSteering || 0, offset); offset += 1;
                const currentGear = packet.sCurrentGear || 0;
                const numGears = packet.sGearNumGears || 6;
                const combinedGear = (currentGear & 0x0F) | ((numGears & 0x0F) << 4);
                buffer.writeUInt8(combinedGear, offset); offset += 1;
                buffer.writeUInt8(packet.sBoostAmount || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sCrashState || 0, offset); offset += 1;
                
                // Padding (4 bytes) - offset 41-44
                buffer.writeUInt32LE(0, offset); offset += 4;
                
                // Fuel, speed, RPM (12 bytes)
                buffer.writeFloatLE(packet.sFuelLevel || 100, offset); offset += 4;
                buffer.writeFloatLE(packet.sSpeed || 0, offset); offset += 4;
                buffer.writeUInt16LE(packet.sRpm || 0, offset); offset += 2;
                buffer.writeUInt16LE(packet.sMaxRpm || 8000, offset); offset += 2;
                
                // Orientation (12 bytes)
                buffer.writeFloatLE(packet.sOrientation ? packet.sOrientation[0] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sOrientation ? packet.sOrientation[1] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sOrientation ? packet.sOrientation[2] : 0, offset); offset += 4;
                
                // Local velocity (12 bytes)
                buffer.writeFloatLE(packet.sLocalVelocity ? packet.sLocalVelocity[0] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sLocalVelocity ? packet.sLocalVelocity[1] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sLocalVelocity ? packet.sLocalVelocity[2] : 0, offset); offset += 4;
                
                // World velocity (12 bytes)
                buffer.writeFloatLE(packet.sWorldVelocity ? packet.sWorldVelocity[0] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sWorldVelocity ? packet.sWorldVelocity[1] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sWorldVelocity ? packet.sWorldVelocity[2] : 0, offset); offset += 4;
                
                // Angular velocity (12 bytes)
                buffer.writeFloatLE(packet.sAngularVelocity ? packet.sAngularVelocity[0] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sAngularVelocity ? packet.sAngularVelocity[1] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sAngularVelocity ? packet.sAngularVelocity[2] : 0, offset); offset += 4;
                
                // Local acceleration (12 bytes)
                buffer.writeFloatLE(packet.sLocalAcceleration ? packet.sLocalAcceleration[0] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sLocalAcceleration ? packet.sLocalAcceleration[1] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sLocalAcceleration ? packet.sLocalAcceleration[2] : 0, offset); offset += 4;
                
                // World acceleration (12 bytes)
                buffer.writeFloatLE(packet.sWorldAcceleration ? packet.sWorldAcceleration[0] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sWorldAcceleration ? packet.sWorldAcceleration[1] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sWorldAcceleration ? packet.sWorldAcceleration[2] : 0, offset); offset += 4;
                
                // Extents centre (12 bytes)
                buffer.writeFloatLE(packet.sExtentsCentre ? packet.sExtentsCentre[0] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sExtentsCentre ? packet.sExtentsCentre[1] : 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sExtentsCentre ? packet.sExtentsCentre[2] : 0, offset); offset += 4;
                
                // Tire data (offset ~145 onwards)
                // sTyreFlags (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeUInt8(packet.sTyreFlags ? packet.sTyreFlags[i] : 0, offset); offset += 1;
                }
                
                // sTerrain (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeUInt8(packet.sTerrain ? packet.sTerrain[i] : 0, offset); offset += 1;
                }
                
                // sTyreY (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sTyreY ? packet.sTyreY[i] : 0, offset); offset += 4;
                }
                
                // sTyreRPS (4 floats = 16 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sTyreRPS ? packet.sTyreRPS[i] : 0, offset); offset += 4;
                }
                
                // sTyreTemp (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeUInt8(Math.max(0, packet.sTyreTemp ? packet.sTyreTemp[i] : 0), offset); offset += 1;
                }
                
                // sTyreHeightAboveGround (4 floats = 16 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sTyreHeightAboveGround ? packet.sTyreHeightAboveGround[i] : 0.2, offset); offset += 4;
                }
                
                // sTyreWear (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeUInt8(packet.sTyreWear ? packet.sTyreWear[i] : 0, offset); offset += 1;
                }
                
                // sBrakeDamage (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeUInt8(packet.sBrakeDamage ? packet.sBrakeDamage[i] : 0, offset); offset += 1;
                }
                
                // sSuspensionDamage (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeUInt8(packet.sSuspensionDamage ? packet.sSuspensionDamage[i] : 0, offset); offset += 1;
                }
                
                // sBrakeTempCelsius (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeUInt8(packet.sBrakeTempCelsius ? packet.sBrakeTempCelsius[i] : 0, offset); offset += 1;
                }
                
                // sTyreTreadTemp (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeUInt8(packet.sTyreTreadTemp ? packet.sTyreTreadTemp[i] : 0, offset); offset += 1;
                }
                
                // sTyreLayerTemp (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeUInt8(packet.sTyreLayerTemp ? packet.sTyreLayerTemp[i] : 0, offset); offset += 1;
                }
                
                // sTyreCarcassTemp (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeUInt8(packet.sTyreCarcassTemp ? packet.sTyreCarcassTemp[i] : 0, offset); offset += 1;
                }
                
                // sWheelRPM (4 floats = 16 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sWheelRPM ? packet.sWheelRPM[i] : 0, offset); offset += 4;
                }
                
                // sWheelInPuddle (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sWheelInPuddle ? packet.sWheelInPuddle[i] : 0, offset); offset += 4;
                }
                
                // sWheelOnRumbleStrip (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sWheelOnRumbleStrip ? packet.sWheelOnRumbleStrip[i] : 0, offset); offset += 4;
                }
                
                // sWheelInSlipperyArea (4 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sWheelInSlipperyArea ? packet.sWheelInSlipperyArea[i] : 0, offset); offset += 4;
                }
                
                // sSurfaceRumble (2 bytes)
                for (let i = 0; i < 2; i++) {
                    buffer.writeFloatLE(packet.sSurfaceRumble ? packet.sSurfaceRumble[i] : 0, offset); offset += 4;
                }
                
                // sTyreSlipSpeed (4 floats = 16 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sTyreSlipSpeed ? packet.sTyreSlipSpeed[i] : 0, offset); offset += 4;
                }
                
                // sTyreSlipAngle (4 floats = 16 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sTyreSlipAngle ? packet.sTyreSlipAngle[i] : 0, offset); offset += 4;
                }
                
                // sTyreCombinedSlip (4 floats = 16 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sTyreCombinedSlip ? packet.sTyreCombinedSlip[i] : 0, offset); offset += 4;
                }
                
                // sSuspensionTravel (4 floats = 16 bytes)
                for (let i = 0; i < 4; i++) {
                    buffer.writeFloatLE(packet.sSuspensionTravel ? packet.sSuspensionTravel[i] : 0, offset); offset += 4;
                }
                
                // Air density, pressure, aero (12 bytes)
                buffer.writeFloatLE(packet.sAirDensity || 1.2, offset); offset += 4;
                buffer.writeFloatLE(packet.sAirPressure || 101.3, offset); offset += 4;
                buffer.writeFloatLE(packet.sAerodynamicDrag || 0, offset); offset += 4;
                buffer.writeFloatLE(packet.sAerodynamicDownforce || 0, offset); offset += 4;
                
                // Odometer (4 bytes)
                buffer.writeFloatLE(packet.sOdometerKM || 0, offset); offset += 4;
                
                // DEBUG: Log buffer hex for full packets
                console.log(`[BUFFER HEX FULL] first 32 bytes: ${buffer.slice(0, 32).toString('hex')}`);
            }

            this.socket.send(buffer, this.config.udpPort, this.config.targetHost, (err) => {
                if (err && this.config.verbosity === 'debug') {
                    console.error('❌ UDP Send error:', err);
                }
            });

        } catch (error) {
            console.error('❌ Packet creation error:', error);
        }
    }

    /**
     * Monitor session progress
     */
    monitorSession() {
        const sessionTime = (Date.now() - this.startTime) / 1000;
        const progress = (sessionTime / this.sessionConfig.duration) * 100;
        
        if (this.config.verbosity !== 'quiet') {
            const telemetry = this.physicsEngine.generateTelemetryData(0);
            process.stdout.write(`\r⏱️  ${Math.floor(sessionTime)}s | ${progress.toFixed(1)}% | Lap ${telemetry.lapNumber} | Speed: ${telemetry.speed.toFixed(1)} km/h | RPM: ${Math.floor(telemetry.rpm)} | Fuel: ${telemetry.fuelLevel.toFixed(1)}%`);
        }
    }

    /**
     * Get session type code
     */
    getSessionTypeCode() {
        const codes = {
            practice: 1,
            qualifying: 2,
            race: 4,
            hotlap: 6
        };
        return codes[this.config.sessionType] || 4;
    }

    /**
     * Print session summary
     */
    printSessionSummary() {
        console.log('\n\n🏁 Session Complete!');
        console.log('=' .repeat(50));
        console.log(`Session Type: ${this.sessionConfig.name}`);
        console.log(`Duration: ${Math.floor((Date.now() - this.startTime) / 1000)} seconds`);
        console.log(`Packets Sent: ${Object.values(this.packetCounters).reduce((a, b) => a + b, 0)}`);
        console.log('=' .repeat(50));
    }

    /**
     * Graceful shutdown
     */
    shutdown() {
        console.log('\n🛑 Shutting down mock server...');
        this.stop();
        this.socket.close();
        process.exit(0);
    }
}

// CLI interface
function main() {
    const config = {
        udpPort: process.env.UDP_PORT ? parseInt(process.env.UDP_PORT) : 5606,
        targetHost: process.env.TARGET_HOST || '127.0.0.1',
        sessionType: process.env.SESSION_TYPE || 'race',
        sessionDuration: process.env.SESSION_DURATION ? parseInt(process.env.SESSION_DURATION) : 1800,
        updateRate: process.env.UPDATE_RATE ? parseFloat(process.env.UPDATE_RATE) : 60,
        trackComplexity: process.env.TRACK_COMPLEXITY || 'medium',
        enableTireDegradation: process.env.ENABLE_TIRE_DEGRADATION !== 'false',
        enableFuelConsumption: process.env.ENABLE_FUEL_CONSUMPTION !== 'false',
        enableWeatherChanges: process.env.ENABLE_WEATHER_CHANGES === 'true',
        aiDriversCount: process.env.AI_DRIVERS_COUNT ? parseInt(process.env.AI_DRIVERS_COUNT) : 19,
        verbosity: process.env.VERBOSITY || 'info'
    };

    console.log('🏁 Racing Telemetry Mock Server');
    console.log('================================');
    console.log(`Session Type: ${config.sessionType}`);
    console.log(`Duration: ${config.sessionDuration}s (${Math.floor(config.sessionDuration / 60)} minutes)`);
    console.log(`Update Rate: ${config.updateRate} Hz`);
    console.log(`Target: ${config.targetHost}:${config.udpPort}`);
    console.log('================================\n');

    const server = new RacingTelemetryMockServer(config);

    // Handle graceful shutdown
    process.on('SIGINT', () => server.shutdown());
    process.on('SIGTERM', () => server.shutdown());

    // Start server
    server.start();
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = RacingTelemetryMockServer;