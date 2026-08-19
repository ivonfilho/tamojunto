import { Component, OnInit } from '@angular/core';
import { PagamentoService } from 'src/app/services/pagamento.service';
import { AssinaturaService } from 'src/app/services/assinatura.service';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ParceiroService } from '../services/parceiro.service';

@Component({
  selector: 'app-pagamentos',
  templateUrl: './pagamentos.page.html',
  styleUrls: ['./pagamentos.page.scss'],
})
export class PagamentosPage implements OnInit {
  planos: any[] = [];
  assinaturas: any[] = [];
  mostrarFreeTrial = false;
  mostrarAvisoAssine = false;
  freeTrialPlano: any = null;
  freeTrialAtivo: boolean = false;
  freeTrialJaUtilizado: boolean = false;
  freeTrialStatus: string = 'DISPONIVEL';
  freeTrialButtonDisabled: boolean = false;
  freeTrialDataRenovacao: Date | null = null;
  isParceiro: boolean = false;
  isMEI: boolean = false; // Adicionado para verificar se o usuário é MEI
  planoParceiroAtivo: boolean = false; // Verifica se plano parceiro está ativo
  planoMensalAtivo: boolean = false; // Verifica se plano mensal está ativo
  planoAnualAtivo: boolean = false; // Verifica se plano anual está ativo

  constructor(
    private pagamentoService: PagamentoService,
    private assinaturaService: AssinaturaService,
    private toastCtrl: ToastController,
    private alertCtrl: AlertController,
    private router: Router,
    private authService: AuthService,
    private parceiroService: ParceiroService
  ) {}

  estaInicializando: boolean = false;

  async ngOnInit() {
    // Apenas declarando, a inicializacao de fato ocorre no ionViewWillEnter
  }

  async ionViewWillEnter() {
    // Evita dupla execucao
    if (this.estaInicializando) return;
    this.estaInicializando = true;
    try {
      await this.inicializarPagina();
    } finally {
      this.estaInicializando = false;
    }
  }

  async inicializarPagina() {
    // Verifica se o usuário é parceiro
    const usuario = this.authService.getUserFromStorage();
    if (usuario && usuario.Id) {
      try {
        const parceiroResponse = await this.pagamentoService.buscarParceiroPorUsuario(usuario.Id).toPromise();
        if (parceiroResponse && parceiroResponse !== false) {
          this.isParceiro = true;
          console.log('Parceiro detectado por busca:', parceiroResponse);
        } else {
          this.isParceiro = false;
          console.log('Usuário não é parceiro');
        }
      } catch (e) {
        this.isParceiro = false;
        console.log('Erro ao buscar parceiro:', e);
      }

      // Verifica se o usuário é MEI
      try {
        const clienteResponse = await this.pagamentoService.buscarClientePorUsuario(usuario.Id).toPromise();
        if (clienteResponse && clienteResponse.IdEmpresa) {
          this.isMEI = true;
          console.log('MEI detectado por busca:', clienteResponse);
        } else {
          this.isMEI = false;
          console.log('Usuário não é MEI');
        }
      } catch (e) {
        this.isMEI = false;
        console.log('Erro ao buscar cliente:', e);
      }
    }
    console.log('isParceiro final:', this.isParceiro);
    console.log('isMEI final:', this.isMEI);
    
    // Verifica se o usuário já possui uma assinatura ativa
    await this.verificarAssinaturaAtiva();
    
    // Verifica se foi redirecionado por não ter assinatura
    await this.verificarRedirecionamentoAssinatura();
    
    await this.carregarPlanos();
    await this.verificarStatusFreeTrial();
    
    // Se é parceiro, mostra mensagem informativa sobre o plano gratuito
    if (this.isParceiro) {
      await this.mostrarInformacaoPlanoParceiro();
    }
  }

  async verificarRedirecionamentoAssinatura() {
    try {
      const status = await this.assinaturaService.podeAcessarSistema();
      if (!status.podeAcessar) {
        const alert = await this.alertCtrl.create({
          header: 'Assinatura Necessária',
          message: status.mensagem || 'Você precisa de uma assinatura ativa para acessar outras áreas do aplicativo.',
          buttons: ['OK']
        });
        await alert.present();
      }
    } catch (error) {
      console.error('Erro ao verificar redirecionamento:', error);
    }
  }

