import { Component, OnInit, Input } from '@angular/core';
import { ClienteService } from '../../services/cliente.service';
import { CupomService } from '../../services/cupom.service';
import { VisualizarCupom } from './visualizar-cupom.model';
import { ActivatedRoute, Router } from '@angular/router';
import { formatCurrencyBRL } from '../../utils/currency.util';

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

  constructor(
    private clienteService: ClienteService,
    private cupomService: CupomService,
    private router: Router,
    private route: ActivatedRoute
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
      },
      (error) => {
        console.error('error ao obter lista de cupoms', error)
      }
    )
  }


  formatarPreco(valor: number): string {
    return formatCurrencyBRL(valor);
  }

  statusIndisponivel(cupom: any): boolean {
    const validade = new Date(cupom.ofertaParceiro.validade).getTime();
    const agora = new Date().getTime();
    return agora > validade;
  }

  calcularDesconto(desconto: number): string {
    return `${desconto}%`;
  }

  calcularPrecoFinal(preco: number, desconto: number): number {
    return preco - (preco * desconto) / 100;
  }

  gerarId(id: string): string {
    if (!id) {
      return '';
    }
    const firstBlock = id.split('-')[0];
    return firstBlock.toUpperCase();
  }

  voltarParaCupons() {
    this.router.navigate(['/cupons'])
  }

}
