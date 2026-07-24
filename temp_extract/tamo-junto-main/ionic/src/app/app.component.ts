import { Component, OnInit } from '@angular/core';
import { UsuarioService } from './services/api/usuario.service';
import { Router } from '@angular/router';
import { AuthService } from './services/auth.service';
import { ParceiroService } from './services/parceiro.service';
import { NavigationService } from './services/navigation.service';
import {
  isUsuarioParceiroComercial,
  mesclarUsuarioSessao,
  obterIdUsuario,
  obterRoleUsuario,
  roleFromJwtPayload,
} from './utils/usuario-sessao.util';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  usuario: any;
  public rotaAtiva: string = '';
  public isParceiro: boolean = false;
  public isDesktop: boolean = false;

  public appPages = [
    {
      title: 'Dinheiro no\nbolso',
      url: '/dashboard',
      icon: '../assets/icon/PictureInPicture2.svg',
    },
    {
      title: 'Assinatura',
      url: '/Assinatura',
      icon: '../assets/icon/CreditCard2.svg',
    },
    {
      title: 'Ofertas',
      url: '/ofertas',
      icon: './assets/icon/ShoppingBag2.svg',
    },
    { title: 'Cupons', url: '/cupons', icon: './assets/icon/Receipt2.svg' },
  ];
  
  constructor(
    private usuarioService: UsuarioService,
    private router: Router,
    private authService: AuthService,
    private parceiroService: ParceiroService,
    private navigationService: NavigationService
  ) {}

  ngOnInit() {
    console.log('[AppComponent] ngOnInit iniciado');
    
    // Detecta se é desktop ou mobile
    this.detectarTipoDispositivo();
    
    // Configura o router e rota ativa
    this.rotaAtiva = this.router.url;
    this.router.events.subscribe((event: any) => {
      if (event && event.url) {
        this.rotaAtiva = event.url;
      }
    });
    
    // Inicia o processo de carregamento do usuário
    this.iniciarCarregamentoUsuario();
    
    // Adiciona listener para mudanças no localStorage
    window.addEventListener('storage', (event) => {
      if (event.key === 'tamo_junto_user') {
        console.log('[AppComponent] Mudança detectada no localStorage, recarregando usuário...');
        this.carregarUsuario();
      }
    });
    
    // Também escuta mudanças no próprio localStorage (mesma aba)
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key: string, value: string) {
      originalSetItem.apply(this, [key, value]);
      if (key === 'tamo_junto_user') {
        console.log('[AppComponent]  localStorage.setItem detectado, recarregando usuário...');
        // Dispara um evento customizado
        window.dispatchEvent(new CustomEvent('localStorageChange', { detail: { key, value } }));
      }
    };
    
    // Escuta o evento customizado
    window.addEventListener('localStorageChange', (event: any) => {
      if (event.detail && event.detail.key === 'tamo_junto_user') {
        console.log('[AppComponent] Evento customizado detectado, recarregando usuário...');
        this.carregarUsuario();
      }
    });
  }

  /**
   * Detecta se o dispositivo é desktop ou mobile
   */
  detectarTipoDispositivo() {
    // Verifica se é desktop baseado no tamanho da tela e user agent
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    const isSmallScreen = window.innerWidth < 768;
    
    this.isDesktop = !isMobile && !isSmallScreen;
    
    console.log('[AppComponent] 📱 Detecção de dispositivo:');
    console.log('[AppComponent]   - User Agent:', navigator.userAgent);
    console.log('[AppComponent]   - Largura da tela:', window.innerWidth);
    console.log('[AppComponent]   - É mobile:', isMobile);
    console.log('[AppComponent]   - É tela pequena:', isSmallScreen);
    console.log('[AppComponent]   - É desktop:', this.isDesktop);
    
    // Adiciona listener para mudanças de tamanho da tela
    window.addEventListener('resize', () => {
      const newIsDesktop = !isMobile && window.innerWidth >= 768;
      if (newIsDesktop !== this.isDesktop) {
        this.isDesktop = newIsDesktop;
      }
    });
  }

  async iniciarCarregamentoUsuario() {
    console.log('[AppComponent] Iniciando carregamento de usuário...');
    
    // Primeira tentativa imediata
    await this.carregarUsuario();
    
    // Se não encontrou usuário, tenta novamente a cada 100ms por até 5 segundos
    if (!this.usuario) {
      console.log('[AppComponent] Usuário não encontrado, iniciando verificação agressiva...');
      let tentativas = 0;
      const maxTentativas = 50; // 5 segundos (50 * 100ms)
      
      const verificarUsuario = async () => {
        tentativas++;
        console.log(`[AppComponent] Tentativa ${tentativas}/${maxTentativas} de carregar usuário...`);
        
        await this.carregarUsuario();
        
        if (this.usuario) {
          console.log('[AppComponent] Usuário encontrado na tentativa', tentativas);
          return; // Sucesso, para a verificação
        }
        
        if (tentativas < maxTentativas) {
          // Agenda próxima tentativa com intervalo menor
          setTimeout(verificarUsuario, 100);
        } else {
          console.log(' Máximo de tentativas atingido, usuário não encontrado');
        }
      };
      
      // Inicia a verificação agressiva
      setTimeout(verificarUsuario, 100);
    }
    
    // Garantir que o layout seja exibido mesmo sem usuário
    if (!this.usuario) {
    }
  }

  async carregarUsuario() {
    console.log('[AppComponent] ===== INICIANDO CARREGAMENTO DE USUÁRIO =====');
    
    if (!this.authService.isTokenValid()) {
      // Não redirecionar se estiver nas páginas de recuperação de senha ou confirmação de email
      if (this.router.url.includes('recuperar-senha') || this.router.url.includes('confirmar-email')) {
        return;
      }
      this.router.navigateByUrl('/');
      return;
    }

    // Tenta carregar o usuário do localStorage
    this.usuario = this.authService.getUserFromStorage();
    
    // Se não encontrou no localStorage, tenta buscar em usuarioLogado
    if (!this.usuario) {
      const usuarioLogado = localStorage.getItem('usuarioLogado');
      if (usuarioLogado) {
        this.usuario = JSON.parse(usuarioLogado);
        console.log('[AppComponent] 🔍 Usuário de usuarioLogado:', this.usuario);
      }
    }
    
    const idAtual = obterIdUsuario(this.usuario);
    if (!idAtual) {
      try {
        const usuarioBackend = await this.usuarioService.getUsuario();
        if (usuarioBackend) {
          const dadosCompletos = mesclarUsuarioSessao(
            { token: this.authService.getToken() },
            usuarioBackend
          );
          this.usuarioService.setUsuarioLogado(dadosCompletos);
          this.usuario = dadosCompletos;
        }
      } catch {
        // Perfil indisponível — segue com token/localStorage
      }
    }

    if (!obterIdUsuario(this.usuario)) {
      const tokenData = this.authService.getUserFromToken();
      if (tokenData) {
        this.usuario = mesclarUsuarioSessao({
          Id: tokenData.Id || tokenData.id,
          role: roleFromJwtPayload(tokenData),
          email: tokenData.email,
          nome: tokenData.nome,
          token: this.authService.getToken(),
        });
        this.usuarioService.setUsuarioLogado(this.usuario);
      }
    } else if (this.usuario && !this.usuario.role && !this.usuario.Role) {
      const tokenData = this.authService.getUserFromToken();
      this.usuario = mesclarUsuarioSessao(this.usuario, {
        role: roleFromJwtPayload(tokenData),
      });
      this.usuarioService.setUsuarioLogado(this.usuario);
    }

    if (this.usuario) {
      this.verificarSeEParceiroSincrono();
      
      // Força detecção de mudanças para atualizar a UI
      setTimeout(() => {
      }, 100);
    } else {
      console.log('Nenhum usuário encontrado');
    }
    
  }

  verificarSeEParceiroSincrono() {
    if (this.usuario) {
      console.log('Verificando se usuário é parceiro (síncrono):', this.usuario);
      
      if (isUsuarioParceiroComercial(this.usuario)) {
        console.log('Usuário é parceiro comercial (role):', obterRoleUsuario(this.usuario));
        this.isParceiro = true;
        this.atualizarMenuParaParceiro();
      } else {
        console.log('Usuário é cliente/MEI, não parceiro comercial');
        this.isParceiro = false;
      }
    } else {
      console.log('Usuário não encontrado');
    }
  }

  atualizarMenuParaParceiro() {
    console.log('Atualizando menu para parceiro');
    // Atualiza o menu para parceiros, trocando "Cupons" por "Relatório de Cupom"
    this.appPages = this.appPages.map(page => {
      if (page.title === 'Cupons') {
        console.log('Trocando "Cupons" por "Relatório de Cupom"');
        return {
          title: 'Relatório de Cupom',
          url: '/cupons/relatorio-cupom',
          icon: './assets/icon/FileText.svg'
        };
      }
      return page;
    });
    console.log('Menu atualizado:', this.appPages);
  }

  public navegarPara(rota: string) {
    this.navigationService.navegarPara(rota);
  }

  sair() {
    this.authService.clearToken();
    this.router.navigate(['/']);
  }
}
