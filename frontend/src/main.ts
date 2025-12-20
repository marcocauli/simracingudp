import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { importProvidersFrom } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app/app.component';
import { AppRoutingModule } from './app/app-routing.module';
import { ErrorInterceptor } from './app/interceptors/error.interceptor';

// Import Feature Modules
import * as featureModules from './app/features';

// Import Angular Material (will be added when NGX-Charts works)
// import { provideAnimations } from '@angular/platform-browser/animations';
// import { MatToolbarModule } from '@angular/material/toolbar';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(),
    provideHttpClientTesting(),
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
