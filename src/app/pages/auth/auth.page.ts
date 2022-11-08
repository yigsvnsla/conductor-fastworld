import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { Component, OnInit } from '@angular/core';
import { CupertinoPane } from 'cupertino-pane';

@Component({
  selector: 'app-auth',
  templateUrl: './auth.page.html',
  styleUrls: ['./auth.page.scss'],
})
export class AuthPage implements OnInit {

  public loginPane : CupertinoPane

  constructor(
    private localStorageService:LocalStorageService
  ) { }

  async ngOnInit() {

    (await this.localStorageService.remove(environment.user_tag));
    

    this.loginPane = new CupertinoPane('app-login', {
      fitHeight: true,
      backdrop: true,
      fastSwipeClose:true,

    })
     
  }


  async ionViewDidEnter() {

  }


  // Mostrar Panel de Ingreso
  public async onShowLogin(){
    await this.loginPane.present({animate: true})
  }
}
