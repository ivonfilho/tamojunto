import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { ResgatarCupomComponent } from './resgatar-cupom.page';

const routes: Routes = [
  {
    path: '',
    component: ResgatarCupomComponent 
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ResgatarCupomComponentRoutingModule {}
