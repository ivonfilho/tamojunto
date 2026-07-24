import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { RecuperarSenhaEmailPageRoutingModule } from './recuperar-senha-email-routing.module';
import { RecuperarSenhaEmailPage } from './recuperar-senha-email.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RecuperarSenhaEmailPageRoutingModule
  ],
  declarations: [RecuperarSenhaEmailPage]
})
export class RecuperarSenhaEmailPageModule {}

