import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { DragDropModule, CdkDragDrop, moveItemInArray } from '@angular/cdk/drag-drop';
import { WebSocketService, TelemetryData } from '../../services/websocket.service';
import { LapTimingComponent } from '../gauges/lap-timing/lap-timing.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DragDropModule, LapTimingComponent],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit, OnDestroy {
  telemetryData: TelemetryData | null = null;
  connectionStatus: string = 'DISCONNECTED';
  lastJson: string = '';
  isJsonExpanded: boolean = false;
  
  cards: { id: string; type: string }[] = [
    { id: 'speed', type: 'speed' },
    { id: 'rpm', type: 'rpm' },
    { id: 'gear', type: 'gear' },
    { id: 'throttle-brake', type: 'throttle-brake' },
    { id: 'steering', type: 'steering' },
    { id: 'fuel', type: 'fuel' },
    { id: 'tire-wear', type: 'tire-wear' },
    { id: 'tire-temps', type: 'tire-temps' },
    { id: 'lap-timing', type: 'lap-timing' }
  ];
  
  private telemetrySubscription?: Subscription;
  private statusSubscription?: Subscription;

  constructor(
    private websocketService: WebSocketService,
    private cdr: ChangeDetectorRef
  ) {
    this.loadCardOrder();
  }

  private loadCardOrder(): void {
    const saved = localStorage.getItem('telemetryCardOrder');
    if (saved) {
      try {
        const savedOrder = JSON.parse(saved) as string[];
        const cardMap = new Map(this.cards.map(c => [c.id, c]));
        const ordered: { id: string; type: string }[] = [];
        
        for (const id of savedOrder) {
          const card = cardMap.get(id);
          if (card) {
            ordered.push(card);
            cardMap.delete(id);
          }
        }
        
        for (const card of cardMap.values()) {
          ordered.push(card);
        }
        
        if (ordered.length === this.cards.length) {
          this.cards = ordered;
        }
      } catch (e) {
        console.warn('Failed to load card order from localStorage');
      }
    }
  }

  private saveCardOrder(): void {
    localStorage.setItem('telemetryCardOrder', JSON.stringify(this.cards.map(c => c.id)));
  }

  ngOnInit(): void {
    this.websocketService.connect('ws://localhost:18888/api/ws/telemetry');
    
    this.statusSubscription = this.websocketService.getConnectionStatus().subscribe(
      status => {
        console.log('Connection status changed:', status);
        this.connectionStatus = status;
        this.cdr.detectChanges();
      }
    );

    this.telemetrySubscription = this.websocketService.getTelemetryData().subscribe(
      data => {
        this.telemetryData = data;
        this.addJsonLog(data);
        this.cdr.detectChanges();
      }
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
    return (this.telemetryData?.throttle ?? 0) * 100;
  }

  get brake(): number {
    return (this.telemetryData?.brake ?? 0) * 100;
  }

  get steering(): number {
    const MAX_STEERING_ANGLE = 90;
    return (this.telemetryData?.steering ?? 0) * MAX_STEERING_ANGLE;
  }

  get fuelLevel(): number {
    return (this.telemetryData?.fuelLevel ?? 0) * 100;
  }

  get tireWear(): number[] {
    return this.telemetryData?.tireWear ?? [0, 0, 0, 0];
  }

  get tireTemps(): number[] {
    return this.telemetryData?.tireTemps ?? [0, 0, 0, 0];
  }

  getTireTempColor(temp: number): string {
    if (temp < 70) return '#4a90d9';
    if (temp < 90) return '#00ff88';
    if (temp < 100) return '#ffaa00';
    return '#ff4444';
  }

  getTireWearColor(wear: number): string {
    if (wear < 30) return '#00ff88';
    if (wear < 60) return '#ffaa00';
    return '#ff4444';
  }

  formatSpeed(speed: number): string {
    return Math.round(speed).toString().padStart(3, '0');
  }

  formatRpm(rpm: number): string {
    return Math.round(rpm).toString();
  }

  getCircleOffset(value: number): number {
    const circumference = 2 * Math.PI * 45;
    return circumference - (value / 100) * circumference;
  }

  addJsonLog(data: TelemetryData): void {
    this.lastJson = JSON.stringify(data);
  }

  clearLogs(): void {
    this.lastJson = '';
  }

  toggleJson(): void {
    this.isJsonExpanded = !this.isJsonExpanded;
  }

  drop(event: CdkDragDrop<{ id: string; type: string }[]>): void {
    if (event.previousIndex === event.currentIndex) return;
    
    moveItemInArray(this.cards, event.previousIndex, event.currentIndex);
    this.saveCardOrder();
    setTimeout(() => this.cdr.detectChanges(), 0);
  }
}
