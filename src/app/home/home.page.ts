import { Component } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { LocalStorageService } from './../services/local-storage.service';
import { ConfigurationService } from "../services/configuration.service";
import { AlertController } from "@ionic/angular";
import { LoadingController } from "@ionic/angular";
import { firstValueFrom } from 'rxjs';

import { ModalController } from "@ionic/angular";
import { TaskPage } from "../task/task.page";

import { DbService } from '../services/db.service';
import { Network } from '@capacitor/network';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: false,
})
export class HomePage {
  private URL_BASE: string = "";
  private user_id: number = 0;

  public data: any = new Array();
  public tasks: any = new Array();
  public position_package: number = 0;

  constructor(
    private http: HttpClient,
    private localStorage: LocalStorageService,
    private configuration: ConfigurationService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private modalController: ModalController,
    private db: DbService,
  ) {
    this.URL_BASE = this.configuration.getUrlBase();
    this.user_id = JSON.parse(this.localStorage.get("user")).id;
  } 

  async ionViewWillEnter() {
    await this.loadTasks();
  }

  async eventRefresh(event: any) {
    let refresher = event.target;
    await this.doRefresh().then(() => {
      refresher.complete();
    });
  }

  async doRefresh() {
    this.ionViewWillEnter();
  }


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // INITIAL FUNCTIONS                                                                                                  //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async loadTasks() {
    await this.presentLoading('Espera un momento por favor');

    this.data = new Array();
    this.position_package = 0;

    try {
      await this.loadTasksOnline();
      await this.loadTasksOffline();
      this.uploadPackage();
    } catch (error: any) {
      // await this.presentMessage('Error cargando tareas', error?.message || error);
    } finally {
      this.dismissLoader();
    }
  }

  async loadTasksOnline() {
    const network = await Network.getStatus();

    if (network && network.connected) {
      try {
        const response = await firstValueFrom(
          this.http.get(this.URL_BASE + 'user-tasks')
        );

        const datafromserver: any = response;
        if (datafromserver.data) {
          this.data = datafromserver.data;
        }

      } catch (error: any) {
        await this.presentMessage('Algo salió mal', error?.error?.message || error);
        throw error;
      }
    }
  }

  async loadTasksOffline() {
    try {
      const tasks = await this.db.getTasks();
      if (tasks && tasks.length > 0) {
        this.data = this.data.concat(tasks);
      }
    } catch (error: any) {
      await this.presentMessage('Error cargando tareas offline', error);
    }
  }

  uploadPackage() {
    this.position_package += 1;
    this.empaquetarDatos(this.position_package * 10);
  }

  async empaquetarDatos(max: any) {
    let position = 0;
    let arr_pos = new Array();
    var pos_ini = (max - 10);

    if(this.data) {
      this.tasks = new Array();
      this.data.forEach((element: any, index: number) => { 
        if(position < max) {
          this.tasks.push(element);
          position += 1;
        }
        if(index >= pos_ini && position < max) {
          arr_pos.push(element);
        }
      });
    }

    if(pos_ini > 0 && (!arr_pos || arr_pos.length == 0)) {
      this.presentMessage("", "No hay mas tareas");
    }
  }


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // MODALS                                                                                                             //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  
  async presenModalTask(task_id: number = 0, synced: number = 0, edit: boolean = false) {
    const modal = await this.modalController.create({
      component: TaskPage,
      cssClass: "my-custom-class",
      componentProps: {
        is_modal: true,
        task_id: task_id,
        synced: synced,
        edit: edit
      },
    });

    modal.onDidDismiss().then((data: any) => {      
    if(data && data.data && data.data.refresh) {
        this.doRefresh();
      }
    });

    return await modal.present();
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
