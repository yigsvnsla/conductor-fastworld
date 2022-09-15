import { ModalController } from '@ionic/angular';
import { ConectionsService } from 'src/app/services/connections.service';
import { ToolsService } from 'src/app/services/tools.service';
import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { ModalMapComponent } from '../generic-components/modal-map/modal-map.component';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-ticket',
  templateUrl: './ticket.page.html',
  styleUrls: ['./ticket.page.scss'],
})
export class TicketPage implements OnInit {

  public ticketForm: FormGroup
  public encomienda: any = undefined
  public complete = false
  public expired = false
  constructor(
    private formBuilder: FormBuilder,
    private toolsService: ToolsService,
    private conectionsService: ConectionsService,
    private activeRoute: ActivatedRoute,
    private modalController:ModalController
  ) { }

  async ngOnInit() {    
    this.ticketForm = this.formBuilder.nonNullable.group({
      name_complete: ['', [Validators.required]],
      phone: ['', [Validators.required]],
      description: [''],
      ubication: [null],
    })
  }

  async ionViewDidEnter() {
    let loading = await this.toolsService.showLoading('Consultando informacion...')
      this.conectionsService
      .get(`ticket/${this.activeRoute.snapshot.paramMap.get('id')}`, false)
      .toPromise()
      .then(res => this.encomienda  = res)
      .catch(async err=> {
        this.expired = true        
      })
      .finally(()=>{  
        loading.dismiss()
      })
  }
  public addDescription($event) {

  }

  public onOpenModalMap() {
    this.toolsService
      .showModal({
        component: ModalMapComponent,
        backdropDismiss: false,
        keyboardClose: true,
        cssClass: 'modal-fullscreen'
      })
      .then(result => {
        this.conectionsService.mapDirections({
          origin: this.encomienda.location.position,
          destination: result.position,
          travelMode: google.maps.TravelMode.DRIVING,
          unitSystem: google.maps.UnitSystem.METRIC,
        })
          .subscribe(n => {
            if (!n.hasOwnProperty('routes')) return;
            const { distance } = n.routes[0].legs[0];
            let km = Number(distance.text.replace(/km/, '').replace(/,/, '.').trim());
            let multiplicador = Math.ceil(km / 6);
            let base = 2; //recordar crear algoritmo de sucursales
            let start = 0.50;
            let tarifa = (multiplicador * start) + base;
            (this.ticketForm.get('ubication') as FormControl).setValue({ ...result, tarifa, km }, { emitEvent: false });

            this.post()
          })
      })


  }

  async post() {
    let loading = await this.toolsService.showLoading('Subiendo informacion...')
    try {
      let request = await this.conectionsService.post('ticket', {
        token: this.encomienda.token, // Insertar JWT aqui,
        encrypt: this.activeRoute.snapshot.paramMap.get('id'), // insertar parametro de url aqui
        direction: this.ticketForm.value, //Insertar coordenadas, placeid y esas weas aqui..
      }, false).toPromise()
      console.log(request)
    } catch (error) {

    } finally {
      loading.dismiss()
      this.complete = true
    }
  }
}
