import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CuponsPage } from './cupons.page';
import { RelatorioCupomPage } from './relatorio-cupom/relatorio-cupom.page';

const routes: Routes = [
  {
    path: '',
    component: CuponsPage
  },
  {
    path: 'relatorio-cupom',
    component: RelatorioCupomPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CuponsPageRoutingModule {}
