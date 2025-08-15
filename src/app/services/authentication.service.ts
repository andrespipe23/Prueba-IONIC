import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, tap, switchMap } from 'rxjs/operators';
import { BehaviorSubject, from, Observable, Subject } from 'rxjs';

import { ConfigurationService } from "../services/configuration.service";
import { LocalStorageService } from './../services/local-storage.service';
import { MenuController } from "@ionic/angular";
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class AuthenticationService {
  isAuthenticated: BehaviorSubject<any> = new BehaviorSubject(null);

  private URL_BASE: any;
  private menus: any = [
    { title: 'Home', url: '/home', icon: 'home' },
    { title: 'Tareas', url: '/tasks', icon: 'clipboard' },
    { title: 'Crear tarea', url: '/task', icon: 'create' },
  ];

  constructor(
    private http: HttpClient,
    private router: Router,
    private configuration: ConfigurationService,
    private localStorage: LocalStorageService,
    private menu: MenuController
  ) {
    this.URL_BASE = this.configuration.getUrlBase();

    this.loadToken();
  }

  async loadToken() {
    const token = await this.localStorage.get("access_token");
    if (token) {
      // console.log('set token: ', token);
      this.isAuthenticated.next(true);
    } else {
      this.isAuthenticated.next(false);
    }
  }

  login(credentials: {email: string; password: string }): Observable<any> {
    return this.http.post(
      this.URL_BASE + "login",
      credentials
    )
    .pipe(
      map((res: any) => {
        let datafromserver = JSON.parse(JSON.stringify(res));
        if (datafromserver.success != false) {
          this.localStorage.set(
            "access_token",
            "Bearer " + datafromserver.token
          );
          this.localStorage.set(
            "user",
            JSON.stringify(datafromserver.user)
          );
          this.localStorage.set(
            "menus",
            JSON.stringify(this.menus)
          );

          this.menu.enable(true, "menu-content");
          this.isAuthenticated.next(true);
        } else {
          this.isAuthenticated.next(false);
        }

        return datafromserver;
      })
    );
  }

  logout() {
    this.menu.enable(false, "menu-content");
    this.isAuthenticated.next(false);
    this.localStorage.delete("access_token");
    this.localStorage.delete("user");
    this.router.navigateByUrl("/login");
  }
}