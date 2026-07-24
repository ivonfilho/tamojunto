import { Component, OnInit } from '@angular/core';
import { AssinaturaService } from '../../services/assinatura.service';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { isUsuarioParceiroComercial } from '../../utils/usuario-sessao.util';

@Component({
  selector: 'app-parceiro-aviso-menu',
  templateUrl: './parceiro-aviso-menu.component.html',
  styleUrls: ['./parceiro-aviso-menu.component.scss']
})
export class ParceiroAvisoMenuComponent implements OnInit {
  mostrarAviso = false;

  constructor(
    private assinaturaService: AssinaturaService,
    private authService: AuthService,
    private router: Router
  ) {
    document.addEventListener('menuWillOpen', () => {
      this.atualizarStatus();
    });
  }

  async ngOnInit() {
    await this.atualizarStatus();
  }

  async atualizarStatus() {
    const usuario = this.authService.getUserFromStorage();
    const isParceiro = isUsuarioParceiroComercial(usuario);
    if (!isParceiro) {
      this.mostrarAviso = false;
      return;
    }
    // Verifica se tem plano parceiro ativo
    const assinaturas = await this.assinaturaService.minhasAssinaturas();
    console.log('[ParceiroAvisoMenu] assinaturas:', assinaturas);
    const parceiroAtivo = assinaturas && assinaturas.find((assinatura: any) =>
      assinatura.plano &&
      (assinatura.plano.tipo === 'PARCEIRO_GRATIS' || assinatura.plano.tipo === 'Parceiro') &&
      assinatura.ativa === true
    );
    console.log('[ParceiroAvisoMenu] parceiroAtivo:', parceiroAtivo);
    this.mostrarAviso = !parceiroAtivo;
  }

  ativarPlanoParceiro() {
    this.router.navigate(['/Assinatura']);
  }
} 