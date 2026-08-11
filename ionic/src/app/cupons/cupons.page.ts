import { Component, OnInit, Input, HostListener } from '@angular/core';
import { ClienteService } from '../services/cliente.service';
import { CupomService } from '../services/cupom.service';
import { Cupom } from './cupom.model';
import { ParceiroService } from '../services/parceiro.service';
import { UsuarioService } from '../services/api/usuario.service';
import { HttpErrorResponse } from '@angular/common/http';
import type { SegmentValue } from '@ionic/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { formatCurrencyBRL } from '../utils/currency.util';
import { isUsuarioParceiroComercial, obterIdUsuario } from '../utils/usuario-sessao.util';
import { CATEGORIAS_OFERTA } from '../utils/constants';

@Component({
  selector: 'app-cupons',
  templateUrl: './cupons.page.html',
  styleUrls: ['./cupons.page.scss'],
})
export class CuponsPage implements OnInit {

  idCliente: string | null = null;
  usuario: any;
  cupoms: Cupom[] = [];
  cuponsOriginais: Cupom[] = [];
  cuponsProcessados: Cupom[] = []; // Nova lista centralizada para exibição rápida
  qrCode: string | null = null;
  categoriaPesquisa: string = 'Todos';
  mensagemCategoriaPorPesquisa: string = ''
  categorias = ['Todos', ...CATEGORIAS_OFERTA];
  idParceiro: string | null = null;

  filtroUsuario: string = '';
  filtroTipo: string = '';
  filtroStatus: string = 'Gerados';
  mensagemVazia: string = 'Nenhum cupom gerado.';
  abaAtiva: string = 'Gerados';
  cupomExpandido: Cupom | null = null;
  isMobile: boolean = false;
  termoBusca: string = ''; // Variável de estado para busca unificada

  // =====================================
  // CONTADORES DINÂMICOS DAS ABAS
  // =====================================
  totalCupons: number = 0;
  cuponsAtivos: number = 0;
  cuponsUsados: number = 0;
  cuponsExpirados: number = 0;

  // Propriedades do carrossel (mantidas para compatibilidade com outros métodos, embora agora usemos grid)
  indiceAtual: number = 0;
  cuponsPorSlide: number = 1;
  autoPlay: boolean = false;
  autoPlayInterval: any;

  // DADOS PARA MOCK SE PRECISAR!!
  @Input() valor: string = 'R$15';
  @Input() data: string = '23/05/2023';
  @Input() parceiro: string = 'Produto';
  @Input() codigo: string = 'TMJ1X210';
  @Input() validade: string = '30 dias';
  @Input() categoria: string = 'Comida';

  textoDescritivo: string = '';

  constructor(
    private clienteService: ClienteService,
    private cupomService: CupomService,
    private parceiroService: ParceiroService,
    private router: Router,
    private usuarioService: UsuarioService,
    private alertController: AlertController,
  ) { }

  ngOnInit() {
    this.detectarDispositivo();
    this.carregarCupons();
    this.carregarUsuarioLogado();
  }

  // Aplica busca se houver query param na inicialização
  private aplicarBusca() {
    const urlParams = new URLSearchParams(window.location.search);
    const termo = urlParams.get('busca');
    if (termo && termo.trim()) {
      this.termoBusca = termo.trim();
    }
  }

  // Busca cupons pelo termo
  private buscarCupons(termo: string) {
    this.termoBusca = termo;
    this.indiceAtual = 0;
    this.aplicarFiltros();
  }

