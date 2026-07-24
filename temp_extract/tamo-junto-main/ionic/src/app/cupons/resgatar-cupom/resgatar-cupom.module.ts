import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { IonicModule } from '@ionic/angular';
import { ResgatarCupomComponentRoutingModule } from './resgatar-cupom.routing.module';
import { ResgatarCupomComponent } from './resgatar-cupom.page';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ResgatarCupomComponentRoutingModule,
  ],
  declarations: [ResgatarCupomComponent],
})
export class ResgatarCupomComponentModule {}
