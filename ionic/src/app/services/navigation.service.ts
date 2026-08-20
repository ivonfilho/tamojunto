import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';

@Injectable({
  providedIn: 'root'
})
export class NavigationService {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  /**
   * Redireciona o usuário para o dashboard correto baseado no seu tipo
   */
  redirecionarParaDashboardCorreto(): void {
    try {
      const usuario = this.authService.getUserFromStorage();
      
      if (!usuario) {
        console.log('[NavigationService] Usuário não encontrado, redirecionando para login');
        this.router.navigate(['/']);
        return;
      }

      console.log('[NavigationService] Verificando tipo de usuário:', usuario);
      
      // Verifica se é parceiro pelo role
      if (usuario.role === 'Parceiro') {
        console.log('[NavigationService] Usuário é parceiro, redirecionando para dashboard-parceiro');
        this.router.navigate(['/dashboard-parceiro']);
        return;
      }

      // Se não é parceiro, redireciona para dashboard do cliente
      console.log('[NavigationService] Usuário é cliente, redirecionando para dashboard');
      this.router.navigate(['/dashboard']);
      
    } catch (error) {
      console.error('[NavigationService] Erro ao redirecionar:', error);
      // Em caso de erro, redireciona para dashboard padrão
      this.router.navigate(['/dashboard']);
    }
  }

  /**
   * Redireciona para a rota especificada
   */
  navegarPara(rota: string): void {
    console.log('[NavigationService] Navegando para rota:', rota);
    this.router.navigate([rota]);
  }
} 