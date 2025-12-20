import { bootstrapApplication } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app/app';
import { AppRoutingModule } from './app/app-routing-module';
import { ErrorInterceptor } from './app/interceptors/error.interceptor';

// Import Feature Modules
import { CommonModule } from '@angular/common';
const featureModules = [CommonModule];

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    ReactiveFormsModule,
    importProvidersFrom(featureModules),
    {
      provide: 'ENVIRONMENT',
      useValue: 'development'
    }
  ]
})
.then(() => {
  console.log('✅ Angular 17 app bootstraped successfully');
})
.catch((err) => {
  console.error('❌ Error bootstrapping Angular app:', err);
});
