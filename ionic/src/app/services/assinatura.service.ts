import { Injectable } from '@angular/core';
import { PagamentoService } from './pagamento.service';
import { AuthService } from './auth.service';
import { BehaviorSubject, Observable } from 'rxjs';
import { isUsuarioParceiroComercial, obterRoleUsuario } from '../utils/usuario-sessao.util';

@Injectable({
  providedIn: 'root'
})
export class AssinaturaService {
  private assinaturasSubject = new BehaviorSubject<any[]>([]);
  private hasActiveSubscriptionSubject = new BehaviorSubject<boolean>(false);
  private lastCheck = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  constructor(
    private pagamentoService: PagamentoService,
    private authService: AuthService
  ) {}

  // Verifica se há assinatura ativa
  async verificarAssinaturaAtiva(): Promise<boolean> {
    // Verifica se há token válido antes de fazer requisição
    if (!this.authService.isTokenValid()) {
      console.log('Token inválido, retornando false para assinatura');
      this.limparCache();
      return false;
    }

    const now = Date.now();
    
    // Se o cache ainda é válido, retorna o valor em cache
    if (now - this.lastCheck < this.CACHE_DURATION) {
      return this.hasActiveSubscriptionSubject.value;
    }

    try {
      const assinaturas = await this.pagamentoService.minhasAssinaturas().toPromise();
      const temAssinaturaAtiva = assinaturas && assinaturas.some((assinatura: any) => {
        return assinatura.ativa === true;
      });

      this.assinaturasSubject.next(assinaturas || []);
      this.hasActiveSubscriptionSubject.next(temAssinaturaAtiva);
      this.lastCheck = now;

      return temAssinaturaAtiva;
    } catch (error) {
      console.error('Erro ao verificar assinatura:', error);
      // Em caso de erro, limpa o cache e retorna false
      this.limparCache();
      return false;
    }
  }

  // Retorna as assinaturas como Observable
  getAssinaturas(): Observable<any[]> {
    return this.assinaturasSubject.asObservable();
  }

  // Retorna se há assinatura ativa como Observable
  hasActiveSubscription(): Observable<boolean> {
    return this.hasActiveSubscriptionSubject.asObservable();
  }

  // Força atualização dos dados
  async atualizarAssinaturas(): Promise<void> {
    // Verifica se há token válido antes de atualizar
    if (!this.authService.isTokenValid()) {
      console.log('Token inválido, limpando cache de assinatura');
      this.limparCache();
      return;
    }

    this.lastCheck = 0; // Invalida o cache
    await this.verificarAssinaturaAtiva();
  }

  // Limpa o cache (útil para logout)
  limparCache(): void {
    this.assinaturasSubject.next([]);
    this.hasActiveSubscriptionSubject.next(false);
    this.lastCheck = 0;
  }

  // Método para retornar as assinaturas diretamente (usado pelo guard)
  async minhasAssinaturas(): Promise<any[]> {
    if (!this.authService.isTokenValid()) {
      return [];
    }

    try {
      const assinaturas = await this.pagamentoService.minhasAssinaturas().toPromise();
      return assinaturas || [];
    } catch (error) {
      console.error('Erro ao buscar assinaturas:', error);
      return [];
    }
  }

