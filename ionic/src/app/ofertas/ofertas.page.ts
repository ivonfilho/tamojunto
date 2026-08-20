import { Component, OnInit, ViewChild } from '@angular/core';
import { LoadingController, IonContent } from '@ionic/angular';
import { OfertaService } from '../services/oferta.service';
import { Oferta } from '../ofertas/oferta.model';
import { Router, ActivatedRoute } from '@angular/router';
import { ParceiroService } from '../services/parceiro.service';
import { HttpErrorResponse } from '@angular/common/http';
import { formatCurrencyBRL } from '../utils/currency.util';
import { ofertaExpirada } from '../utils/oferta-validade.util';
import { CATEGORIAS_OFERTA } from '../utils/constants';

@Component({
  selector: 'app-ofertas',
  templateUrl: './ofertas.page.html',
  styleUrls: ['./ofertas.page.scss'],
})
export class OfertasPage implements OnInit {
  @ViewChild(IonContent, { static: false }) content!: IonContent;
  ofertas: any[] = [];
  ofertasFiltradas:any;
  usuario: any = null;
  tipoFiltro: string = 'todas';
  parceiro: any = null;
  termoBuscaParams: string = '';
  termoAtivo: string = '';
  categoriaSelecionada: string = '';
  categorias = CATEGORIAS_OFERTA;
  tipoFiltroTipo: string = '';
  filtroTipo: string = '';

  // Contadores convertidos para variáveis (atualizados dinamicamente na filtragem)
  totalOfertas: number = 0;
  ofertasAtivas: number = 0;
  ofertasInativas: number = 0;
  ofertasExpiradas: number = 0;

  constructor(
    private ofertaService: OfertaService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private parceiroService: ParceiroService,
  ) {}

  ngOnInit() {
    this.carregarUsuarioLogado();
    window.addEventListener('resetFilters', () => {
      this.limparBusca();
    });
  }

  // Hook do Ionic que é executado sempre que a página é acessada
  ionViewWillEnter() {
    console.log('[OfertasPage] ionViewWillEnter - Recarregando dados...');
    this.carregarDados();
    this.aplicarBusca();
  }

  voltarParaDashboard() {
    // Correção: Agora o redirecionamento olha para a prova real.
    // Só vai para o dashboard-parceiro se a API confirmou que ele é um parceiro válido.
    if (this.parceiro && this.parceiro.idParceiro) {
      this.router.navigate(['/dashboard-parceiro']);
    } else {
      // Qualquer outro usuário (sem tipo, cliente normal, etc) vai para o dashboard padrão
      this.router.navigate(['/dashboard']);
    }
  }

  // Aplica busca se houver query param
  private aplicarBusca() {
    this.route.queryParams.subscribe(params => {
      const termoBusca = params['busca'];
      const categoria = params['categoria'];
      let mudou = false;
      
      if (termoBusca && termoBusca.trim()) {
        this.termoAtivo = termoBusca.trim();
        mudou = true;
      } else {
        this.termoAtivo = '';
      }

      if (categoria && categoria.trim()) {
        const slug = categoria.trim();
        const matched = this.categorias.find(c => this.toSlug(c) === slug);
        this.categoriaSelecionada = matched || slug;
        mudou = true;
      }
      
      if (mudou) {
        this.aplicarFiltros();
      } else {
        this.aplicarFiltros();
      }
    });
  }

  // Busca ofertas pelo termo
  private buscarOfertas(termo: string) {
    this.termoAtivo = termo;
    this.aplicarFiltros();
  }

  // Calcular valor final com desconto
  calcularValorFinal(oferta: any): number {
    if (!oferta.preco || !oferta.desconto) return oferta.preco || 0;
    return oferta.preco - (oferta.preco * oferta.desconto / 100);
  }

  toSlug(text: string): string {
    if (!text) return '';
    return text.toString().normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim().replace(/[^a-z0-9 ]/g, '').replace(/\s+/g, '-');
  }

  // Formatar valor para exibição
  formatarValor(valor: number): string {
    return formatCurrencyBRL(valor);
  }

  limparBusca() {
    this.termoAtivo = '';
    this.categoriaSelecionada = '';
    this.filtroTipo = '';
    this.tipoFiltroTipo = '';
    this.tipoFiltro = 'todas';
    this.router.navigate(['/ofertas']);
    this.aplicarFiltros();
    if (this.content) {
      this.content.scrollToTop(500);
    }
  }

  // Método centralizado para carregar todos os dados necessários
  private carregarDados() {
    if (this.usuario && this.usuario.Id) {
      this.buscarParceiroPorUsuario(this.usuario.Id);
    } else {
      // Se não há usuário, carregar todas as ofertas (para clientes)
      this.carregarOfertas();
    }
  }

