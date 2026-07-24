import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CupomService } from '../../services/cupom.service';
import { AlertController, ToastController } from '@ionic/angular';

@Component({
  selector: 'app-resgatar-cupom',
  templateUrl: './resgatar-cupom.page.html',
  styleUrls: ['./resgatar-cupom.page.scss'],
})
export class ResgatarCupomComponent implements OnInit {
  cupomId: string | null = null;
  mensagem: string = 'Confirme a validação do cupom para concluir o resgate.';
  carregando: boolean = false;
  sucesso: boolean = false;
  usuarioRole: string = 'Cliente';

  constructor(
    private route: ActivatedRoute,
    private cupomService: CupomService,
    private toastController: ToastController,
    private alertController: AlertController
  ) {}

  async ngOnInit(): Promise<void> {
    this.cupomId = this.route.snapshot.paramMap.get('id');
    this.usuarioRole = this.getUsuarioRole();
    console.log('Cupom ID capturado:', this.cupomId);

    if (this.cupomId) {
      await this.abrirModalConfirmacao();
    } else {
      this.mensagem = 'ID do cupom não encontrado!';
    }
  }
  async presentToast(text: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message: text,
      duration: 5000,
      position: 'top',
      color: color,
    });
    toast.present();
  }
  private getUsuarioRole(): string {
    const usuarioStorage =
      localStorage.getItem('tamo_junto_user') || localStorage.getItem('usuarioLogado');

    if (!usuarioStorage) {
      return 'Cliente';
    }

    try {
      const usuario = JSON.parse(usuarioStorage);
      return usuario?.role || 'Cliente';
    } catch {
      return 'Cliente';
    }
  }

  gerarCodigoCurto(cupomId: string): string {
    return cupomId.substring(0, 8).toUpperCase();
  }

  async abrirModalConfirmacao(): Promise<void> {
    if (!this.cupomId || this.carregando) {
      return;
    }

    const ehParceiro = this.usuarioRole === 'Parceiro';
    const alert = await this.alertController.create({
      header: ehParceiro ? 'Confirmar validação' : 'Confirmar uso do cupom',
      message: ehParceiro
        ? `Deseja validar o cupom ${this.gerarCodigoCurto(this.cupomId)}?`
        : `Deseja confirmar o uso do cupom ${this.gerarCodigoCurto(this.cupomId)}?`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: ehParceiro ? 'Validar cupom' : 'Confirmar',
          handler: () => {
            this.resgatarCupom(this.cupomId!);
          },
        },
      ],
      backdropDismiss: false,
    });

    await alert.present();
  }

  async abrirModalSucesso(): Promise<void> {
    const ehParceiro = this.usuarioRole === 'Parceiro';
    const alert = await this.alertController.create({
      header: 'Cupom validado',
      message: ehParceiro
        ? 'Validação concluída com sucesso. O cliente já pode visualizar o cupom como utilizado.'
        : 'Seu cupom foi validado com sucesso pelo parceiro comercial.',
      buttons: ['OK'],
    });

    await alert.present();
  }

  resgatarCupom(cupomId: string): void {
    this.carregando = true;
    this.cupomService.resgatarCupom(cupomId).subscribe({
      next: async (resposta) => {
        this.carregando = false;
        if (resposta.id) {
          this.presentToast('Cupom resgatado com sucesso!');
          this.sucesso = true;
          this.mensagem = 'Validação finalizada.';
          await this.abrirModalSucesso();
        } else this.presentToast(resposta, 'danger');
      },
      error: (erro) => {
        console.error('Erro ao resgatar cupom:', erro);
        this.mensagem = 'Erro ao resgatar o cupom. Tente novamente mais tarde.';
        this.carregando = false;
      },
    });
  }
}
