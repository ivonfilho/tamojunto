import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import {ParceirosPageRoutingModule} from '../parceiros/parceiros-routing.module';

import { HttpClientModule } from '@angular/common/http';

import { ParceirosPage } from './parceiros.page';


@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ParceirosPageRoutingModule,
    HttpClientModule
  ],
  declarations: [ParceirosPage]
})
export class ParceirosPageModule {}
