import { Component, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { NotificacaoService} from '../services/notificacao.service';
import { UsuarioService } from '../services/api/usuario.service';
import { obterIdUsuario } from '../utils/usuario-sessao.util';
import { Router } from '@angular/router';


interface CustomNotification {
  id: string;
  titulo: string;
  subTitulo: string;
  dataCriacao: string;  
  idUsuario: string;
  isOffer?: boolean;         
  isFlashSale?: boolean;
  isCoupon?: boolean;
}

@Component({
  selector: 'app-notification-modal',
  templateUrl: './notification-modal.component.html',
  styleUrls: ['./notification-modal.component.scss'],
})
export class NotificationModalComponent implements OnInit {
  currentNotification: CustomNotification | null = null; 
  usuarioId: string | null = null;
  notifications: CustomNotification[] = [];

  constructor(
    private modalController: ModalController,
    private notificacaoService: NotificacaoService,
    private usuarioService: UsuarioService,
    private router: Router 
  ) {}

  ngOnInit() {
    const usuarioLogado = this.usuarioService.getUsuarioLogado();
    this.usuarioId = obterIdUsuario(usuarioLogado);
    if (this.usuarioId) {
      this.carregarNotificacoes(this.usuarioId);
    } else {
      console.error('Usuário não logado ou ID não encontrado.');
    }
  }

  navigateToNotification(notification: CustomNotification) {
    const usuarioLogado = this.usuarioService.getUsuarioLogado();
    const isParceiro = usuarioLogado?.role === 'Parceiro' || usuarioLogado?.Role === 'Parceiro';
    if (notification.titulo.includes("Oferta")) {
      this.router.navigate([isParceiro ? '/editar-oferta' : '/oferta', notification.id]);
    } else if (notification.titulo.includes("Cupom")) {
      this.router.navigate(['/cupom', notification.id]);
    } else if (notification.titulo.includes("Alerta")) {
      this.router.navigate(['/alerta', notification.id]);
    }
  }
  getIconForNotification(notification: CustomNotification): string {
    const lowerTitle = notification.titulo.toLowerCase();
    if (lowerTitle.includes("oferta")) {
      return '../assets/icon/Star.svg'; 
    } else if (lowerTitle.includes("cupom")) {
      return '../assets/icon/Ticket.svg'; 
    } else if (lowerTitle.includes("alerta")) {
      return '../assets/icon/Warning.svg'; 
    }
    return '../assets/icon/NotificationsOutline.svg';
  }
  
  carregarNotificacoes(idUsuario: string) {
    if (!idUsuario) {
      console.warn('Nenhum ID de usuário encontrado.');
      return;
    }

    this.notificacaoService.listarPorIdCliente(idUsuario).subscribe(
      (data: CustomNotification[]) => {
        this.notifications = data
          .map(notification => ({
            ...notification,
            isFlashSale: notification.titulo.includes("Oferta relâmpago"),
            isOffer: notification.titulo === "Nova Oferta Disponível!",
            isCoupon: notification.titulo.includes("Novo cupom disponível!")
          }))
          .sort((a, b) => new Date(b.dataCriacao).getTime() - new Date(a.dataCriacao).getTime());
  
        console.log('Notificações carregadas:', this.notifications);
      },
      (error) => {
        console.error('Erro ao carregar notificação:', error);
      }
    );
  }
  
  closeModal() {
    this.modalController.dismiss({
      'dismissed': true
    });
  }
}
