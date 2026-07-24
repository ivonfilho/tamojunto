import { Component, OnInit } from '@angular/core';
import { LoadingController } from '@ionic/angular';
import { OfertaService } from '../services/oferta.service';
import { Oferta } from '../ofertas/oferta.model';
import { Router, ActivatedRoute } from '@angular/router';
import { ParceiroService } from '../services/parceiro.service';
import { HttpErrorResponse } from '@angular/common/http';
import { formatCurrencyBRL } from '../utils/currency.util';
import { ofertaExpirada } from '../utils/oferta-validade.util';

@Component({
  selector: 'app-ofertas',
  templateUrl: './ofertas.page.html',
  styleUrls: ['./ofertas.page.scss'],
})
export class OfertasPage implements OnInit {
  ofertas: any[] = [];
  ofertasFiltradas:any;
  usuario: any = null;
  tipoFiltro: string = 'todas';
  parceiro: any = null;
  

  constructor(
    private ofertaService: OfertaService,
    private router: Router,
    private route: ActivatedRoute,
    private loadingCtrl: LoadingController,
    private parceiroService: ParceiroService,
  ) {}

  ngOnInit() {
    this.carregarUsuarioLogado();
  }

  // Hook do Ionic que é executado sempre que a página é acessada
  ionViewWillEnter() {
    console.log('[OfertasPage] ionViewWillEnter - Recarregando dados...');
    this.carregarDados();
    this.aplicarBusca();
  }

  // Aplica busca se houver query param
  private aplicarBusca() {
    this.route.queryParams.subscribe(params => {
      const termoBusca = params['busca'];
      if (termoBusca && termoBusca.trim()) {
        this.buscarOfertas(termoBusca.trim());
      }
    });
  }

  // Busca ofertas pelo termo
  private buscarOfertas(termo: string) {
    if (!termo || termo.length < 2) {
      this.ofertasFiltradas = [...this.ofertas];
      return;
    }

    const termoLower = termo.toLowerCase();
    this.ofertasFiltradas = this.ofertas.filter(oferta => {
      const nomeProduto = (oferta.nomeProduto || '').toLowerCase();
      const descricao = (oferta.descricao || '').toLowerCase();
      const categoria = (oferta.categoria || '').toLowerCase();
      
      return nomeProduto.includes(termoLower) || 
             descricao.includes(termoLower) || 
             categoria.includes(termoLower);
    });
  }

  // Calcular valor final com desconto
  calcularValorFinal(oferta: any): number {
    if (!oferta.preco || !oferta.desconto) return oferta.preco || 0;
    return oferta.preco - (oferta.preco * oferta.desconto / 100);
  }

  // Formatar valor para exibição
  formatarValor(valor: number): string {
    return formatCurrencyBRL(valor);
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
    const loading = await this.exibirLoading('Carregando ofertas...');
    
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
              if (termoBusca && termoBusca.trim()) {
                this.buscarOfertas(termoBusca.trim());
              }
            });
            loading.dismiss();
          },
          error: (error) => {
            console.error('Erro ao carregar ofertas do parceiro:', error);
            this.ofertas = [];
            this.ofertasFiltradas = [];
            loading.dismiss();
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
              if (termoBusca && termoBusca.trim()) {
                this.buscarOfertas(termoBusca.trim());
              }
            });
            loading.dismiss();
          },
          error: (error) => {
            console.error('Erro ao carregar ofertas:', error);
            this.ofertas = [];
            this.ofertasFiltradas = [];
            loading.dismiss();
          }
        });
      }
    } catch (error) {
      console.error('Erro ao carregar ofertas:', error);
      this.ofertas = [];
      this.ofertasFiltradas = [];
      loading.dismiss();
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

  async aplicarFiltro(tipo: string) {
    const loading = await this.exibirLoading('Aplicando filtro...');
    try {
      this.tipoFiltro = tipo;
      if (tipo === 'normal') {
        this.ofertasFiltradas = this.ofertas.filter(oferta => oferta.tipoOferta.toLowerCase() === 'normal');
      } else if (tipo === 'relampago') {
        this.ofertasFiltradas = this.ofertas.filter(oferta => oferta.tipoOferta?.toLowerCase() === 'relampago');
      } else {
        this.ofertasFiltradas = [...this.ofertas];
      }
      console.log('Ofertas filtradas:', this.ofertasFiltradas);
    } finally {
      loading.dismiss();
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
      loading.dismiss();
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
        loading.dismiss();
      }
    );
  }
  
  private aplicarFiltroAtual(): void {
    const status = this.tipoFiltro || 'todas';
    this.ofertasFiltradas = this.ofertas.filter((oferta) => {
      const expirada = ofertaExpirada(oferta);
      const ativa = oferta.status === true && !expirada;

      if (status === 'ativa') {
        return ativa;
      }
      if (status === 'expirada') {
        return expirada;
      }
      if (status === 'inativa') {
        return oferta.status === false && !expirada;
      }

      return true;
    });
  }

  async aplicarFiltroStatus(status: string = 'todas') {
    this.tipoFiltro = status;
    const loading = await this.exibirLoading('Aplicando filtro...');
    try {
      this.aplicarFiltroAtual();
      console.log('Ofertas filtradas:', this.ofertasFiltradas);
    } finally {
      loading.dismiss();
    }
  }  
    
}
