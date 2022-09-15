import { Router } from '@angular/router';
import { ConectionsService } from './../../../../services/connections.service';
import { ModalMapComponent } from './../../../generic-components/modal-map/modal-map.component';
import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { ToolsService } from './../../../../services/tools.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import { CupertinoPane } from 'cupertino-pane';
import { IonDatetime, IonSegment, InputCustomEvent } from '@ionic/angular';
import { FormBuilder, FormGroup, AbstractControl, Validators, FormControl } from '@angular/forms';
import { formatCurrency } from '@angular/common';
import { IonDatetimeCustomEvent, IonSegmentCustomEvent, SegmentCustomEvent, TextareaCustomEvent } from '@ionic/core';
import { es } from 'date-fns/locale';
import { Ubication } from 'src/app/interfaces/ubication.interface';
import { encomienda } from 'src/app/interfaces/encomiendas.interface'
import { endOfMonth, format, parseISO } from 'date-fns';
import * as lib from 'libphonenumber-js';

@Component({
  selector: 'app-crear-encomienda',
  templateUrl: './crear-encomienda.component.html',
  styleUrls: ['./crear-encomienda.component.scss'],
})
export class CrearEncomiendaComponent implements OnInit {

  @ViewChild('ProgramedDateTime') public ProgramedDateTime: IonDatetime
  @ViewChild('timeOutSegment') public timeOutSegment: IonSegment
  @ViewChild('segmentLocation') public segmentLocation: IonSegment

  public productList: encomienda[]

  public categoryList: string[]

  public startListUbication: any[]

  // pane
  private addProductPane: CupertinoPane
  private selectCategoryPane: CupertinoPane
  private timeOutProgramedPane: CupertinoPane
  private timeOutToDayPane: CupertinoPane

  //form
  public encomiendaForm: FormGroup
  public receiverForm: FormGroup
  constructor(
    private toolsService: ToolsService,
    private localStorageService: LocalStorageService,
    private formBuilder: FormBuilder,
    private conectionsService: ConectionsService,
    private router:Router
  ) {
    this.productList = []
    this.categoryList = ['Alimentos', 'Compras', 'Correspondencia', 'Fragil', 'Libros', 'Madera', 'Medicina', 'Mensajeria', 'Otros', 'Ropa', 'Tecnología',];
  }

  public ngOnInit() {
    this.startListUbication = []

    this.prepareForm()

    this.addProductPane = new CupertinoPane('#add', {
      parentElement: 'app-crear-encomienda',
      backdrop: true,
      fastSwipeClose: true,
      fitHeight: true,
      simulateTouch: true,
      touchMoveStopPropagation: false,
      handleKeyboard: true,
      initialBreak: 'top',
      breaks: {
        top: { enabled: true, height: 500 }
      },
      events: {
        onWillPresent: () => {
          this.timeOutSegment.value = '';
        },
      }
    })

    this.selectCategoryPane = new CupertinoPane('#category-list', {
      parentElement: 'app-crear-encomienda',
      backdrop: true,
      fastSwipeClose: true,
      fitHeight: true,
      simulateTouch: false,
      touchMoveStopPropagation: false
    })

    this.timeOutProgramedPane = new CupertinoPane('#time-out-programed', {
      cssClass: 'method-pay-pane',
      parentElement: 'app-crear-encomienda',
      backdrop: true,
      fastSwipeClose: true,
      fitHeight: true,
      simulateTouch: false,
      bottomClose: true,
      touchMoveStopPropagation: false,
      handleKeyboard: true,
      events: {
        onWillPresent: () => {
          this.ProgramedDateTime.min = new Date(Date.now()).toISOString()
          this.ProgramedDateTime.max = endOfMonth(new Date(Date.now())).toISOString()
        },
      }
    })

    this.timeOutToDayPane = new CupertinoPane('#time-out-today', {
      cssClass: 'method-pay-pane',
      parentElement: 'app-crear-encomienda',
      backdrop: true,
      fastSwipeClose: true,
      fitHeight: true,
      simulateTouch: false,
      bottomClose: true,
      touchMoveStopPropagation: false,
      handleKeyboard: true
    })
  }

  public async ionViewDidEnter() {

  }

