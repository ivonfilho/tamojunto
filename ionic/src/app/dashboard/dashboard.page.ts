import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { OfertaService } from 'src/app/services/oferta.service';
import { Oferta } from 'src/app/ofertas/oferta.model';
import { Router } from '@angular/router';
import { CupomService } from 'src/app/services/cupom.service';
import { UsuarioService } from 'src/app/services/api/usuario.service';
import { ParceiroService } from 'src/app/services/parceiro.service';
import { ClienteService } from '../services/cliente.service';
import { AssinaturaService } from '../services/assinatura.service';
import { IonContent, LoadingController, ToastController, AlertController } from '@ionic/angular';
import { formatCurrencyBRL } from '../utils/currency.util';
import {
  ApexNonAxisChartSeries,
  ApexChart,
  ApexResponsive,
  ApexLegend,
  ApexPlotOptions,
  ApexDataLabels
} from 'ng-apexcharts';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  @ViewChild(IonContent) content!: IonContent;
  
  chartData: any[] = [];
  public oferta: Oferta[] = [];
  public series: ApexNonAxisChartSeries = [];
  public chart: ApexChart = {
    type: 'donut',
    height: 350,
    animations: {
      enabled: true,
      easing: 'easeinout',
      speed: 800,
      animateGradually: {
        enabled: true,
        delay: 150
      },
      dynamicAnimation: {
        enabled: true,
        speed: 350
      }
    }
  };
  public labels: string[] = [];
  public legend: ApexLegend = {
    show: false
  };  
  public dataLabels: ApexDataLabels = {
    enabled: false
  };
  public responsive: ApexResponsive[] = [
    {
      breakpoint: 1024,
      options: {
        chart: {
          height: 320
        },
        plotOptions: {
          pie: {
            donut: {
              size: '70%'
            }
          }
        }
      }
    },
    {
      breakpoint: 768,
      options: {
        chart: {
          height: 300
        },
        plotOptions: {
          pie: {
            donut: {
              size: '68%'
            }
          }
        }
      }
    },
    {
      breakpoint: 568,
      options: {
        chart: {
          height: 260
        },
        plotOptions: {
          pie: {
            donut: {
              size: '65%'
            }
          }
        }
      }
    }
  ];
  public plotOptions: ApexPlotOptions = {
    pie: {
      startAngle: -90,
      endAngle: 90,
      donut: {
        size: '75%',
        labels: {
          show: true,
          total: {
            show: true,
            label: 'Total Descontos',
            fontSize: '16px',
            fontWeight: 600,
            color: '#1e293b',
            formatter: () => formatCurrencyBRL(this.totalDescontos)
          }
        }
      }
    }
  };
  public pedidos: any[] = [];
  public cupons: any[] = [];
  public cupomDetalhes: any = null;
  public totalDescontos = 0;
  public isLoading = false;
  public lastRefresh = new Date();
  public usuario: any;

  constructor(
    private ofertaService: OfertaService,
    private router: Router,
    private cupomService: CupomService,
    private usuarioService: UsuarioService,
    private parceiroService: ParceiroService,
    private loadingController: LoadingController,
    private toastController: ToastController,
    private cdr: ChangeDetectorRef,
    private clienteService: ClienteService,
    private assinaturaService: AssinaturaService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    // Carrega o usuário do localStorage
    this.usuario = JSON.parse(localStorage.getItem('tamo_junto_user') || '{}');
    
    window.addEventListener('scrollToTop', () => {
      this.scrollToTop();
    });

    this.initializeDashboard();
  }

  scrollToTop() {
    if (this.content) {
      this.content.scrollToTop(500);
    }
  }

  async initializeDashboard() {
    const loading = await this.showLoading('Carregando dashboard...');
    
    try {
      // Usar o usuário que já foi carregado do localStorage no ngOnInit
      if (this.usuario && this.usuario.Id) {
        this.parceiroService.buscarParceiroPorUsuario(this.usuario.Id).subscribe(
          (response) => {
            if (response && response.idParceiro) {
              this.router.navigate(['./dashboard-parceiro']);
            } else {
              this.carregarDashboardPadrao();
            }
            loading.dismiss();
          },
          (error) => {
            console.error('[Dashboard] Erro ao buscar parceiro:', error);
            this.carregarDashboardPadrao();
            loading.dismiss();
          }
        );
      } else {
        console.error('[Dashboard] Usuário não encontrado no localStorage ou ID não encontrado.');
        this.carregarDashboardPadrao();
        loading.dismiss();
      }
    } catch (error) {
      console.error('[Dashboard] Erro na inicialização:', error);
      loading.dismiss();
      this.showToast('Erro ao inicializar dashboard', 'danger');
    }
  }

  async showLoading(message: string) {
    const loading = await this.loadingController.create({
      message,
      spinner: 'crescent',
      translucent: true,
      cssClass: 'custom-loading'
    });
    await loading.present();
    return loading;
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'top',
      cssClass: 'custom-toast'
    });
    await toast.present();
  }

  async carregarDashboardPadrao() {
    if (this.isLoading) {
      return;
    }

    this.isLoading = true;

    try {
      // Carregar cupons primeiro para debug
      await this.carregarPedidosRecentes();
      
      // Carregar cupons do usuário
      await this.carregarCuponsUsuario();
      
      // Carregar ofertas
      await this.carregarOfertas();
      
      // Carregar analytics
      await this.carregarAnalytics();
      
      // Verificar se a assinatura está próxima do vencimento
      await this.verificarRenovacaoAssinatura();
      
      // Forçar detecção de mudanças após todos os dados
      this.cdr.detectChanges();
      
    } catch (error) {
      console.error('❌ Erro ao carregar dashboard padrão:', error);
      this.showToast('Erro ao carregar dados', 'danger');
    } finally {
      this.isLoading = false;
    }
  }

  carregarAnalytics() {
    return new Promise<void>((resolve) => {
      this.ofertaService.listarComDescontoECategoria().subscribe((ofertas) => {
        const categoriaDescontoMap = new Map<string, number>();

        ofertas.forEach((oferta) => {
          const categoria = oferta.categoria || 'Outros';
          const desconto = oferta.desconto || 0;
          categoriaDescontoMap.set(
            categoria,
            (categoriaDescontoMap.get(categoria) || 0) + desconto
          );
        });

        const topCategorias = Array.from(categoriaDescontoMap.entries())
          .sort((a, b) => b[1] - a[1]);

        // Pega as 3 primeiras categorias para o gráfico
        const top3 = topCategorias.slice(0, 3);
        this.series = top3.map(([_, desconto]) => desconto);
        this.labels = top3.map(([categoria, _]) => categoria);
        this.totalDescontos = top3.reduce((sum, val) => sum + val[1], 0);

        // Pega as 4 primeiras categorias para os cards
        this.chartData = topCategorias.slice(0, 3).map(([categoria, desconto]) => ({
          name: categoria,
          value: desconto,
        }));

        resolve();
      }, (error) => {
        console.error('Erro ao carregar analytics:', error);
        resolve();
      });
    });
  }

  getFixedIcon(index: number): string {
    const icons = [
      '../assets/icon/ShoppingBag2.svg',
      '../assets/icon/Storefront.svg',
      '../assets/icon/BagOutline.svg',
      '../assets/icon/Gift.svg',
      '../assets/icon/HomeOutline.svg',
      '../assets/icon/DocumentOutline.svg',
      '../assets/icon/Pricetags.svg',
      '../assets/icon/TrendingUp.svg'
    ];
    return icons[index % icons.length];
  }
  
  getColor(index: number): string {
    const colors = [
      'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)',
      'linear-gradient(135deg, #10b981 0%, #059669 100%)',
      'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
      'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
      'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
      'linear-gradient(135deg, #06b6d4 0%, #0891b2 100%)',
      'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
      'linear-gradient(135deg, #84cc16 0%, #65a30d 100%)'
    ];
    return colors[index % colors.length];
  }
  
  carregarOfertas() {
    return new Promise<void>((resolve) => {
      this.ofertaService.listarOfertas().subscribe((data: Oferta[]) => {
        const ofertasValidas = (data || []).filter((oferta) =>
          this.ofertaEstaValida(oferta)
        );

        this.oferta = ofertasValidas
          .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime())
          .slice(0, 3);
        resolve();
      }, (error) => {
        console.error('Erro ao carregar ofertas:', error);
        resolve();
      });
    });
  }

  private ofertaEstaValida(oferta: Oferta): boolean {
    if (!oferta) {
      return false;
    }

    const status = (oferta as any)?.status;
    const statusAtivo = status === undefined ? true : status === true;

    if (!statusAtivo) {
      return false;
    }

    if (!oferta.validade) {
      return true;
    }

    const hoje = new Date();
    const hojeSemHora = new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate());

    const validade = new Date(oferta.validade);
    const validadeSemHora = new Date(validade.getFullYear(), validade.getMonth(), validade.getDate());

    return validadeSemHora >= hojeSemHora;
  }

  carregarPedidosRecentes() {
    return new Promise<void>((resolve) => {
      this.cupomService.listarCupoms(this.usuario.Id).subscribe((cupons) => {
        this.pedidos = cupons || [];
        resolve();
      }, (error) => {
        console.error('Erro ao carregar pedidos', 'warning');
        resolve();
      });
    });
  }

  carregarCuponsUsuario() {
    return new Promise<void>((resolve) => {
      // Usar a mesma lógica da página de cupons
      const usuarioLogado = localStorage.getItem('usuarioLogado');
      if (usuarioLogado) {
        const usuario = JSON.parse(usuarioLogado);
        
        if (usuario && usuario.Id) {
          // Usar o ClienteService para obter o ID correto do cliente
          this.clienteService.obterClientePorUsuario(usuario.Id).subscribe(
            (cliente: any) => {
              if (cliente && cliente.id) {
                // Agora usar o ID do cliente para buscar os cupons
                this.cupomService.listarCupoms(cliente.id).subscribe((cupons) => {
                  this.cupons = cupons || [];
                  resolve();
                }, (error) => {
                  console.error('Erro ao carregar cupons do cliente:', error);
                  this.cupons = [];
                  resolve();
                });
              } else {
                // Fallback: tentar com o ID do usuário
                this.cupomService.listarCupoms(usuario.Id).subscribe((cupons) => {
                  this.cupons = cupons || [];
                  resolve();
                }, (error) => {
                  console.error('Erro ao carregar cupons (fallback):', error);
                  this.cupons = [];
                  resolve();
                });
              }
            },
            (error: any) => {
              console.error('Erro ao buscar cliente:', error);
              // Fallback: tentar com o ID do usuário
              this.cupomService.listarCupoms(usuario.Id).subscribe((cupons) => {
                this.cupons = cupons || [];
                resolve();
              }, (error) => {
                console.error('Erro ao carregar cupons (fallback após erro):', error);
                this.cupons = [];
                resolve();
              });
            }
          );
        } else {
          this.cupons = [];
          resolve();
        }
      } else {
        this.cupons = [];
        resolve();
      }
    });
  }

  // Métodos auxiliares para formatar dados dos cupons
  getEstabelecimentoNome(cupom: any): string {
    const oferta = cupom.ofertaParceiro;
    if (oferta && oferta.idParceiroNavigation && oferta.idParceiroNavigation.idEmpresaNavigation) {
      return oferta.idParceiroNavigation.idEmpresaNavigation.nome || 'Estabelecimento Desconhecido';
    }
    return 'Estabelecimento Desconhecido';
  }

  getCodigoCupom(cupom: any): string {
    return cupom.id ? cupom.id.substring(0, 8).toUpperCase() : 'N/A';
  }

  getValorCupom(cupom: any): number {
    const oferta = cupom.ofertaParceiro;
    if (oferta && oferta.preco && oferta.desconto) {
      const preco = parseFloat(oferta.preco);
      const desconto = parseFloat(oferta.desconto);
      return preco - (preco * desconto / 100);
    }
    return oferta?.preco || 0;
  }

  getDataCupom(cupom: any): Date {
    return new Date(cupom.dataResgate || new Date());
  }

  getStatusColor(cupom: any): string {
    if (cupom.dataUtilizacao) return 'success';
    
    const oferta = cupom.ofertaParceiro;
    if (oferta && oferta.validade) {
      const validade = new Date(oferta.validade);
      const dataAtual = new Date();
      if (validade < dataAtual) return 'danger';
    }
    
    return 'primary';
  }

  getStatusText(cupom: any): string {
    if (cupom.dataUtilizacao) return 'Utilizado';
    
    const oferta = cupom.ofertaParceiro;
    if (oferta && oferta.validade) {
      const validade = new Date(oferta.validade);
      const dataAtual = new Date();
      if (validade < dataAtual) return 'Expirado';
    }
    
    return 'Ativo';
  }

  verTodosCupons() {
    this.router.navigate(['/cupons']);
  }

  calcularPrecoComDesconto(preco: number, desconto: number): number {
    if (!preco || !desconto) {
      return preco || 0;
    }
    return preco - (preco * desconto / 100);
  }

  verOferta(ofertaId: string | undefined) {
    if (ofertaId) {
      this.router.navigate(['/oferta', ofertaId]);
    } else {
      this.showToast('ID da oferta não encontrado', 'warning');
    }
  }

  async refreshDashboard() {
    const loading = await this.showLoading('Atualizando dashboard...');
    try {
      await this.carregarDashboardPadrao();
      this.showToast('Dinheiro no bolso atualizado com sucesso!', 'success');
      this.content.scrollToTop(500);
    } catch (error) {
      this.showToast('Erro ao atualizar dashboard', 'danger');
    } finally {
      loading.dismiss();
    }
  }
  /**
   * Verifica se a assinatura está próxima do vencimento e exibe alerta
   */
  async verificarRenovacaoAssinatura() {
    try {
      console.log('[Dashboard] Verificando renovação de assinatura...');
      const infoVencimento = await this.assinaturaService.verificarAssinaturaProximaVencimento();
      console.log('[Dashboard] Resultado da verificação:', infoVencimento);
      
      if (infoVencimento.estaProximaVencimento) {
        const diasRestantes = infoVencimento.diasRestantes || 0;
        const dataRenovacao = infoVencimento.dataRenovacao;
        const planoTitulo = infoVencimento.planoTitulo || 'seu plano';
        
        // Formata a data de renovação
        const dataFormatada = dataRenovacao 
          ? dataRenovacao.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' })
          : '';
        
        // Mensagem personalizada baseada nos dias restantes
        let mensagem = '';
        if (diasRestantes === 0) {
          mensagem = `Sua assinatura ${planoTitulo} expira hoje (${dataFormatada})! Renove agora para continuar usando a plataforma.`;
        } else if (diasRestantes === 1) {
          mensagem = `Sua assinatura ${planoTitulo} expira amanhã (${dataFormatada})! Renove agora para continuar usando a plataforma.`;
        } else {
          mensagem = `Sua assinatura ${planoTitulo} expira em ${diasRestantes} dias (${dataFormatada}). Renove agora para continuar usando a plataforma sem interrupções.`;
        }
        
        const alert = await this.alertController.create({
          header: 'Renovação de Assinatura',
          message: mensagem,
          buttons: [
            {
              text: 'Renovar Agora',
              handler: () => {
                this.router.navigate(['/Assinatura']);
              }
            },
            {
              text: 'Lembrar Depois',
              role: 'cancel'
            }
          ],
          cssClass: 'alerta-renovacao'
        });
        
        await alert.present();
      } else {
      }
    } catch (error) {
      console.error('[Dashboard] Stack trace:', error);
      // Não exibe erro para o usuário, apenas loga
    }
  }

  getLastRefreshTime(): string {
    return this.lastRefresh.toLocaleTimeString('pt-BR');
  }

  mostrarDetalhesCupom(cupom: any) {
    this.router.navigate(['/cupom', cupom.id]);
  }

  fecharDetalhesCupom() {
    this.cupomDetalhes = null;
  }
}
