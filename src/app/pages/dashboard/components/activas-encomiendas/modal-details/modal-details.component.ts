import { Component, Input, OnInit } from "@angular/core";
import { ModalController } from "@ionic/angular";
import { ConectionsService } from "src/app/services/connections.service";
import { Clipboard } from "@capacitor/clipboard";
import { ToolsService } from "src/app/services/tools.service";

@Component({
  selector: "app-modal-details",
  templateUrl: "./modal-details.component.html",
  styleUrls: ["./modal-details.component.scss"],
})
export class ModalDetailsComponent implements OnInit {
  @Input() item: any;

  sender: any;

  constructor(
    private toolsService: ToolsService,
    private conectionsService: ConectionsService,
    private modal: ModalController
  ) {}

  async ngOnInit() {
    let response = await this.conectionsService
      .get(`sender/find/${this.item.id}`)
      .toPromise();
    if (response) this.sender = response;
  }

  sharePackage() {
    this.modal.dismiss({
      share: true,
      id: this.item.id,
    });
  }

  close() {
    this.modal.dismiss();
  }

  transfer(id) {
    this.modal.dismiss({ transfer: id });
  }
}
