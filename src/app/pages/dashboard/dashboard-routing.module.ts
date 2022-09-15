import { AutoLoginGuard } from './../../guards/auto-login.guard';
import { ActivasEncomiendasComponent } from './components/activas-encomiendas/activas-encomiendas.component';
import { CrearEncomiendaComponent } from './components/crear-encomienda/crear-encomienda.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';

import { DashboardPage } from './dashboard.page';
import { HistorialEncomiendaComponent } from './components/historial-encomienda/historial-encomienda.component';
import { CompleteStepsGuard } from 'src/app/guards/complete-steps.guard';

const routes: Routes = [{
  path: '',
  component: DashboardPage,
  children: [
    {
      path: '',
      pathMatch: 'full',
      redirectTo: 'home'
    }, 
    {
      path: 'home',
      component: HomeComponent,
    }, 
    {
      path: 'encomienda',
      children: [
        {
          path: 'crear',
          component: CrearEncomiendaComponent
        }, 
        {
          path: 'activas',
          component: ActivasEncomiendasComponent
        }, 
        {
        path: 'historial',
        component: HistorialEncomiendaComponent
        }
      ]
    }
  ],
  canActivate:[AutoLoginGuard,CompleteStepsGuard],

}];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class DashboardPageRoutingModule { }
