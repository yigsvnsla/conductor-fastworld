import { DetailsPackageComponent } from './details-package/details-package.component';
import { ModalMapComponent } from './modal-map/modal-map.component';
import { SlidesLoginStepsComponent } from './slides-login-steps/slides-login-steps.component';
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { HttpClientJsonpModule, HttpClientModule } from '@angular/common/http';
import { BtnMenuComponent } from './btn-menu/btn-menu.component';
import { SwiperModule } from 'swiper/angular';
import { GoogleMapsModule } from '@angular/google-maps';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    HttpClientModule,
    SwiperModule,
    GoogleMapsModule,
    HttpClientJsonpModule,
  ],
  declarations: [
    BtnMenuComponent,
    ModalMapComponent,
    SlidesLoginStepsComponent,
    DetailsPackageComponent

  ],
  exports:[
    BtnMenuComponent
  ]
})
export class GenericComponentsModule {}