  // Método para verificar se o usuário pode acessar o sistema
  async podeAcessarSistema(): Promise<{ podeAcessar: boolean, mensagem?: string, tipo?: string }> {
    console.log('[AssinaturaService] Iniciando verificação de acesso ao sistema');
    
    if (!this.authService.isTokenValid()) {
      console.log('[AssinaturaService] Token inválido, permitindo acesso');
      // Se não está logado, não bloqueia (deixa o guard passar para rotas públicas)
      return { podeAcessar: true };
    }

    try {
      console.log('[AssinaturaService] Buscando assinaturas...');
      
      try {
        const verif = await this.pagamentoService.verificarAssinaturaAtiva().toPromise();
        if (verif && verif.hasActiveSubscription) {
          console.log('[AssinaturaService] Assinatura ativa confirmada pela API. Acesso liberado.');
          return { podeAcessar: true };
        }
      } catch (err) {
        console.log('[AssinaturaService] Erro na verificação pela API:', err);
      }

      const assinaturas = await this.pagamentoService.minhasAssinaturas().toPromise();
      console.log('[AssinaturaService] Assinaturas encontradas:', assinaturas);
      
      const usuario = this.authService.getUserFromStorage();
      console.log('[AssinaturaService] Usuário:', usuario);

      // Verifica se é parceiro
      let isParceiro = false;
      let isMEI = false;
      if (usuario && (usuario.Id || usuario.id)) {
        isParceiro = isUsuarioParceiroComercial(usuario);
        
        // Verifica se é MEI (cliente com empresa)
        try {
          const clienteResponse = await this.pagamentoService.buscarClientePorUsuario(usuario.Id || usuario.id).toPromise();
          isMEI = clienteResponse && clienteResponse.IdEmpresa;
        } catch (error) {
          console.log('[AssinaturaService] Erro ao verificar se é MEI:', error);
          isMEI = false;
        }
      }
      
      console.log('[AssinaturaService] É parceiro?', isParceiro);
      console.log('[AssinaturaService] É MEI?', isMEI);

      if (isParceiro) {
        console.log('[AssinaturaService] Verificando status do parceiro...');
        
       
        try {
          const parceiroResponse = await this.pagamentoService.buscarParceiroPorUsuario(usuario.Id).toPromise();
          if (parceiroResponse && parceiroResponse.status === false) {
            console.log('[AssinaturaService] Parceiro está inativo, bloqueando acesso');
            return {
              podeAcessar: false,
              mensagem: 'Seu cadastro de parceiro está inativo. Entre em contato com o suporte.',
              tipo: 'parceiro_inativo'
            };
          }
        } catch (error) {
          console.log('[AssinaturaService] Erro ao verificar status do parceiro:', error);
        }
        
        console.log('[AssinaturaService] Verificando assinatura de parceiro...');
        // Verifica se tem assinatura de parceiro grátis ativa
        const assinaturaParceiro = assinaturas && assinaturas.find((assinatura: any) => 
          assinatura.plano && assinatura.plano.tipo === 'PARCEIRO_GRATIS' && assinatura.ativa === true
        );
        console.log('[AssinaturaService] Assinatura de parceiro encontrada:', assinaturaParceiro);
        
        if (assinaturaParceiro) {
          console.log('[AssinaturaService] Parceiro tem assinatura ativa, permitindo acesso');
          return { podeAcessar: true };
        } else {
          console.log('[AssinaturaService] Parceiro não tem assinatura ativa, bloqueando acesso');
          return {
            podeAcessar: false,
            mensagem: 'Ative o card de parceiro gratuito para acessar a plataforma!',
            tipo: 'parceiro'
          };
        }
      }

      console.log('[AssinaturaService] Verificando assinatura paga ativa (cliente/MEI)...');
      // Verifica se há assinatura paga ativa (cliente) ou teste grátis (cliente/MEI)
      const assinaturaPagaAtiva = assinaturas && assinaturas.some((assinatura: any) => 
        assinatura.plano && (assinatura.plano.tipo === 'MENSAL' || assinatura.plano.tipo === 'ANUAL') && assinatura.ativa === true
      );
      
      const freeTrial = assinaturas && assinaturas.find((assinatura: any) => 
        assinatura.plano && assinatura.plano.tipo === 'FREE_TRIAL' && assinatura.ativa === true
      );
      
      console.log('[AssinaturaService] Assinatura paga ativa:', assinaturaPagaAtiva);
      console.log('[AssinaturaService] Free trial ativo:', freeTrial);
      
      if (assinaturaPagaAtiva) {
        console.log('[AssinaturaService] Cliente/MEI tem assinatura paga ativa, permitindo acesso');
        return { podeAcessar: true };
      }
      
      if (freeTrial) {
        // Verifica se o teste grátis ainda está válido
        const dataCompra = new Date(freeTrial.dataCompra);
        const agora = new Date();
        const diffDias = (agora.getTime() - dataCompra.getTime()) / (1000 * 60 * 60 * 24);
        
        if (diffDias <= 30) {
          console.log('[AssinaturaService] Cliente/MEI tem teste grátis válido, permitindo acesso');
          return { podeAcessar: true };
        } else {
          console.log('[AssinaturaService] Cliente/MEI tem teste grátis expirado, bloqueando acesso');
          return {
            podeAcessar: false,
            mensagem: `Seu teste grátis expirou há ${Math.floor(diffDias - 30)} dias. Ative um plano para continuar usando a plataforma!`,
            tipo: 'cliente'
          };
        }
      }
      
      // Se chegou aqui, não tem nenhuma assinatura válida
      console.log('[AssinaturaService] Cliente/MEI não tem assinatura válida, bloqueando acesso');
      return {
        podeAcessar: false,
        mensagem: isMEI ? 'Ative um plano para acessar a plataforma!' : 'Ative um plano ou teste grátis para acessar a plataforma!',
        tipo: 'cliente'
      };

    } catch (error) {
      console.error('[AssinaturaService] Erro ao verificar acesso:', error);
      return { 
        podeAcessar: true // Em caso de erro, não bloqueia
      };
    }
  }

