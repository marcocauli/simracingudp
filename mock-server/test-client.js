/**
 * Test Client for Racing Telemetry Mock Server
 * Receives and validates UDP packets from mock server
 */

const dgram = require('dgram');
const { PacketType } = require('./packet-definitions');

class TestClient {
    constructor(port = 5606) {
        this.port = port;
        this.socket = dgram.createSocket('udp4');
        this.packetsReceived = { 0: 0, 1: 0, 2: 0, 3: 0, 4: 0 };
        this.lastPacketTime = null;
        this.startTime = Date.now();
    }

    start() {
        console.log(`🔌 Starting test client on port ${this.port}`);
        console.log('Listening for UDP packets...\n');

        this.socket.on('message', (msg, rinfo) => {
            this.handlePacket(msg, rinfo);
        });

        this.socket.on('error', (err) => {
            console.error('❌ Socket error:', err);
        });

        this.socket.on('listening', () => {
            console.log(`✅ Test client listening on port ${this.port}`);
            console.log('Waiting for packets from mock server...\n');
        });

        this.socket.bind(this.port);

        // Print periodic statistics
        setInterval(() => {
            this.printStatistics();
        }, 5000);
    }

    handlePacket(msg, rinfo) {
        const now = Date.now();
        const packetType = msg[10]; // Packet type is at offset 10
        
        this.packetsReceived[packetType] = (this.packetsReceived[packetType] || 0) + 1;
        this.lastPacketTime = now;

        // Parse basic packet info
        const packetNumber = msg.readUInt32LE(0);
        const categoryPacketNumber = msg.readUInt32LE(4);
        const packetVersion = msg[11];
        const packetSize = msg.length;

        // Print packet info
        const typeNames = ['Telemetry', 'Race', 'Participants', 'Timings', 'GameState'];
        const typeName = typeNames[packetType] || `Unknown(${packetType})`;

        console.log(`📦 ${typeName} Packet | Size: ${packetSize}B | #:${packetNumber} | Cat:#${categoryPacketNumber} | From: ${rinfo.address}:${rinfo.port}`);

        // Validate packet structure
        this.validatePacket(msg, packetType);
        
        // Validate telemetry fields if it's a telemetry packet
        if (packetType === 0) {
            this.validateTelemetry(msg);
        }
    }

    validatePacket(msg, packetType) {
        const expectedSizes = {
            [PacketType.CAR_PHYSICS]: 600,
            [PacketType.RACE_DEFINITION]: 308,
            [PacketType.PARTICIPANTS]: 1136,
            [PacketType.TIMINGS]: 1063,
            [PacketType.GAME_STATE]: 24
        };

        const expectedSize = expectedSizes[packetType];
        const actualSize = msg.length;

        if (expectedSize && Math.abs(actualSize - expectedSize) > 50) { // Allow some tolerance
            console.log(`⚠️  Warning: Packet size mismatch. Expected: ~${expectedSize}B, Got: ${actualSize}B`);
        }

        // Check packet header
        if (actualSize < 12) {
            console.log(`❌ Error: Packet too small (${actualSize}B), minimum required: 12B`);
            return;
        }

        // Validate packet sequence
        const packetNumber = msg.readUInt32LE(0);
        if (packetNumber === 0 && this.packetsReceived[packetType] > 1) {
            console.log(`🔄 Packet sequence reset detected for type ${packetType}`);
        }
    }

