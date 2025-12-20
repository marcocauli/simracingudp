export interface TelemetryData {
  packetType: number;
  timestamp: number;
  speed: number;
  rpm: number;
  gear: number;
  throttle: number;
  brake: number;
  steering: number;
  fuelLevel: number;
  tireWear: number[];
  tireTemps: number[];
}

export interface ServerStatus {
  serverRunning: boolean;
  listeningPort: number;
  timestamp: string;
  status: string;
  message: string;
}

export interface Config {
  udpPort: number;
  updateRate: number;
  sessionType: string;
  serverHost: string;
  frontendUrl: string;
}

export interface PacketStatistics {
  packetType: number;
  count: number;
  percentage: number;
  packetsPerSecond: number;
  lastPacketReceived: string;
}