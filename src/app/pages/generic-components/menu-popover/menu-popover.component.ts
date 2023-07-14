import { Component, Input, OnInit } from '@angular/core';
import { ConectionsService } from 'src/app/services/connections.service';

@Component({
  selector: 'menu-popover',
  templateUrl: './menu-popover.component.html',
  styleUrls: ['./menu-popover.component.scss'],
})
export class MenuPopoverComponent implements OnInit {

  @Input('package') package: { id: number };

  constructor(private http: ConectionsService) { }

  ngOnInit() { }


  download(type: 'entrega' | 'recibido') {
    this.http.downloadPDF(this.package.id, `Encomienda #${this.package.id}`, true)
  }

}
