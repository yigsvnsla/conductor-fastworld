import { environment } from 'src/environments/environment';
import { LocalStorageService } from 'src/app/services/local-storage.service';
import { ToolsService } from 'src/app/services/tools.service';
import { ConectionsService } from 'src/app/services/connections.service';
import { Component, OnInit, ViewChild } from '@angular/core';
import SwiperCore, { Pagination, Swiper, SwiperOptions } from 'swiper'
import { IonicSlides, ModalController, InputCustomEvent } from '@ionic/angular';
import { Observable, of, } from 'rxjs';
import { FormBuilder, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { Ubication } from 'src/app/interfaces/ubication.interface';
import { tap } from 'rxjs/operators';

SwiperCore.use([Pagination, IonicSlides])
@Component({
  selector: 'app-slides-login-steps',
  templateUrl: './slides-login-steps.component.html',
  styleUrls: ['./slides-login-steps.component.scss'],
})
export class SlidesLoginStepsComponent implements OnInit {

  public stepsForm: FormGroup
  public swiperConfig: SwiperOptions;

  private swiper: Swiper;

  private localUser: any
  public uploadFiles: any[]

  constructor(
    private conectionsService: ConectionsService,
    private formBuilder: FormBuilder,
    private toolsService: ToolsService,
    private localStorageService: LocalStorageService,
    private modalController: ModalController
  ) {
    this.uploadFiles = [];
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

  public async ngOnInit() {
    let apiLoaded = this.toolsService.showLoading('Cargando Recursos..');
    this.stepsForm = this.formBuilder.nonNullable.group({
      maker: ['', [Validators.required, Validators.pattern(/([a-zA-Z])/g),]],
      model: ['', [Validators.required, Validators.pattern(/([a-zA-Z0-9])/g),]],
      year: ['', [Validators.required, Validators.pattern(/([0-9]{4})/g),]],
      color: ['', [Validators.required, Validators.pattern(/([a-zA-Z])/g),]],
      plate_id: ['', Validators.required],
      licence_id: ['', Validators.required]
    },);
    this.localUser = (await this.localStorageService.get(environment.user_tag));
    console.log(this.localUser);

    (await apiLoaded).dismiss();
  }

  public async goApp() {
    await this.buildPost()
  }

  public setSwiperInstance($swiper: Swiper) {
    this.swiper = $swiper;
  }

  public nextSlider() {
    this.swiper.slideNext()
  }

  public backSlider() {
    this.swiper.slidePrev()
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

  async buildPost() {
    let data = this.stepsForm.value;
    let form = new FormData();
    console.log(data)
    this.uploadFiles.forEach(({ name, file }) => {
      form.append(`files.${name.replace('image_', '')}`, file, file.name);
    });
    form.append('data', JSON.stringify(data))
    this.conectionsService
      .post(`user/driver/${this.localUser.id}`, form)
      .subscribe(async res => {
        if ((await this.modalController.getTop())) {
          (await this.modalController.dismiss(true));
          (await this.localStorageService.update(environment.user_tag, { ...this.localUser, driver: res }))
        }
        console.log(res)
      })
  }

  // <script async defer src="//maps.googleapis.com/maps/api/js?key=AIzaSyCkUOdZ5y7hMm0yrcCQoCvLwzdM6M8s5qk&libraries=places&callback=initialize">
}