  async verificarAssinaturaAtiva() {
    try {
      const response = await this.pagamentoService.verificarAssinaturaAtiva().toPromise();
      console.log('Verificação de assinatura ativa:', response);
      
      if (response && response.hasActiveSubscription) {
        const assinatura = response.activeSubscription;
        const plano = assinatura.plano;
        
        // Para plano parceiro gratuito, calcula 1 ano a partir de hoje
        let diasRestantes = assinatura.diasRestantes;
        let dataRenovacao = new Date(assinatura.dataRenovacao);
        
        if (plano && plano.tipo === 'PARCEIRO_GRATIS') {
          // Calcula 1 ano (365 dias) a partir da data atual
          const hoje = new Date();
          dataRenovacao = new Date(hoje);
          dataRenovacao.setFullYear(dataRenovacao.getFullYear() + 1);
          diasRestantes = 365;
          this.planoParceiroAtivo = true; // Marca que o plano parceiro está ativo
        }
        
        const alert = await this.alertCtrl.create({
          header: 'Assinatura Ativa',
          message: `Você já possui uma assinatura ativa: ${plano.titulo}. A assinatura é válida até ${dataRenovacao.toLocaleDateString('pt-BR')} (${diasRestantes} dias restantes).`,
          buttons: ['OK']
        });
        await alert.present();
        
        // Opcional: redirecionar para dashboard ou outra página
        // this.router.navigate(['/dashboard']);
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura ativa:', error);
    }
  }

  async verificarStatusFreeTrial() {
    this.assinaturas = await this.assinaturaService.minhasAssinaturas();
    console.log('Assinaturas do usuário:', this.assinaturas);
    
    this.freeTrialAtivo = false;
    this.freeTrialJaUtilizado = false;
    this.freeTrialStatus = 'DISPONIVEL';
    this.freeTrialButtonDisabled = false;
    this.freeTrialDataRenovacao = null;
    this.mostrarAvisoAssine = false;

    // Log detalhado de cada assinatura para encontrar o campo correto
    this.assinaturas.forEach((assinatura, index) => {
      console.log(`Assinatura ${index}:`, assinatura);
      console.log(`  - Tipo: ${assinatura.Tipo}`);
      console.log(`  - tipo: ${assinatura.tipo}`);
      console.log(`  - IdPlano: ${assinatura.IdPlano}`);
      console.log(`  - idPlano: ${assinatura.idPlano}`);
      console.log(`  - plano:`, assinatura.plano);
      if (assinatura.plano) {
        console.log(`    - plano.tipo: ${assinatura.plano.tipo}`);
        console.log(`    - plano.Tipo: ${assinatura.plano.Tipo}`);
        console.log(`    - plano.id: ${assinatura.plano.id}`);
        console.log(`    - plano.Id: ${assinatura.plano.Id}`);
      }
    });
    
    // Verifica se tem plano parceiro ativo
    const planoParceiro = this.assinaturas.find(a => a.plano && a.plano.tipo === 'PARCEIRO_GRATIS' && a.ativa === true);
    if (planoParceiro) {
      this.planoParceiroAtivo = true;
      console.log('Plano parceiro ativo encontrado');
    }
    
    // Verifica se tem plano mensal ativo
    const planoMensal = this.assinaturas.find(a => {
      if (!a.plano) return false;
      const status = (a.status || '').toString().toUpperCase();
      return a.plano.tipo === 'MENSAL' && (a.ativa === true || status === 'ATIVA');
    });
    if (planoMensal) {
      this.planoMensalAtivo = true;
      console.log('Plano mensal ativo encontrado');
    } else {
      this.planoMensalAtivo = false;
    }
    
    // Verifica se tem plano anual ativo
    const planoAnual = this.assinaturas.find(a => {
      if (!a.plano) return false;
      const status = (a.status || '').toString().toUpperCase();
      return a.plano.tipo === 'ANUAL' && (a.ativa === true || status === 'ATIVA');
    });
    if (planoAnual) {
      this.planoAnualAtivo = true;
      console.log('Plano anual ativo encontrado');
    } else {
      this.planoAnualAtivo = false;
    }
    
    // Procura assinatura do tipo FREE_TRIAL (tentando diferentes campos)
    let freeTrial = this.assinaturas.find(a => a.plano && a.plano.tipo === 'FREE_TRIAL');
    if (!freeTrial) {
      // Fallback: procurar pelo ID do plano
      freeTrial = this.assinaturas.find(a => a.plano && a.plano.id === '33333333-3333-3333-3333-333333333333');
    }

    const agora = new Date();
    console.log('Free trial encontrado:', freeTrial);

    if (freeTrial) {
      this.freeTrialJaUtilizado = true;
      this.freeTrialDataRenovacao = freeTrial.dataRenovacao ? new Date(freeTrial.dataRenovacao) : null;

      let status = (freeTrial.status || '').toString().toUpperCase();
      if (!status && this.freeTrialDataRenovacao) {
        status = this.freeTrialDataRenovacao > agora ? 'ATIVA' : 'EXPIRADA';
      }

      const assinaturaAindaAtiva = freeTrial.ativa === true || status === 'ATIVA';
      this.freeTrialAtivo = assinaturaAindaAtiva;
      this.freeTrialStatus = assinaturaAindaAtiva ? 'ATIVO' : 'UTILIZADO';
      this.freeTrialButtonDisabled = true;

      console.log('Status do teste grátis:', status);
      console.log('freeTrialAtivo definido como:', this.freeTrialAtivo);

      if (!assinaturaAindaAtiva && freeTrial.dataCompra) {
        const dataCompra = new Date(freeTrial.dataCompra);
        const diffDias = (agora.getTime() - dataCompra.getTime()) / (1000 * 60 * 60 * 24);
        console.log('Diferença em dias desde o início do teste grátis:', diffDias);
      }
    } else {
      console.log('Nenhum free trial encontrado, permanecendo disponível para ativação');
      this.freeTrialStatus = 'DISPONIVEL';
      this.freeTrialButtonDisabled = false;
      this.freeTrialAtivo = false;
      this.freeTrialJaUtilizado = false;
    }

    // O card de teste grátis deve aparecer sempre (mesmo com assinatura paga ativa)
    const assinaturaPaga = this.assinaturas.find(a => {
      if (!a.plano) {
        return false;
      }
      if (a.plano.tipo !== 'MENSAL' && a.plano.tipo !== 'ANUAL') {
        return false;
      }
      const status = (a.status || '').toString().toUpperCase();
      return a.ativa === true || status === 'ATIVA';
    });

    const assinaturaPagaAtiva = !!assinaturaPaga;

    // Sempre mostra o plano gratuito, mesmo com assinatura paga ativa
    this.mostrarFreeTrial = true;
    this.mostrarAvisoAssine = this.freeTrialJaUtilizado && !this.freeTrialAtivo && !assinaturaPagaAtiva;

    console.log('freeTrialAtivo final:', this.freeTrialAtivo);
    console.log('freeTrialStatus final:', this.freeTrialStatus);
    console.log('freeTrialButtonDisabled:', this.freeTrialButtonDisabled);
    console.log('mostrarFreeTrial:', this.mostrarFreeTrial);
  }

  carregarPlanos(): Promise<void> {
    return new Promise((resolve) => {
      this.pagamentoService.listarPlanos().subscribe(
        (planos) => {
          console.log('Planos carregados da API:', planos);
          this.planos = planos.map((plano: any) => ({
            id: plano.id,
            titulo: plano.titulo,
            valor: plano.valor,
            tipo: plano.tipo,
            descricao: plano.descricao ? plano.descricao.split(',') : [],
            cor: 'light'
          }));
          this.freeTrialPlano = this.planos.find(p => p.tipo === 'FREE_TRIAL') || null;
          console.log('Free trial plano encontrado:', this.freeTrialPlano);
          console.log('Todos os planos:', this.planos);
          resolve();
        },
        async (error) => {
          console.error('Erro ao carregar planos:', error);
          const toast = await this.toastCtrl.create({
            message: 'Erro ao carregar planos',
            duration: 3000,
            color: 'danger',
          });
          await toast.present();
          resolve();
        }
      );
    });
  }

  getChipColor(tipo: string): string {
    switch (tipo) {
      case 'MENSAL': return 'light';
      case 'ANUAL': return 'secondary';
      case 'FREE_TRIAL': return 'success';
      case 'PARCEIRO_GRATIS': return 'warning';
      default: return 'medium';
    }
  }

  getTipoDisplay(tipo: string): string {
    switch (tipo) {
      case 'MENSAL': return 'Mensal';
      case 'ANUAL': return 'Anual';
      case 'FREE_TRIAL': return 'Teste Grátis';
      case 'PARCEIRO_GRATIS': return 'PARCEIRO';
      default: return tipo;
    }
  }

  getButtonColor(tipo: string): string {
    switch (tipo) {
      case 'MENSAL': return 'primary';
      case 'ANUAL': return 'secondary';
      case 'FREE_TRIAL': return 'success';
      case 'PARCEIRO_GRATIS': return 'warning';
      default: return 'medium';
    }
  }

  getButtonText(tipo: string): string {
    switch (tipo) {
      case 'MENSAL': return this.planoMensalAtivo ? 'Plano Ativo' : 'Assinar Plano';
      case 'ANUAL': return this.planoAnualAtivo ? 'Plano Ativo' : 'Assinar Plano';
      case 'FREE_TRIAL': return 'Ativar Grátis';
      case 'PARCEIRO_GRATIS': return this.planoParceiroAtivo ? 'Plano Ativo' : 'Ativar Plano';
      default: return 'Selecionar';
    }
  }
  
  isPlanoAtivo(tipo: string): boolean {
    switch (tipo) {
      case 'MENSAL': return this.planoMensalAtivo;
      case 'ANUAL': return this.planoAnualAtivo;
      case 'PARCEIRO_GRATIS': return this.planoParceiroAtivo;
      default: return false;
    }
  }

  isFreeTrialButtonDisabled(): boolean {
    return this.freeTrialButtonDisabled;
  }

  getFreeTrialButtonText(): string {
    switch (this.freeTrialStatus) {
      case 'ATIVO':
        return 'Teste ativo';
      case 'UTILIZADO':
        return 'Teste já utilizado';
      default:
        return 'Ativar Grátis';
    }
  }

  getFreeTrialInfoMessage(): string {
    if (!this.freeTrialJaUtilizado) {
      return '';
    }

    if (this.freeTrialAtivo) {
      if (this.freeTrialDataRenovacao) {
        return `Seu teste grátis está ativo até ${this.freeTrialDataRenovacao.toLocaleDateString('pt-BR')}.`;
      }
      return 'Seu teste grátis está ativo.';
    }

    return 'Seu teste grátis já foi utilizado. Assine o plano mensal para continuar aproveitando a plataforma.';
  }

  async selecionarPlano(plano: any) {
    if (plano.tipo === 'FREE_TRIAL' && this.freeTrialButtonDisabled) {
      const mensagem = this.freeTrialAtivo
        ? 'Você já possui o teste grátis ativo.'
        : 'Seu teste grátis já foi utilizado. Ative um plano pago para continuar usando a plataforma.';
      const alert = await this.alertCtrl.create({
        header: 'Teste grátis indisponível',
        message: mensagem,
        buttons: ['OK']
      });
      await alert.present();
      return;
    }

    // Verifica se o usuário já possui uma assinatura ativa
    try {
      const response = await this.pagamentoService.verificarAssinaturaAtiva().toPromise();
      if (response && response.hasActiveSubscription) {
        const assinatura = response.activeSubscription;
        const planoAtivo = assinatura.plano;
        
        // Para plano parceiro gratuito, calcula 1 ano a partir de hoje
        let diasRestantes = assinatura.diasRestantes;
        let dataRenovacao = new Date(assinatura.dataRenovacao);
        
        if (planoAtivo && planoAtivo.tipo === 'PARCEIRO_GRATIS') {
          const hoje = new Date();
          dataRenovacao = new Date(hoje);
          dataRenovacao.setFullYear(dataRenovacao.getFullYear() + 1);
          diasRestantes = 365;
        }
        
        // Verifica se o planoAtivo existe antes de acessar suas propriedades
        if (planoAtivo && planoAtivo.titulo) {
        const alert = await this.alertCtrl.create({
          header: 'Assinatura Ativa',
          message: `Você já possui uma assinatura ativa: ${planoAtivo.titulo}. A assinatura é válida até ${dataRenovacao.toLocaleDateString('pt-BR')} (${diasRestantes} dias restantes). Não é possível assinar um novo plano enquanto a assinatura atual estiver ativa.`,
          buttons: ['OK']
        });
        await alert.present();
        return;
        } else {
          // Se não tem plano válido, mostra mensagem genérica
          const alert = await this.alertCtrl.create({
            header: 'Assinatura Ativa',
            message: `Você já possui uma assinatura ativa. A assinatura é válida até ${dataRenovacao.toLocaleDateString('pt-BR')} (${diasRestantes} dias restantes). Não é possível assinar um novo plano enquanto a assinatura atual estiver ativa.`,
            buttons: ['OK']
          });
          await alert.present();
          return;
        }
      }
    } catch (error) {
      console.error('Erro ao verificar assinatura ativa:', error);
    }

    // Validações específicas por tipo de plano
    if (plano.tipo === 'PARCEIRO_GRATIS') {
      console.log('Plano PARCEIRO_GRATIS selecionado, isParceiro:', this.isParceiro);
      
      if (!this.isParceiro) {
        const alert = await this.alertCtrl.create({
          header: 'Plano Exclusivo para Parceiros',
          message: 'Este plano é exclusivo para parceiros. Faça o cadastro como parceiro para acessar este plano gratuito.',
          buttons: [
            {
              text: 'Entendi',
              role: 'cancel'
            }
          ]
        });
        await alert.present();
        return;
      }
    }

    // Validação para planos de teste grátis - MEI pode usar
    if (plano.tipo === 'FREE_TRIAL' && this.isParceiro && !this.isMEI) {
      const alert = await this.alertCtrl.create({
        header: 'Plano indisponível',
        message: 'O teste grátis é exclusivo para clientes e MEIs. Parceiros devem ativar o plano parceiro gratuito.',
        buttons: ['OK']
      });
      await alert.present();
      document.dispatchEvent(new CustomEvent('menuWillOpen'));
      return;
    }

    // Bloquear ativação do teste grátis se já tem assinatura paga ativa
    if (plano.tipo === 'FREE_TRIAL') {
      const assinaturaPaga = this.assinaturas.find(a => a.plano && (a.plano.tipo === 'MENSAL' || a.plano.tipo === 'ANUAL') && a.ativa === true);
      if (assinaturaPaga) {
        const alert = await this.alertCtrl.create({
          header: 'Já possui plano mensal',
          message: 'Você já possui o plano mensal ativo. Não é possível ativar o teste grátis.',
          buttons: ['OK']
        });
        await alert.present();
        return;
      }
    }

    // LÓGICA CORRIGIDA: Usar endpoints diferentes baseado no tipo de plano
    try {
      if (plano.tipo === 'FREE_TRIAL') {
        // Para planos gratuitos (FREE_TRIAL), usar endpoint de assinatura diretamente
        console.log('Criando assinatura gratuita para cliente/MEI:', plano);
        
        // Obter o ID do usuário atual
        const usuario = this.authService.getUserFromStorage();
        if (!usuario || !usuario.Id) {
          throw new Error('Usuário não identificado');
        }

        console.log('Buscando cliente/MEI para usuário:', usuario.Id);
        
        // Primeiro, buscar o cliente pelo ID do usuário
        const clienteResponse = await this.pagamentoService.buscarClientePorUsuario(usuario.Id).toPromise();
        console.log('Resposta da busca de cliente/MEI:', clienteResponse);
        
        if (!clienteResponse) {
          throw new Error('Cliente/MEI não encontrado para este usuário');
        }

        const dadosAssinatura = {
          idCliente: clienteResponse.Id || clienteResponse.id,
          idPlano: plano.id
        };

        console.log('Dados da assinatura:', dadosAssinatura);

        const response = await this.pagamentoService.criarAssinaturaGratuita(dadosAssinatura).toPromise();
        console.log('Resposta da criação de assinatura gratuita:', response);
        
        if (response && response.sucesso) {
          const tipoUsuario = this.isMEI ? 'MEI' : 'Cliente';
          const toast = await this.toastCtrl.create({
            message: `${tipoUsuario} - ${response.mensagem || 'Plano gratuito ativado com sucesso!'}`,
            duration: 3000,
            color: 'success',
          });
          await toast.present();
          
          // Atualizar o status após ativar o plano
          await this.verificarStatusFreeTrial();
          return;
        } else {
          throw new Error(response?.erro || 'Erro ao criar assinatura gratuita');
        }
      } else if (plano.tipo === 'PARCEIRO_GRATIS' && this.isParceiro) {
        // Para planos gratuitos de parceiros, usar endpoint de assinatura de parceiro
        console.log('Criando assinatura gratuita para parceiro:', plano);
        
        // Obter o ID do usuário atual
        const usuario = this.authService.getUserFromStorage();
        if (!usuario || !usuario.Id) {
          throw new Error('Usuário não identificado');
        }

        console.log('Buscando parceiro para usuário:', usuario.Id);
        
        // Primeiro, buscar o parceiro pelo ID do usuário
        const parceiroResponse = await this.pagamentoService.buscarParceiroPorUsuario(usuario.Id).toPromise();
        console.log('Resposta da busca de parceiro:', parceiroResponse);
        
        if (!parceiroResponse || parceiroResponse === false) {
          throw new Error('Parceiro não encontrado para este usuário');
        }

        const dadosAssinatura = {
          idParceiro: parceiroResponse.idParceiro || parceiroResponse.id,
          idPlano: plano.id
        };

        console.log('Dados da assinatura de parceiro:', dadosAssinatura);

        const response = await this.pagamentoService.criarAssinaturaParceiro(dadosAssinatura).toPromise();
        console.log('Resposta da criação de assinatura de parceiro:', response);
        
        if (response && response.sucesso) {
          const toast = await this.toastCtrl.create({
            message: response.mensagem || 'Plano de parceiro ativado com sucesso!',
            duration: 3000,
            color: 'success',
          });
          await toast.present();
          
          // Atualizar o status após ativar o plano
          await this.verificarStatusFreeTrial();
        return;
        } else {
          throw new Error(response?.erro || 'Erro ao criar assinatura de parceiro');
        }
      } else {
        // Para planos pagos (MENSAL/ANUAL), usar endpoint de pagamento
        console.log('Gerando link de pagamento para plano pago:', plano);
        const response = await this.pagamentoService.gerarLinkPagamento(plano.id).toPromise();
        console.log('Resposta da API de pagamento:', response);
      
      // Verifica se há erro de parceiro
      if (response && response.requiresPartnerRegistration) {
        await this.mostrarAlertaParceiro();
        return;
      }
      
      // Para planos pagos, verifica se tem URL de pagamento
      if (response && response.urlPagamento) {
        console.log('Redirecionando para:', response.urlPagamento);
        
        // Tenta abrir em nova aba primeiro
        const newWindow = window.open(response.urlPagamento, '_blank');
        
        // Se não conseguiu abrir nova aba, redireciona na mesma aba
        if (!newWindow) {
          window.location.href = response.urlPagamento;
          }
        } else {
          throw new Error('URL de pagamento não foi gerada');
        }
      }
    } catch (error: any) {
      console.error('Erro ao processar plano:', error);
      
      // Trata erro específico para parceiros tentando gerar link de pagamento
      if (error.status === 400 && error.error && error.error.isPartnerPlan) {
        const toast = await this.toastCtrl.create({
          message: error.error.message || 'Acesso liberado para parceiros! Você já pode utilizar todos os recursos exclusivos.',
          duration: 3000,
          color: 'success',
        });
        await toast.present();
        return;
      }
      
      // Trata outros erros
      let errorMessage = 'Erro ao processar plano';
      if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const alert = await this.alertCtrl.create({
        header: 'Erro',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async mostrarInformacaoPlanoParceiro() {
    try {
      // Verifica se já tem assinatura ativa
      const response = await this.pagamentoService.verificarAssinaturaAtiva().toPromise();
      console.log('Verificação de assinatura para parceiro:', response);
      
      if (response && response.hasActiveSubscription) {
        console.log('Parceiro já possui assinatura ativa');
        return;
      }

      // Busca o plano gratuito para parceiros
      const planoGratuito = this.planos.find(p => p.tipo === 'PARCEIRO_GRATIS');
      if (!planoGratuito) {
        console.error('Plano gratuito para parceiros não encontrado');
        return;
      }

      // Mostra alerta informativo sobre o plano gratuito
      const alert = await this.alertCtrl.create({
        header: 'Boas-vindas, Parceiro!',
        message: `Você tem acesso ao plano gratuito exclusivo para parceiros: "${planoGratuito.titulo}". Clique em "Ativar Plano" para começar a usar a plataforma.`,
        buttons: [
          {
            text: 'Entendi',
            role: 'cancel'
          }
        ]
      });
      await alert.present();
    } catch (error: any) {
      console.error('Erro ao mostrar informação do plano parceiro:', error);
      
      // Trata erro específico de servidor
      let errorMessage = 'Erro ao verificar status da assinatura';
      if (error.status === 500) {
        errorMessage = 'Erro interno do servidor. Tente novamente em alguns instantes.';
      } else if (error.error && error.error.message) {
        errorMessage = error.error.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      const alert = await this.alertCtrl.create({
        header: 'Erro',
        message: errorMessage,
        buttons: ['OK']
      });
      await alert.present();
    }
  }

  async mostrarAlertaParceiro() {
    const alert = await this.alertCtrl.create({
      header: 'Plano Exclusivo para Parceiros',
      message: 'Este plano é exclusivo para parceiros. Faça o cadastro como parceiro para acessar este plano gratuito.',
      buttons: [
        {
          text: 'Entendi',
          role: 'cancel'
        }
      ]
    });

    await alert.present();
  }
}
