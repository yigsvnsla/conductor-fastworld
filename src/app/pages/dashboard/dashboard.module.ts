import { EncomiendaComponent } from './components/encomienda/encomienda.component';
import { ActivasEncomiendasComponent } from './components/activas-encomiendas/activas-encomiendas.component';
import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';

import { DashboardPage } from './dashboard.page';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './components/home/home.component';
import { GenericComponentsModule } from '../generic-components/generic-components.module';
import { HistorialEncomiendaComponent } from './components/historial-encomienda/historial-encomienda.component';
import { CrearEncomiendaComponent } from './components/crear-encomienda/crear-encomienda.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    HttpClientModule,
    GenericComponentsModule,
    ScrollingModule
  ],
  declarations: [
    DashboardPage,
    HomeComponent,
    HistorialEncomiendaComponent,
    CrearEncomiendaComponent,
    ActivasEncomiendasComponent,
    EncomiendaComponent
  ],
  providers:[CurrencyPipe]
})
export class DashboardPageModule {}