  // methods
  public editItem(item) {

  }

  public deleteItem(item) {

  }

  private prepareForm(){
    this.encomiendaForm = this.formBuilder.group({
      category: [null, [Validators.required]],
      timeOut: [null, [Validators.required]],
      route: this.formBuilder.group({
        start: [null, [Validators.required]],
        end: [null, [Validators.required]],
        distance: [null],
        value: [null]
      }),
      payment: this.formBuilder.group({
        value: ['$0.00', []]
      }),
      receiver: this.formBuilder.group({
        name: ['', [Validators.required]],
        phone: ['', [Validators.required,
        (phoneControl: AbstractControl<string>) => {
          if (phoneControl['value'] != '') {
            if (RegExp(/ /).test(phoneControl['value'])) phoneControl.patchValue(phoneControl['value'].replace(/ /, ''));
            if (RegExp(/^[0-9]{10}$/).test(phoneControl['value'])) phoneControl.setValue(lib.format(phoneControl['value'], 'EC', 'INTERNATIONAL').replace(/ /, ''));
            if (RegExp(/^[+]{1}[0-9]{12}$/).test(phoneControl['value']) && lib.isValidPhoneNumber(phoneControl['value'])) return null;
            return { notIsValidPhoneNumber: true };
          }
        }]]
      }),

    })

    this.encomiendaForm.get('route')
      .valueChanges.subscribe(value => {
        if (value.start != null && value.end != null) {
          const { start, end } = value          
          this.conectionsService
            .mapDirections({
              origin: start.position,
              destination: end.position,
              travelMode: google.maps.TravelMode.DRIVING,
              unitSystem: google.maps.UnitSystem.METRIC,
            })
            .subscribe(res => {
              this.setCalculateFee(res);
            })
        }
      })

  }



  public _typeof(base: any, comparator: string) {
    return (typeof base == comparator)
  }

  public timeOutFormat(time: string | number) {
    return typeof time == 'number' ? `${time} Minutos` : format(parseISO(time), "EEEE MMMM d 'del' y - h:mm aaa", { locale: es })
  }

  public async popoverDidPresentUserUbication() {
    this.startListUbication = []
    let { direction } = (await this.localStorageService.get(environment.user_tag)).business
    this.startListUbication.push(direction)
  }

  onChangeSegmentLocation(_$event:Event){
    const{detail} = _$event as SegmentCustomEvent
    if (detail.value == '0')this.setReceiver();
    if (detail.value == '1') this.setTicket();
  }

