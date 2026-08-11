import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { OfertasParceiroPage } from './ofertas-parceiro.page';

const routes: Routes = [
  {
    path: '',
    component: OfertasParceiroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OfertasParceiroPageRoutingModule {}
