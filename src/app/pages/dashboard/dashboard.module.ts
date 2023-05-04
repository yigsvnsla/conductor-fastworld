import { PerfilComponent } from './components/perfil/perfil.component';
import { ActivasEncomiendasComponent } from './components/activas-encomiendas/activas-encomiendas.component';
import { NgModule } from '@angular/core';
import { CommonModule, CurrencyPipe, TitleCasePipe } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { DashboardPageRoutingModule } from './dashboard-routing.module';

import { DashboardPage } from './dashboard.page';
import { HttpClientModule } from '@angular/common/http';
import { HomeComponent } from './components/home/home.component';
import { GenericComponentsModule } from '../generic-components/generic-components.module';
import { HistorialEncomiendaComponent } from './components/historial-encomienda/historial-encomienda.component';
import { ScrollingModule } from '@angular/cdk/scrolling';
import { EntregasEncomiendaComponent } from './components/entregas-encomienda/entregas-encomieda.component';
import { SocketIoModule } from 'ngx-socket-io';
import { ReportsEncomiendaComponent } from "./components/reports-encomienda/reports-encomienda.component";
import { FileOpener } from '@awesome-cordova-plugins/file-opener/ngx';
@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    DashboardPageRoutingModule,
    HttpClientModule,
    GenericComponentsModule,
    ScrollingModule,
    SocketIoModule,
  ],
  declarations: [
    DashboardPage,
    HomeComponent,
    HistorialEncomiendaComponent,
    ActivasEncomiendasComponent,
    EntregasEncomiendaComponent,
    PerfilComponent,
    ReportsEncomiendaComponent
  ],
  providers:[CurrencyPipe, TitleCasePipe, FileOpener]
})
export class DashboardPageModule {}
