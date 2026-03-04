import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface Config {
  udpPort: number;
  updateRate: number;
  sessionType: string;
  serverHost: string;
  frontendUrl: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService {
  private defaultConfig: Config = {
    udpPort: 5606,
    updateRate: 60,
    sessionType: 'race',
    serverHost: 'localhost:18888',
    frontendUrl: 'http://localhost:4200'
  };

  private configSubject = new BehaviorSubject<Config>(this.defaultConfig);

  constructor() {
    this.loadConfig();
  }

  private loadConfig(): void {
    // Load from localStorage or environment variables
    const storedConfig = localStorage.getItem('telemetry-config');
    if (storedConfig) {
      try {
        const parsed = JSON.parse(storedConfig);
        this.configSubject.next({ ...this.defaultConfig, ...parsed });
      } catch (e) {
        console.error('Error parsing stored config:', e);
      }
    } else {
      // Try environment variables
      const envConfig = {
        udpPort: parseInt(localStorage.getItem('udpPort') || '5606'),
        updateRate: parseInt(localStorage.getItem('updateRate') || '60'),
        sessionType: localStorage.getItem('sessionType') || 'race',
        serverHost: localStorage.getItem('serverHost') || 'localhost:18888',
        frontendUrl: localStorage.getItem('frontendUrl') || 'http://localhost:4200'
      };
      this.configSubject.next({ ...this.defaultConfig, ...envConfig });
    }
  }

  getConfig(): Observable<Config> {
    return this.configSubject.asObservable();
  }

  updateConfig(config: Partial<Config>): void {
    const currentConfig = this.configSubject.value;
    const updatedConfig = { ...currentConfig, ...config };
    
    this.configSubject.next(updatedConfig);
    
    // Save to localStorage
    localStorage.setItem('telemetry-config', JSON.stringify(updatedConfig));
  }

  resetConfig(): void {
    this.configSubject.next(this.defaultConfig);
    localStorage.removeItem('telemetry-config');
    localStorage.removeItem('udpPort');
    localStorage.removeItem('updateRate');
    localStorage.removeItem('sessionType');
    localStorage.removeItem('serverHost');
    localStorage.removeItem('frontendUrl');
  }
}