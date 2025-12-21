import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  templateUrl: './app.html',
  standalone: true,
  imports: [RouterOutlet, CommonModule],
  styleUrl: './app.scss'
})
export class AppComponent {
  protected readonly title = signal('telemetry-reader');
}
