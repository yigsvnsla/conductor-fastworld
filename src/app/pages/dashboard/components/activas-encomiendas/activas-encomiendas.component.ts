import { FormBuilder, FormGroup, Validators } from "@angular/forms";
import { ToolsService } from "src/app/services/tools.service";
import {
  ConectionsService,
  Source,
} from "src/app/services/connections.service";
import { StorageService } from "./../../../../services/storage.service";
import { Component, OnInit, ViewChild } from "@angular/core";
import { Clipboard } from "@capacitor/clipboard";
import { map, tap, delay } from "rxjs/operators";
import { Observable, timer } from "rxjs";
import { formatDistanceToNowStrict, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { InputCustomEvent, IonModal, ModalController } from "@ionic/angular";
import * as qs from "qs";
import { SocketService } from "src/app/services/socket.service";
import { TitleCasePipe } from "@angular/common";
import { ModalDetailsComponent } from "./modal-details/modal-details.component";

@Component({
  selector: "app-activas-encomiendas",
  templateUrl: "./activas-encomiendas.component.html",
  styleUrls: ["./activas-encomiendas.component.scss"],
})
export class ActivasEncomiendasComponent implements OnInit {
  @ViewChild("modal") modal: IonModal;

  _qs = qs.stringify({
    filters: {
      $or: [
        {
          shipping_status: {
            $containsi: "aceptado",
          },
        },
        {
          shipping_status: {
            $containsi: "recibido",
          },
        },
      ],
    },
  });
  public source = new Source(
    `driver/packages?populate=*&${this._qs}&sort=id:DESC`,
    this.conectionsService
  );
  // public source = new Source('driver/packages?filters[shipping_status][$notContains]=invalido&filters[shipping_status][$notContains]=entregado&populate=*&sort=id:DESC&', this.conectionsService)
  public dialogForm: FormGroup;
  private value: number = 0;
  constructor(
    private conectionsService: ConectionsService,
    private toolsService: ToolsService,
    private formBuilder: FormBuilder,
    private modalcontroller: ModalController,
    private socketService: SocketService,
    private titlecasePipe: TitleCasePipe
  ) {
    this.dialogForm = this.formBuilder.nonNullable.group({
      money_catch: ["$0.00", [Validators.required]],
      discharge: ["$0.00"],
      comment: ["Sin Novedad", [Validators.required]],
    });
  }

  ngOnInit() {
    this.socketService.on("product-updated", (product: any | any[]) => {
      let _id = product.data.id;
      let tempArr = this.source.itemsChanges$.value.map((value, index, arr) => {
        let _refValue: any = value;
        if (_refValue.id == _id) {
          if (product.data.attributes.shipping_status != "pendiente") {
            // delete
            _refValue = product.data;
          }
          if (product.data.attributes.shipping_status == "pendiente") {
            // add
            _refValue = value;
          }
        }
        return _refValue;
      });
      this.source.itemsChanges$.next([...tempArr]);
    });
  }

  ionViewDidEnter() {}

  ionViewWillLeave() {
    /**
     * Important, remove all listener of the events used.
     */
    this.socketService.removeAllListeners("product-updated");
    // this.socketService.removeAllListeners('product-created')
  }

  modalOnWillPresent($event) {
    this.dialogForm.reset();
    console.log("dasdasdasdas");
  }

  public ionChangesInputCurrency(_$event: Event, target: string) {
    const $event = _$event as InputCustomEvent;
    let value = $event.detail.value;
    const decimal: string = ",";
    const thousand: string = ".";
    if (RegExp(/$/g).test($event.detail.value))
      $event.detail.value.replace("$", "");
    if ($event.detail.value == "")
      this.dialogForm.get([target]).setValue((value = "0" + decimal + "00"));
    value = value + "";
    value = value.replace(/[\D]+/g, "");
    value = value + "";
    value = value.replace(/([0-9]{2})$/g, decimal + "$1");
    var parts = value.toString().split(decimal);
    if (parts[0] == "") parts[0] = "0";
    parts[0] = parseInt(parts[0]).toString();
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
    value = parts.join(decimal);
    this.dialogForm.get([target]).setValue("$" + value);
  }

  public selectPackage(_id) {
    this.toolsService.showAlert({
      backdropDismiss: false,
      cssClass: "alert-primary",
      header: "Traspasar 📦",
      subHeader: "Ingresa el codigo del motorizado que recibira este paquete",
      inputs: [
        {
          type: "number",
          name: "id",
          placeholder: "Codigo del conductor",
          cssClass: "input-number",
        },
      ],
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
          cssClass: "secondary",
        },
        {
          text: "Transferir",
          handler: async ({ id }) => {
            let loading = await this.toolsService.showLoading(
              "Transfiriendo..."
            );
            try {
              const response = await this.conectionsService
                .post("package/transfer", {
                  driver: id,
                  package: _id,
                })
                .toPromise();
              console.log(response);
              this.source.deleteItemToSource(_id);
            } catch (error) {
              console.log(error);
            } finally {
              this.dialogForm = this.formBuilder.nonNullable.group({
                money_catch: ["$0.00", [Validators.required]],
                comment: ["Sin Novedad", [Validators.required]],
              });
              this.modal.dismiss();
              loading.dismiss();
            }
          },
        },
      ],
    });
  }

  public async updateStatusPackage(index: number, _id: number, status: string) {
    let loading = await this.toolsService.showLoading("Actualizando...");
    const { money_catch, comment, discharge } = this.dialogForm.value;

    try {
      let response = await this.conectionsService
        .post(`packages/shipping/${_id}?populate=*`, {
          money_catch,
          comment,
          status,
          discharge,
          time: this.toolsService.satinizeDate(new Date()).toISOString(),
        })
        .toPromise();
      if (status == "recibido") {
        this.source.updateItemToSource(_id, response.data);
        this.chooseDownload(_id);
      }
      if (status != "recibido") {
        this.source.deleteItemToSource(_id);
      }

      if (status == "entregado") {
        this.chooseDownload(_id);
      }
    } catch (error) {
      console.log(error);
    } finally {
      this.dialogForm = this.formBuilder.nonNullable.group({
        money_catch: ["$0.00", [Validators.required]],
        discharge: ["$0.00"],
        comment: ["Sin novedad", [Validators.required]],
      });
      loading.dismiss();
      (await this.modalcontroller.getTop()).dismiss();
    }
  }

  chooseDownload(id) {
    this.toolsService.showAlert({
      backdropDismiss: false,
      cssClass: "alert-primary",
      header: "Descargas",
      subHeader: "¿Deseas descargar un comprobante?",
      buttons: [
        {
          text: "Cancelar",
          role: "cancel",
          cssClass: "secondary",
        },
        {
          text: "Aceptar",
          handler: () => {
            console.log(id, "id para imprimir");
            this.conectionsService.downloadPDF(id, `Encomienda #${id}`, true);
          },
        },
      ],
    });
  }

  onChangeSelect(event: any) {
    const { checked } = event.detail;
    if (!checked) {
      this.dialogForm.get("discharge").patchValue("$0.00");
    }
  }

  async onRefresh(event?: any) {
    await this.source.refresh();
    if (event) {
      event.target.complete();
    }
  }

  showDetails(item: any) {
    this.toolsService
      .showModal({
        component: ModalDetailsComponent,
        componentProps: {
          item,
        },
      })
      .then((res) => {
        if (res == null) return;
        if (res.hasOwnProperty("transfer")) {
          this.selectPackage(res.transfer);
        }
      });
  }
}
