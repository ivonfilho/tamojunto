import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { EditarOfertasPage } from './editar-ofertas.page';

const routes: Routes = [
  {
    path: '',
    component: EditarOfertasPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class EditarOfertasRoutingModule {}
