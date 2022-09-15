import { Component, OnInit } from '@angular/core';
import { ConectionsService } from 'src/app/services/connections.service';
import { ToolsService } from 'src/app/services/tools.service';
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
  ) { }
  async ngOnInit() {
    
    this.sectionMenu = [{
      title: 'Encomiendas',
      url: 'encomienda',
      options: [{
        title: 'Crear',
        url: 'crear',
        icon: 'cube',
      }, {
        title: 'Activas',
        url: 'activas',
        icon: 'list-circle',
      }, {
        title: 'Historial',
        url: 'historial',
        icon: 'list',
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
