import { Injectable } from "@angular/core";
import {
HttpErrorResponse,
HttpEvent,
HttpHandler,
HttpInterceptor,
HttpRequest,
HttpResponse,
} from "@angular/common/http";
import { Observable, throwError } from "rxjs";
import { Router } from "@angular/router";
import { catchError, map } from "rxjs/operators";
import { LocalStorageService } from './../services/local-storage.service';
import { AuthenticationService } from './../services/authentication.service';

@Injectable({
  providedIn: 'root'
})
export class InterceptorService {

  constructor(
    private router: Router,
    private localStorage: LocalStorageService,
    private authService: AuthenticationService
  ) { 
    
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    let authReq = req;
    const token = this.localStorage.get('access_token');

    if (token != null) {
      authReq = req.clone({
        setHeaders: {
          authorization: token
        }
      });
    }
    return next.handle(authReq).pipe(
      catchError((err) => {
        if (err.status === 401) {
          // console.log("ERROR 401");
          // console.log(err);
          this.authService.logout();
        }
        const error = err;
        // const error = err.error.message || err.statusText;
        return throwError(error);
      })
    );
  }
}