    validateTelemetry(msg) {
        console.log('\n📋 TELEMETRY VALIDATION');
        console.log('='.repeat(50));
        
        const packetNumber = msg.readUInt32LE(0);
        const categoryPacketNumber = msg.readUInt32LE(4);
        const partialPacketIndex = msg[8];
        const partialPacketNumber = msg[9];
        const packetType = msg[10];
        const packetVersion = msg[11];
        
        console.log(`Header: packetNum=${packetNumber}, catPkgNum=${categoryPacketNumber}`);
        console.log(`         type=${packetType}, version=${packetVersion}`);
        
        const viewedParticipantIndex = msg[12];
        const unfilteredThrottle = msg[13];
        const unfilteredBrake = msg[14];
        const unfilteredSteering = msg.readInt8(15);
        console.log(`Controls: viewedIdx=${viewedParticipantIndex}, unfThrottle=${unfilteredThrottle}, unfBrake=${unfilteredBrake}, unfSteer=${unfilteredSteering}`);
        
        const carFlags = msg.readUInt32LE(16);
        console.log(`CarFlags: ${carFlags}`);
        
        const oilTemp = msg.readInt16LE(20);
        const oilPressure = msg.readUInt16LE(22);
        const waterTemp = msg.readInt16LE(24);
        const waterPressure = msg.readUInt16LE(26);
        const fuelPressure = msg.readUInt16LE(28);
        const carFlags2 = msg[30];
        const padding31 = msg[31];
        const fuelCapacity = msg.readUInt16LE(32);
        console.log(`Engine: oilTemp=${oilTemp}°C, oilPress=${oilPressure}kPa, waterTemp=${waterTemp}°C`);
        console.log(`         waterPress=${waterPressure}kPa, fuelPress=${fuelPressure}kPa`);
        console.log(`         carFlags2=${carFlags2}, fuelCap=${fuelCapacity}L`);
        
        const brake = msg[34];
        const throttle = msg[35];
        const clutch = msg[36];
        const steering = msg.readInt8(37);
        const gearNumGears = msg[38];
        const boostAmount = msg[39];
        const crashState = msg[40];
        console.log(`Pedals: brake=${brake}, throttle=${throttle}, clutch=${clutch}, steer=${steering}`);
        console.log(`Gear: num=${gearNumGears}, boost=${boostAmount}, crash=${crashState}`);
        
        const fuelLevel = msg.readFloatLE(45);
        const speed = msg.readFloatLE(49);
        const rpm = msg.readUInt16LE(53);
        const maxRpm = msg.readUInt16LE(55);
        console.log(`Vehicle: speed=${speed.toFixed(2)} m/s (${(speed*3.6).toFixed(1)} km/h)`);
        console.log(`         rpm=${rpm}/${maxRpm}, fuel=${fuelLevel.toFixed(1)}%`);
        
        const orientation = [msg.readFloatLE(57), msg.readFloatLE(61), msg.readFloatLE(65)];
        console.log(`Orientation: pitch=${orientation[0].toFixed(3)}, roll=${orientation[1].toFixed(3)}, yaw=${orientation[2].toFixed(3)}`);
        
        const localVel = [msg.readFloatLE(69), msg.readFloatLE(73), msg.readFloatLE(77)];
        console.log(`LocalVelocity: x=${localVel[0].toFixed(2)}, y=${localVel[1].toFixed(2)}, z=${localVel[2].toFixed(2)}`);
        
        const issues = [];
        if (brake > 255) issues.push(`brake > 255: ${brake}`);
        if (throttle > 255) issues.push(`throttle > 255: ${throttle}`);
        if (rpm > 20000) issues.push(`rpm unreasonably high: ${rpm}`);
        if (speed < 0 || speed > 200) issues.push(`speed out of range: ${speed}`);
        if (fuelLevel < 0 || fuelLevel > 100) issues.push(`fuelLevel out of range: ${fuelLevel}`);
        
        if (issues.length > 0) {
            console.log(`❌ VALIDATION FAILED: ${issues.join(', ')}`);
        } else {
            console.log(`✅ All fields in valid range`);
        }
        console.log('='.repeat(50));
    }

    printStatistics() {
        const totalPackets = Object.values(this.packetsReceived).reduce((a, b) => a + b, 0);
        const uptime = (Date.now() - this.startTime) / 1000;
        const packetsPerSecond = totalPackets / uptime;
        const timeSinceLastPacket = this.lastPacketTime ? (Date.now() - this.lastPacketTime) / 1000 : 'N/A';

        console.log('\n📊 Statistics Update');
        console.log('=' .repeat(40));
        console.log(`Uptime: ${uptime.toFixed(1)}s`);
        console.log(`Total Packets: ${totalPackets}`);
        console.log(`Packets/Second: ${packetsPerSecond.toFixed(2)}`);
        console.log(`Last Packet: ${timeSinceLastPacket}s ago`);
        console.log('\nPacket Types Received:');
        
        const typeNames = ['Telemetry', 'Race', 'Participants', 'Timings', 'GameState'];
        for (let i = 0; i < 5; i++) {
            const count = this.packetsReceived[i] || 0;
            const percentage = totalPackets > 0 ? ((count / totalPackets) * 100).toFixed(1) : '0.0';
            console.log(`  ${typeNames[i]} (Type ${i}): ${count} (${percentage}%)`);
        }
        console.log('=' .repeat(40));
    }

    stop() {
        console.log('\n🛑 Stopping test client...');
        this.printStatistics();
        this.socket.close();
    }
}

// CLI interface
function main() {
    const port = process.argv[2] ? parseInt(process.argv[2]) : 5606;
    
    console.log('🧪 Racing Telemetry Test Client');
    console.log('=============================\n');
    
    const client = new TestClient(port);

    process.on('SIGINT', () => client.stop());
    process.on('SIGTERM', () => client.stop());

    client.start();
}

// Run if called directly
if (require.main === module) {
    main();
}

module.exports = TestClient;