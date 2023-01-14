import { Component, OnInit, OnDestroy } from "@angular/core";
import { ConectionsService, Source } from "src/app/services/connections.service";
import { SocketService } from "src/app/services/socket.service";
import { StorageService } from "src/app/services/storage.service";
import { ToolsService } from "src/app/services/tools.service";

@Component({
  selector: 'app-entregas-encomienda',
  templateUrl: './entregas-encomieda.component.html',
  styleUrls: ['./entregas-encomieda.component.scss']
})
export class EntregasEncomiendaComponent implements OnInit, OnDestroy {

  public source = new Source('packages?populate=*&sort[id]=DESC&filters[$and][0][receiver][id][$notNull]=true&filters[$and][1][shipping_status][$contains]=pendiente', this.conectionsService)

  constructor(
    private conectionsService: ConectionsService,
    private toolsService: ToolsService,
    private socketService: SocketService,
  ) { }
  ngOnDestroy(): void {
    /* this.socketService.removeListener('product-updated', (listener) => {
        console.log(listener);

    })
    this.socketService.removeListener('product-created', (listener) => {
        console.log(listener);

    }) */
  }

  ngOnInit() {
    this.socketService.on('product-created', (product: any | any[]) => {
      product['data'].forEach((value) => {

        console.log(value);

        if (value.attributes.shipping_status == 'pendiente') {
          this.source.addItemToSource(value)
        };
        // if (value.attributes.shipping_status != 'pendiente') {
        //   this.source.deleteItemToSource(value.id)
        // }
      })
    })

    this.socketService.on('product-updated', (product: any | any[]) => {
      const condition = (product.data.attributes.shipping_status == 'aceptado' || product.data.attributes.shipping_status == 'pendiente')
      console.log(product);

      if (product.data.attributes.shipping_status == 'pendiente') {
        this.source.addItemToSource(product.data)
        return
      }
      if (product.data.attributes.shipping_status != 'pendiente'){

        this.source.deleteItemToSource(product.data.id)
      }

      // if (!condition) {
      //
      // }
    })

  }



  ionViewWillLeave() {
    /**
     * Important, remove all listener of the events used.
     */
    this.socketService.removeAllListeners('product-updated')
    this.socketService.removeAllListeners('product-created')
  }


  public selectPackage({id},i) {
    this.toolsService.showAlert({
      header: 'Agregar Ruta',
      subHeader: '¿Desea agregar esta encomienda a sus lista de rutas de envios?',
      message: 'Recuerde que puede ver asignada esta encomienda en la seccion de activas del menu lateral.',
      buttons: ['Cancelar', {
        text: 'Agregar', role: 'success', handler: async () => {
          let loading = await this.toolsService.showLoading("Obteniendo encomienda...");
          this.conectionsService.post('package/pickup', { id })
            .toPromise()
            .then(res => {
              this.source.deleteItemToSource(id,i)
              // console.log(this.source);

              console.log(res);

            })
            .finally(() => loading.dismiss())
        }
      }]
    })
  }
}
