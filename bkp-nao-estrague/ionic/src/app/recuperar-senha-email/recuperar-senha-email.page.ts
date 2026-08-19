import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { UsuarioService } from '../services/api/usuario.service';

@Component({
  selector: 'app-recuperar-senha-email',
  templateUrl: './recuperar-senha-email.page.html',
  styleUrls: ['./recuperar-senha-email.page.scss'],
})
export class RecuperarSenhaEmailPage implements OnInit {
  recuperarForm: FormGroup;
  submitted = false;
  loading = false;

  constructor(
    private formBuilder: FormBuilder,
    private router: Router,
    private usuarioService: UsuarioService,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private toastController: ToastController
  ) {
    this.recuperarForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]]
    });
  }

  ngOnInit() {}

  async enviarEmail() {
    this.submitted = true;

    if (this.recuperarForm.invalid) {
      return;
    }

    this.loading = true;

    try {
      const email = this.recuperarForm.get('email')?.value;
      
      const response = await this.usuarioService.recuperarSenhaEmail({ email }).toPromise();
      
      if (response && response.success) {
        const alert = await this.alertController.create({
          header: 'Email Enviado',
          message: 'Um email com instruções para redefinir sua senha foi enviado para ' + email,
          buttons: [
            {
              text: 'OK',
              handler: () => {
                this.voltarParaLogin();
              }
            }
          ]
        });
        await alert.present();
      } else {
        this.mostrarErro('Erro ao enviar email. Tente novamente.');
      }
    } catch (error) {
      console.error('Erro ao recuperar senha:', error);
      this.mostrarErro('Erro ao enviar email. Verifique sua conexão e tente novamente.');
    } finally {
      this.loading = false;
    }
  }

  async mostrarErro(mensagem: string) {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    await toast.present();
  }

  voltarParaLogin() {
    this.router.navigate(['/login']);
  }

  irParaRecuperarSms() {
    this.router.navigate(['/recuperar-senha-sms']);
  }
}
