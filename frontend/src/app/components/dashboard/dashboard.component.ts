import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { WebSocketService, TelemetryData } from '../../services/websocket.service';
import { LapTimingComponent } from '../gauges/lap-timing/lap-timing.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, LapTimingComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  telemetryData: TelemetryData | null = null;
  connectionStatus: string = 'DISCONNECTED';
  private telemetrySubscription?: Subscription;
  private statusSubscription?: Subscription;

  constructor(private websocketService: WebSocketService) {}

  ngOnInit(): void {
    this.websocketService.connect('ws://localhost:8080/ws/telemetry');
    
    this.statusSubscription = this.websocketService.getConnectionStatus().subscribe(
      status => this.connectionStatus = status
    );

    this.telemetrySubscription = this.websocketService.getTelemetryData().subscribe(
      data => this.telemetryData = data
    );
  }

  ngOnDestroy(): void {
    this.telemetrySubscription?.unsubscribe();
    this.statusSubscription?.unsubscribe();
  }

  get isConnected(): boolean {
    return this.connectionStatus === 'CONNECTED';
  }

  get speed(): number {
    return this.telemetryData?.speed ?? 0;
  }

  get rpm(): number {
    return this.telemetryData?.rpm ?? 0;
  }

  get gear(): number {
    return this.telemetryData?.gear ?? 0;
  }

  get throttle(): number {
    return this.telemetryData?.throttle ?? 0;
  }

  get brake(): number {
    return this.telemetryData?.brake ?? 0;
  }

  get steering(): number {
    return this.telemetryData?.steering ?? 0;
  }

  get fuelLevel(): number {
    return this.telemetryData?.fuelLevel ?? 0;
  }

  formatSpeed(speed: number): string {
    return Math.round(speed).toString().padStart(3, '0');
  }

  formatRpm(rpm: number): string {
    return Math.round(rpm).toString();
  }
}
