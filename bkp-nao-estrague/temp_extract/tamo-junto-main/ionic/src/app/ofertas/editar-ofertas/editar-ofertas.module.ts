import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';

import { EditarOfertasRoutingModule } from './editar-ofertas-routing.module';

import { HttpClientModule } from '@angular/common/http';

import { EditarOfertasPage } from './editar-ofertas.page';
import { PipesModule } from '../../pipes/pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    EditarOfertasRoutingModule,
    HttpClientModule,
    PipesModule
  ],
  declarations: [EditarOfertasPage]
})
export class EditarOfertasPageModule {}
