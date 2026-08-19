import { Component, OnInit } from '@angular/core';
import { OfertaService } from '../../services/oferta.service';
import { ClienteService } from '../../services/cliente.service';
import { CupomService } from 'src/app/services/cupom.service';
import { Oferta, resgatarOferta } from '../../ofertas/oferta.model';
import { ActivatedRoute, Router } from '@angular/router';
import { Share } from '@capacitor/share';
import { ApiConfig } from '../../services/api/api.config';
import { formatCurrencyBRL } from '../../utils/currency.util';
import { ofertaDisponivel, ofertaExpirada, ofertaStatusAtivo } from '../../utils/oferta-validade.util';

@Component({
  selector: 'app-ofertas',
  templateUrl: './visualizar-ofertas.page.html',
  styleUrls: ['./visualizar-ofertas.page.scss'],
})
export class VisualizarOfertasPage implements OnInit {
  oferta: any = null;
  usuario: any;
  idCliente: string | null = null;
  showToast: boolean = false;
  toastMessage: string = "";
  toastColor: string = "";
  isParceiro: boolean = false; // Nova propriedade para identificar parceiros

  constructor(
    private ofertaService: OfertaService,
    private router: Router,
    private route: ActivatedRoute,
    private apiConfig: ApiConfig,
    private clienteService: ClienteService,
    private cupomService: CupomService
  ) { }

  ngOnInit() {
    this.carregarUsuarioLogado();
    this.obterCliente();
  }

  ionViewWillEnter() {
    this.carregarOferta();
  }

