import { Injectable } from '@angular/core';
import { Subject, Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private ws: WebSocket | null = null;
  private telemetrySubject = new Subject<TelemetryData>();
  private connectionStatusSubject = new Subject<string>();

  constructor() {}

  connect(url: string): void {
    try {
      this.ws = new WebSocket(url);
      
      this.ws.onopen = () => {
        console.log('WebSocket connected to:', url);
        this.connectionStatusSubject.next('CONNECTED');
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