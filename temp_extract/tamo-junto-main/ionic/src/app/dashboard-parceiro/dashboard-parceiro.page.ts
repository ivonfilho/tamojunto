import { Component, OnInit } from '@angular/core';
import { CupomService } from '../services/cupom.service';
import { OfertaService } from '../services/oferta.service';
import { ParceiroService } from '../services/parceiro.service';
import { UsuarioService } from '../services/api/usuario.service'; 
import {
  ApexAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexDataLabels,
  ApexStroke,
  ApexFill
} from 'ng-apexcharts';

export type ChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  fill?: ApexFill;
};

@Component({
  selector: 'app-dashboard-parceiro',
  templateUrl: './dashboard-parceiro.page.html',
  styleUrls: ['./dashboard-parceiro.page.scss'],
})
export class DashboardParceiroPage implements OnInit {

  public chartOptions!: Partial<ChartOptions>;

  public totalCuponsUtilizados = 0;
  public totalCuponsPendentes = 0;
  public totalCuponsPerdidos = 0;

  public totalOfertasAtivas = 0;
  public totalOfertasInativas = 0;

  public totalVendas = 0;
  public percentualVendasMes = 0; 
  public cuponsUtilizadosSemana = 0; 
  
  public vendasPorProduto: { nomeProduto: string; quantidade: number; valorTotal: number }[] = [];

  public selectedPeriodo = 60;
  public desempenhoPorPeriodo: { x: string, y: number }[] = [];

  public idParceiro: string = '';
  public usuario: any;

  constructor(
    private cupomService: CupomService,
    private ofertaService: OfertaService,
    private parceiroService: ParceiroService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    // Carrega o usuário do localStorage
    this.usuario = JSON.parse(localStorage.getItem('tamo_junto_user') || '{}');
    this.obterParceiroEListarDados();
  }

  ionViewWillEnter() {
    // Garante recarregar totais ao voltar para a tela após validar cupom.
    if (this.idParceiro) {
      this.carregarDadosDashboard();
      return;
    }

    this.obterParceiroEListarDados();
  }

  obterParceiroEListarDados() {
    const usuarioLogado = this.usuarioService.getUsuarioLogado();
    console.log('Usuário logado:', usuarioLogado);
    
    if (usuarioLogado && usuarioLogado.Id) {
      this.parceiroService.buscarParceiroPorUsuario(usuarioLogado.Id).subscribe({
        next: (parceiro: any) => {
          console.log('Parceiro retornado pela API:', parceiro);
          
          if (parceiro && parceiro.idParceiro) {
            this.idParceiro = parceiro.idParceiro;
            console.log('ID do parceiro:', this.idParceiro);
            this.carregarDadosDashboard();
          } else {
            console.warn('Parceiro não possui um ID válido:', parceiro);
            console.log('Usuário ou idParceiro não encontrado.');
          }
        },
        error: (error: any) => {
          console.error('Erro ao obter parceiro:', error);
          console.log('Usuário ou idParceiro não encontrado.');
        }
      });
    } else {
      console.error('Usuário não logado ou ID não encontrado.');
    }
  }

  atualizarDados() {
    console.log('Atualizando dados do dashboard...');
    this.carregarDadosDashboard();
  }

  getProgressPercentage(valorTotal: number): number {
    if (!this.vendasPorProduto || this.vendasPorProduto.length === 0) {
      return 0;
    }
    
    const maxValor = Math.max(...this.vendasPorProduto.map(v => v.valorTotal));
    if (maxValor === 0) {
      return 0;
    }
    
    return (valorTotal / maxValor) * 100;
  }

