import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { AvisoAssinaturaService } from '../services/aviso-assinatura.service';

@Injectable({
  providedIn: 'root'
})
export class AssinaturaFuncionalidadeGuard implements CanActivate {
  
  constructor(
    private avisoAssinaturaService: AvisoAssinaturaService,
    private router: Router
  ) {}

  async canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Promise<boolean> {
    
    try {
      const podeAcessar = await this.avisoAssinaturaService.podeAcessarFuncionalidade();
      
      if (!podeAcessar) {
        // O aviso já foi mostrado pelo serviço
        // Retorna false para impedir a navegação
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Erro no guard de funcionalidade:', error);
      return false;
    }
  }
} 