import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notifications: { message: string; type: 'success' | 'error' | 'info'; timestamp: number }[] = [];

  constructor() {}

  showNotification(message: string, type: 'success' | 'error' | 'info' = 'info'): void {
    this.notifications.push({ message, type, timestamp: Date.now() });
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      this.removeNotification(0);
    }, 5000);
  }

  getNotifications(): any[] {
    return this.notifications;
  }

  removeNotification(index: number): void {
    this.notifications.splice(index, 1);
  }

  clearAll(): void {
    this.notifications = [];
  }

  showError(message: string): void {
    this.showNotification(message, 'error');
  }

  showSuccess(message: string): void {
    this.showNotification(message, 'success');
  }

  showInfo(message: string): void {
    this.showNotification(message, 'info');
  }
}