  carregarDadosDashboard() {
    const agora = new Date();

    // Buscar cupons do parceiro específico
    this.cupomService.listarCuponsPorParceiro(this.idParceiro).subscribe({
      next: (cupons) => {
        console.log('Cupons do parceiro carregados:', cupons);
        const cuponsDoParceiro = cupons;

        this.totalCuponsUtilizados = cuponsDoParceiro.filter(c => this.isCupomUtilizado(c)).length;
        this.totalCuponsPendentes = cuponsDoParceiro.filter(c => !this.isCupomUtilizado(c)).length;
        this.totalCuponsPerdidos = cuponsDoParceiro.filter(c =>
          !this.isCupomUtilizado(c) &&
          c.ofertaParceiro?.validade &&
          new Date(c.ofertaParceiro.validade) < agora
        ).length;

        const agrupado: { [produto: string]: { quantidade: number; valorTotal: number } } = {};

        cuponsDoParceiro.forEach(c => {
          if (this.isCupomUtilizado(c)) {
            const nome = c.ofertaParceiro?.nomeProduto || 'Produto Desconhecido';
            const preco = c.ofertaParceiro?.preco || 0;
            const desconto = c.ofertaParceiro?.desconto || 0;
            const precoComDesconto = preco - (preco * desconto / 100);

            if (!agrupado[nome]) {
              agrupado[nome] = { quantidade: 0, valorTotal: 0 };
            }
            agrupado[nome].quantidade += 1;
            agrupado[nome].valorTotal += precoComDesconto;
          }
        });

        this.vendasPorProduto = Object.entries(agrupado).map(([nomeProduto, dados]) => ({
          nomeProduto,
          quantidade: dados.quantidade,
          valorTotal: dados.valorTotal
        }));

        this.totalVendas = cuponsDoParceiro
          .filter(c => this.isCupomUtilizado(c))
          .reduce((sum, c) => {
            const preco = c.ofertaParceiro?.preco || 0;
            const desconto = c.ofertaParceiro?.desconto || 0;
            return sum + (preco - (preco * desconto / 100));
          }, 0);

        // Calcular crescimento de vendas do mês atual vs mês anterior
        this.calcularCrescimentoVendas(cuponsDoParceiro);
        
        // Calcular cupons utilizados esta semana
        this.calcularCuponsUtilizadosSemana(cuponsDoParceiro);

        this.prepararDadosGrafico(cuponsDoParceiro);
      },
      error: (error) => {
        console.error('Erro ao carregar cupons do parceiro:', error);
      }
    });

    // Buscar ofertas do parceiro específico
    this.ofertaService.listarOfertasPorParceiro(this.idParceiro).subscribe({
      next: (ofertas) => {
        console.log('Ofertas do parceiro carregadas:', ofertas);
        this.totalOfertasAtivas = ofertas.filter(o => o['status'] === true).length;
        this.totalOfertasInativas = ofertas.filter(o => o['status'] === false).length;
      },
      error: (error) => {
        console.error('Erro ao carregar ofertas do parceiro:', error);
      }
    });
  }

  private prepararDadosGrafico(cuponsDoParceiro: any[]) {
    const limiteData = new Date();
    limiteData.setDate(limiteData.getDate() - this.selectedPeriodo);

    const vendasPeriodo = cuponsDoParceiro.filter(c =>
      this.isCupomUtilizado(c) &&
      (() => {
        const dataUso = this.getDataUtilizacao(c);
        return dataUso ? dataUso >= limiteData : false;
      })()
    );

    const porDia: { [data: string]: number } = {};
    vendasPeriodo.forEach(c => {
      const dataUso = this.getDataUtilizacao(c);
      if (!dataUso) {
        return;
      }
      const data = dataUso.toLocaleDateString();
      porDia[data] = (porDia[data] || 0) + 1;
    });

    this.desempenhoPorPeriodo = Object.entries(porDia).map(([data, qtd]) => ({
      x: data,
      y: qtd as number
    }));

    this.chartOptions = {
      series: [{
        name: 'Vendas',
        data: this.desempenhoPorPeriodo
      }],
      chart: {
        type: 'area',
        height: 350,
        toolbar: {
          show: false
        },
        zoom: {
          enabled: false
        }
      },
      dataLabels: {
        enabled: true,
        style: {
          fontSize: '12px',
          colors: ['#fff']
        }
      },
      stroke: {
        curve: 'smooth',
        width: 3
      },
      xaxis: {
        type: 'category',
        labels: {
          rotate: -45,
          style: {
            fontSize: '12px'
          }
        }
      },
      fill: {
        type: 'gradient',
        gradient: {
          shade: 'light',
          type: 'horizontal',
          shadeIntensity: 0.5,
          gradientToColors: ['#ffd600'], // cor final do gradiente
          inverseColors: false,
          opacityFrom: 0.8,
          opacityTo: 0.2,
          stops: [0, 100]
        }
      }
    };
  }

