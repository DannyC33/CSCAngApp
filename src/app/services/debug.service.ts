import { Injectable } from '@angular/core';
import { isDevMode } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class DebugService {

  constructor() {
    console.log('Is devmode: ' + isDevMode());
   }

   console(message: string): void {

        if(isDevMode()){

            console.log('DEBUG: ' + message);
        }
   }
}