  buscarParceiroPorUsuario(idUsuario: string) {
    this.parceiroService.buscarParceiroPorUsuario(idUsuario).subscribe(
      (parceiro: any) => {
        if (parceiro && parceiro.idParceiro) {
          this.parceiro = parceiro;
          console.log('Usuário é parceiro:', this.parceiro);
        } else {
          console.warn('Usuário não é parceiro:', parceiro);
          this.parceiro = null;
        }
        // Carregar ofertas após verificar se é parceiro
        this.carregarOfertas();
      },
      (error: HttpErrorResponse) => {
        console.error('Erro ao buscar parceiro:', error);
        this.parceiro = null;
        // Carregar ofertas mesmo se der erro na busca de parceiro
        this.carregarOfertas();
      }
    );
  }

  async carregarOfertas() {
    let loading: any = null;
    
    if (!this.ofertas || this.ofertas.length === 0) {
      loading = await this.exibirLoading('Carregando ofertas...');
    }

    try {
      // Verificar se o usuário é parceiro
      if (this.parceiro && this.parceiro.idParceiro) {
        console.log('Usuário é parceiro, carregando ofertas do parceiro:', this.parceiro.idParceiro);
        this.ofertaService.listarOfertasPorParceiro(this.parceiro.idParceiro).subscribe({
          next: (data: Oferta[]) => {
            this.ofertas = data || [];
            this.aplicarFiltroAtual();
            console.log('Ofertas do parceiro carregadas:', this.ofertas.length);
            console.log('Estrutura da primeira oferta:', this.ofertas[0]);

            // Log específico para foto de perfil
            if (this.ofertas[0]?.idParceiroNavigation) {
              console.log('[OfertasPage] idParceiroNavigation:', this.ofertas[0].idParceiroNavigation);
              console.log('[OfertasPage] fotoPerfil:', this.ofertas[0].idParceiroNavigation.fotoPerfil);
              console.log('[OfertasPage] FotoPerfil:', this.ofertas[0].idParceiroNavigation.FotoPerfil);
              console.log('[OfertasPage] Todas as propriedades:', Object.keys(this.ofertas[0].idParceiroNavigation));
            }

            if (this.ofertas[0]?.imagem) {
              console.log('Imagens da primeira oferta:', this.ofertas[0].imagem);
              console.log('Quantidade de imagens:', this.ofertas[0].imagem.length);
              if (this.ofertas[0].imagem.length > 0) {
                console.log('Primeira imagem path:', this.ofertas[0].imagem[0].path);
              }
            } else {
              console.log('Primeira oferta não tem propriedade imagem');
              console.log('Propriedades disponíveis:', Object.keys(this.ofertas[0] || {}));
            }
            // Aplicar busca se houver termo na URL
            this.route.queryParams.subscribe(params => {
              const termoBusca = params['busca'];
              const categoria = params['categoria'];
              let mudou = false;
              if (termoBusca && termoBusca.trim()) {
                this.termoAtivo = termoBusca.trim();
                mudou = true;
              }
              if (categoria && categoria.trim()) {
                const slug = categoria.trim();
                const matched = this.categorias.find(c => this.toSlug(c) === slug);
                this.categoriaSelecionada = matched || slug;
                mudou = true;
              }
              if (mudou) {
                this.aplicarFiltros();
              }
            });
            if (loading) loading.dismiss();
          },
          error: (error) => {
            console.error('Erro ao carregar ofertas do parceiro:', error);
            this.ofertas = [];
            this.ofertasFiltradas = [];
            if (loading) loading.dismiss();
          }
        });
      } else {
        console.log('Usuário não é parceiro, carregando todas as ofertas');
        this.ofertaService.listarOfertas().subscribe({
          next: (data: Oferta[]) => {
            this.ofertas = data || [];
            this.aplicarFiltroAtual();

            // Log para debug - verificar se fotoPerfil está sendo retornada
            if (this.ofertas.length > 0) {
              const primeiraOferta = this.ofertas[0];
              console.log('[OfertasPage] Primeira oferta recebida:', {
                id: primeiraOferta.id,
                idParceiroNavigation: primeiraOferta.idParceiroNavigation,
                fotoPerfil: primeiraOferta.idParceiroNavigation?.fotoPerfil,
                FotoPerfil: primeiraOferta.idParceiroNavigation?.FotoPerfil,
                todasPropriedades: Object.keys(primeiraOferta.idParceiroNavigation || {})
              });
            }
            console.log('Todas as ofertas carregadas:', this.ofertas.length);
            console.log('Estrutura da primeira oferta:', this.ofertas[0]);

            // Log específico para foto de perfil
            if (this.ofertas[0]?.idParceiroNavigation) {
              console.log('[OfertasPage] idParceiroNavigation:', this.ofertas[0].idParceiroNavigation);
              console.log('[OfertasPage] fotoPerfil:', this.ofertas[0].idParceiroNavigation.fotoPerfil);
              console.log('[OfertasPage] FotoPerfil:', this.ofertas[0].idParceiroNavigation.FotoPerfil);
              console.log('[OfertasPage] Todas as propriedades:', Object.keys(this.ofertas[0].idParceiroNavigation));
            }

            if (this.ofertas[0]?.imagem) {
              console.log('Imagens da primeira oferta:', this.ofertas[0].imagem);
              console.log('Quantidade de imagens:', this.ofertas[0].imagem.length);
              if (this.ofertas[0].imagem.length > 0) {
                console.log('Primeira imagem path:', this.ofertas[0].imagem[0].path);
              }
            } else {
              console.log('Primeira oferta não tem propriedade imagem');
              console.log('Propriedades disponíveis:', Object.keys(this.ofertas[0] || {}));
            }
            // Aplicar busca se houver termo na URL
            this.route.queryParams.subscribe(params => {
              const termoBusca = params['busca'];
              const categoria = params['categoria'];
              let mudou = false;
              if (termoBusca && termoBusca.trim()) {
                this.termoAtivo = termoBusca.trim();
                mudou = true;
              }
              if (categoria && categoria.trim()) {
                const slug = categoria.trim();
                const matched = this.categorias.find(c => this.toSlug(c) === slug);
                this.categoriaSelecionada = matched || slug;
                mudou = true;
              }
              if (mudou) {
                this.aplicarFiltros();
              }
            });
            if (loading) loading.dismiss();
          },
          error: (error) => {
            console.error('Erro ao carregar ofertas:', error);
            this.ofertas = [];
            this.ofertasFiltradas = [];
            if (loading) loading.dismiss();
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar ofertas:', error);
      this.ofertas = [];
      this.ofertasFiltradas = [];
      if (loading) loading.dismiss();
    }
  }

  // Método para forçar atualização da lista (útil para pull-to-refresh)
  async atualizarLista() {
    console.log('[OfertasPage] Forçando atualização da lista...');
    await this.carregarOfertas();
  }

  // Handler para o pull-to-refresh
  async handleRefresh(event: any) {
    console.log('[OfertasPage] Pull-to-refresh acionado');
    try {
      await this.atualizarLista();
      event.target.complete();
    } catch (error) {
      console.error('[OfertasPage] Erro ao atualizar lista:', error);
      event.target.complete();
    }
  }

  carregarUsuarioLogado() {
    // Tentar diferentes chaves do localStorage para compatibilidade
    let usuarioLogado = localStorage.getItem('tamo_junto_user');

    if (!usuarioLogado) {
      usuarioLogado = localStorage.getItem('usuarioLogado');
    }

    if (usuarioLogado) {
      try {
        this.usuario = JSON.parse(usuarioLogado);
        console.log('Usuário logado carregado:', this.usuario);
      } catch (error) {
        console.error('Erro ao fazer parse do usuário:', error);
        this.usuario = null;
      }
    } else {
      console.warn('Nenhum usuário logado encontrado no localStorage.');
      this.usuario = null;
    }
  }

  verOferta(ofertaId: string | undefined) {
    this.router.navigate(['/oferta', ofertaId]);
  }

  editarOferta(id: string) {
    this.router.navigate([`/editar-oferta/${id}`]);
  }

  async recarregarPagina() {
    const loading = await this.exibirLoading('Redirecionando...');
    this.router.navigate(['/cadastro-oferta']).finally(() => {
      if (loading) loading.dismiss();
    });
  }

  async exibirLoading(mensagem: string = 'Carregando...') {
    const loading = await this.loadingCtrl.create({
      message: mensagem,
      spinner: 'circles',
    });
    await loading.present();
    return loading;
  }

  async alterarStatusOferta(oferta: any, event?: CustomEvent) {
    const ativar = event?.detail?.checked ?? oferta.status !== true;
    const novoStatus = ativar ? 'ativa' : 'inativa';

    const loading = await this.exibirLoading('Atualizando status...');

    this.ofertaService.atualizarStatus(oferta.id, novoStatus).subscribe(
      (response: any) => {
        console.log(`Oferta ${oferta.id} agora está ${novoStatus}`);
        this.carregarOfertas();
      },
      (error) => {
        console.error('Erro ao atualizar status da oferta:', error);
        if (event) {
          oferta.status = !event.detail.checked;
        }
      },
      () => {
        if (loading) loading.dismiss();
      }
    );
  }

  // =========================================================================
  // LOGICA CENTRAL DE FILTROS E CONTADORES
  // =========================================================================

  private aplicarFiltroAtual(): void {
    this.aplicarFiltros();
  }

  async aplicarFiltroStatus(status: string = 'todas') {
    this.tipoFiltro = status;
    const loading = await this.exibirLoading('Aplicando filtro...');
    try {
      this.aplicarFiltros();
      console.log('Ofertas filtradas:', this.ofertasFiltradas);
    } finally {
      if (loading) loading.dismiss();
    }
  }

  async aplicarFiltro(tipo: string) {
    const loading = await this.exibirLoading('Aplicando filtro...');
    try {
      this.filtroTipo = tipo === 'normal' ? 'Normal' : (tipo === 'relampago' ? 'Relâmpago' : '');
      this.aplicarFiltros();
    } finally {
      if (loading) loading.dismiss();
    }
  }

  filtrarPorCategoria(categoria: string) {
    this.categoriaSelecionada = categoria;
    this.termoAtivo = categoria ? categoria : '';
    this.aplicarFiltros();
  }

  filtrarTipoOferta(tipo: string) {
    this.filtroTipo = (this.filtroTipo === tipo) ? '' : tipo;
    this.tipoFiltroTipo = this.filtroTipo; // Sincroniza com a variável usada no HTML
    this.aplicarFiltros();
  }

  private aplicarFiltros() {
    if (!this.ofertas) return;

    let lista = [...this.ofertas];

    // 1. Filtro por Busca de Texto (ignora busca textual generalizada se estiver buscando uma categoria exata)
    if (this.termoAtivo && this.termoAtivo.length >= 2 && !this.categoriaSelecionada) {
      const termoLower = this.termoAtivo.toLowerCase();
      lista = lista.filter(o => {
        return (o.nomeProduto || '').toLowerCase().includes(termoLower) ||
               (o.descricao || '').toLowerCase().includes(termoLower) ||
               (o.categoria || '').toLowerCase().includes(termoLower);
      });
    }

    // 2. Filtro por Categoria Dropdown
    if (this.categoriaSelecionada) {
      lista = lista.filter(o => (o.categoria || '') === this.categoriaSelecionada);
    }

    // 3. Filtro por Tipo de Oferta (Normal ou Relâmpago)
    if (this.filtroTipo) {
      lista = lista.filter(o => {
        const tipoOf = (o.tipoOferta || '').toLowerCase().replace('â', 'a');
        const tipoDesejado = this.filtroTipo.toLowerCase().replace('â', 'a');
        return tipoOf === tipoDesejado;
      });
    }

    // 4. ATUALIZAR CONTADORES ANTES DE APLICAR A ABA
    // Isso garante que os números do HTML reflitam a realidade dos filtros ativos acima
    this.totalOfertas = lista.length;
    this.ofertasAtivas = lista.filter(o => o.status === true && !ofertaExpirada(o)).length;
    this.ofertasInativas = lista.filter(o => o.status === false && !ofertaExpirada(o)).length;
    this.ofertasExpiradas = lista.filter(o => ofertaExpirada(o)).length;

    // 5. Filtro por Status da Aba (Todas, Ativa, Inativa, Expirada)
    if (this.tipoFiltro !== 'todas') {
      lista = lista.filter(o => {
        const expirada = ofertaExpirada(o);
        if (this.tipoFiltro === 'ativa') return o.status === true && !expirada;
        if (this.tipoFiltro === 'inativa') return o.status === false && !expirada;
        if (this.tipoFiltro === 'expirada') return expirada;
        return true;
      });
    }

    this.ofertasFiltradas = lista;
  }

  get textoDescritivo(): string {
    const total = this.ofertasFiltradas ? this.ofertasFiltradas.length : 0;
    
    // Status text based on current tab
    let statusTexto = '';
    if (this.tipoFiltro === 'ativa') statusTexto = ' ativas';
    else if (this.tipoFiltro === 'inativa') statusTexto = ' inativas';
    else if (this.tipoFiltro === 'expirada') statusTexto = ' expiradas';
    else statusTexto = ' cadastradas';

    if (total === 0) {
      return `Poxa, não encontramos nenhuma oferta${statusTexto} com os filtros selecionados.`;
    }

    let texto = `Exibindo ${total} ${total === 1 ? 'oferta' : 'ofertas'}${statusTexto}`;

    const filtrosExtras = [];

    if (this.categoriaSelecionada) {
      filtrosExtras.push(`na categoria "${this.categoriaSelecionada}"`);
    }

    if (this.filtroTipo) {
      filtrosExtras.push(`do tipo ${this.filtroTipo}`);
    }

    if (this.termoAtivo && this.termoAtivo !== this.categoriaSelecionada) {
      filtrosExtras.push(`com o termo "${this.termoAtivo}"`);
    }

    if (filtrosExtras.length > 0) {
      if (filtrosExtras.length === 1) {
        texto += ` ${filtrosExtras[0]}`;
      } else {
        const last = filtrosExtras.pop();
        texto += ` ${filtrosExtras.join(', ')} e ${last}`;
      }
    }

    return texto + '.';
  }
}
