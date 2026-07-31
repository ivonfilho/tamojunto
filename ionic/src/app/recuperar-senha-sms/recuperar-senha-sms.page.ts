import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AlertController, LoadingController, ToastController } from '@ionic/angular';
import { UsuarioService } from '../services/api/usuario.service';

@Component({
  selector: 'app-recuperar-senha-sms',
  templateUrl: './recuperar-senha-sms.page.html',
  styleUrls: ['./recuperar-senha-sms.page.scss'],
})
export class RecuperarSenhaSmsPage implements OnInit {
  recuperarForm: FormGroup;
  submitted = false;
  spinner = false;

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
      await this.mostrarErro('Por favor, digite um email válido.');
      return;
    }

    const formData = this.recuperarForm.value;
    
    const requestData = {
      email: formData.email
    };

    this.spinner = true;

    try {
      console.log('Enviando solicitação de recuperação por email:', requestData);
      
      const response = await this.usuarioService.recuperarSenhaEmail(requestData).toPromise();
      
      console.log('Resposta da API:', response);
      
      if (response && response.success) {
        // Mostrar toast de sucesso
        await this.mostrarSucesso('Email enviado com sucesso! Verifique sua caixa de entrada.');
        
        // Limpar formulário
        this.recuperarForm.reset();
        this.submitted = false;
        this.spinner = false;
        
        // Aguardar um pouco antes de navegar para o login
        setTimeout(() => {
          this.router.navigate(['']);
        }, 3000);
      } else if (response && response.resetLink) {
        await this.mostrarAviso('Falha ao enviar email. Use este link para redefinir sua senha:', response.resetLink);
      } else {
        await this.mostrarErro(response?.message || 'Erro ao enviar email de recuperação.');
      }
    } catch (error: any) {
      console.error('Erro ao enviar email de recuperação:', error);
      
      if (error.error && error.error.message) {
        await this.mostrarErro(error.error.message);
      } else {
        await this.mostrarErro('Erro ao enviar email de recuperação. Tente novamente.');
      }
    } finally {
      this.spinner = false;
    }
  }

  async mostrarSucesso(mensagem: string) {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      position: 'top',
      color: 'success'
    });
    await toast.present();
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

  async mostrarAviso(mensagem: string, link?: string) {
    const alert = await this.alertController.create({
      header: 'Aviso',
      message: link ? `${mensagem}<br><br><a href="${link}" target="_blank">${link}</a>` : mensagem,
      buttons: ['OK']
    });
    await alert.present();
  }

  voltarParaLogin() {
    this.router.navigate(['']);
  }

  irParaRecuperarEmail() {
    this.router.navigate(['/recuperar-senha-email']);
  }
}