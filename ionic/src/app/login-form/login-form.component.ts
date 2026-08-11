import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ToastController } from '@ionic/angular';
import { UsuarioService } from 'src/app/services/api/usuario.service';
import { AuthService } from 'src/app/services/auth.service';
import { Router } from '@angular/router';
import { isUsuarioParceiroComercial } from 'src/app/utils/usuario-sessao.util';

@Component({
  selector: 'app-login-form',
  templateUrl: './login-form.component.html',
  styleUrls: ['./login-form.component.scss'],
})
export class LoginFormComponent implements OnInit {
  /** Texto fixo (evita divergência entre template e build; facilita revisão de cópia) */
  readonly labelEsqueciSenha = 'Esqueci minha senha';
  readonly labelReenviarConfirmacao = 'Reenviar e-mail de confirmação';

  loginForm?: any;
  spinner = false;
  submitted = false;

  @Output() Cadastro = new EventEmitter<void>();

  constructor(
    private toastController: ToastController,
    private usuarioService: UsuarioService,
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loginForm = this.formBuilder.group({
      email: ['', Validators.required],
      senha: ['', Validators.required],
    });
  }

  async presentToastErro(text: string) {
    const toast = await this.toastController.create({
      message: '',
      duration: 10000,
      position: 'top',
      color: 'danger',
      cssClass: 'toast-radar',
      buttons: [
        {
          side: 'start',
          icon: 'checkmark-done-outline',
          text: ' ' + text,
        },
      ],
    });
    toast.onDidDismiss().then((e) => {});
    toast.present();
  }

  alterarForm() {
    this.Cadastro.emit();
  }

  irParaRecuperarEmail() {
    this.router.navigate(['/recuperar-senha-sms']);
  }

   login() {
    this.submitted = true;

    if (this.loginForm.valid) {
      this.spinner = true;
      console.log(' Iniciando processo de login...');
      
      this.usuarioService
        .login(this.loginForm.value)
        .then((data: any) => {
          console.log('Login bem-sucedido:', data);
          this.authService.setToken(data.token);
          localStorage.setItem('tamo_junto_user', JSON.stringify(data));
          
          if (isUsuarioParceiroComercial(data)) {
            console.log('[Login] Usuário parceiro, redirecionando para dashboard-parceiro');
            window.location.href = '/#/dashboard-parceiro';
          } else {
            console.log('[Login] Usuário cliente, redirecionando para dashboard');
            window.location.href = '/#/dashboard';
          }
          
          this.spinner = false;
        })
        .catch((e) => {
          console.error('Erro no login:', e);
          let mensagemErro = 'Erro ao fazer login';
          
          if (e.status === 0) {
            mensagemErro = 'Sem conexão com o servidor. Verifique sua internet.';
          } else if (e.status === 401) {
            mensagemErro = 'Usuário ou senha incorretos';
          } else if (e.status === 500) {
            mensagemErro = 'Erro no servidor. Tente novamente.';
          } else if (e.status === 404) {
            mensagemErro = 'Serviço não encontrado. Verifique a conexão.';
          } else if (e.status === 403) {
            mensagemErro =
              e.error?.message ||
              'Confirme seu e-mail antes de entrar. Verifique a caixa de entrada e o spam.';
          }
          
          this.presentToastErro(mensagemErro);
          this.spinner = false;
        });
    } else {
      const emailControl = this.loginForm.get('email');
      const senhaControl = this.loginForm.get('senha');

      if (emailControl?.value.trim() === '') {
        emailControl.markAsTouched();
      }

      if (senhaControl?.value.trim() === '') {
        senhaControl.markAsTouched();
      }
      this.presentToastErro('Por favor, preencha todos os campos obrigatórios!');
    }
  }

  async reenviarConfirmacaoEmail() {
    const email = (this.loginForm?.get('email')?.value || '').trim();
    if (!email) {
      await this.presentToastErro(
        'Informe seu e-mail no campo acima para reenviarmos o link de confirmação.'
      );
      return;
    }

    this.spinner = true;
    try {
      const data: any = await this.usuarioService.reenviarConfirmacaoEmail({ email });
      await this.presentToastSucesso(
        data?.message ||
          'Se o e-mail estiver cadastrado e pendente de confirmação, enviaremos um novo link.'
      );
    } catch (err: any) {
      console.error('Erro ao reenviar confirmação:', err);
      await this.presentToastErro(
        err?.error?.message || 'Não foi possível enviar agora. Tente de novo mais tarde.'
      );
    } finally {
      this.spinner = false;
    }
  }

  private async presentToastSucesso(text: string) {
    const toast = await this.toastController.create({
      message: text,
      duration: 6000,
      position: 'top',
      color: 'success',
    });
    await toast.present();
  }
}

