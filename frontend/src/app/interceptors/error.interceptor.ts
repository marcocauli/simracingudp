import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { catchError, retry } from 'rxjs/operators';

@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    console.log('HTTP Request:', request.method, request.url);
    
    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('HTTP Error:', {
          status: error.status,
          message: error.message,
          url: error.url
        });
        
        let errorMessage = 'An unknown error occurred';
        
        if (error.error instanceof ErrorEvent) {
          errorMessage = error.error.message;
        } else if (error.status === 0) {
          errorMessage = 'Network error: Unable to connect to server';
        } else if (error.status === 404) {
          errorMessage = 'Resource not found';
        } else if (error.status === 500) {
          errorMessage = 'Internal server error';
        } else if (error.status >= 400 && error.status < 500) {
          errorMessage = `Client error: ${error.error?.message || 'Bad request'}`;
        }
        
        // For development, show detailed error
        if (error.error && error.error.message) {
          errorMessage = error.error.message;
        }
        
        return throwError(() => errorMessage);
      })
    );
  }
}

@Injectable()
export class LoadingInterceptor implements HttpInterceptor {
  private activeRequests = 0;

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    this.activeRequests++;
    
    return next.handle(request).pipe(
      catchError((error) => {
        this.activeRequests--;
        throw error;
      })
    );
  }

  getActiveRequests(): number {
    return this.activeRequests;
  }

  decrementActiveRequests(): void {
    if (this.activeRequests > 0) {
      this.activeRequests--;
    }
  }
}