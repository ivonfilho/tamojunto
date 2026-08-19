import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecuperarSenhaEmailPage } from './recuperar-senha-email.page';

const routes: Routes = [
  {
    path: '',
    component: RecuperarSenhaEmailPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecuperarSenhaEmailPageRoutingModule {}

