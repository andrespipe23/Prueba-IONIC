import { AuthenticationService } from './../services/authentication.service';
import { LocalStorageService } from './../services/local-storage.service';
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { ConfigurationService } from "../services/configuration.service";
import { HttpClient } from "@angular/common/http";
import { LoadingController } from "@ionic/angular";
import { AlertController } from "@ionic/angular";
import { Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: false,
})
export class MenuComponent implements OnInit {

  private config_HTTP: any;
  private URL_BASE: string = "";
  public URL_WEB: string = "";
  public VERSION: string = "";
  public currentUrl: string = "";
  public user: any;
  private user_id: number = 0;

  public menus: any = [];

  constructor(
    private loadingController: LoadingController,
    private configuration: ConfigurationService,
    private authService: AuthenticationService,
    private localStorage: LocalStorageService,
    private alertController: AlertController,
    private http: HttpClient,
    private router: Router
  ) {
    this.config_HTTP = {
      headers: {
        'X-Requested-With': "XMLHttpRequest",
        'Accept' : '*/*',
        'Authorization' : this.localStorage.get('access_token')
      }
    };
    
    if (this.localStorage.check("access_token")) {
      this.user = JSON.parse(this.localStorage.get("user"));
    } 
    this.URL_BASE = this.configuration.getUrlBase();
    this.URL_WEB = this.configuration.getUrlWeb();
    this.VERSION = this.configuration.getVersion();

    this.router.events.subscribe(() => {
      this.currentUrl = this.router.url;
    });

    if(this.user) {
      this.user_id = this.user.id;
    }
  }

  async ngOnInit() {
    await this.startMenu();
  }

  async startMenu() {
    this.menus = new Array();
    if (this.localStorage.check("menus")) {
      this.menus = JSON.parse(this.localStorage.get("menus"));
    }
  }

  goToModule(url: string) {
    this.router.navigate([url]);
  }

  async logout() {
    await this.authService.logout();
  }


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // LOADINGS AND ALERTS                                                                                                //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  async presentLoading(message: string) {
    const loading = await this.loadingController.create({
      cssClass: "my-custom-class",
      message: message + " ...",
      // duration: time,
      backdropDismiss: true,
      spinner: "bubbles",
    });

    await loading.present();
  }

  async dismissLoader() {
    await this.loadingController.dismiss();
  }

  async presentMessage(header: string, mensaje: string) {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class-alert',
      header: header,
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }

}
