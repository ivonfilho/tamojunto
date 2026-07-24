import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { OfertaService } from '../../services/oferta.service';
import { AlertController } from '@ionic/angular';
import { formatCurrencyBRL } from '../../utils/currency.util';
import { ofertaExpirada, ofertaStatusAtivo } from '../../utils/oferta-validade.util';

@Component({
  selector: 'app-visualizar-ofertas-publica',
  templateUrl: './visualizar-ofertas-publica.page.html',
  styleUrls: ['./visualizar-ofertas-publica.page.scss'],
})
export class VisualizarOfertasPublicaPage implements OnInit {
  oferta: any = null;
  loading: boolean = true;
  error: boolean = false;
  errorMessage: string = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private ofertaService: OfertaService,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    this.carregarOferta();
  }

  async carregarOferta() {
    try {
      this.loading = true;
      this.error = false;
      
      const ofertaId = this.route.snapshot.paramMap.get('id');
      if (!ofertaId) {
        this.mostrarErro('ID da oferta não fornecido');
        return;
      }

      // Buscar oferta pelo ID
      const data = await this.ofertaService.obterOfertaPorId(ofertaId).toPromise();
      this.oferta = data
        ? {
            ...data,
            status: (data as any).status ?? (data as any).Status,
            validade: (data as any).validade ?? (data as any).Validade,
          }
        : null;

      if (!this.oferta) {
        this.mostrarErro('Oferta não encontrada');
        return;
      }

      if (!ofertaStatusAtivo(this.oferta)) {
        this.mostrarErro('Esta oferta não está mais disponível');
        return;
      }
      if (ofertaExpirada(this.oferta)) {
        this.mostrarErro('Esta oferta expirou');
        return;
      }

    } catch (error) {
      console.error('Erro ao carregar oferta:', error);
      this.mostrarErro('Erro ao carregar a oferta. Tente novamente.');
    } finally {
      this.loading = false;
    }
  }

  formatarPreco(valor: number): string {
    if (!valor && valor !== 0) return formatCurrencyBRL(0);
    return formatCurrencyBRL(valor);
  }

  formatarPorcentagem(valor: number): string {
    if (valor === null || valor === undefined || isNaN(valor)) {
      return '0%';
    }
    
    // Se o valor é um número inteiro, não mostrar casas decimais
    if (Number.isInteger(valor)) {
      return `${valor}%`;
    }
    
    // Se tem casas decimais, mostrar apenas as necessárias
    const valorFormatado = valor.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
    return `${valorFormatado}%`;
  }

  calcularPrecoComDesconto(): number {
    if (!this.oferta?.preco || !this.oferta?.desconto) return 0;
    return this.oferta.preco - (this.oferta.preco * (this.oferta.desconto / 100));
  }

  formatarData(data: string): string {
    if (!data) return '';
    const dataObj = new Date(data);
    return dataObj.toLocaleDateString('pt-BR');
  }

  async fazerLogin() {
    const alert = await this.alertController.create({
      header: 'Login Necessário',
      message: 'Para resgatar ou compartilhar ofertas, você precisa fazer login.',
      buttons: [
        {
          text: 'Cancelar',
          role: 'cancel'
        },
        {
          text: 'Fazer Login',
          handler: () => {
            this.router.navigate(['/']);
          }
        }
      ]
    });

    await alert.present();
  }

  voltarParaHome() {
    this.router.navigate(['/']);
  }

  private mostrarErro(mensagem: string) {
    this.error = true;
    this.errorMessage = mensagem;
    this.loading = false;
  }
} 