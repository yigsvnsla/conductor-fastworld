import { Injectable } from '@angular/core';
import { Socket, SocketIoConfig } from 'ngx-socket-io'

type config = Pick<SocketIoConfig, 'options'>

@Injectable({
  providedIn: 'root'
})
export class SocketService extends Socket {

  // private _config: SocketIoConfig = {url: 'http://localhost:8080/chat', options: {}};

  constructor() {
    super({
      url: 'https://s1.fastworld.app',
      options: {
        autoConnect: false,
        query:{
          origin:'driver'
        }
      }
    });
  }


  public set setAuth(token: string) {        
    this.ioSocket.auth={token: token }
  }

}
