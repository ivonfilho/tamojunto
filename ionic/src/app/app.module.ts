import { NgModule, LOCALE_ID } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { RouteReuseStrategy } from '@angular/router';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';

import { IonicModule, IonicRouteStrategy } from '@ionic/angular';

import { AppComponent } from './app.component';
import { AppRoutingModule } from './app-routing.module';
import { FormsModule } from '@angular/forms';
import {
  HttpClient,
  HttpClientModule,
  HTTP_INTERCEPTORS
} from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpInterceptorService } from './interceptors/http.interceptor';
import { navigationInterceptor } from './interceptors/navigation.interceptor';
import { CookieService } from 'ngx-cookie-service';
import { HeaderComponent } from './header/header.component';
import { ProfileModalComponent } from './header/profile-modal/profile-modal.component';
import { NotificationModalComponent } from './notificacao/notification-modal.component';
import { PagamentoModalPageModule } from './pagamentos/pagamento-modal/pagamento-modal.module';
import { AssinaturaAvisoModule } from './components/assinatura-aviso/assinatura-aviso.module';
import { ParceiroAvisoMenuModule } from './components/parceiro-aviso-menu/parceiro-aviso-menu.module';
import { PipesModule } from './pipes/pipes.module';

// Registrar locale brasileiro
registerLocaleData(localePt, 'pt-BR');


@NgModule({
  declarations: [AppComponent, HeaderComponent, ProfileModalComponent],
  imports: [
    BrowserModule,
    IonicModule.forRoot({ mode: 'md' }),
    //    IonicModule.forRoot({ mode: 'md' }), // Forçando 'md' para manter o mesmo visual em Desktop e Celular (iOS/Android)
    AppRoutingModule,
    HttpClientModule,
    FormsModule,
    ReactiveFormsModule,
    PagamentoModalPageModule,
    AssinaturaAvisoModule,
    ParceiroAvisoMenuModule,
    PipesModule,
  ],
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    { provide: LOCALE_ID, useValue: 'pt-BR' }, // Configurar locale brasileiro para todo o app
    CookieService,
    {
      provide: HTTP_INTERCEPTORS,
      useClass: HttpInterceptorService,
      multi: true
    }
  ],
  bootstrap: [AppComponent],
})
export class AppModule { }
