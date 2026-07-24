import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { AssinaturaService } from '../services/assinatura.service';

export const AssinaturaGuard: CanActivateFn = async (route, state) => {
  const authService = inject(AuthService);
  const assinaturaService = inject(AssinaturaService);
  const router = inject(Router);

  console.log('[AssinaturaGuard] Verificando acesso para:', state.url);

  // Se está tentando acessar a página de assinatura, permite o acesso
  if (state.url.includes('/Assinatura')) {
    console.log('[AssinaturaGuard] Acessando página de assinatura, permitindo acesso');
    return true;
  }

  if (!authService.isTokenValid()) {
    console.log('[AssinaturaGuard] Token inválido, redirecionando para login');
    authService.clearToken();
    router.navigate(['/login']);
    return false;
  }

  try {
    console.log('[AssinaturaGuard] Verificando status da assinatura...');
    const status = await assinaturaService.podeAcessarSistema();
    console.log('[AssinaturaGuard] Status da assinatura:', status);
    
    if (status.podeAcessar) {
      console.log('[AssinaturaGuard] Acesso permitido');
      return true;
    } else {
      console.log('[AssinaturaGuard] Acesso negado, redirecionando para assinatura. Mensagem:', status.mensagem);
      
      // Redireciona diretamente para a página de assinatura
      router.navigate(['/Assinatura']);
      return false;
    }
  } catch (error) {
    console.error('[AssinaturaGuard] Erro ao verificar assinatura:', error);
    router.navigate(['/Assinatura']);
    return false;
  }
}; 