import { DetailsPackageComponent } from '../../../generic-components/details-package/details-package.component';
import { ToolsService } from 'src/app/services/tools.service';
import { Source, ConectionsService } from 'src/app/services/connections.service';
import { Component, OnInit } from '@angular/core';
import { TitleCasePipe } from '@angular/common';

@Component({
  selector: 'app-historial-encomienda',
  templateUrl: './historial-encomienda.component.html',
  styleUrls: ['./historial-encomienda.component.scss'],
})
export class HistorialEncomiendaComponent implements OnInit {

  public source = new Source('driver/packages?populate=*&sort=id:DESC&', this.conectionsService)

  constructor(private conectionsService: ConectionsService, private toolsService: ToolsService,
    private titlecasePipe: TitleCasePipe) {

  }

  ngOnInit() { }

  public onSearchChange($event) {
    console.log($event);

  }

  public showModalDetailsPackages(_id: number) {
    this.toolsService.showModal({
      component: DetailsPackageComponent,
      cssClass: ['modal-fullscreen'],
      keyboardClose: true,
      mode: 'ios',
      backdropDismiss: false,
      componentProps: {
        id: _id
      }
    })
  }

  download(pack: any) {
    this.conectionsService.downloadPDF(pack.id, `Encomienda #${pack.id}`, true)
  }

}