  carregarUsuarioLogado() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    if (usuarioLogado) {
      this.usuario = JSON.parse(usuarioLogado);
    } else {
      console.error('Nenhum usuário logado encontrado.');
      this.usuario = null;
    }
    console.log('Usuário logado:', this.usuario);
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.detectarDispositivo();
    this.ajustarCuponsPorSlide();
  }

  detectarDispositivo() {
    this.isMobile = window.innerWidth < 768;
    this.ajustarCuponsPorSlide();
  }

  ajustarCuponsPorSlide() {
    if (window.innerWidth >= 1200) {
      this.cuponsPorSlide = 4;
    } else if (window.innerWidth >= 992) {
      this.cuponsPorSlide = 3;
    } else if (window.innerWidth >= 768) {
      this.cuponsPorSlide = 2;
    } else {
      this.cuponsPorSlide = 1;
    }
  }

  anteriorCupom() {
    if (this.indiceAtual > 0) {
      this.indiceAtual--;
    }
  }

  proximoCupom() {
    const totalCupons = this.filtrarCupons().length;
    const maxIndice = Math.max(0, totalCupons - this.cuponsPorSlide);

    if (this.indiceAtual < maxIndice) {
      this.indiceAtual++;
    }
  }

  irParaCupom(indice: number) {
    this.indiceAtual = indice;
  }

  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    if (event.key === 'ArrowLeft') {
      this.anteriorCupom();
    } else if (event.key === 'ArrowRight') {
      this.proximoCupom();
    }
  }

  expandirCupom(cupom: Cupom) {
    this.router.navigate(['/cupom', cupom.id]);
  }

  fecharCupomExpandido() {
    this.cupomExpandido = null;
  }

  getPrimeiroNome(nomeCompleto: string): string {
    if (!nomeCompleto) return '';
    return nomeCompleto.split(' ')[0];
  }

  listarCuponsPorParceiro(idParceiro: string): void {
    if (!idParceiro) {
      console.warn('ID do parceiro não é válido:', idParceiro);
      return;
    }

    this.cupomService.listarCuponsPorParceiro(idParceiro).subscribe(
      (ofertasParceiro: any[]) => {
        console.log('Ofertas do parceiro:', ofertasParceiro);

        ofertasParceiro.forEach((oferta) => {
          if (oferta.idOfertaParceiro) {
            console.log('Buscando cupons para a oferta com ID do parceiro:', oferta.idOfertaParceiro);
            this.listarCuponsDetalhados(oferta.idOfertaParceiro);
          }
        });
      },
      (error: HttpErrorResponse) => {
        console.error('Erro ao listar cupons por parceiro:', error);
      }
    );
  }

  listarCuponsDetalhados(idOfertaParceiro: string): void {
    if (!idOfertaParceiro) {
      console.warn('ID da oferta do parceiro não é válido:', idOfertaParceiro);
      return;
    }

    console.log('Chamando listarCupomOfertaParceiro com ID do parceiro:', idOfertaParceiro);
    this.cupomService.listarCupomOfertaParceiro(idOfertaParceiro).subscribe(
      (cuponsDetalhados: any[]) => {
        console.log('Cupons detalhados retornados para a oferta:', idOfertaParceiro, cuponsDetalhados);

        cuponsDetalhados.forEach(cupom => {
          const dataAtual = new Date();
          if (cupom.ofertaParceiro) {
            console.log('Detalhes da oferta:', cupom.ofertaParceiro);
          }

          if (cupom.utilizado === undefined) {
            cupom.utilizado = false;
          }

          if (cupom.ofertaParceiro?.validade) {
            const validade = new Date(cupom.ofertaParceiro.validade);
            if (validade < dataAtual) {
              cupom.status = 'Indisponíveis';
            } else {
              cupom.status = cupom.utilizado ? 'Utilizados' : 'Gerados';
            }
          } else {
            cupom.status = cupom.utilizado ? 'Utilizados' : 'Gerados';
          }
        });

        this.cupoms = [...this.cupoms, ...cuponsDetalhados];
        this.cuponsOriginais = [...this.cupoms];
        this.atualizarCategorias();

        this.aplicarBusca();
        this.aplicarFiltros();
      },
      (error: HttpErrorResponse) => {
        console.error('Erro ao listar cupons detalhados:', error);
      }
    );
  }

  obterCliente() {
    this.clienteService.obterClientePorUsuario(this.usuario.Id).subscribe(
      (cliente) => {
        if (cliente && cliente.id) {
          this.idCliente = cliente.id;
          this.obterListaCupom();
          console.log('ID do cliente obtido:', this.idCliente);
        } else {
          console.warn('Cliente não encontrado ou inválido.');
        }
      },
      (error) => {
        console.error('Erro ao obter cliente:', error);
      }
    );
  }

  obterParceiroEListarCupons(idUsuario: string): void {
    this.parceiroService.buscarParceiroPorUsuario(idUsuario).subscribe(
      (parceiro: any) => {
        console.log('Parceiro retornado pela API:', parceiro);

        if (parceiro && parceiro.idParceiro) {
          const idParceiro = parceiro.idParceiro;
          this.idParceiro = idParceiro;
          console.log('ID do parceiro:', idParceiro);
          this.listarCuponsPorParceiro(idParceiro);
        } else {
          console.warn('Parceiro não possui um ID válido:', parceiro);
          console.log('Tentando buscar cliente...');
          this.obterCliente();
        }
      },
      (error: HttpErrorResponse) => {
        console.error('Erro ao obter parceiro:', error);
        console.log('Erro ao buscar parceiro, tentando buscar cliente...');
        this.obterCliente();
      }
    );
  }

  obterListaCupom() {
    if (!this.idCliente) {
      console.warn('ID do cliente não está definido.');
      return;
    }

    this.cupomService.listarCupoms(this.idCliente).subscribe(
      (cupoms) => {
        this.cupoms = cupoms || [];
        this.cuponsOriginais = [...this.cupoms];
        this.atualizarCategorias();

        this.aplicarBusca();
        this.indiceAtual = 0;
        this.aplicarFiltros();

        console.log('Lista de cupons:', this.cupoms);
      },
      (error) => {
        console.error('Erro ao obter lista de cupons:', error);
      }
    );
  }

  carregarCupons(): void {
    const usuarioLogado = this.usuarioService.getUsuarioLogado();
    const idUsuario = obterIdUsuario(usuarioLogado);
    if (!usuarioLogado || !idUsuario) {
      console.error('Usuário não logado ou ID não encontrado.');
      return;
    }
    this.usuario = usuarioLogado;
    if (isUsuarioParceiroComercial(usuarioLogado)) {
      this.obterParceiroEListarCupons(idUsuario);
    } else {
      this.obterCliente();
    }
  }

  pesquisarPorCategoria(): void {
    if (this.categoriaPesquisa && this.categoriaPesquisa !== 'Todos') {
      this.mensagemCategoriaPorPesquisa = `Resultados para "${this.categoriaPesquisa}"`;
    } else {
      this.mensagemCategoriaPorPesquisa = '';
    }
    this.indiceAtual = 0;
    this.aplicarFiltros();
  }

  limparBusca(): void {
    this.categoriaPesquisa = 'Todos';
    this.mensagemCategoriaPorPesquisa = '';
    this.indiceAtual = 0;
    this.aplicarFiltros();
  }

  atualizarCategorias() {
    const categoriasSet = new Set<string>();
    this.cuponsOriginais.forEach(cupom => {
      if (cupom.ofertaParceiro?.categoria) {
        categoriasSet.add(cupom.ofertaParceiro.categoria);
      }
    });
    this.categorias = ['Todos', ...Array.from(categoriasSet)];
  }

  mudarAba(aba: string): void {
    this.abaAtiva = aba;
    this.filtroStatus = aba;
    this.indiceAtual = 0;
    this.aplicarFiltros();
  }

  formatarPreco(preco: number | string | null | undefined): string {
    return formatCurrencyBRL(preco);
  }

  private parseNumero(valor: number | string | null | undefined): number {
    if (valor === null || valor === undefined) return 0;
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;

    const texto = valor.toString().trim();
    if (!texto) return 0;

    const cleaned = texto.replace(/R\$/gi, '').replace(/\s/g, '');
    if (!cleaned) return 0;

    const commaIndex = cleaned.lastIndexOf(',');
    const dotIndex = cleaned.lastIndexOf('.');

    let normalized = cleaned;
    if (commaIndex > dotIndex) {
      normalized = normalized.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = normalized.replace(/,/g, '');
    }

    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  formatarPorcentagem(desconto: number | string | null | undefined): string {
    const d = this.parseNumero(desconto);
    if (!Number.isFinite(d)) return '0%';

    if (Number.isInteger(d)) return `${d}%`;
    return `${d.toFixed(2).replace(/\.?0+$/, '').replace('.', ',')}%`;
  }

  calcularPrecoComDesconto(
    preco: number | string | null | undefined,
    desconto: number | string | null | undefined
  ): number {
    const p = this.parseNumero(preco);
    const d = this.parseNumero(desconto);

    if (!p || !d) return p;

    return p - (p * (d / 100));
  }

  gerarId(id: string): string {
    if (!id) return '';
    return id.substring(0, 8).toUpperCase();
  }

  cupomValidado(cupom: Cupom): boolean {
    return !!cupom?.dataUtilizacao;
  }

  async abrirModalConfirmacaoCliente(cupom: Cupom, event?: Event): Promise<void> {
    event?.stopPropagation();

    const nomeParceiro = cupom?.ofertaParceiro?.idParceiroNavigation?.nome || 'Parceiro comercial';
    const dataUtilizacao = cupom?.dataUtilizacao
      ? new Date(cupom.dataUtilizacao).toLocaleDateString('pt-BR')
      : 'Data não informada';

    const alert = await this.alertController.create({
      header: 'Cupom validado',
      message: `Seu cupom ${this.gerarId(cupom.id)} foi validado em ${dataUtilizacao} por ${nomeParceiro}.`,
      buttons: ['OK'],
    });

    await alert.present();
  }

  classificarCupom(cupom: Cupom): string {
    const dataAtual = new Date();
    const validade = new Date(cupom.ofertaParceiro.validade);

    if (cupom.dataUtilizacao && dataAtual < validade) {
        return 'Utilizados';
    }

    if (cupom.ofertaParceiro?.validade) {
      if (validade < dataAtual) {
        return 'Indisponíveis';
      }
    }

    return 'Gerados';
  }

  // =========================================================================
  // LÓGICA CENTRALIZADA DE FILTROS E CONTADORES
  // =========================================================================

  aplicarFiltros() {
    let lista = [...this.cuponsOriginais];

    // 1. Filtro de Busca de Texto
    if (this.termoBusca && this.termoBusca.length >= 2) {
      const termoLower = this.termoBusca.toLowerCase();
      lista = lista.filter(cupom => {
        const nomeProduto = (cupom.ofertaParceiro?.nomeProduto || '').toLowerCase();
        const descricao = (cupom.ofertaParceiro?.descricao || '').toLowerCase();
        const categoria = (cupom.ofertaParceiro?.categoria || '').toLowerCase();
        const codigo = (cupom.id || '').toLowerCase();

        return nomeProduto.includes(termoLower) ||
               descricao.includes(termoLower) ||
               categoria.includes(termoLower) ||
               codigo.includes(termoLower);
      });
    }

    // 2. Filtro de Categoria do Select
    if (this.categoriaPesquisa && this.categoriaPesquisa !== 'Todos') {
      lista = lista.filter(cupom =>
        cupom.ofertaParceiro?.categoria?.toLowerCase().includes(this.categoriaPesquisa.toLowerCase())
      );
    }

    // 3. Atualizar Contadores das Abas ANTES de filtrar pelo status
    this.totalCupons = lista.length;
    this.cuponsAtivos = lista.filter(cupom => this.classificarCupom(cupom) === 'Gerados').length;
    this.cuponsUsados = lista.filter(cupom => this.classificarCupom(cupom) === 'Utilizados').length;
    this.cuponsExpirados = lista.filter(cupom => this.classificarCupom(cupom) === 'Indisponíveis').length;

    // 4. Filtro de Status das Abas (Ativos, Usados, Expirados)
    if (this.filtroStatus) {
      lista = lista.filter(cupom => this.classificarCupom(cupom) === this.filtroStatus);
    }

    // 5. Filtros Extras (mantidos da sua base)
    if (this.filtroUsuario) {
      lista = lista.filter(cupom =>
        this.usuario?.nome?.toLowerCase().includes(this.filtroUsuario.toLowerCase())
      );
    }
    if (this.filtroTipo) {
      lista = lista.filter(cupom => cupom.ofertaParceiro?.categoria === this.filtroTipo);
    }

    this.cuponsProcessados = lista;

    const currentQtd = this.cuponsProcessados.length;
    const nomeAba = this.abaAtiva === 'Gerados' ? 'ativos' : this.abaAtiva === 'Utilizados' ? 'usados' : 'expirados';
    this.textoDescritivo = `Mostrando ${currentQtd} ${currentQtd === 1 ? 'cupom' : 'cupons'} ${nomeAba}`;
  }

  filtrarCupons(): Cupom[] {
    return this.cuponsProcessados;
  }

  redirecionarRelatorioCupom(){
    this.router.navigate(['/cupons/relatorio-cupom']);
  }
}
