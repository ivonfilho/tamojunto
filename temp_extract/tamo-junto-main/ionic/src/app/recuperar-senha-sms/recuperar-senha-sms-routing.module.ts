import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { RecuperarSenhaSmsPage } from './recuperar-senha-sms.page';

const routes: Routes = [
  {
    path: '',
    component: RecuperarSenhaSmsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class RecuperarSenhaSmsPageRoutingModule {}
