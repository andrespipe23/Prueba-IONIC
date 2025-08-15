import { Component } from '@angular/core';
import { LocalStorageService } from '././services/local-storage.service';
import { ConfigurationService } from "././services/configuration.service";
import { MenuController } from "@ionic/angular";
import { Platform } from '@ionic/angular';
import { Device } from '@capacitor/device';
import { DbService } from '././services/db.service';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Network } from '@capacitor/network';
import { AlertController } from "@ionic/angular";
import { LoadingController } from "@ionic/angular";
import { HttpClient } from "@angular/common/http";
import { firstValueFrom } from 'rxjs';
import * as moment from 'moment';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
  standalone: false,
})
export class AppComponent {
  private URL_BASE: string = "";
  private uploadingPendingTasks = false;

  constructor(
    private loadingController: LoadingController,
    private configuration: ConfigurationService,
    private localStorage: LocalStorageService,
    private alertController: AlertController,
    private menu: MenuController,
    private platform: Platform,
    private http: HttpClient,
    private db: DbService
  ) {
    this.URL_BASE = this.configuration.getUrlBase();
    this.initializeApp();

    if (this.localStorage.check("access_token")) {
      this.menu.enable(true, "menu-content");
    } else {
      this.menu.enable(false, "menu-content");
    }
  }

  async initializeApp() {
    let device_info = await Device.getInfo();

    try {
      await this.db.initDB();
      console.log('Base de datos inicializada');
    } catch (err) {
      console.error('Error inicializando DB', err);
    }
    
    // En uso de la APP
    if(device_info && device_info.platform != "web") {
      this.platform.ready().then(async () => {
        await StatusBar.setOverlaysWebView({ overlay: false });
        await StatusBar.setBackgroundColor({ color: '#337ab7' });
        await StatusBar.setStyle({ style: Style.Dark  });
      });
    }

    Network.addListener('networkStatusChange', async status => {
      if (status.connected && !this.uploadingPendingTasks) {
        this.uploadingPendingTasks = true;

        try {
          const tasks = await this.db.getTasks();
          const tasks_upload = [];

          if (tasks && tasks.length > 0) {
            await this.presentLoading('Conexión restaurada, subiendo tareas pendientes...');

            for (const task of tasks) {
              let { id, ...taskWithoutId } = task;

              const response: any = await firstValueFrom(
                this.http.post(this.URL_BASE + 'tasks', taskWithoutId)
              );

              if (response.success) {
                task.synced = 1;
                task.updated_at = moment(new Date()).format("yyyy-MM-DD");
                await this.db.updateTask(task.id, task);
                tasks_upload.push(task);
              }
            }

            this.dismissLoader();
            if (tasks_upload.length > 0) {
              await this.presentMessage('Tareas sincronizadas', 'Se sincronizaron ' + tasks_upload.length + ' tareas exitosamente');
            }
          }
        } catch (error: any) {
          this.dismissLoader();
          await this.presentMessage('Error cargando tareas offline', error);
        } finally {
          this.uploadingPendingTasks = false;
        }
      }
    });
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

  async presentMessage(header: string, mensaje: string) 
  {
    const alert = await this.alertController.create({
      cssClass: 'my-custom-class-alert',
      header: header,
      message: mensaje,
      buttons: ['OK']
    });

    await alert.present();
  }
}
