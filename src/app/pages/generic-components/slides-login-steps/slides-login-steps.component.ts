import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { ToolsService } from 'src/app/services/tools.service';
import { ConectionsService } from 'src/app/services/connections.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import SwiperCore, { Pagination, Swiper, SwiperOptions } from 'swiper'
import { IonicSlides, ModalController, } from '@ionic/angular';
import { Observable, of, } from 'rxjs';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Ubication } from 'src/app/interfaces/ubication.interface';
import { tap } from 'rxjs/operators';

SwiperCore.use([Pagination, IonicSlides])
@Component({
  selector: 'app-slides-login-steps',
  templateUrl: './slides-login-steps.component.html',
  styleUrls: ['./slides-login-steps.component.scss'],
})
export class SlidesLoginStepsComponent implements OnInit {

  @ViewChild('googleMap') public googleMap: google.maps.Map;
  private swiper: Swiper;
  public swiperConfig: SwiperOptions;

  public autocompletePredictions: google.maps.places.AutocompletePrediction[]
  public googleAutocompleteService: google.maps.places.AutocompleteService
  private sessionToken: google.maps.places.AutocompleteSessionToken;
  public markerOptions: google.maps.MarkerOptions;
  public mapOptions: google.maps.MapOptions;
  public apiLoaded: Promise<HTMLIonLoadingElement>
  public apiMap$: Observable<boolean>;
  public myUbication: Ubication

  public stepsForm: FormGroup


  constructor(
    private conectionsService: ConectionsService,
    private formBuilder: FormBuilder,
    private toolsService: ToolsService,
    private localStorageService:LocalStorageService,
    private modalController:ModalController
  ) {

    this.apiMap$ = of(false)
    this.autocompletePredictions = []
    this.myUbication = {
      address: '',
      position: null,
      placeId:null
    }
    this.mapOptions = {
      keyboardShortcuts: false,
      disableDefaultUI: true,
      minZoom: 12,
      maxZoom: 18,
      zoom: 12,
      center: {
        lat: -2.1546273,
        lng: -79.8641237
      }
    };

    this.markerOptions = {
      draggable: false
    }

    this.swiperConfig = {
      centeredSlides: true,
      centeredSlidesBounds: true,
      slidesPerView: 'auto',
      allowTouchMove: false,
      keyboard: false,
      pagination: {
        clickable: false,
        dynamicBullets: true
      },
    }
  }

  uploadFiles: any = [];

  ngOnInit() {
    this.stepsForm = this.formBuilder.nonNullable.group({
      business: this.formBuilder.nonNullable.group({
        name: ['', [Validators.required,]],
        logoImg: ['', [Validators.required,]],
        ubication: ['', [Validators.required,]],
        documentImg: ['', [Validators.required,]],
      })
    });
    this.apiLoaded = this.toolsService.showLoading('Cargando Recursos..')
    this.uploadFiles = [];
  }

  public async ionViewDidEnter() {



    (await this.apiLoaded).dismiss()
    this.apiMap$ = this.conectionsService
      .getGoogleMapsApi()
      .pipe(
        tap(api => {

          this.googleAutocompleteService = new google.maps.places.AutocompleteService();
          this.sessionToken = new google.maps.places.AutocompleteSessionToken();
          this.markerOptions.position = this.mapOptions.center;
          // if (typeof google === 'object' && typeof google.maps === 'object') {
          //   let x = async ()=>{
          //   }
          //   x()
          // }

        })
      )
  }

  public showMap() {
    this.conectionsService
      .geolocation((geolocationPosition) => {
        if (geolocationPosition) {
          this.myUbication.position = { lat: geolocationPosition.coords.latitude, lng: geolocationPosition.coords.longitude };
          this.mapOptions.center = { lat: geolocationPosition.coords.latitude, lng: geolocationPosition.coords.longitude };
          this.markerOptions.position = { lat: geolocationPosition.coords.latitude, lng: geolocationPosition.coords.longitude };
          this.mapOptions.center = { lat: geolocationPosition.coords.latitude, lng: geolocationPosition.coords.longitude };
          this.googleMap.panTo(this.myUbication.position);
          this.mapOptions.zoom = 17
          this.conectionsService
            .mapGeocode({ location: this.myUbication.position })
            .subscribe(_geoCodeResults => {
              this.myUbication.address = _geoCodeResults[0].formatted_address
              this.myUbication.placeId = _geoCodeResults[0].place_id
              this.nextSlider()
            })

        }
      })
  }

