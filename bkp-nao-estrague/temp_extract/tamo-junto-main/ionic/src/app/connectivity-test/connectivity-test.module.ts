import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ConnectivityTestPageRoutingModule } from './connectivity-test-routing.module';
import { ConnectivityTestPage } from './connectivity-test.page';
import { HttpClientModule } from '@angular/common/http';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    ConnectivityTestPageRoutingModule,
    HttpClientModule
  ],
  declarations: [ConnectivityTestPage]
})
export class ConnectivityTestPageModule {} 