  // Método para obter o status atual do usuário
  async getStatusUsuario(): Promise<{ temPlanoPago: boolean, temTesteGratis: boolean, diasRestantes?: number, isParceiro?: boolean }> {
    if (!this.authService.isTokenValid()) {
      return { temPlanoPago: false, temTesteGratis: false };
    }

    try {
      const assinaturas = await this.pagamentoService.minhasAssinaturas().toPromise();
      const usuario = this.authService.getUserFromStorage();
      
      // Verifica se é parceiro
      const isParceiro = isUsuarioParceiroComercial(usuario);
      
      if (isParceiro) {
        // Para parceiros, verifica se tem assinatura de parceiro grátis ativa
        const assinaturaParceiro = assinaturas && assinaturas.find((assinatura: any) => 
          assinatura.plano && assinatura.plano.tipo === 'PARCEIRO_GRATIS' && assinatura.ativa === true
        );
        
        if (assinaturaParceiro) {
          return {
            temPlanoPago: false,
            temTesteGratis: false,
            isParceiro: true,
            diasRestantes: 365 // 1 ano para parceiros
          };
        }
      }
      
      // Verifica se há assinatura paga ativa (cliente)
      const assinaturaPagaAtiva = assinaturas && assinaturas.some((assinatura: any) => 
        assinatura.ativa === true && assinatura.plano && 
        (assinatura.plano.tipo === 'MENSAL' || assinatura.plano.tipo === 'ANUAL')
      );

      // Verifica se há plano gratuito dentro do período
      const freeTrial = assinaturas && assinaturas.find((assinatura: any) => 
        assinatura.plano && assinatura.plano.tipo === 'FREE_TRIAL'
      );

      let diasRestantes = 0;
      if (freeTrial) {
        const dataCompra = new Date(freeTrial.dataCompra);
        const agora = new Date();
        const diffDias = (agora.getTime() - dataCompra.getTime()) / (1000 * 60 * 60 * 24);
        diasRestantes = Math.max(0, 30 - diffDias);
      }

      return {
        temPlanoPago: assinaturaPagaAtiva,
        temTesteGratis: freeTrial && diasRestantes > 0,
        diasRestantes: diasRestantes,
        isParceiro: isParceiro
      };

    } catch (error) {
      console.error('Erro ao obter status do usuário:', error);
      return { temPlanoPago: false, temTesteGratis: false };
    }
  }

  /**
   * Verifica se a assinatura está próxima do vencimento (7 dias ou menos)
   * Retorna informações sobre a assinatura que está expirando, se houver
   */
  private assinaturaVencimentoCache: any = null;

