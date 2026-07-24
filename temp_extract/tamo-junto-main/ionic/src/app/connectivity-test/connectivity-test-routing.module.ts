import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { ConnectivityTestPage } from './connectivity-test.page';

const routes: Routes = [
  {
    path: '',
    component: ConnectivityTestPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class ConnectivityTestPageRoutingModule {} 