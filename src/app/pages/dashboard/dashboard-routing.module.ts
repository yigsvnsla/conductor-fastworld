import { PerfilComponent } from './components/perfil/perfil.component';
import { AutoLoginGuard } from './../../guards/auto-login.guard';
import { ActivasEncomiendasComponent } from './components/activas-encomiendas/activas-encomiendas.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { HomeComponent } from './components/home/home.component';

import { DashboardPage } from './dashboard.page';
import { HistorialEncomiendaComponent } from './components/historial-encomienda/historial-encomienda.component';
import { CompleteStepsGuard } from 'src/app/guards/complete-steps.guard';
import { EntregasEncomiendaComponent } from './components/entregas-encomienda/entregas-encomieda.component';
import { ReportsEncomiendaComponent } from './components/reports-encomienda/reports-encomienda.component';

const routes: Routes = [{
  path: '',
  component: DashboardPage,
  children: [
    {
      path: '',
      pathMatch: 'full',
      redirectTo: 'encomienda/activas'
    },
    // {
    //   path: 'home',
    //   component: HomeComponent,
    // },
    {
      path: 'encomienda',
      children: [
        {
          path: 'entregas',
          component: EntregasEncomiendaComponent
        },
        {
          path: 'activas',
          component: ActivasEncomiendasComponent
        },
        {
        path: 'historial',
        component: HistorialEncomiendaComponent
        },{
          path:'reportes',
          component:ReportsEncomiendaComponent
        },
        {
          path:'perfil',
          component:PerfilComponent
        },
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
