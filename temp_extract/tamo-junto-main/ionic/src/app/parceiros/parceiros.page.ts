import { OnInit, Component } from '@angular/core';
import { Parceiro } from '../parceiros/parceiro.model';
import { ParceiroService } from '../services/parceiro.service'; 
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-parceiros',
  templateUrl: './parceiros.page.html',
  styleUrls: ['./parceiros.page.scss'],
})
export class ParceirosPage implements OnInit {
  partners: Parceiro[] = [];
  currentPage = 1;
  pageSize = 10;
  totalPartners = 0;
  filters: any = {};

  constructor(private partnerService:ParceiroService, private router: Router, private loadingCtrl: LoadingController) {}

  ngOnInit() {
    this.loadPartners();
  }
  editarParceiro(partner: Parceiro) {
    this.router.navigate(['/editar-parceiro', partner.id]);
  }
  
  loadPartners() {
    this.partnerService.listar().subscribe({
      next: (partners: Parceiro[]) => {
        this.partners = partners.filter((partner) => {
          const nome = this.filters.name?.toLowerCase() || '';
          const cnpj = this.filters.cnpj?.replace(/\D/g, ''); 
          const status = this.filters.status;
  
          const parceiroNome = partner.idEmpresaNavigation?.nome?.toLowerCase() || '';
          const parceiroCnpj = partner.idEmpresaNavigation?.cnpj?.replace(/\D/g, '') || '';
          const parceiroStatus = partner.status ? 'ativo' : 'inativo';
  
          return (
            (!nome || parceiroNome.includes(nome)) &&
            (!cnpj || parceiroCnpj.includes(cnpj)) &&
            (!status || parceiroStatus === status)
          );
        });
  
        this.totalPartners = this.partners.length;
      },
      error: (err: any) => {
        console.error('Erro ao carregar parceiros:', err);
        alert('Erro ao carregar a lista de parceiros.');
      },
    });
  }  
  
 

  async cadastrarPaceiro() {
    const loading = await this.exibirLoading('Redirecionando...');
    this.router.navigate(['/cadastro-parceiro']).finally(() => {
      loading.dismiss();
    });
  }
  async exibirLoading(mensagem: string = 'Carregando...') {
    const loading = await this.loadingCtrl.create({
      message: mensagem,
      spinner: 'circles',
    });
    await loading.present();
    return loading;
  }
  onPageChange(page: number) {
    if (page < 1 || page > this.getTotalPages()) return;
    this.currentPage = page;
    this.loadPartners();
  }

  applyFilters(filters: any) {
    this.filters = { ...filters }; 
    this.currentPage = 1;
    this.loadPartners();
  }

  deletePartner(id: string) {
    if (confirm('Tem certeza que deseja excluir este parceiro?')) {
      this.partnerService.deletar(id).subscribe({
        next: () => {
          alert('Parceiro removido com sucesso!');
          this.loadPartners();
        },
        error: (err) => {
          console.error('Erro ao excluir parceiro:', err);
          alert('Não foi possível excluir o parceiro.');
        },
      });
    }
  }

  getTotalPages() {
    return Math.ceil(this.totalPartners / this.pageSize);
  }

  exportarCSV() {
    const headers = ['Nome', 'CNPJ', 'Website', 'Contato', 'Status', 'Data de Cadastro'];
    const rows = this.partners.map(partner => [
      partner.idEmpresaNavigation?.nome || '',
      partner.idEmpresaNavigation?.cnpj || '',
      partner.website || '',
      partner.contato || '',
      partner.status ? 'Ativo' : 'Inativo',
      new Date(partner.dataCriacao).toLocaleDateString('pt-BR')
    ]);
  
    const csvContent = [headers, ...rows]
      .map(row => row.map(item => `"${item}"`).join(','))
      .join('\n');
  
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'parceiros.csv');
    link.click();
  }
  
}
