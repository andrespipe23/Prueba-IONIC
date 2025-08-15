import { Injectable } from '@angular/core';
import { HttpRequest, HttpHandler, HttpEvent, HttpInterceptor, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthenticationService } from './../services/authentication.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {

  constructor(
    private authService: AuthenticationService
  ) {}

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = localStorage.getItem('access_token');

    let headersConfig: { [name: string]: string | string[] } = {
      'Accept': 'application/json'
    };

    if (token) {
      headersConfig['Authorization'] = `Bearer ${token}`;
    }

    const clonedRequest = request.clone({
      setHeaders: headersConfig
    });

    return next.handle(clonedRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        if (error.status === 401) {
          console.error('Error 401: No autenticado');
          this.authService.logout();
        }
        return throwError(() => error);
      })
    );
  }
}
