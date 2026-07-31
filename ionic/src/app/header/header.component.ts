import { Component, Input, OnInit, OnChanges, SimpleChanges, ElementRef, ViewChild } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { ToastController, ModalController, AlertController } from '@ionic/angular';
import { NotificationModalComponent } from '../notificacao/notification-modal.component';
import { NotificacaoService } from '../services/notificacao.service';
import { FotoPerfilService } from '../services/foto-perfil.service';
import { ProfileModalComponent } from './profile-modal/profile-modal.component';
import { Router } from '@angular/router';
import { ApiConnectivityService } from '../services/api-connectivity.service';
import {
  readStoredFotoPerfil,
  writeStoredFotoPerfil,
  clearStoredFotoPerfilForUser,
} from '../utils/foto-perfil-storage.util';

@Component({
  selector: 'app-header',
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit, OnChanges {
  @Input() usuario: any;
  isProfileMenuOpen = false;
  unreadNotificationsCount = 0;
  @ViewChild('fileInput') fileInput!: ElementRef<HTMLInputElement>;
  fotoPerfil: string = '';
  fotoPerfilMenuOpen: boolean = false;
  isDesktop: boolean = false;
  searchTerm: string = '';
  isSearchModalOpen: boolean = false;

  constructor(
    private authService: AuthService,
    private toastController: ToastController,
    private modalController: ModalController,
    private notificacaoService: NotificacaoService,
    private fotoPerfilService: FotoPerfilService,
    private alertController: AlertController,
    private router: Router,
    private apiConnectivity: ApiConnectivityService,
  ) { }

  ngOnInit() {
    this.detectarTipoDispositivo();
    
    // Só carrega notificações e imagem se o usuário estiver disponível
    if (this.usuario) {
      this.carregarNotificacoes();
      this.carregarImagemPerfil();
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    // Detecta mudanças no usuário e recarrega as informações
    if (changes['usuario'] && changes['usuario'].currentValue) {
      console.log('[HeaderComponent] Usuário carregado, recarregando informações...');
      this.carregarNotificacoes();
      this.carregarImagemPerfil();
    }
  }

  /**
   * Detecta se o dispositivo é desktop ou mobile
   * Prioriza o tamanho da tela para garantir que o menu apareça corretamente em produção
   */
  detectarTipoDispositivo() {
    // Prioriza o tamanho da tela - mais confiável em produção
    // Se a tela for menor que 768px, SEMPRE considera mobile (mostra menu)
    // Se for >= 768px, verifica outros fatores
    const screenWidth = window.innerWidth;
    const isSmallScreen = screenWidth < 768;
    
    if (isSmallScreen) {
      // Tela pequena = sempre mobile = menu aparece
      this.isDesktop = false;
    } else {
      // Tela grande: verifica se é realmente desktop
      const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      
      // Considera desktop apenas se:
      // - Tela >= 1024px E NÃO for touch device E NÃO for mobile device
      // Isso garante que tablets e dispositivos touch grandes ainda mostrem o menu
      this.isDesktop = screenWidth >= 1024 && !isTouchDevice && !isMobileDevice;
    }
    
    console.log('[HeaderComponent] 📱 Detecção de dispositivo:');
    console.log('[HeaderComponent]   - Largura da tela:', window.innerWidth);
    console.log('[HeaderComponent]   - É tela pequena (< 768px):', isSmallScreen);
    console.log('[HeaderComponent]   - É desktop:', this.isDesktop);
    console.log('[HeaderComponent]   - Menu sanduíche deve aparecer:', !this.isDesktop);
    
    // Adiciona listener para mudanças de tamanho da tela
    window.addEventListener('resize', () => {
      const newScreenWidth = window.innerWidth;
      const newIsSmallScreen = newScreenWidth < 768;
      
      let newIsDesktop: boolean;
      if (newIsSmallScreen) {
        newIsDesktop = false;
      } else {
        const newIsTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        const newIsMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        newIsDesktop = newScreenWidth >= 1024 && !newIsTouchDevice && !newIsMobileDevice;
      }
      
      if (newIsDesktop !== this.isDesktop) {
        this.isDesktop = newIsDesktop;
        console.log('[HeaderComponent] 📱 Mudança de layout detectada, isDesktop:', this.isDesktop);
        console.log('[HeaderComponent]   - Menu sanduíche deve aparecer:', !this.isDesktop);
      }
    });
  }

  /**
   * Abre/fecha o menu lateral em dispositivos móveis
   */
  toggleMenu() {
    // Tenta encontrar o menu mobile primeiro (não desabilitado)
    let menu = document.querySelector('ion-menu:not([disabled])') as HTMLIonMenuElement;
    
    // Se não encontrar, tenta qualquer menu
    if (!menu) {
      menu = document.querySelector('ion-menu') as HTMLIonMenuElement;
    }
    
    if (menu) {
      console.log('[HeaderComponent] 🍔 Abrindo menu sanduíche');
      menu.open();
    } else {
      console.warn('[HeaderComponent] ⚠️ Menu não encontrado no DOM');
    }
  }

  getPrimeiroNome(nomeCompleto: string): string {
    if (!nomeCompleto) return '';
    return nomeCompleto.split(' ')[0];
  }

  carregarImagemPerfil() {
    if (!this.usuario?.Id) {
      console.warn(' Usuário não disponível para carregar foto de perfil');
      this.fotoPerfil = '';
      return;
    }

    const userId = String(this.usuario.Id);

    const aplicarCacheLocal = (raw: string) => {
      if (raw.startsWith('data:')) {
        this.fotoPerfil = raw;
        this.usuario.fotoPerfil = raw;
      } else {
        this.fotoPerfil = `${raw}?t=${new Date().getTime()}`;
        this.usuario.fotoPerfil = this.fotoPerfil;
      }
    };

    const cached = readStoredFotoPerfil(userId);
    if (cached) {
      aplicarCacheLocal(cached);
    }

    this.fotoPerfilService.getFotoPerfil(userId).subscribe({
      next: (res) => {
        if (res && res.imagemUrl && res.imagemUrl.trim() !== '') {
          let imageUrl = res.imagemUrl;

          if (imageUrl.startsWith('data:')) {
            this.fotoPerfil = imageUrl;
            this.usuario.fotoPerfil = imageUrl;
            writeStoredFotoPerfil(userId, imageUrl);
          } else if (imageUrl.startsWith('/uploads')) {
            const apiUrl = this.apiConnectivity.getCurrentApiUrl();
            const full = `${apiUrl}${imageUrl}`;
            this.fotoPerfil = `${full}?t=${new Date().getTime()}`;
            this.usuario.fotoPerfil = this.fotoPerfil;
            writeStoredFotoPerfil(userId, full);
          } else {
            this.fotoPerfil = imageUrl;
            this.usuario.fotoPerfil = imageUrl;
            writeStoredFotoPerfil(userId, imageUrl);
          }
        } else {
          this.fotoPerfil = '';
          this.usuario.fotoPerfil = '';
          clearStoredFotoPerfilForUser(userId);
        }
      },
      error: (err) => {
        console.error('[HeaderComponent] Erro ao carregar imagem de perfil do backend:', err);
        if (!readStoredFotoPerfil(userId)) {
          this.fotoPerfil = '';
          this.usuario.fotoPerfil = '';
        }
      },
    });
  }
  

  openPopover(event: Event): void {
    this.isProfileMenuOpen = !this.isProfileMenuOpen;
  }

  async logout(): Promise<void> {
    this.authService.clearToken();
    window.location.href = '/';
    localStorage.setItem('sessionEnded', 'true');
    this.isProfileMenuOpen = false;
  }
  async openNotificationModal(): Promise<void> {
    const modal = await this.modalController.create({
      component: NotificationModalComponent,
    });

    modal.onDidDismiss().then(() => {
      this.carregarNotificacoes();
    });

    await modal.present();
  }

carregarNotificacoes() {
  const usuarioLogado = this.usuario;
  if (usuarioLogado && usuarioLogado.Id) {
    this.notificacaoService.listarPorIdCliente(usuarioLogado.Id).subscribe(
      (data: any[]) => {
        const notificacoesNaoLidas = data.filter((notificacao) => !notificacao.lida);
        this.unreadNotificationsCount = notificacoesNaoLidas.length;
      },
      (error) => {
        console.error('Erro ao carregar notificações:', error);
      }
    );
  }
}

async openProfileOptionsModal(): Promise<void> {
  const modal = await this.modalController.create({
    component: ProfileModalComponent,
    componentProps: {
      usuario: this.usuario,
    },
    cssClass: 'large-modal',
  });

  await modal.present();
}

openFilePicker() {
  this.fileInput.nativeElement.click();
}

onFileSelected(event: any) {
  const file: File = event.target.files[0];

  if (!file) {
    this.showToast('Selecione uma imagem para atualizar sua foto de perfil.',false);
    return;
  }

  if (!['image/jpeg', 'image/png'].includes(file.type)) {
    this.showToast('Formato de arquivo não suportado. Selecione uma imagem nos formatos JPG ou PNG.', false);
    return;
  }

  if (file.size > 5 * 1024 * 1024) {
    this.showToast('A imagem deve ter no máximo 5MB.', false);
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    this.fotoPerfil = reader.result as string;
  };
  reader.readAsDataURL(file);

  this.fotoPerfilService.uploadFotoPerfil(this.usuario.Id, file).subscribe({
    next: (response) => {      
      // Se a resposta contém a URL da imagem, usar ela
      if (response && response.imageUrl) {
        let imageUrl = response.imageUrl;
        
        // Se for base64 (data URL), usar diretamente
        // Se for caminho relativo (/uploads), construir URL completa (compatibilidade com formato antigo)
        if (imageUrl.startsWith('data:')) {
          this.fotoPerfil = imageUrl;
          this.usuario.fotoPerfil = imageUrl;
          writeStoredFotoPerfil(String(this.usuario.Id), imageUrl);
          console.log('[HeaderComponent] 📸 Foto de perfil (base64) salva após upload');
        } else if (imageUrl.startsWith('/uploads')) {
          const apiUrl = this.apiConnectivity.getCurrentApiUrl();
          imageUrl = `${apiUrl}${imageUrl}`;
          this.fotoPerfil = `${imageUrl}?t=${new Date().getTime()}`;
          this.usuario.fotoPerfil = this.fotoPerfil;
          writeStoredFotoPerfil(String(this.usuario.Id), imageUrl);
        } else {
          this.fotoPerfil = imageUrl;
          this.usuario.fotoPerfil = imageUrl;
          writeStoredFotoPerfil(String(this.usuario.Id), imageUrl);
        }
              } else {
        // Se não tiver URL na resposta, recarregar do backend
        this.carregarImagemPerfil();
      }
      
      this.showToast('Foto de perfil atualizada com sucesso!', true);
    },
    error: (error) => {
      console.error(' Erro no upload:', error);
      this.showToast('Ocorreu um erro ao atualizar sua foto de perfil. Tente novamente mais tarde.', false);
    }
  });
}

removeProfilePhoto() {
  if(!this.fotoPerfil){
    this.showToast('Não há foto de perfil a ser removida.', false);
    return
  }
  this.fotoPerfilService.deleteFotoPerfil(this.usuario.Id).subscribe({
    next: (response) => {
      this.fotoPerfil = '';
      this.usuario.fotoPerfil = '';
      clearStoredFotoPerfilForUser(String(this.usuario.Id));
      this.showToast('Foto de perfil removida com sucesso.', true);
    },
    error: (error) => {
      console.error('Erro ao remover foto:', error);
      this.showToast('Erro ao remover a foto de perfil.', false);
    }
  });
}

async showToast(message: string, isSuccess:boolean): Promise<void> {
  const toast = await this.toastController.create({
    message,
    duration: 3000,
    position: 'top',
    color: isSuccess ? 'success': 'danger'
  });
  await toast.present();
}

toggleFotoPerfilOptions() {
  this.fotoPerfilMenuOpen = !this.fotoPerfilMenuOpen;
}

async confirmRemoveProfilePhoto() {
  const alert = await this.alertController.create({
    header: 'Remover Foto de Perfil',
    message: 'Tem certeza que deseja remover sua foto de perfil?',
    buttons: [
      {
        text: 'Cancelar',
        role: 'cancel',
        cssClass: 'secondary'
      },
      {
        text: 'Remover',
        cssClass: 'danger',
        handler: () => {
          this.removeProfilePhoto();
        }
      }
    ]
  });

  await alert.present();
}

/**
 * Manipula a entrada de busca
 */
onSearchInput(event: any) {
  const term = event.detail.value?.trim() || '';
  
  if (term.length >= 2) {
    // Determina para qual página navegar baseado no termo de busca
    const termLower = term.toLowerCase();
    
    // Se o termo contém palavras relacionadas a cupons, vai para cupons
    if (termLower.includes('cupom') || termLower.includes('cupons') || termLower.includes('voucher')) {
      this.router.navigate(['/cupons'], { queryParams: { busca: term } });
    } else {
      // Caso contrário, vai para ofertas
      this.router.navigate(['/ofertas'], { queryParams: { busca: term } });
    }
  }
}

/**
 * Limpa a busca quando o usuário limpa o campo
 */
onSearchClear() {
  this.searchTerm = '';
  // Opcional: remover query params da URL
  const currentUrl = this.router.url.split('?')[0];
  this.router.navigate([currentUrl]);
}
}
