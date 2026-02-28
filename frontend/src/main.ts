import { bootstrapApplication } from '@angular/platform-browser';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app/app';
import { routes } from './app/app-routing-module';
import { ErrorInterceptor } from './app/interceptors/error.interceptor';

bootstrapApplication(AppComponent, {
  providers: [
    provideRouter(routes),
    provideHttpClient(),
    {
      provide: HTTP_INTERCEPTORS,
      useClass: ErrorInterceptor,
      multi: true
    },
    ReactiveFormsModule,
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