  public imgHandler(event: Event, elementViewPort?: HTMLImageElement) {
    console.log(event);
    // pasamos a una constante el arr de archivo
    const files = (event.target['files'] as File[])
    // si el evento tiene un archivo y si esta en el indice
    if (files && files.length) {
      this.uploadFiles.push({
        name: event.target['id'],
        file: files[0]
      })
      if (elementViewPort) {
        //  creamos una instancia de un FileReader
        var fr = new FileReader();
        fr.onload = () => {
          elementViewPort.style.backgroundImage = `url('${fr.result.toString()}')`
          elementViewPort.style.backgroundSize = 'cover'
        }
        fr.readAsDataURL(files[0]);
      }
    }
  }

  ///////>>>>

  public async searchAddresChange($event: Event) {
    this.myUbication.address = ($event as CustomEvent).detail.value;
    if (($event as CustomEvent).detail.value != '') {
      let { predictions } =  (await this.googleAutocompleteService.getPlacePredictions({
        input: ($event as CustomEvent).detail.value,
        sessionToken: this.sessionToken,
        language: 'es-419',
        componentRestrictions: { country: 'EC' },
      }))
      this.autocompletePredictions = predictions
    }
  }

  public selectAddress(prediction: google.maps.places.AutocompletePrediction) {
    this.conectionsService
      .mapGeocode({ placeId: prediction.place_id, region: 'EC' })
      .subscribe(result => {
        this.myUbication.placeId = prediction.place_id
        this.myUbication.position = result[0].geometry.location.toJSON()
        this.markerOptions.position = result[0].geometry.location.toJSON()
        this.mapOptions.center = result[0].geometry.location.toJSON()
        this.mapOptions.zoom = this.mapOptions.maxZoom
        this.googleMap.panTo(this.myUbication.position);
        this.autocompletePredictions = []
      })
  }

  public searchAddresCancel(elementRef: any) {
    this.autocompletePredictions = []
  }

  public mapDragend() {
    this.markerOptions.position = this.googleMap.getCenter().toJSON()
    this.conectionsService
      .mapGeocode({ location: this.googleMap.getCenter().toJSON() })
      .subscribe(_geoCodeResults => {
        this.myUbication.address = _geoCodeResults[0].formatted_address
      })
  }

  public mapDrag() {
    this.markerOptions.position = this.googleMap.getCenter().toJSON()

  }

  public centerMyUbication() {
    this.googleMap.panTo(this.myUbication.position);
    this.markerOptions.position = this.myUbication.position;
  }

  public selectUbication() {
    this.toolsService.showAlert({
      header: 'Confirmar Ubicación 🛰',
      subHeader: 'recuerde que para brindar un servicio eficiente verifique que la ubicación ingresada sea la correcta oh la mas proxima, si es asi presione confirmar',
      cssClass: 'alert-success',
      buttons: ['Cancelar', {
        text: 'confirmar', handler: () => {
          this.nextSlider();
          this.stepsForm
            .get('business')
            .get('ubication')
            .setValue(this.myUbication);
        }
      }]
    })
  }
  ///////<<<<<
  public nextSlider() {
    this.swiper.slideNext()
  }

  public backSlider() {
    this.swiper.slidePrev()
  }

  public setSwiperInstance($swiper: Swiper) {
    this.swiper = $swiper;
  }

  public async goApp() {
    await this.buildPost()
  }

  async buildPost() {
    
    const localUser = (await this.localStorageService.get(environment.user_tag))

    let data = this.stepsForm.value;
    let form = new FormData();
    this.uploadFiles.forEach(({ name, file }) => {
      form.append(`files.${name.replace('image_', '')}`, file, file.name);
    });
    form.append('data', JSON.stringify(data))
    this.conectionsService
      .post(`user/business/${localUser.id}`, form)
      .subscribe( async res => {
        if ((await this.modalController.getTop())) {
          (await this.modalController.dismiss(true));
          (await this.localStorageService.update(environment.user_tag,{...localUser,business:res}))
        }
        console.log(res)
      })
  }

  // <script async defer src="//maps.googleapis.com/maps/api/js?key=AIzaSyCkUOdZ5y7hMm0yrcCQoCvLwzdM6M8s5qk&libraries=places&callback=initialize">
}
