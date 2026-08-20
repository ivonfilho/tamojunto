import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CadastroFormParceiroComponent } from './cadastro-form-parceiro.component';

const routes: Routes = [
  {
    path: '',
    component: CadastroFormParceiroComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CadastroFormParceiroRoutingModule {}
