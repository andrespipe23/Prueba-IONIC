import { AuthenticationService } from './../services/authentication.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AlertController, LoadingController } from '@ionic/angular';
import { MenuController } from "@ionic/angular";
import { Router } from '@angular/router';
import { Network } from '@capacitor/network';
import { LocalStorageService } from './../services/local-storage.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: false,
})
export class LoginPage implements OnInit {
  credentials!: FormGroup;
  showPassword: boolean = false;

  constructor(
    private fb: FormBuilder,
    private authService: AuthenticationService,
    private alertController: AlertController,
    private router: Router,
    private menu: MenuController,
    private loadingController: LoadingController,
    private localStorage: LocalStorageService
  ) {

  }

  ngOnInit() {
    this.credentials = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    const token = this.localStorage.get("access_token");
    if (token) {
      window.open("/home", "_self");
    }
  }

  async login() {
    const loading = await this.loadingController.create();
    await loading.present();

    let network = await Network.getStatus();
    if(network && network.connected) {
      this.authService.login(this.credentials.value).subscribe(
        async (res: any) => {
          await loading.dismiss();

          this.menu.enable(true, "menu-content");
          window.open("/home", "_self");
        },
        async (res) => {
          // console.log(res);
          await loading.dismiss();
          const alert = await this.alertController.create({
            header: 'Algo salió mal',
            message: res.error.message,
            buttons: ['OK']
          });

          await alert.present();
        }
      );
    } else {
      await loading.dismiss();
      const alert = await this.alertController.create({
        header: 'Algo salió mal',
        message: 'No tiene conexión a internet',
        buttons: ['OK']
      });

      await alert.present();
    }
  }

  clearField(field: string) {
    this.credentials.get(field)?.setValue('');
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  get email() {
    return this.credentials.get('email');
  }

  get password() {
    return this.credentials.get('password');
  }

}

