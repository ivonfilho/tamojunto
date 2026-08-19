import { Component, Input, Output, EventEmitter } from '@angular/core';
import { OfertaService } from '../../services/oferta.service';
import { CupomService } from '../../services/cupom.service';
import { LoadingController, AlertController } from '@ionic/angular';

@Component({
  selector: 'app-excluir-oferta',
  templateUrl: './excluir-oferta.component.html',
  styleUrls: ['./excluir-oferta.component.scss'],
})
export class ExcluirOfertaComponent {
  @Input() ofertaId!: string;
  @Input() ofertaNome!: string; 
  @Output() ofertaExcluida = new EventEmitter<void>();

  constructor(
    private ofertaService: OfertaService,
    private cupomService: CupomService,
    private loadingCtrl: LoadingController,
    private alertCtrl: AlertController
  ) {}

  async excluirOferta() {
  
    const confirmacao = await this.alertCtrl.create({
      header: 'Confirmar Exclusão',
      message: `Tem certeza de que deseja excluir a oferta ${this.ofertaNome} ? Esta ação não pode ser desfeita.`,
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel',
        },
        {
          text: 'Confirmar',
          handler: () => this.processarExclusao(),
        },
      ],
    });

    await confirmacao.present();
  }

  private async processarExclusao() {
    const loading = await this.loadingCtrl.create({
      message: 'Excluindo oferta...',
      spinner: 'circles',
    });

    
    await loading.present();

    try {
      const cupomId = await this.cupomService.buscarCupomDaOferta(this.ofertaId).toPromise();

      if (cupomId) {
        const cupomExcluido = await this.cupomService.excluirCupom(cupomId).toPromise();
        if (!cupomExcluido) {
          throw new Error('Não é possível excluir esta oferta porque ela está vinculada a processos ativos.');
        }
      }
     
      const ofertaExcluida = await this.ofertaService.excluirOferta(this.ofertaId).toPromise();
      if (!ofertaExcluida) {
        throw new Error('Não é possível excluir esta oferta porque ela está vinculada a processos ativos.');
      }
      console.log('CupomId encontrado:', cupomId);

      console.log('Oferta excluída:', ofertaExcluida);

      
      loading.dismiss();
      const sucesso = await this.alertCtrl.create({
        header: 'Sucesso',
        message: 'Oferta excluída com sucesso!',
        buttons: ['OK'],
      });
      await sucesso.present();

    this.ofertaExcluida.emit();
    
    } catch (error: any) {
      loading.dismiss();
      const erroMsg = await this.alertCtrl.create({
        header: 'Erro',
        message: error.message || 'Erro ao excluir a oferta.',
        buttons: ['OK'],
      });
      await erroMsg.present();
    }
  }
}
