import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AssinaturaService } from './assinatura.service';

@Injectable({
  providedIn: 'root'
})
export class AvisoAssinaturaService {
  private mostrarAvisoSubject = new BehaviorSubject<boolean>(false);
  private statusAcessoSubject = new BehaviorSubject<any>(null);

  constructor(private assinaturaService: AssinaturaService) {}

  // Observable para controlar a exibição do aviso
  get mostrarAviso$() {
    return this.mostrarAvisoSubject.asObservable();
  }

  // Observable para o status de acesso
  get statusAcesso$() {
    return this.statusAcessoSubject.asObservable();
  }

  // Verificar acesso e mostrar aviso se necessário
  async verificarEAvisar(): Promise<boolean> {
    try {
      const status = await this.assinaturaService.podeAcessarSistema();
      this.statusAcessoSubject.next(status);
      
      if (!status.podeAcessar) {
        this.mostrarAvisoSubject.next(true);
        return false;
      } else {
        this.mostrarAvisoSubject.next(false);
        return true;
      }
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      return false;
    }
  }

  // Mostrar aviso manualmente
  mostrarAviso(status?: any) {
    if (status) {
      this.statusAcessoSubject.next(status);
    }
    this.mostrarAvisoSubject.next(true);
  }

  // Esconder aviso
  esconderAviso() {
    this.mostrarAvisoSubject.next(false);
  }

  // Verificar se o usuário pode acessar uma funcionalidade específica
  async podeAcessarFuncionalidade(): Promise<boolean> {
    const podeAcessar = await this.verificarEAvisar();
    return podeAcessar;
  }
} 