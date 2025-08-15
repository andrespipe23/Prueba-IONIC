import { Component, OnInit, Input } from '@angular/core';
import { LoadingController } from "@ionic/angular";
import { HttpClient } from "@angular/common/http";
import { AlertController } from "@ionic/angular";
import { ModalController } from "@ionic/angular";
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { LocalStorageService } from './../services/local-storage.service';
import { ConfigurationService } from "../services/configuration.service";
import { DbService } from '../services/db.service';

import { Network } from '@capacitor/network';
import * as moment from 'moment';

@Component({
  selector: 'app-task',
  templateUrl: './task.page.html',
  styleUrls: ['./task.page.scss'],
  standalone: false,
})
export class TaskPage implements OnInit {
  private URL_BASE: string = "";
  private user_id: number = 0;

  @Input() is_modal: boolean = false;
  @Input() task_id: number = 0;
  @Input() synced: number = 0;
  @Input() edit: boolean = false;

  public statuses: any = [
    "pending",
    "in_progress",
    "completed"
  ];

  public task: any = [];
  public title: string = "";
  public description: string = "";
  public due_date: string = new Date().toISOString();
  public status: string = "";

  constructor(
    private loadingController: LoadingController,
    private configuration: ConfigurationService,
    private localStorage: LocalStorageService,
    private alertController: AlertController,
    private modalController: ModalController,
    private http: HttpClient,
    private router: Router,
    private db: DbService,
  ) {
    this.URL_BASE = this.configuration.getUrlBase();
    this.user_id = JSON.parse(this.localStorage.get("user")).id;
  }

  async ngOnInit() {
    await this.loadDataForm();
  }


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // INITIAL FUNCTIONS                                                                                                  //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async loadDataForm() {
    if(this.task_id > 0) {
      await this.presentLoading('Espera un momento por favor');

      if(this.synced) {
        await this.http.get(this.URL_BASE + 'tasks/' + this.task_id).subscribe((res: any) => {
          let datafromserver: any = (JSON.parse(JSON.stringify(res)));

          if(datafromserver.success) {
            if(datafromserver.data) {
              this.task = datafromserver.data;

              if(this.task) {
                this.title = this.task.title;
                this.description = this.task.description;
                this.due_date = this.task.due_date;
                this.status = this.task.status;
              }
            }

            this.dismissLoader();
          } else {
            this.dismissLoader();
            this.presentMessage("Algo salió mal", datafromserver.message);
          }
        }, (error: any) => {
          this.dismissLoader();
          this.presentMessage("Algo salió mal", error.error.message);
        });
      } else {
        try {
          const task = await this.db.getTask(this.task_id);
          this.task = task[0]; 

          if(this.task) {
            this.title = this.task.title;
            this.description = this.task.description;
            this.due_date = this.task.due_date;
            this.status = this.task.status;
          }

          this.dismissLoader();
        } catch (error: any) {
          this.dismissLoader();
          this.presentMessage('Algo salió mal cargando la tarea', error);
        }
      }
    }
  }


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // EVENTS ON CLICK                                                                                                   //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  async storeTask() {
    let task = {
      "title": this.title,
      "description": this.description,
      "due_date": moment(this.due_date).format("yyyy-MM-DD"),
      "status": this.status,
      "user_id": this.user_id,
      "created_at": moment(new Date()).format("yyyy-MM-DD")
    };

    const result = await this.db.addTask(task);
    console.log(result);

    if (result.success && result.id) {
      await this.uploadTask(task, result.id);  
    } else {
      this.presentMessage("Algo salió mal", result.message);
    }
  }

  async uploadTask(task: any, task_id: number) {
    await this.presentLoading('Espere un momento por favor');

    let network = await Network.getStatus();
    if (network && network.connected) {
      try {
        const response = await firstValueFrom(
          this.http.post(this.URL_BASE + 'tasks', task)
        );

        const datafromserver: any = response;
        this.dismissLoader();

        if(datafromserver.success) {
          this.presentMessage("Tarea registrada", "La tarea se registro y sincronizo exitosamente.");

          task.synced = 1;
          task.updated_at = moment(new Date()).format("yyyy-MM-DD");

          const result = this.db.updateTask(task_id, task);
          console.log(result);

          if(this.is_modal) {
            this.dismiss(true);
          }
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
      this.presentMessage("Tarea registrada", "No hay conexión a Internet, por lo que la tarea se guardó localmente. Se sincronizará automáticamente cuando la conexión esté disponible.");

      Network.addListener('networkStatusChange', status => {
        if (status.connected) {
          let { id, ...taskWithoutId } = task;
          this.uploadTask(taskWithoutId, task_id);
        }
      });

      if(this.is_modal) {
        this.dismiss(true);
      }
    }
  }

  async updateTask() {
    await this.presentLoading('Espere un momento por favor');      

    let task = {
      "title": this.title,
      "description": this.description,
      "due_date": moment(this.due_date).format("yyyy-MM-DD"),
      "status": this.status,
      "synced": this.synced,
      "user_id": this.user_id,
      "updated_at": moment(new Date()).format("yyyy-MM-DD")
    };
    // return console.log(task);

    if(this.synced) {
      let network = await Network.getStatus();
      if(network && network.connected) {

        this.http.put(this.URL_BASE + 'tasks/' + this.task_id, task).subscribe((res: any)=>{
          let datafromserver: any = (JSON.parse(JSON.stringify(res)));
          this.dismissLoader();

          if(datafromserver.success) {
            this.presentMessage("Tarea editada", datafromserver.message);
            this.dismiss(true);
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
      const result = await this.db.updateTask(this.task_id, task);
      console.log(result);

      this.dismissLoader();
      if (result.success) {
        this.presentMessage("Tarea editada", result.message);
        this.dismiss(true); 
      } else {
        this.presentMessage("Algo salió mal", result.message);
      }
    }
  }


  /////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
  // EVENTS ON CHANGE                                                                                                   //
  ///////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

  selectDate(event: any) {
    this.due_date = event.detail.value;
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

  dismiss(refresh: boolean = false) {
    if(this.is_modal) {
      this.modalController.dismiss({
        'dismissed': true,
        'refresh': refresh
      });
    } else {
      this.router.navigateByUrl("home");
    }
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
