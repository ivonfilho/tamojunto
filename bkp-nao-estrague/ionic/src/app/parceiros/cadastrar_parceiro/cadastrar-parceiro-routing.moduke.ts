import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditarParceiroPage } from './cadastrar-parceiro.page';

const routes: Routes = [
  {
    path: '',
    component: EditarParceiroPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditarParceiroRoutingModule {}
