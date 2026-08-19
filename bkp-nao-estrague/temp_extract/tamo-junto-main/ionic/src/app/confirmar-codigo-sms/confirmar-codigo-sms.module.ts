import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { ConfirmarCodigoSmsPageRoutingModule } from './confirmar-codigo-sms-routing.module';

//import { ConfirmarCodigoSmsPage } from './confirmar-codigo-sms.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    ConfirmarCodigoSmsPageRoutingModule
  ],
  //declarations: [ConfirmarCodigoSmsPage]
})
export class ConfirmarCodigoSmsPageModule {}
