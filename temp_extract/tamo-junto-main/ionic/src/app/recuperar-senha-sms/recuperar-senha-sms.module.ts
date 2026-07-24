import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { RecuperarSenhaSmsPageRoutingModule } from './recuperar-senha-sms-routing.module';

import { RecuperarSenhaSmsPage } from './recuperar-senha-sms.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    RecuperarSenhaSmsPageRoutingModule
  ],
  declarations: [RecuperarSenhaSmsPage]
})
export class RecuperarSenhaSmsPageModule {}