  // Calcula o crescimento de vendas do mês atual vs mês anterior
  calcularCrescimentoVendas(cupons: any[]) {
    const hoje = new Date();
    const mesAtual = hoje.getMonth();
    const anoAtual = hoje.getFullYear();
    
    // Vendas do mês atual
    const vendasMesAtual = cupons
      .filter(c => {
        const data = this.getDataUtilizacao(c);
        if (!data) return false;
        return data.getMonth() === mesAtual && data.getFullYear() === anoAtual;
      })
      .reduce((sum, c) => {
        const preco = c.ofertaParceiro?.preco || 0;
        const desconto = c.ofertaParceiro?.desconto || 0;
        return sum + (preco - (preco * desconto / 100));
      }, 0);
    
    // Vendas do mês anterior
    const mesAnterior = mesAtual === 0 ? 11 : mesAtual - 1;
    const anoMesAnterior = mesAtual === 0 ? anoAtual - 1 : anoAtual;
    
    const vendasMesAnterior = cupons
      .filter(c => {
        const data = this.getDataUtilizacao(c);
        if (!data) return false;
        return data.getMonth() === mesAnterior && data.getFullYear() === anoMesAnterior;
      })
      .reduce((sum, c) => {
        const preco = c.ofertaParceiro?.preco || 0;
        const desconto = c.ofertaParceiro?.desconto || 0;
        return sum + (preco - (preco * desconto / 100));
      }, 0);
    
    // Calcula o percentual de crescimento
    if (vendasMesAnterior > 0) {
      this.percentualVendasMes = ((vendasMesAtual - vendasMesAnterior) / vendasMesAnterior) * 100;
    } else if (vendasMesAtual > 0) {
      this.percentualVendasMes = 100; // Se não tinha vendas antes e agora tem, é 100% de crescimento
    } else {
      this.percentualVendasMes = 0;
    }
    
    console.log('Vendas mês atual:', vendasMesAtual);
    console.log('Vendas mês anterior:', vendasMesAnterior);
    console.log('Percentual crescimento:', this.percentualVendasMes);
  }
  
  // Calcula cupons utilizados esta semana
  calcularCuponsUtilizadosSemana(cupons: any[]) {
    const hoje = new Date();
    const seteDiasAtras = new Date(hoje);
    seteDiasAtras.setDate(hoje.getDate() - 7);
    
    this.cuponsUtilizadosSemana = cupons.filter(c => {
      const data = this.getDataUtilizacao(c);
      if (!data) return false;
      return data >= seteDiasAtras && data <= hoje;
    }).length;
    
    console.log('Cupons utilizados últimos 7 dias:', this.cuponsUtilizadosSemana);
  }

  private isCupomUtilizado(cupom: any): boolean {
    if (!cupom) return false;
    return !!(
      cupom.dataUtilizacao ||
      cupom.DataUtilizacao ||
      cupom.aUtilizacao ||
      cupom.AUtilizacao ||
      cupom.utilizado === true ||
      cupom.Utilizado === true
    );
  }

  private getDataUtilizacao(cupom: any): Date | null {
    if (!cupom) return null;

    const valorData =
      cupom.dataUtilizacao ||
      cupom.DataUtilizacao ||
      cupom.aUtilizacao ||
      cupom.AUtilizacao;

    if (!valorData) {
      return null;
    }

    const data = new Date(valorData);
    return Number.isNaN(data.getTime()) ? null : data;
  }
}
