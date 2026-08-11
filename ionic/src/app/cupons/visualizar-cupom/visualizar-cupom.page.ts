import { Component, OnInit, Input } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import { CupomService } from '../../services/cupom.service';
import { VisualizarCupom } from './visualizar-cupom.model';
import { ActivatedRoute, Router } from '@angular/router';
import { formatCurrencyBRL } from '../../utils/currency.util';
import { AlertController } from '@ionic/angular';

@Component({
  selector: 'app-cupons',
  templateUrl: './visualizar-cupom.page.html',
  styleUrls: ['./visualizar-cupom.scss'],
})
export class VisualizarCupomPage implements OnInit {

  cupom: VisualizarCupom | null = null;
  usuario: any;
  idCliente: string | null = null;
  showToast: boolean = false;
  toastMessage: string =  "";
  toastColor: string = "";
  isQrCodeModalOpen: boolean = false;
  isLoading: boolean = true;

  constructor(
    private clienteService: ClienteService,
    private cupomService: CupomService,
    private router: Router,
    private route: ActivatedRoute,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.carregarUsuarioLogado();
    if (this.usuario){
      this.obterCliente();
    }
  }

  carregarUsuarioLogado() {
    const raw =
      localStorage.getItem('tamo_junto_user') || localStorage.getItem('usuarioLogado');
    this.usuario = raw ? JSON.parse(raw) : null;
    console.log('userLogado', this.usuario);
  }

  obterCliente() {
    this.clienteService.obterClientePorUsuario(this.usuario.Id).subscribe(
      (cliente) => {
        this.idCliente = cliente.id;
        this.obterListaCupom()
        console.log('ID do cliente obtido:', this.idCliente);
      },
      (error) => {
        console.error('Erro ao obter cliente:', error);
      }
    );
  }

  obterListaCupom() {
    const id =
      this.route.snapshot.paramMap.get('id') ||
      this.route.parent?.snapshot.paramMap.get('id');
    if (!id || !this.idCliente) {
      console.warn('Cupom ou cliente não identificado para carregar detalhes.');
      return;
    }
    this.cupomService.listarCupoms(this.idCliente).subscribe(
      (cupoms: VisualizarCupom[]) => {
        const idNorm = id.toLowerCase();
        this.cupom =
          cupoms.find((c) => (c.id || '').toLowerCase() === idNorm) || null;
        this.isLoading = false;
      },
      (error) => {
        console.error('error ao obter lista de cupoms', error);
        this.isLoading = false;
      }
    )
  }


  formatarPreco(valor: number | string | null | undefined): string {
    return formatCurrencyBRL(valor);
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

  statusIndisponivel(cupom: any): boolean {
    const validade = new Date(cupom.ofertaParceiro.validade).getTime();
    const agora = new Date().getTime();
    return agora > validade;
  }

  gerarId(id: string): string {
    if (!id) return '';
    return id.substring(0, 8).toUpperCase();
  }

  getPrimeiroNome(nomeCompleto: string): string {
    if (!nomeCompleto) return '';
    return nomeCompleto.split(' ')[0];
  }

  cupomValidado(cupom: any): boolean {
    return !!cupom?.dataUtilizacao;
  }

  voltarParaCupons() {
    this.router.navigate(['/cupons']);
  }

  async abrirModalConfirmacaoCliente(cupom: any, event?: Event): Promise<void> {
    event?.stopPropagation();

    const nomeParceiro = cupom?.ofertaParceiro?.idParceiroNavigation?.idEmpresaNavigation?.nome || cupom?.ofertaParceiro?.idParceiroNavigation?.nome || 'Parceiro comercial';
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

}