  carregarOferta() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.oferta = null;
      return;
    }
    // Preferir detalhe fresco (status/validade após reativar a oferta). Listar pode vir em cache.
    this.ofertaService.obterOfertaPorId(id).subscribe({
      next: (data: any) => {
        this.oferta = this.normalizarOferta(data);
      },
      error: () => {
        this.ofertaService.listarOfertas().subscribe(
          (data: Oferta[]) => {
            const encontrada = data.find((o) => o.id === id) || null;
            this.oferta = encontrada ? this.normalizarOferta(encontrada) : null;
          },
          (err) => console.error('Erro ao carregar ofertas', err)
        );
      },
    });
  }

  carregarUsuarioLogado() {
    const usuarioLogado = localStorage.getItem('usuarioLogado');
    console.log('usuarioLogado do localStorage:', usuarioLogado);
    this.usuario = usuarioLogado ? JSON.parse(usuarioLogado) : null;
    console.log('Usuário logado atribuído:', this.usuario);
    
    // Verificar se o usuário é parceiro
    this.isParceiro = this.usuario?.role === 'Parceiro';
    console.log('Usuário é parceiro:', this.isParceiro);
  }

  private normalizarOferta(data: any): any {
    if (!data) return null;
    const oferta = { ...data };
    oferta.status = oferta.status ?? oferta.Status;
    oferta.validade = oferta.validade ?? oferta.Validade;
    oferta.preco = Number(oferta.preco ?? oferta.Preco);
    oferta.desconto = Number(oferta.desconto ?? oferta.Desconto);
    return oferta;
  }

  ofertaExpirada(): boolean {
    return ofertaExpirada(this.oferta);
  }

  ofertaDisponivel(): boolean {
    return ofertaDisponivel(this.oferta);
  }

  ofertaInativa(): boolean {
    return !ofertaStatusAtivo(this.oferta);
  }

  formatarPreco(valor: number): string {
    if (!valor && valor !== 0) return formatCurrencyBRL(0);
    return formatCurrencyBRL(valor);
  }

  calcularPrecoComDesconto(): number {
    if (!this.oferta?.preco || !this.oferta?.desconto) return 0;
    return this.oferta.preco - (this.oferta.preco * (this.oferta.desconto / 100));
  }

  share(oferta: any) {
    // Verificar se a oferta está expirada
    if (this.ofertaExpirada()) {
      this.toastMessage = "Não é possível compartilhar uma oferta expirada!";
      this.toastColor = "warning";
      this.showToast = true;
      return;
    }

    var texto = `Dá uma olhada, ${oferta.nomeProduto} - ${oferta.descricao}`;
    // Usar URL de produção configurada
    var link = `${this.apiConfig.FRONTEND_URL}/#/oferta/${oferta.id}`;
    Share.share({
      title: 'Dá uma olhada nessa publicação',
      text: texto,
      url: link,
      dialogTitle: 'Compartilhe com seus amigos e acumule pontos',
    })
      .then((arg: any) => {})
      .catch((error: any) => {
        console.error('Erro ao compartilhar:', error);
        this.toastMessage = "Erro ao compartilhar. Tente novamente.";
        this.toastColor = "danger";
        this.showToast = true;
      });
  }

  async compartilharOferta(oferta: Oferta) {
    // Verificar se a oferta está expirada
    if (this.ofertaExpirada()) {
      this.toastMessage = "Não é possível compartilhar uma oferta expirada!";
      this.toastColor = "warning";
      this.showToast = true;
      return;
    }

    // Se for web, mostrar opções de compartilhamento
    if (this.isWebPlatform()) {
      this.mostrarOpcoesCompartilhamento(oferta);
      return;
    }

    // Para mobile, usar o compartilhamento nativo
    try {
      // Usar URL de produção configurada
      const urlOferta = `${this.apiConfig.FRONTEND_URL}/#/oferta/${oferta.id}`;

      await Share.share({
        title: 'Confira esta oferta!',
        text: `${oferta.nomeProduto} - ${oferta.descricao}`,
        url: urlOferta,
        dialogTitle: 'Compartilhar Oferta'
      });
    } catch (error) {
      console.error('Erro ao compartilhar oferta', error);
      this.toastMessage = "Erro ao compartilhar a oferta. Tente novamente.";
      this.toastColor = "danger";
      this.showToast = true;
    }
  }

  mostrarOpcoesCompartilhamento(oferta: Oferta) {
    // Criar um modal simples com opções de compartilhamento
    const modal = document.createElement('div');
    modal.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 10000;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 24px;
      max-width: 400px;
      width: 90%;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    `;

    content.innerHTML = `
      <h3 style="margin: 0 0 16px 0; color: #333;">Compartilhar Oferta</h3>
      <p style="margin: 0 0 24px 0; color: #666;">Escolha como deseja compartilhar:</p>
      <div style="display: flex; flex-direction: column; gap: 12px;">
        <button id="whatsapp-btn" style="
          background: #25d366;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <span style="font-size: 20px;">📱</span>
          WhatsApp web
        </button>
        <button id="native-share-btn" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <span style="font-size: 20px;">🔗</span>
          Compartilhamento pelo app
        </button>
        <button id="copy-link-btn" style="
          background: #6c757d;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        ">
          <span style="font-size: 20px;">📋</span>
          Copiar Link
        </button>
        <button id="close-modal-btn" style="
          background: #dc3545;
          color: white;
          border: none;
          padding: 12px 24px;
          border-radius: 8px;
          font-size: 16px;
          cursor: pointer;
        ">
          Cancelar
        </button>
      </div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    // Event listeners
    content.querySelector('#whatsapp-btn')?.addEventListener('click', () => {
      this.compartilharWhatsApp(oferta);
      document.body.removeChild(modal);
    });

    content.querySelector('#native-share-btn')?.addEventListener('click', async () => {
      try {
        const urlOferta = `${this.apiConfig.FRONTEND_URL}/#/oferta/${oferta.id}`;
        await Share.share({
          title: 'Confira esta oferta!',
          text: `${oferta.nomeProduto} - ${oferta.descricao}`,
          url: urlOferta,
          dialogTitle: 'Compartilhar Oferta'
        });
      } catch (error) {
        console.error('Erro ao compartilhar:', error);
        this.toastMessage = "Erro ao compartilhar. Tente novamente.";
        this.toastColor = "danger";
        this.showToast = true;
      }
      document.body.removeChild(modal);
    });

    content.querySelector('#copy-link-btn')?.addEventListener('click', () => {
      const urlOferta = `${this.apiConfig.FRONTEND_URL}/#/oferta/${oferta.id}`;
      navigator.clipboard.writeText(urlOferta).then(() => {
        this.toastMessage = "Link copiado para a área de transferência!";
        this.toastColor = "success";
        this.showToast = true;
      }).catch(() => {
        this.toastMessage = "Erro ao copiar link.";
        this.toastColor = "danger";
        this.showToast = true;
      });
      document.body.removeChild(modal);
    });

    content.querySelector('#close-modal-btn')?.addEventListener('click', () => {
      document.body.removeChild(modal);
    });

    // Fechar ao clicar fora do modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        document.body.removeChild(modal);
      }
    });
  }

  compartilharWhatsApp(oferta: Oferta) {
    // Verificar se a oferta está expirada
    if (this.ofertaExpirada()) {
      this.toastMessage = "Não é possível compartilhar uma oferta expirada!";
      this.toastColor = "warning";
      this.showToast = true;
      return;
    }

    try {
      // Usar URL de produção configurada
      const urlOferta = `${this.apiConfig.FRONTEND_URL}/#/oferta/${oferta.id}`;
      
      // Criar mensagem para WhatsApp
      const mensagem = `Confira esta oferta incrível! 🎉\n\n${oferta.nomeProduto}\n${oferta.descricao}\n\nAcesse: ${urlOferta}`;
      
      // URL do WhatsApp Web/App
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(mensagem)}`;
      
      // Abrir WhatsApp em nova aba
      window.open(whatsappUrl, '_blank');
      
      this.toastMessage = "Abrindo WhatsApp para compartilhar...";
      this.toastColor = "success";
      this.showToast = true;
    } catch (error) {
      console.error('Erro ao compartilhar no WhatsApp', error);
      this.toastMessage = "Erro ao abrir WhatsApp. Tente novamente.";
      this.toastColor = "danger";
      this.showToast = true;
    }
  }

  isWebPlatform(): boolean {
    return !!(window as any).Capacitor && (window as any).Capacitor.isNativePlatform() === false;
  }

  obterCliente() {
    this.clienteService.obterClientePorUsuario(this.usuario.Id).subscribe(
      (cliente) => {
        this.idCliente = cliente.id;
        console.log('ID do cliente obtido:', this.idCliente);
      },
      (error) => {
        console.error('Erro ao obter cliente:', error);
      }
    );
  }

  resgatarOferta(IdOfertaParceiro: string) {
    if (!this.idCliente) {
      this.toastMessage = "Erro ao resgatar a oferta: ID do cliente não encontrado!";
      this.toastColor = "danger";
      this.showToast = true
      console.error('ID do cliente não encontrado!');
      return;
    }

    const ofertaResgate: resgatarOferta = {
      IdOfertaParceiro: IdOfertaParceiro,
      IdCliente: this.idCliente
    };

    this.cupomService.resgatarOferta(ofertaResgate).subscribe({
      next: (response) => {
        const idCupom = String(response?.id ?? (response as any)?.Id ?? '').trim();
        const falhou = response?.success === false || !idCupom;

        if (falhou) {
          const msg =
            response?.message ||
            (typeof response === 'string' ? response : null) ||
            'Não foi possível resgatar a oferta.';
          this.toastMessage = msg;
          this.toastColor = 'danger';
          this.showToast = true;
          return;
        }

        console.log('Oferta resgatada com sucesso!', response);
        this.toastMessage =
          (response as any)?.reused && (response as any)?.message
            ? String((response as any).message)
            : 'Oferta resgatada com sucesso!';
        this.toastColor = 'success';
        this.showToast = true;
        setTimeout(() => {
          this.resetToast();
          this.router.navigate(['/cupom', idCupom]);
        }, 800);
      },
      error: (error) => {
        console.error('Erro ao resgatar a oferta:', error);
        const apiMsg = error?.error?.message ?? error?.error;
        this.toastMessage =
          typeof apiMsg === 'string' && apiMsg.trim()
            ? apiMsg
            : 'Erro: A oferta já foi resgatada ou não está disponível.';
        this.toastColor = 'danger';
        this.showToast = true;
      },
    });
  }

  resetToast(): void {
    this.showToast = false;
    this.toastMessage = '';
  }

  voltarParaListarOfertas(){
      this.router.navigate(['/ofertas'])
  }}
