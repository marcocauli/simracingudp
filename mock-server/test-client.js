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
    }

    validatePacket(msg, packetType) {
        const expectedSizes = {
            [PacketType.CAR_PHYSICS]: 556,
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