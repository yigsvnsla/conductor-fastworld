import { Component, OnInit } from "@angular/core";
import { ConectionsService, Source } from "src/app/services/connections.service";
import { StorageService } from "src/app/services/storage.service";
import { ToolsService } from "src/app/services/tools.service";

@Component({
    selector: 'app-entregas-encomienda',
    templateUrl: './entregas-encomieda.component.html',
    styleUrls: ['./entregas-encomieda.component.scss']
})
export class EntregasEncomiendaComponent implements OnInit {

    public source = new Source('packages?filters[shipping_status][$contains]=pendiente&sort=id:ASC&populate=*', this.conectionsService)

    constructor(
        private storageService: StorageService,
        private conectionsService: ConectionsService,
        private toolsService: ToolsService
    ) { }

    ngOnInit() {
        this.storageService;
    }
    public selectPackage(id: number, index: number) {

        this.toolsService.showAlert({
            header: 'Agregar Ruta',
            subHeader: '¿Desea agregar esta encomienda a sus lista de rutas de envios?',
            message: 'Recuerde que puede ver asignada esta encomienda en la seccion de activas del menu lateral.',
            buttons: ['Cancelar', {
                text: 'Agregar', role: 'success', handler: async () => {
                    let loading = await this.toolsService.showLoading("Obteniendo encomienda...");
                    this.conectionsService.post('package/pickup', { id })
                        .toPromise()
                        .then(res => this.source.updateSource(index))
                        .finally(() => loading.dismiss())
                }
            }]
        })
    }
}