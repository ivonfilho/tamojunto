import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { Router, ActivatedRoute } from '@angular/router';
import { environment } from '../../environments/environment';
import { AuthService } from '../services/auth.service';
import { UsuarioService } from '../services/api/usuario.service';
import { jwtDecode } from 'jwt-decode';

type ConfirmarEmailResponse = {
  message?: string;
  token?: string;
  nome?: string;
  email?: string;
  imagemUrl?: string;
  role?: string;
};

@Component({
  selector: 'app-confirmar-email',
  templateUrl: './confirmar-email.page.html',
  styleUrls: ['./confirmar-email.page.scss'],
})
export class ConfirmarEmailPage implements OnInit {
  token = '';
  novaSenha = '';
  confirmarSenha = '';
  isLoading = false;
  processado = false;
  sucesso = false;
  mensagemErro = '';
  isRecuperacaoSenha = false;

  constructor(
    private http: HttpClient,
    private toastController: ToastController,
    private router: Router,
    private route: ActivatedRoute,
    private authService: AuthService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit(): void {
    // Snapshot evita disparar confirmarEmail duas vezes (queryParams pode emitir mais de uma vez)
    // e normaliza token da URL (encoding, maiúsculas/minúsculas do hex).
    const map = this.route.snapshot.queryParamMap;
    this.token = this.normalizarToken(map.get('token'));
    this.isRecuperacaoSenha = map.get('type') === 'password-reset';

    if (!this.token) {
      this.mostrarErro('Token inválido ou ausente');
      return;
    }

    if (!this.isRecuperacaoSenha) {
      void this.confirmarEmail();
    }
  }

  private normalizarToken(raw: string | null): string {
    if (raw == null || raw === '') {
      return '';
    }
    let t = raw.trim();
    try {
      t = decodeURIComponent(t);
    } catch {
      // mantém valor após trim
    }
    return t.trim();
  }

  async processarToken() {
    if (this.isRecuperacaoSenha) {
      await this.redefinirSenha();
    } else {
      await this.confirmarEmail();
    }
  }

  async redefinirSenha() {
    if (!this.novaSenha || !this.confirmarSenha) {
      await this.mostrarToast('Preencha todos os campos', 'danger');
      return;
    }

    if (this.novaSenha !== this.confirmarSenha) {
      await this.mostrarToast('As senhas não coincidem', 'danger');
      return;
    }

    if (this.novaSenha.length < 6) {
      await this.mostrarToast('A senha deve ter pelo menos 6 caracteres', 'danger');
      return;
    }

    this.isLoading = true;

    try {
      await this.http
        .post(`${environment.apiUrl}/api/usuario/confirmar-senha`, {
          token: this.token,
          novaSenha: this.novaSenha,
        })
        .toPromise();

      this.processado = true;
      this.sucesso = true;
      await this.mostrarToast('Senha redefinida com sucesso! Faça login para continuar.', 'success');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Erro ao redefinir senha:', error);
      this.processado = true;
      this.sucesso = false;
      this.mensagemErro = error.error?.message || 'Erro ao redefinir senha. Tente novamente.';
      await this.mostrarToast(this.mensagemErro, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  async confirmarEmail() {
    this.isLoading = true;

    try {
      const response = (await this.http
        .post<ConfirmarEmailResponse>(`${environment.apiUrl}/api/usuario/confirmar-email`, {
          token: this.token,
        })
        .toPromise()) as ConfirmarEmailResponse;

      this.processado = true;
      this.sucesso = true;

      if (response?.token) {
        this.authService.setToken(response.token);
        let userId: string | number | undefined;
        try {
          const decoded: any = jwtDecode(response.token);
          userId = decoded?.Id;
        } catch {
          userId = undefined;
        }
        const usuarioArmazenado = {
          nome: response.nome,
          email: response.email,
          token: response.token,
          role: response.role,
          imagemUrl: response.imagemUrl,
          Id: userId,
        };
        if (userId != null && userId !== '') {
          this.usuarioService.setUsuarioLogado(usuarioArmazenado);
        } else {
          localStorage.setItem('tamo_junto_user', JSON.stringify(usuarioArmazenado));
          console.warn('[confirmar-email] JWT sem claim Id; fluxos que dependem do Id podem falhar.');
        }

        await this.mostrarToast(response.message || 'Email confirmado com sucesso!', 'success');

        if (response.role === 'Parceiro') {
          this.router.navigate(['/dashboard-parceiro']);
        } else {
          this.router.navigate(['/dashboard']);
        }
        return;
      }

      await this.mostrarToast('Email confirmado. Faça login para continuar.', 'success');
      this.router.navigate(['/']);
    } catch (error: any) {
      console.error('Erro ao confirmar email:', error);
      this.processado = true;
      this.sucesso = false;
      this.mensagemErro = error.error?.message || 'Erro ao confirmar email. Tente novamente.';
      await this.mostrarToast(this.mensagemErro, 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  voltarParaLogin() {
    this.router.navigate(['/']);
  }

  private mostrarErro(mensagem: string) {
    this.processado = true;
    this.sucesso = false;
    this.mensagemErro = mensagem;
  }

  private async mostrarToast(mensagem: string, cor: string) {
    const toast = await this.toastController.create({
      message: mensagem,
      duration: 3000,
      color: cor,
      position: 'top',
    });
    await toast.present();
  }
}
