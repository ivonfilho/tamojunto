import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { CadastroFormParceiroRoutingModule } from './cadastro-form-parceiro-routing.module';
import { CadastroFormParceiroComponent } from './cadastro-form-parceiro.component';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    CadastroFormParceiroRoutingModule
  ],
  declarations: [CadastroFormParceiroComponent]
})
export class CadastroFormParceiroModule {}