  public ionChangesInputCurrency(_$event: Event) {
    const $event = (_$event as InputCustomEvent)
    let value = $event.detail.value;
    const decimal: string = ',';
    const thousand: string = '.';
    if (RegExp(/$/g).test($event.detail.value)) $event.detail.value.replace('$', '');
    if ($event.detail.value == '') this.encomiendaForm.get(['payment', 'value']).setValue(value = '0' + decimal + '00');
    value = value + '';
    value = value.replace(/[\D]+/g, '');
    value = value + '';
    value = value.replace(/([0-9]{2})$/g, decimal + '$1');
    var parts = value.toString().split(decimal);
    if (parts[0] == '') parts[0] = '0';
    parts[0] = parseInt(parts[0]).toString();
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, thousand);
    value = parts.join(decimal);
    this.encomiendaForm.get(['payment', 'value']).setValue('$' + value)
  }

  public async onOpenModalMapStart() {
    this.setStartUbication(
      (await this.toolsService
        .showModal({
          component: ModalMapComponent,
          backdropDismiss: false,
          keyboardClose: true,
          cssClass: 'modal-fullscreen'
        })
      )
    )
  }

  public async onOpenModalMapEnd() {
    this.setEndUbication(
      (await this.toolsService
        .showModal({
          component: ModalMapComponent,
          backdropDismiss: false,
          keyboardClose: true,
          cssClass: 'modal-fullscreen'
        })
      )
    )
  }

  //setters

  /**
  * Fee and distance
  */
  public setCalculateFee(result: google.maps.DirectionsResult) {
    if (!result.hasOwnProperty('routes')) return;
    const { distance } = result.routes[0].legs[0];
    let km = Number(distance.text.replace(/km/, '').replace(/,/, '.').trim());
    let multiplicador = Math.ceil(km / 6);
    let base = 2; //recordar crear algoritmo de sucursales
    let start = 0.50;
    let tarifa = (multiplicador * start) + base;
    (this.encomiendaForm.get(['route', 'distance']) as FormControl).setValue(km,{emitEvent:false});
    (this.encomiendaForm.get(['route', 'value']) as FormControl).setValue(tarifa,{emitEvent:false});
  }

  public setReceiver() {
    if (!this.encomiendaForm.value.hasOwnProperty('receiver')) {
      (this.encomiendaForm.get('route') as FormGroup)
        .addControl('end', this.formBuilder.control( null , { validators: [Validators.required] }));
      this.encomiendaForm
        .addControl('receiver', this.formBuilder.group({
          name: ['', [Validators.required]],
          phone: ['', [Validators.required,
          (phoneControl: AbstractControl<string>) => {
            if (phoneControl['value'] != '') {
              if (RegExp(/ /).test(phoneControl['value'])) phoneControl.patchValue(phoneControl['value'].replace(/ /, ''));
              if (RegExp(/^[0-9]{10}$/).test(phoneControl['value'])) phoneControl.setValue(lib.format(phoneControl['value'], 'EC', 'INTERNATIONAL').replace(/ /, ''));
              if (RegExp(/^[+]{1}[0-9]{12}$/).test(phoneControl['value']) && lib.isValidPhoneNumber(phoneControl['value'])) return null;
              return { notIsValidPhoneNumber: true };
            }
          }]]
        }));
      this.encomiendaForm.updateValueAndValidity()
    }
  }

  public setTicket() {
    this.encomiendaForm.removeControl('receiver');
    (this.encomiendaForm.get('route') as FormGroup).removeControl('end')    
    // this.encomiendaForm.updateValueAndValidity()
  }

  public setStartUbicationMessage($event: Event) {
    this.encomiendaForm.get('route').get('start').value.message = ($event as TextareaCustomEvent).detail.value
  }

  public setEndUbicationMessage($event: Event) {
    this.encomiendaForm.get('route').get('end').value.message = ($event as TextareaCustomEvent).detail.value
  }

  public setStartUbication(x: Ubication) {
    this.encomiendaForm
      .get('route')
      .get('start')
      .setValue(x)
  }

  public setEndUbication(x: Ubication) {
    this.encomiendaForm
      .get('route')
      .get('end')
      .setValue(x)
  }

  public async setProduct() {
    this.productList.push({ receiver: this.receiverForm != null ? { ...this.receiverForm.value } : null, ...this.encomiendaForm.value })

    console.log(this.productList);

    await this.addProductPane.destroy({ animate: true })
  }

  public async setTimeOut(method: 'today' | 'programed') {
    switch (method) {
      case 'today':
        await this.timeOutToDayPane.present({ animate: true })
        break;
      case 'programed':
        await this.timeOutProgramedPane.present({ animate: true })
        break;
      default:
        console.error('setTimeOut Error > ', method);
        break;
    }
  }

  public async setTimeOutToday(timeOut: number) {
    this.encomiendaForm.get('timeOut').setValue(timeOut);
    await this.timeOutToDayPane.destroy({ animate: true });
  }

  public async setTimeOutProgramed($event: Event) {
    this.encomiendaForm.get('timeOut').setValue(($event as IonDatetimeCustomEvent<any>).detail.value)
    await this.timeOutProgramedPane.destroy({ animate: true })
  }

  public async setCategory(category: string) {
    this.encomiendaForm.get('category').setValue(category)
    await this.selectCategoryPane.destroy({ animate: true })
  }

  // show panes

  public async onShowCategoryPane() {
    await this.selectCategoryPane.present({ animate: true })
  }

  public async onShowAddProduct() {
    this.prepareForm()
    await this.addProductPane.present({ animate: true })
  }


  /**
   * HTTP
   */
  public async post() {
    const { id } = await this.localStorageService.get(environment.user_tag)
    this.conectionsService
      .post(`packages/cliente`, {
        client: id,
        packages: this.productList
      }).subscribe(res => {console.log(res); this.router.navigateByUrl('./activas')})
  }



}

