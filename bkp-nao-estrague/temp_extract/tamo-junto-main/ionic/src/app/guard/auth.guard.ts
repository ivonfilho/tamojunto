import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isTokenValid()) {
    // Se está tentando acessar a rota raiz, redireciona para o dashboard correto
    if (route.routeConfig?.path === '') {
      const usuario = authService.getUserFromStorage();
      
      if (usuario && usuario.role === 'Parceiro') {
        console.log('[AuthGuard] Usuário parceiro, redirecionando para dashboard-parceiro');
        router.navigate(['/dashboard-parceiro']);
      } else {
        console.log('[AuthGuard] Usuário cliente, redirecionando para dashboard');
        router.navigate(['/dashboard']);
      }
      return false; // Impede a ativação da rota atual
    }

    return true;
  }

  // Não redirecionar se estiver nas páginas de recuperação de senha ou confirmação de email
  if (state.url.includes('recuperar-senha') || state.url.includes('confirmar-email')) {
    return true;
  }

  authService.clearToken();
  router.navigate(['/']);
  return false;
};
