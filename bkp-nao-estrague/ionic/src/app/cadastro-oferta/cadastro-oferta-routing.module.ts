import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CadastroOfertaPage } from './cadastro-oferta.component';

const routes: Routes = [
  {
    path: '',
    component: CadastroOfertaPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CadastroOfertaPageRoutingModule {}
