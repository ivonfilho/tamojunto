import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { CadastroFormComponent } from './cadastro-form.component';

const routes: Routes = [
  {
    path: '',
    component: CadastroFormComponent
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CadastroFormRoutingModule {}
