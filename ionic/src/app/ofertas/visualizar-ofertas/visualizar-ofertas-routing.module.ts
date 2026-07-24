import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { VisualizarOfertasPage } from './visualizar-ofertas.page';

const routes: Routes = [
  {
    path: '',
    component: VisualizarOfertasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VisualizarOfertasRoutingModule {}
