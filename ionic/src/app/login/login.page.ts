import { Component, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastController, Platform } from '@ionic/angular';
import { ActivatedRoute, Router } from '@angular/router';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class LoginPage implements OnInit, OnDestroy {
  cadastro: boolean = false;

  private backButtonSub?: Subscription;

  constructor(
    private authService: AuthService,
    private toastController: ToastController,
    private router: Router,
    private route: ActivatedRoute,
    private platform: Platform
  ) { }

  ngOnInit(): void {
    const confirmEmail = this.route.snapshot.queryParamMap.get('confirmEmail');
    if (confirmEmail === 'ok') {
      void this.toastController
        .create({
          message: 'E-mail confirmado. Faça login com sua senha.',
          position: 'top',
          duration: 4000,
          color: 'success',
        })
        .then((t) => t.present());
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { confirmEmail: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    } else if (confirmEmail === 'invalid' || confirmEmail === 'missing') {
      void this.toastController
        .create({
          message:
            confirmEmail === 'missing'
              ? 'Link de confirmação incompleto. Use "Reenviar e-mail de confirmação" no login.'
              : 'Link de confirmação inválido ou já utilizado. Peça um novo e-mail na tela de login.',
          position: 'top',
          duration: 6000,
          color: 'warning',
        })
        .then((t) => t.present());
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { confirmEmail: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    } else if (confirmEmail === 'error') {
      void this.toastController
        .create({
          message: 'Não foi possível confirmar o e-mail. Tente de novo ou use reenviar confirmação.',
          position: 'top',
          duration: 5000,
          color: 'danger',
        })
        .then((t) => t.present());
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { confirmEmail: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }

    if (
      this.authService.isTokenValid() &&
      this.authService.getUserFromStorage()
    ) {
      window.location.href = '/#/dashboard';
    }

    const sessionEnded = localStorage.getItem('sessionEnded');

    if (sessionEnded) {
      const toast = this.toastController.create({
        message: 'Sessão encerrada com sucesso.',
        position: 'top',
        duration: 2000,
        color: 'success',
      });
      toast.then((t) => t.present());
      localStorage.removeItem('sessionEnded');
    }

    void this.configurarStatusBarLogin();
  }

  ngOnDestroy(): void {
    this.backButtonSub?.unsubscribe();
    this.backButtonSub = undefined;
  }

  private async configurarStatusBarLogin(): Promise<void> {
    if (!Capacitor.isNativePlatform()) {
      return;
    }
    try {
      await StatusBar.setOverlaysWebView({ overlay: false });
      await StatusBar.setStyle({ style: Style.Light });
      await StatusBar.setBackgroundColor({ color: '#ffffff' });
    } catch (e) {
      console.warn('[LoginPage] StatusBar:', e);
    }
  }

  private atualizarListenerVoltarCadastro(): void {
    this.backButtonSub?.unsubscribe();
    this.backButtonSub = undefined;
    if (!this.cadastro || !Capacitor.isNativePlatform()) {
      return;
    }
    this.backButtonSub = this.platform.backButton.subscribeWithPriority(20, () => {
      this.cadastro = false;
      this.atualizarListenerVoltarCadastro();
    });
  }

  alterarForm() {
    this.cadastro = !this.cadastro;
    this.atualizarListenerVoltarCadastro();
  }

  goToConnectivityTest() {
    this.router.navigate(['/connectivity-test']);
  }

  goToHome() {
    window.location.href = '/';
  }
}
