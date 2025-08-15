import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ConfigurationService {
  private URL_BASE: string;
  private URL_WEB: string;
  private VERSION: string;

  constructor(
  ) {
    /* Configuracion de url del servidor Api Rest */
    // this.URL_BASE = 'http://127.0.0.1:8000/api/';
    // this.URL_WEB = 'http://127.0.0.1:8000';
    this.URL_BASE = 'http://3.81.158.17/api/';
    this.URL_WEB = 'http://3.81.158.17';
    this.VERSION = '1.0';
  }

  /*-----------------------------------------------------------------------------------
  | Funcion get url base. Retorna la url del servidor configurada en la variable
  -----------------------------------------------------------------------------------*/
  getUrlBase() {
    return this.URL_BASE;
  }
  getUrlWeb() {
    return this.URL_WEB;
  }
  getVersion() {
    return this.VERSION;
  }
}
