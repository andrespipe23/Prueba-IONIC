import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalStorageService {

  constructor() { }

  check(name: string): boolean {
    if (localStorage.getItem(name)) {
      return true
    } else {
      return false;
    }
  }

  get(name: string): string {
    return localStorage.getItem(name)!;
  }

  set(name: string, value: string) {
    localStorage.setItem(name, value);
  }

  delete(name: string) {
    localStorage.removeItem(name);
  }

  deleteAll() {
    localStorage.clear();
  }
}
