import { Component } from '@angular/core';
import { LocalStorageService } from '././services/local-storage.service';
import { MenuController } from "@ionic/angular";
import { Platform } from '@ionic/angular';
import { Device } from '@capacitor/device';
import { DbService } from '././services/db.service';
import { SplashScreen } from '@capacitor/splash-screen';
import { StatusBar, Style } from '@capacitor/status-bar';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {

  constructor(
    private localStorage: LocalStorageService,
    private menu: MenuController,
    private platform: Platform,
    private db: DbService
  ) {
    SplashScreen.show({
      showDuration: 1000,
      autoHide: true,
    });
    this.initializeApp();

    if (this.localStorage.check("access_token")) {
      this.menu.enable(true, "menu-content");
    } else {
      this.menu.enable(false, "menu-content");
    }
  }

  async initializeApp() {
    let device_info = await Device.getInfo();

    await this.db.initDB();
    
    // En uso de la APP
    if(device_info && device_info.platform != "web") {
      this.platform.ready().then(async () => {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#337ab7' });
        await StatusBar.setStyle({ style: Style.Dark  });
      });
    }
  }
}
