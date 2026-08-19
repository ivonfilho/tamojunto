import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

//import { ConfirmarCodigoSmsPage } from './confirmar-codigo-sms.page';

const routes: Routes = [
  {
    path: '',
    //component: ConfirmarCodigoSmsPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConfirmarCodigoSmsPageRoutingModule {}
