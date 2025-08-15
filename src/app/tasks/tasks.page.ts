import { Component } from '@angular/core';
import { HttpClient } from "@angular/common/http";
import { LocalStorageService } from './../services/local-storage.service';
import { ConfigurationService } from "../services/configuration.service";
import { AlertController } from "@ionic/angular";
import { LoadingController } from "@ionic/angular";
import { DbService } from '../services/db.service';
import { firstValueFrom } from 'rxjs';

import { ModalController } from "@ionic/angular";
import { TaskPage } from "../task/task.page";

import { Network } from '@capacitor/network';
import * as moment from 'moment';

@Component({
  selector: 'app-tasks',
  templateUrl: './tasks.page.html',
  styleUrls: ['./tasks.page.scss'],
  standalone: false,
})
export class TasksPage {
  private URL_BASE: string = "";
  private user_id: number = 0;

  public data: any = [];
  public data_alt: any = [];
  public cant_data: number = 0;
  public tasks: any = new Array();
  public position_package: number = 0;
  public size_package: number = 0;
  public visiblePages: any = [];

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
      this.uploadPackage("+");
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

  uploadPackage(operacion: string = "", pagina: number = 0) {
    this.cant_data = this.data.length;

    if(operacion == "+") {
      this.position_package = (this.position_package + 1);
    } else if(operacion == "-") {
      if(this.position_package > 1) {
        this.position_package = (this.position_package - 1);
      }
    } else if(pagina > 0) {
      this.position_package = pagina;
    }

    this.empaquetarDatos(this.position_package - 1);
  }

  async empaquetarDatos(max: any) {
    if(this.data && this.data.length > 0) {
      this.data_alt = new Array();

      for (let i = 0; i < this.data.length; i += 5) {
        this.data_alt.push(this.data.slice(i, i + 5));
      }

      if (this.data_alt.length > 0) {
        this.size_package = Math.floor(12 / this.data_alt.length);
        this.updateVisiblePages((max + 1), this.data_alt.length);
      } else {
        this.size_package = 0;
      }

      this.tasks = this.data_alt[(max)];
    } else {
      this.tasks = new Array();
    }
  }

  updateVisiblePages(currentPage: number, totalPages: number): void {
    this.visiblePages = [];

    if (totalPages <= 4) {
      this.visiblePages = Array.from({ length: totalPages }, (_, i) => i + 1);
    } else {
      if((totalPages - currentPage) < 2) {
        const afterPage = currentPage - 2;
        this.visiblePages.push(afterPage);
      
        if((totalPages - currentPage) == 0) {
          this.visiblePages.push(afterPage - 1);
        }
      }

      const afterPage = currentPage - 1;
      if(afterPage > 0) {
        this.visiblePages.push(afterPage);
      }

      this.visiblePages.push(currentPage);

      if(currentPage > 1) {
        const nextPage = currentPage + 1;
        if (nextPage < totalPages) {
          this.visiblePages.push(nextPage);
        }
      } else {
        for (let i = 1; i <= 2; i++) {
          const nextPage = currentPage + i;
          if (nextPage < totalPages) {
            this.visiblePages.push(nextPage);
          }
        }
      }

      if(totalPages != currentPage) {
        this.visiblePages.push(totalPages);
      }
    }
  }


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // EVENTS ON CLICK                                                                                                   //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async updateTask(task_id: number, synced: number = 0, status: string) {
    await this.presentLoading('Espere un momento por favor'); 

    let task = {
      "status": status
    };
    
    if(synced) {
      let network = await Network.getStatus();
      if(network && network.connected) {
        // return console.log(task);

        this.http.put(this.URL_BASE + 'tasks/' + task_id, task).subscribe((res: any)=>{
          let datafromserver: any = (JSON.parse(JSON.stringify(res)));
          this.dismissLoader();

          if(datafromserver.success) {
            this.presentMessage("Tarea editada", datafromserver.message);
            this.loadTasks();
          } else {
            this.presentMessage("Algo salió mal", datafromserver.message);
          }
        }, (error: any) => {
          this.dismissLoader();
          this.presentMessage("Algo salió mal", error.error.message);
        });
      } else {
        this.dismissLoader();
        this.presentMessage("Algo salió mal", "No tiene conexión a internet");
      }
    } else {
      const result = await this.db.updateStatusTask(task_id, task);
      console.log(result);

      this.dismissLoader();
      if (result.success) {
        this.presentMessage("Tarea editada", result.message);
        this.loadTasks();
      } else {
        this.presentMessage("Algo salió mal", result.message);
      }
    }
  }

  async deleteTask(task_id: number, synced: number = 0) {
    await this.presentLoading('Espere un momento por favor');
    
    if(synced) {
      let network = await Network.getStatus();
      if(network && network.connected) {
        this.http.delete(this.URL_BASE + 'tasks/' + task_id).subscribe((res: any)=>{
          let datafromserver: any = (JSON.parse(JSON.stringify(res)));
          this.dismissLoader();

          if(datafromserver.success) {
            this.presentMessage("Tarea eliminada", datafromserver.message);
            this.loadTasks();
          } else {
            this.presentMessage("Algo salió mal", datafromserver.message);
          }
        }, (error: any) => {
          this.dismissLoader();
          this.presentMessage("Algo salió mal", error.error.message);
        });
      } else {
        this.dismissLoader();
        this.presentMessage("Algo salió mal", "No tiene conexión a internet");
      }
    } else {
      const result = await this.db.deleteTask(task_id);
      console.log(result);

      this.dismissLoader();
      if (result.success) {
        this.presentMessage("Tarea editada", result.message);
        this.loadTasks();
      } else {
        this.presentMessage("Algo salió mal", result.message);
      }
    }
  }

  async uploadTask(task: any) {
    await this.presentLoading('Espere un momento por favor');

    let network = await Network.getStatus();

    if (network && network.connected) {
      try {
        let { id, ...taskWithoutId } = task;

        const response = await firstValueFrom(
          this.http.post(this.URL_BASE + 'tasks', taskWithoutId)
        );

        const datafromserver: any = response;
        this.dismissLoader();

        if(datafromserver.success) {
          this.presentMessage("Tarea registrada", "La tarea se sincronizo exitosamente.");

          task.synced = 1;
          task.updated_at = moment(new Date()).format("yyyy-MM-DD");

          await this.db.updateTask(task.id, task);
          setTimeout(() => {
            this.loadTasks();
          }, 500); 
        } else {
          this.presentMessage("Algo salió mal", datafromserver.message);
        }
      } catch (error: any) {
        this.dismissLoader();
        await this.presentMessage('Algo salió mal', error?.error?.message || error);
        throw error;
      }
    } else {
      this.dismissLoader();
      this.presentMessage("Algo salió mal", "No hay conexión a Internet. Intente de nuevo cuando la conexión esté disponible.");
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