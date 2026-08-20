import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CadastroFormRoutingModule } from './cadastro-form-routing.module';
import { CadastroFormComponent } from './cadastro-form.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CadastroFormRoutingModule
  ],
  declarations: [CadastroFormComponent]
})
export class CadastroFormModule {}
