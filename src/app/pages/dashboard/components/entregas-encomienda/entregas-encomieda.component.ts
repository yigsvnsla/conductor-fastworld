import { Component, OnInit } from "@angular/core";
import { ConectionsService, Source } from "src/app/services/connections.service";
import { StorageService } from "src/app/services/storage.service";
import { ToolsService } from "src/app/services/tools.service";
import { Clipboard } from '@capacitor/clipboard';

@Component({
    selector:'app-entregas-encomienda',
    templateUrl:'./entregas-encomieda.component.html',
    styleUrls:['./entregas-encomieda.component.scss']
})
export class EntregasEncomiendaComponent implements OnInit{

    public source = new Source('packages?filters[shipping_status][$contains]=pendiente&sort=id:ASC&populate=*',this.conectionsService)

    constructor(
      private storageService: StorageService,
      private conectionsService: ConectionsService,
      private toolsService: ToolsService
    ) { }

    ngOnInit() {
      this.storageService;
    }
    public selectPackage(_id:number) {
        this.toolsService.showAlert({
            header:'Agregar Ruta',
            subHeader:'¿Desea agregar esta encomienda a sus lista de rutas de envios?',
            buttons:['Cancelar',{text:'Agregar',role:'success',handler:()=>{}}]
        })
    }

}
