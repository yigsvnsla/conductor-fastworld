import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ToolsService } from 'src/app/services/tools.service';
import { ConectionsService, Source } from 'src/app/services/connections.service';
import { StorageService } from './../../../../services/storage.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { Clipboard } from '@capacitor/clipboard';
import { map, tap, delay, } from 'rxjs/operators';
import { Observable, timer, } from 'rxjs';
import { formatDistanceToNowStrict, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { InputCustomEvent, IonModal } from '@ionic/angular';


@Component({
  selector: 'app-activas-encomiendas',
  templateUrl: './activas-encomiendas.component.html',
  styleUrls: ['./activas-encomiendas.component.scss'],
})
export class ActivasEncomiendasComponent implements OnInit {

  @ViewChild('modal') modal: IonModal

  public source = new Source('driver/packages?filters[shipping_status][$notContains]=invalido&filters[shipping_status][$notContains]=entregado&populate=*&sort=id:DESC&', this.conectionsService)
  public dialogForm: FormGroup;
  private value: number = 0
  constructor(
    private conectionsService: ConectionsService,
    private toolsService: ToolsService,
    private formBuilder: FormBuilder
  ) {
    this.dialogForm = this.formBuilder.nonNullable.group({
      money_catch: ['$0.00', [Validators.required]],
      comment: ['Sin Novedad', [Validators.required]]
    })
  }



  ngOnInit() {

  }

  ionViewDidEnter() {

  }

  modalOnWillPresent($event) {
    this.dialogForm.reset()
    // console.log('dasdasdasdas');

  }

  public ionChangesInputCurrency(_$event: Event) {
    const $event = (_$event as InputCustomEvent)
    let value = $event.detail.value;
    const decimal: string = ',';
    const thousand: string = '.';
    if (RegExp(/$/g).test($event.detail.value)) $event.detail.value.replace('$', '');
    if ($event.detail.value == '') this.dialogForm.get(['money_catch']).setValue(value = '0' + decimal + '00');
    value = value + '';
    value = value.replace(/[\D]+/g, '');
    value = value + '';
    value = value.replace(/([0-9]{2})$/g, decimal + '$1');
    var parts = value.toString().split(decimal);
    if (parts[0] == '') parts[0] = '0';
    parts[0] = parseInt(parts[0]).toString();
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
    value = parts.join(decimal);
    this.dialogForm.get(['money_catch']).setValue('$' + value)
  }


  public selectPackage(_id) {
    this.toolsService.showAlert({
      backdropDismiss: false,
      cssClass: 'alert-primary',
      header: 'Traspasar ????',
      subHeader: 'Ingresa el codigo del motorizado que recibira este paquete',
      inputs: [{
        type: 'number',
        name: 'id',
        placeholder: 'Codigo del conductor',
        cssClass: 'input-number'
      }],
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
          cssClass: 'secondary',
        },
        {
          text: 'Transferir',
          handler: async ({ id }) => {
            let loading = await this.toolsService.showLoading('Transfiriendo...')
            try {
              const response = await this.conectionsService.post('package/transfer', {
                driver: id,
                package: _id
              }).toPromise()
              console.log(response);
              this.source.deleteItemToSource(_id)
            } catch (error) {
              console.log(error);
            } finally {
              this.modal.dismiss()
              loading.dismiss()
            }
          }
        }
      ]
    })
  }

  public async updateStatusPackage(index: number, _id: number, status: string) {
    let loading = await this.toolsService.showLoading('Actualizando...');
    const { money_catch, comment } = this.dialogForm.value

    try {
      let response = await this.conectionsService.post(`packages/shipping/${_id}`, {
        money_catch,
        comment,
        status
      }).toPromise()
      if ( status == 'recibido' ){
        this.source.addItemToSource(response.data);
      }
      if ( status != 'recibido' ){
        this.source.deleteItemToSource(_id)
      }

      console.log('response', response)
    } catch (error) {
      console.log(error)
    } finally {
      this
      loading.dismiss()
      this.modal.dismiss()
    }
  }
}

