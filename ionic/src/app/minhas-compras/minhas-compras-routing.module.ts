import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { MinhasComprasPage } from './minhas-compras.page';

const routes: Routes = [
  {
    path: '',
    component: MinhasComprasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MinhasComprasPageRoutingModule {}
