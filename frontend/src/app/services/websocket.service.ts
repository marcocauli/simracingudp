import { Injectable } from '@angular/core';
import { Subject, Observable, BehaviorSubject } from 'rxjs';

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
  currentLap: number;
  currentSector: number;
  sector1Time: number;
  sector2Time: number;
  sector3Time: number;
  lastLapTime: number;
  lastSector1Time: number;
  lastSector2Time: number;
  lastSector3Time: number;
  bestLapTime: number;
  bestSector1Time: number;
  bestSector2Time: number;
  bestSector3Time: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private telemetrySubject = new Subject<TelemetryData>();
  private connectionStatusSubject = new BehaviorSubject<string>('DISCONNECTED');

  constructor() {}

  connect(url: string): void {
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket onopen fired, URL:', url);
        this.connectionStatusSubject.next('CONNECTED');
        console.log('Connection status set to CONNECTED');
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.telemetrySubject.next(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionStatusSubject.next('ERROR');
      };
      
      this.ws.onclose = (event) => {
        console.log('WebSocket disconnected:', event.code, event.reason);
        this.connectionStatusSubject.next('DISCONNECTED');
        
        // Auto-reconnect after 3 seconds
        setTimeout(() => {
          this.connect(url);
        }, 3000);
      };
      
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      this.connectionStatusSubject.next('ERROR');
    }
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  getTelemetryData(): Observable<TelemetryData> {
    return this.telemetrySubject.asObservable();
  }

  getConnectionStatus(): Observable<string> {
    return this.connectionStatusSubject.asObservable();
  }

  sendMessage(message: any): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    }
  }
}