  async verificarAssinaturaProximaVencimento(): Promise<{ 
    estaProximaVencimento: boolean, 
    diasRestantes?: number, 
    dataRenovacao?: Date, 
    planoTitulo?: string,
    planoTipo?: string 
  }> {
    if (this.assinaturaVencimentoCache !== null) {
      return this.assinaturaVencimentoCache;
    }

    if (!this.authService.isTokenValid()) {
      return { estaProximaVencimento: false };
    }

    try {
      const assinaturas = await this.pagamentoService.minhasAssinaturas().toPromise();
      console.log('[verificarAssinaturaProximaVencimento] Assinaturas recebidas:', assinaturas);
      const agora = new Date();
      
      // Busca assinaturas ativas (MENSAL, ANUAL ou FREE_TRIAL)
      const assinaturasAtivas = (assinaturas || []).filter((assinatura: any) => {
        console.log('[verificarAssinaturaProximaVencimento] Verificando assinatura:', {
          ativa: assinatura.ativa,
          status: assinatura.status,
          plano: assinatura.plano,
          dataRenovacao: assinatura.dataRenovacao
        });
        
        // Verifica se está ativa (pode ser pelo campo 'ativa' ou pelo status 'ATIVA')
        const estaAtiva = assinatura.ativa === true || (assinatura.status && assinatura.status.toString().toUpperCase() === 'ATIVA');
        
        if (!estaAtiva) {
          console.log('[verificarAssinaturaProximaVencimento] Assinatura não está ativa');
          return false;
        }
        
        if (!assinatura.plano) {
          console.log('[verificarAssinaturaProximaVencimento] Assinatura não tem plano');
          return false;
        }
        
        const tipoPlano = assinatura.plano.tipo || assinatura.plano.Tipo;
        console.log('[verificarAssinaturaProximaVencimento] Tipo do plano:', tipoPlano);
        
        // Considera apenas planos pagos (MENSAL, ANUAL) e FREE_TRIAL
        const tipoValido = tipoPlano === 'MENSAL' || tipoPlano === 'ANUAL' || tipoPlano === 'FREE_TRIAL';
        console.log('[verificarAssinaturaProximaVencimento] Tipo válido?', tipoValido);
        
        return tipoValido;
      });
      
      console.log('[verificarAssinaturaProximaVencimento] Assinaturas ativas encontradas:', assinaturasAtivas.length);

      // Encontra a assinatura que está mais próxima do vencimento
      let assinaturaProxima: any = null;
      let menorDiasRestantes = Infinity;

      for (const assinatura of assinaturasAtivas) {
        // Verifica dataRenovacao com diferentes formatos possíveis
        const dataRenovacaoStr = assinatura.dataRenovacao || assinatura.DataRenovacao;
        if (!dataRenovacaoStr) {
          console.log('[verificarAssinaturaProximaVencimento] Assinatura sem dataRenovacao');
          continue;
        }

        const dataRenovacao = new Date(dataRenovacaoStr);
        
        // Calcula os dias restantes considerando apenas a diferença de dias (sem horas/minutos)
        // Usa UTC para evitar problemas de fuso horário
        const hojeUTC = new Date(Date.UTC(agora.getUTCFullYear(), agora.getUTCMonth(), agora.getUTCDate()));
        const renovacaoUTC = new Date(Date.UTC(dataRenovacao.getUTCFullYear(), dataRenovacao.getUTCMonth(), dataRenovacao.getUTCDate()));
        
        // Calcula a diferença em milissegundos e converte para dias
        // Usa Math.floor para contar apenas dias completos (não arredonda para cima)
        const diffMs = renovacaoUTC.getTime() - hojeUTC.getTime();
        const diasRestantes = Math.floor(diffMs / (1000 * 60 * 60 * 24));
        
        console.log('[verificarAssinaturaProximaVencimento] Assinatura:', {
          dataRenovacao: dataRenovacao.toISOString(),
          hojeUTC: hojeUTC.toISOString(),
          renovacaoUTC: renovacaoUTC.toISOString(),
          diasRestantes: diasRestantes,
          dentroDoPrazo: diasRestantes >= 0 && diasRestantes <= 7
        });

        // Considera apenas assinaturas que ainda não expiraram ou expiram hoje
        // e que estão dentro do prazo de alerta (7 dias ou menos)
        if (diasRestantes >= 0 && diasRestantes <= 7 && diasRestantes < menorDiasRestantes) {
          menorDiasRestantes = diasRestantes;
          assinaturaProxima = assinatura;
          console.log('[verificarAssinaturaProximaVencimento] Nova assinatura mais próxima encontrada:', {
            diasRestantes: menorDiasRestantes,
            planoTitulo: assinatura.plano?.titulo || assinatura.plano?.Titulo
          });
        }
      }

      // Verifica se está próxima do vencimento (7 dias ou menos)
      if (assinaturaProxima && menorDiasRestantes <= 7 && menorDiasRestantes >= 0) {
        console.log('[verificarAssinaturaProximaVencimento] Assinatura próxima do vencimento encontrada!', {
          diasRestantes: menorDiasRestantes,
          planoTitulo: assinaturaProxima.plano?.titulo || assinaturaProxima.plano?.Titulo
        });
        const dataRenovacaoFinal = new Date(assinaturaProxima.dataRenovacao || assinaturaProxima.DataRenovacao);
        const resultado = {
          estaProximaVencimento: true,
          diasRestantes: menorDiasRestantes,
          dataRenovacao: dataRenovacaoFinal,
          planoTitulo: assinaturaProxima.plano?.titulo || assinaturaProxima.plano?.Titulo || 'Plano',
          planoTipo: assinaturaProxima.plano?.tipo || assinaturaProxima.plano?.Tipo
        };
        this.assinaturaVencimentoCache = resultado;
        return resultado;
      }
      this.assinaturaVencimentoCache = { estaProximaVencimento: false };
      return this.assinaturaVencimentoCache;
    } catch (error) {
      console.error('Erro ao verificar assinatura próxima do vencimento:', error);
      this.assinaturaVencimentoCache = { estaProximaVencimento: false };
      return this.assinaturaVencimentoCache;
    }
  }
} 