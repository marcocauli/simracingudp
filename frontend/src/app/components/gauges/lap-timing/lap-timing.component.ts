import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface LapData {
  lapNumber: number;
  lapTime: number;
  sector1Time: number;
  sector2Time: number;
  sector3Time: number;
  isValid: boolean;
}

@Component({
  selector: 'app-lap-timing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lap-timing.component.html',
  styleUrl: './lap-timing.component.scss'
})
export class LapTimingComponent implements OnChanges {
  @Input() currentLap: number = 0;
  @Input() currentSector1Time: number = 0;
  @Input() currentSector2Time: number = 0;
  @Input() currentSector3Time: number = 0;
  @Input() lastLapTime: number = 0;
  @Input() lastSector1Time: number = 0;
  @Input() lastSector2Time: number = 0;
  @Input() lastSector3Time: number = 0;
  @Input() bestLapTime: number = 0;
  @Input() bestSector1Time: number = 0;
  @Input() bestSector2Time: number = 0;
  @Input() bestSector3Time: number = 0;
  @Input() currentSector: number = 1;

  laps: LapData[] = [];
  isCurrentLapValid: boolean = true;

  ngOnChanges(changes: SimpleChanges): void {
    if (this.lastLapTime > 0) {
      this.addLap();
    }
  }

  private addLap(): void {
    const newLap: LapData = {
      lapNumber: this.currentLap,
      lapTime: this.lastLapTime,
      sector1Time: this.lastSector1Time,
      sector2Time: this.lastSector2Time,
      sector3Time: this.lastSector3Time,
      isValid: this.isCurrentLapValid
    };

    this.laps.unshift(newLap);

    if (this.laps.length > 20) {
      this.laps.pop();
    }

    this.isCurrentLapValid = true;
  }

  formatTime(seconds: number): string {
    if (!seconds || seconds === 0) return '--:--.---';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 1000);
    
    if (mins > 0) {
      return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${secs.toString()}.${ms.toString().padStart(3, '0')}`;
  }

  getDelta(current: number, best: number): string {
    if (!current || !best || current === 0 || best === 0) return '';
    
    const delta = current - best;
    const prefix = delta >= 0 ? '+' : '';
    return `${prefix}${this.formatTime(Math.abs(delta))}`;
  }

  isBestLap(lapTime: number): boolean {
    return lapTime > 0 && this.bestLapTime > 0 && lapTime <= this.bestLapTime;
  }

  isBestSector(sectorTime: number, bestSectorTime: number): boolean {
    return sectorTime > 0 && bestSectorTime > 0 && sectorTime <= bestSectorTime;
  }

  trackByLap(index: number, lap: LapData): number {
    return lap.lapNumber;
  }
}
