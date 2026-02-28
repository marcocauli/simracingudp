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

        // Create and send packets
        this.sendTelemetryPacket(telemetry, sessionTime);
        this.sendRaceDataPacket(telemetry, sessionTime);
        
        // Send less frequent packets
        if (Math.floor(sessionTime * 10) % 10 === 0) { // Every second
            this.sendParticipantsPacket(telemetry, sessionTime);
        }
        
        if (Math.floor(sessionTime * 2) % 2 === 0) { // Every 2 seconds
            this.sendTimingsPacket(telemetry, sessionTime);
        }
        
        if (Math.floor(sessionTime * 0.2) % 5 === 0) { // Every 5 seconds
            this.sendGameStatePacket(telemetry, sessionTime);
        }
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

        // Fill with realistic data
        packet.sViewedParticipantIndex = 0;
        packet.sUnfilteredThrottle = Math.floor(telemetry.throttle);
        packet.sUnfilteredBrake = Math.floor(telemetry.brake);
        packet.sUnfilteredSteering = Math.floor(telemetry.steering);
        packet.sUnfilteredClutch = 0;

        packet.sCarFlags = 0;
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
        packet.sSpeed = telemetry.speed;
        packet.sRpm = Math.floor(telemetry.rpm);
        packet.sMaxRpm = 8000;
        packet.sSteering = Math.floor(telemetry.steering);
        packet.sGearNumGears = 6;
        packet.sBoostAmount = 0;
        packet.sCrashState = 0;

        packet.sOdometerKM = telemetry.sessionTime * telemetry.speed / 3600;
        packet.sOrientation = [0, 0, 0]; // Simplified
        packet.sLocalVelocity = [telemetry.speed, 0, 0];
        packet.sWorldVelocity = [telemetry.speed, 0, 0];
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
        packet.mUnfilteredSteering = Math.floor(telemetry.steering);
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

        this.sendUdpPacket(packet);
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
            } else {
                // Create full buffer (simplified for demo)
                buffer = Buffer.alloc(600); // Simplified TelemetryData size
                let offset = 0;
                
                // Packet Base
                buffer.writeUInt32LE(packet.sBase.mPacketNumber, offset); offset += 4;
                buffer.writeUInt32LE(packet.sBase.mCategoryPacketNumber, offset); offset += 4;
                buffer.writeUInt8(packet.sBase.mPartialPacketIndex, offset); offset += 1;
                buffer.writeUInt8(packet.sBase.mPartialPacketNumber, offset); offset += 1;
                buffer.writeUInt8(packet.sBase.mPacketType, offset); offset += 1;
                buffer.writeUInt8(packet.sBase.mPacketVersion, offset); offset += 1;
                
                // Telemetry data (simplified)
                buffer.writeInt8(packet.sViewedParticipantIndex || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sUnfilteredThrottle || 0, offset); offset += 1;
                buffer.writeUInt8(packet.sUnfilteredBrake || 0, offset); offset += 1;
                buffer.writeInt8(packet.sUnfilteredSteering || 0, offset); offset += 1;
                
                // Add more fields as needed...
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
        updateRate: process.env.UPDATE_RATE ? parseInt(process.env.UPDATE_RATE) : 60,
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