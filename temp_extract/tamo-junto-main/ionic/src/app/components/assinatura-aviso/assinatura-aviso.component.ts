import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { AssinaturaService } from '../../services/assinatura.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-assinatura-aviso',
  templateUrl: './assinatura-aviso.component.html',
  styleUrls: ['./assinatura-aviso.component.scss']
})
export class AssinaturaAvisoComponent implements OnInit {
  @Input() mostrarAviso: boolean = false;
  @Output() fecharAviso = new EventEmitter<void>();

  statusAcesso: { podeAcessar: boolean, mensagem?: string, tipo?: string } | null = null;
  carregando: boolean = true;

  constructor(
    private assinaturaService: AssinaturaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.verificarAcesso();
  }

  async verificarAcesso() {
    this.carregando = true;
    try {
      this.statusAcesso = await this.assinaturaService.podeAcessarSistema();
      this.mostrarAviso = !this.statusAcesso.podeAcessar;
    } catch (error) {
      console.error('Erro ao verificar acesso:', error);
      this.statusAcesso = {
        podeAcessar: false,
        mensagem: 'Erro ao verificar acesso. Tente novamente.',
        tipo: 'erro'
      };
      this.mostrarAviso = true;
    } finally {
      this.carregando = false;
    }
  }

  ativarTesteGratis() {
    this.router.navigate(['/assinatura']);
  }

  assinarPlanoMensal() {
    this.router.navigate(['/assinatura']);
  }

  fazerLogin() {
    this.router.navigate(['/login']);
  }

  fechar() {
    this.fecharAviso.emit();
  }

  getTituloAviso(): string {
    if (!this.statusAcesso) return 'Aviso';
    
    switch (this.statusAcesso.tipo) {
      case 'teste_gratis':
        return 'Ative seu teste grátis!';
      case 'plano_mensal':
        return 'Período grátis expirado';
      case 'parceiro_gratis':
        return 'Ative o card de parceiro!';
      default:
        return 'Acesso restrito';
    }
  }

  getTextoBotao(): string {
    if (!this.statusAcesso) return 'OK';
    
    switch (this.statusAcesso.tipo) {
      case 'teste_gratis':
        return 'Ativar teste grátis';
      case 'plano_mensal':
        return 'Assinar plano mensal';
      case 'parceiro_gratis':
        return 'Ativar card de parceiro';
      default:
        return 'OK';
    }
  }

  executarAcao() {
    if (!this.statusAcesso) {
      this.fechar();
      return;
    }
    
    switch (this.statusAcesso.tipo) {
      case 'teste_gratis':
        this.ativarTesteGratis();
        break;
      case 'plano_mensal':
        this.assinarPlanoMensal();
        break;
      case 'parceiro_gratis':
        this.ativarTesteGratis();
        break;
      default:
        this.fechar();
    }
  }
} 