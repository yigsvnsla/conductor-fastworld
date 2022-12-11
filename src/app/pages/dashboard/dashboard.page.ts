import { CookiesService } from 'src/app/services/cookies.service';
import { SocketService } from './../../services/socket.service';
import { Component, OnInit } from '@angular/core';
import { ConectionsService } from 'src/app/services/connections.service';
import { ToolsService } from 'src/app/services/tools.service';
import { environment } from 'src/environments/environment';
interface SectionMenu {
  title: string,
  url: string,
  icon?: string,
  options?: SectionMenu[]

}
@Component({
  selector: 'app-dashboard',
  templateUrl: 'dashboard.page.html',
  styleUrls: ['dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  public sectionMenu: SectionMenu[]
  constructor(
    private toolsService: ToolsService,
    private conectionsService: ConectionsService,
    private socketService:SocketService,
    private cookiesService:CookiesService
  ) { }
  async ngOnInit() {

    this.socketService.setAuth = this.cookiesService.get(environment['cookie_tag']).replace(/"/g,'')
    this.socketService.connect()

    this.socketService.on('connect',(arg, callback) =>{
      console.log('Socket connected');

    })

    this.sectionMenu = [{
      title: 'Encomiendas',
      url: 'encomienda',
      options: [{
        title: 'Encomiendas',
        url: 'entregas',
        icon: 'cube',
      }, {
        title: 'Activas',
        url: 'activas',
        icon: 'list-circle',
      }, {
        title: 'Historial',
        url: 'historial',
        icon: 'list',
      },{
        title: 'Perfil',
        url: 'perfil',
        icon: 'person',
      }]
    }]
  }

  onLogOut() {
    this.toolsService.showAlert({
      cssClass: 'alert-danger',
      header: '🛑 Cerrar Sesion',
      subHeader: '¿Desea cerrar su sesion actual?',
      buttons: ['Cancelar', { text: 'Aceptar', handler: () => { this.conectionsService.logOut() } }]
    })
  }

}
