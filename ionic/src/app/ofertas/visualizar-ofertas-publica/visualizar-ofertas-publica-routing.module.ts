import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VisualizarOfertasPublicaPage } from './visualizar-ofertas-publica.page';

const routes: Routes = [
  {
    path: '',
    component: VisualizarOfertasPublicaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class VisualizarOfertasPublicaPageRoutingModule {} 