import { CookiesService } from 'src/app/services/cookies.service';
import { SocketService } from './../../services/socket.service';
import { Component, OnInit } from '@angular/core';
import { ConectionsService } from 'src/app/services/connections.service';
import { ToolsService } from 'src/app/services/tools.service';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { GPSFastworld } from 'gpsfastworld'

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
  user: any
  constructor(
    private toolsService: ToolsService,
    private conectionsService: ConectionsService,
    private socketService:SocketService,
    private cookiesService:CookiesService,
    private localStorageService:LocalStorageService

  ) { }
  async ngOnInit() {
    this.user =  await this.localStorageService.get(environment['user_tag'])

    this.socketService.setAuth = this.cookiesService.get(environment['cookie_tag']).replace(/"/g,'')
    this.socketService.connect()

    this.socketService.on('connect',(arg, callback) =>{
      console.log('Socket connected');

    })

    GPSFastworld.startGeolocation({
      user: this.user,
      token: this.cookiesService.get(environment['cookie_tag']).replace(/"/g,''),
      config:{
        url: "https://s1.fastworld.app"
      }
    })

    this.sectionMenu = [{
      title: 'Encomiendas',
      url: 'encomienda',
      options: [{
        title: 'Encomiendas',
        url: 'entregas',
        icon: 'cube',
      }, {
        title: 'Mis Rutas',
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
      },{
        title: 'Reportes',
        url: 'reportes',
        icon: 'bar-chart',
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
