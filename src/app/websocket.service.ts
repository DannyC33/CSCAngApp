import { Injectable } from '@angular/core';
import {io} from 'socket.io-client';
import { Observable } from 'rxjs';
import { SocketData }  from './models/socket_data';
import { TOUCH_BUFFER_MS } from '@angular/cdk/a11y';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  socket: any = null;
  socketErrorCheck = 0;
  socketHandler;
  user = 'api@iocore.tv';
  id = '60346ddcfec089658ffaa01f';

  // public uri: string = 'ws://192.168.179.246:3333';


  constructor() {

      this.connect();


   }


  listen(eventName: string) {
    return new Observable((subscriber) => {
      this.socket.on(eventName, (data) => {
        const returnData: SocketData = data;
        subscriber.next(returnData);
      });
    });
  }
  emit(eventName: string, data: any){
    this.socket.emit(eventName, data);
  }
  disconnect(){
    this.socket.disconnect();
  }
  connect(){
    if (this.socket){
      if (this.socket.id){
        return;
      }
    }
    console.log("Connecting to socketio");
    this.socket = io('https://csc.iocore.tv:3333');
    this.socket.on('connect', (socket) => {
             const User = sessionStorage.getItem('User');

             this.socket.emit('authentication', {
              user: this.user,
              id: this.id
            });

        });
    this.socket.on('disconnect', () => {
          setTimeout(() => {
            this.socket.connect();
      }, 15000);
    });
    clearInterval(this.socketHandler);
    this.socketHandler = setInterval(() => {
      // console.log(this.socket.id);
      if (!this.socket.id){
        this.socketErrorCheck++;
        if (this.socketErrorCheck > 6){
          this.socket.connect();
          this.socketErrorCheck = 0;
          console.log('Trying to reconnect to socketio');
        }
      } else {
        this.socketErrorCheck = 0;
      }

    }, 10000);



  }
}
