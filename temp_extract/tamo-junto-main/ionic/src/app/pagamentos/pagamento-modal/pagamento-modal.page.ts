import { Component, Input } from '@angular/core';
import { ModalController, ToastController } from '@ionic/angular';
import { PagamentoService } from 'src/app/services/pagamento.service';

@Component({
  selector: 'app-pagamento-modal',
  templateUrl: './pagamento-modal.page.html',
  styleUrls: ['./pagamento-modal.page.scss'],
})

export class PagamentoModalPage {
  @Input() idPlano?: string;

  pagamento = {
    CardNumber: '',
    ExpMonth: '',
    ExpYear: '',
    SecuritCode: '',
    CardHolderName: '',
    CardHolderTaxId: '',
    IdPlano: '',
  };

  constructor(
    private modalCtrl: ModalController,
    private pagamentoService: PagamentoService,
    private toastCtrl: ToastController
  ) {}

  fecharModal() {
    this.modalCtrl.dismiss();
  }

  async pagar() {
    this.pagamento.IdPlano = this.idPlano || '';

    this.pagamentoService.criarPagamento(this.pagamento).subscribe(async (res) => {
      if (res.sucesso) {
        const toast = await this.toastCtrl.create({
          message: `Pagamento realizado com sucesso!`,
          duration: 3000,
          color: 'success',
        });
        await toast.present();
        this.modalCtrl.dismiss(true);
      } else {
        const toast = await this.toastCtrl.create({
          message: `Erro no pagamento: ${res.erro}`,
          duration: 3000,
          color: 'danger',
        });
        await toast.present();
      }
    });
  }
}
