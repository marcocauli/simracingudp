import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

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

@Injectable({
  providedIn: 'root'
})
export class TelemetryService {
  private readonly BACKEND_URL = 'http://localhost:8080';
  private readonly WS_URL = 'ws://localhost:8080/ws/telemetry';

  constructor(private http: HttpClient) {}

  getServerStatus(): Observable<ServerStatus> {
    return this.http.get<ServerStatus>(`${this.BACKEND_URL}/v1/udp-status`).pipe(
      catchError(error => {
        console.error('Error getting server status:', error);
        return throwError(() => error);
      })
    );
  }

  getHealth(): Observable<any> {
    return this.http.get(`${this.BACKEND_URL}/v1/health`).pipe(
      catchError(error => {
        console.error('Error getting health:', error);
        return throwError(() => error);
      })
    );
  }

  getTelemetryHistory(): Observable<TelemetryData[]> {
    return this.http.get<TelemetryData[]>(`${this.BACKEND_URL}/v1/telemetry/history`).pipe(
      catchError(error => {
        console.error('Error getting telemetry history:', error);
        return throwError(() => error);
      })
    );
  }

  createWebSocketConnection(): WebSocket {
    const ws = new WebSocket(this.WS_URL);
    
    ws.onopen = () => {
      console.log('WebSocket connection opened');
    };
    
    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };
    
    ws.onclose = () => {
      console.log('WebSocket connection closed');
    };
    
    return ws;
  }

  // Mock data for development when backend is not available
  getMockTelemetryData(): TelemetryData {
    const baseTime = Date.now();
    return {
      packetType: 0,
      timestamp: baseTime,
      speed: 150 + Math.random() * 150,
      rpm: 4000 + Math.random() * 4000,
      gear: Math.floor(Math.random() * 6) + 1,
      throttle: Math.random() * 100,
      brake: Math.random() * 30,
      steering: (Math.random() - 0.5) * 90,
      fuelLevel: 100 - Math.random() * 20,
      tireWear: Array.from({length: 4}, () => Math.random() * 100),
      tireTemps: Array.from({length: 4}, () => 70 + Math.random() * 50)
    };
  }
}