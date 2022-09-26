import { ToolsService } from 'src/app/services/tools.service';
import { ConectionsService, Source } from 'src/app/services/connections.service';
import { StorageService } from './../../../../services/storage.service';
import { Component, OnInit } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';
import { map, tap,delay, } from 'rxjs/operators';
import { Observable, timer,  } from 'rxjs';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';


@Component({
  selector: 'app-activas-encomiendas',
  templateUrl: './activas-encomiendas.component.html',
  styleUrls: ['./activas-encomiendas.component.scss'],
})
export class ActivasEncomiendasComponent implements OnInit {

  public source = new Source('client/packages?filters[shipping_status][$notContains]=invalido&filters[shipping_status][$notContains]=entregado&populate=*&sort=id:ASC&',this.conectionsService)

  constructor(
    private storageService: StorageService,
    private conectionsService: ConectionsService,
    private toolsService: ToolsService
  ) { }

  ngOnInit() {
    this.storageService;
  }


  public selectPackage(_id) {
    
  }

  public sharePackage(_id: number) {
    this.toolsService.showLoading()
      .then(async loading => {
        const { id } = await this.conectionsService.get<any>(`ticket/generate/${_id}`).toPromise()
        loading.dismiss();
        (await this.toolsService.showAlert({
          backdropDismiss: false,
          header: 'Enlace Generado 🌎',
          subHeader: 'Comparta este elace a su cliente para validar los datos de entrega',
          keyboardClose: true,
          mode: 'ios',
          cssClass: 'alert-primary',
          inputs: [{
            type: 'text',
            value: 'https://fastworld.app/ticket/' + id,
            name: 'url'
          }],
          buttons: [{
            text: 'copiar',
            role: 'success',
            handler: async (data) => {
              await Clipboard.write({ url: data.url })
              await this.toolsService.showToast({
                message: 'Enlace copiado',
                icon: 'copy',
                mode: 'ios',
                buttons: ['Aceptar']
              })
            }
          }]
        }))
      })
  }
}

