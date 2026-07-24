import { Component, OnInit, Input } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import type { SegmentValue } from '@ionic/core';
import { Router } from '@angular/router';
import { CupomService } from 'src/app/services/cupom.service';
import { ParceiroService } from 'src/app/services/parceiro.service';
import { ClienteService } from 'src/app/services/cliente.service';
import { UsuarioService } from 'src/app/services/api/usuario.service';
import { Cupom} from '../cupom.model';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Share } from '@capacitor/share';

// Importações para PDF e CSV - usando as bibliotecas instaladas via npm
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { formatCurrencyBRL } from '../../utils/currency.util';


@Component({
  selector: 'app-relatorio-cupom',
  templateUrl: './relatorio-cupom.page.html',
  styleUrls: ['./relatorio-cupom.page.scss'],
})
export class RelatorioCupomPage implements OnInit {
    // Dados
    idParceiro: string = ''; 
    filtrosForm: FormGroup;
    cupons: any[] = [];
    carregando: boolean = false;
    cuponsFiltrados: any[] = [];
    categorias: string[] = [];
  

    currentPage = 1;
    pageSize = 10;
    totalPartners = 0;
    filters: any = {};

    usuario: any;
    cupoms: Cupom[] = [];
    totalPorProduto: { [nomeProduto: string]: number } = {};

    abaRelatorio: 'cupom' | 'oferta' = 'cupom';

    isMobileView: boolean = false;

     

    
  constructor(
    private clienteService: ClienteService,
    private cupomService: CupomService,
    private parceiroService: ParceiroService,
    private usuarioService: UsuarioService,
    private router: Router,
    private fb: FormBuilder
  ) { 
    this.filtrosForm = this.fb.group({
      nomeProduto: [''],
      categoria: [null] // null para não pré-selecionar nenhuma opção
      
    });
  }

  ngOnInit() {
    this.isMobileView = this.isMobile();
    this.obterParceiroEListarDados();
  }

  mudarAbaRelatorio(valor: any) {
    const v = (valor ?? '').toString();
    this.abaRelatorio = v === 'oferta' ? 'oferta' : 'cupom';
  }

  obterParceiroEListarDados() {
    const usuarioLogado = this.usuarioService.getUsuarioLogado();
    console.log('Usuário logado:', usuarioLogado);
    
    if (usuarioLogado && usuarioLogado.Id) {
      this.parceiroService.buscarParceiroPorUsuario(usuarioLogado.Id).subscribe({
        next: (parceiro: any) => {
          console.log('Parceiro retornado pela API:', parceiro);
          
          if (parceiro && parceiro.idParceiro) {
            this.idParceiro = parceiro.idParceiro;
            console.log('ID do parceiro:', this.idParceiro);
            this.carregarDadosRelatorio();
          } else {
            console.warn('Parceiro não possui um ID válido:', parceiro);
            console.log('Usuário ou idParceiro não encontrado.');
          }
        },
        error: (error: any) => {
          console.error('Erro ao obter parceiro:', error);
          console.log('Usuário ou idParceiro não encontrado.');
        }
      });
    } else {
      console.error('Usuário não logado ou ID não encontrado.');
    }
  }

  carregarDadosRelatorio() {
    console.log('Carregando dados do relatório para parceiro:', this.idParceiro);
    this.cupomService.listarCuponsPorParceiro(this.idParceiro).subscribe({
      next: (res) => {
        console.log('Dados recebidos da API:', res);
        this.cupons = res;
        this.cuponsFiltrados = [...res];
        console.log('Cupons carregados:', this.cupons.length);
        console.log('Primeiro cupom:', this.cupons[0]);
        
        this.calcularTotaisPorProduto(); 
        this.extrairCategorias(); 
      },
      error: (err) => {
        console.error('Erro ao carregar cupons:', err);
        this.cupons = [];
        this.cuponsFiltrados = [];
      }
    });
  }
extrairCategorias() {
  const categoriasSet = new Set<string>();
  this.cupons.forEach(c => {
    if (c.ofertaParceiro?.categoria) {
      categoriasSet.add(c.ofertaParceiro.categoria);
    }
  });
  this.categorias = Array.from(categoriasSet);
}
carregarCuponsDoParceiro() {
  this.cupomService.listarCuponsPorParceiro(this.idParceiro).subscribe({
    next: (res) => {
      this.cupons = res;
      this.cuponsFiltrados = [...res];
      this.calcularTotaisPorProduto();
      this.extrairCategorias();
    },
    error: (err) => console.error('Erro ao carregar cupons:', err)
  });
}

filtrar() {
  const { nomeProduto, categoria } = this.filtrosForm.value;
  if (!nomeProduto && !categoria) {
    this.cuponsFiltrados = [...this.cupons];
    return;
  }

  this.cuponsFiltrados = this.cupons.filter(cupom => {
    const nomeMatch = !nomeProduto || cupom.ofertaParceiro?.nomeProduto?.toLowerCase().includes(nomeProduto.toLowerCase());
    const categoriaMatch = !categoria || cupom.ofertaParceiro?.categoria === categoria;
    return nomeMatch && categoriaMatch;
  });

  this.currentPage = 1;
}

get paginatedCupons() {
  const start = (this.currentPage - 1) * this.pageSize;
  return this.cuponsFiltrados.slice(start, start + this.pageSize);
}

get ofertasAgrupadas() {
  // Simple grouping by product name
  const grupos = new Map<string, any>();
  for (const c of this.cuponsFiltrados) {
    if (c.ofertaParceiro) {
      const nome = c.ofertaParceiro.nomeProduto;
      if (!grupos.has(nome)) {
        grupos.set(nome, {
           nomeProduto: nome,
           oferta: c.ofertaParceiro,
           quantidade: 1,
           valorTotal: this.getValorFinalCupom(c)
        });
      } else {
        const g = grupos.get(nome);
        g.quantidade++;
        g.valorTotal += this.getValorFinalCupom(c);
      }
    }
  }
  return Array.from(grupos.values());
}

get paginatedOfertas() {
  const allOfertas = this.ofertasAgrupadas;
  const start = (this.currentPage - 1) * this.pageSize;
  return allOfertas.slice(start, start + this.pageSize);
}

getTotalPagesOfertas(): number {
  const n = this.ofertasAgrupadas.length;
  if (n === 0) return 1;
  return Math.ceil(n / this.pageSize);
}

get totalPages() {
  return Math.ceil(this.cuponsFiltrados.length / this.pageSize);
}

onPageChange(page: number) {
  if (page >= 1 && page <= this.totalPages) {
    this.currentPage = page;
  }
}

  

  getTotalPages(): number {
    const n = this.cuponsFiltrados.length;
    if (n === 0) {
      return 1;
    }
    return Math.ceil(n / this.pageSize);
  }

  /** Valor final da oferta (preço com desconto). */
  getValorFinalCupom(cupom: any): number {
    const preco = cupom?.ofertaParceiro?.preco || 0;
    const desconto = cupom?.ofertaParceiro?.desconto || 0;
    return preco - (preco * desconto) / 100;
  }

  modalOfertaAberto = false;
  cupomOfertaModal: any = null;

  abrirModalOferta(cupom: any): void {
    this.cupomOfertaModal = cupom;
    this.modalOfertaAberto = true;
  }

  fecharModalOferta(): void {
    this.modalOfertaAberto = false;
    this.cupomOfertaModal = null;
  }


  

 
  limparFiltros() {
    this.filtrosForm.reset();
    this.cuponsFiltrados = [...this.cupons];
    this.currentPage = 1;
  }
  

  exportarCSV() {
    try {
      console.log('Iniciando exportação CSV...');
      
      if (!this.cuponsFiltrados || this.cuponsFiltrados.length === 0) {
        console.warn('Nenhum cupom para exportar');
        return;
      }

    const linhas = [
      [
        'Produto',
        'Código',
        'Descrição',
        'Data Resgate',
        'Data Uso',
        'Data de Validade',
        'Preço',
        'Desconto (%)',
        'Valor Final',
        'Categoria',
        'Total Vendido',
      ]
    ];
  
    this.cuponsFiltrados.forEach(cupom => {
      const preco = cupom.ofertaParceiro?.preco || 0;
      const desconto = cupom.ofertaParceiro?.desconto || 0;
      const valorFinal = preco - (preco * desconto) / 100;
      const total = this.totalPorProduto[cupom.ofertaParceiro?.nomeProduto] || 0;
  
      const linha = [
        cupom.ofertaParceiro?.nomeProduto || '',
        this.gerarId(cupom.id),
        cupom.ofertaParceiro?.descricao || '',
          cupom.dataResgate ? new Date(cupom.dataResgate).toLocaleString('pt-BR') : '',
          cupom.dataUtilizacao ? new Date(cupom.dataUtilizacao).toLocaleDateString('pt-BR') : '',
          cupom.ofertaParceiro?.validade ? new Date(cupom.ofertaParceiro.validade).toLocaleDateString('pt-BR') : '',
        this.formatarValorBR(preco),
        desconto.toString(),
        this.formatarValorBR(valorFinal),
        cupom.ofertaParceiro?.categoria || '',
        this.formatarValorBR(total),
      ];
  
      // Envolver cada campo com aspas e escapar aspas internas
      const linhaFormatada = linha.map(campo =>
        `"${String(campo).replace(/"/g, '""')}"`
      );
  
      linhas.push(linhaFormatada);
    });
  
    const csvContent = linhas.map(e => e.join(',')).join('\n');
      
      // Verificar se estamos no ambiente mobile
      if (this.isMobile()) {
        // Método alternativo para mobile
        this.downloadCSVMobile(csvContent);
      } else {
        // Método padrão para desktop
        this.downloadCSVDesktop(csvContent);
      }
      
      console.log('Exportação CSV concluída com sucesso');
    } catch (error) {
      console.error('Erro ao exportar CSV:', error);
      
    }
  }

  private downloadCSVDesktop(csvContent: string) {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `relatorio-cupons-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  }

  private downloadCSVMobile(csvContent: string) {
    // Método alternativo para mobile usando data URL
    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csvContent);
    const link = document.createElement('a');
    link.href = dataStr;
    link.download = `relatorio-cupons-${new Date().toISOString().split('T')[0]}.csv`;
    link.style.display = 'none';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
  
  
  
  exportarPDF() {
    try {
      console.log('Iniciando exportação PDF...');
      
      if (!this.cuponsFiltrados || this.cuponsFiltrados.length === 0) {
        console.warn('Nenhum cupom para exportar');
        alert('Nenhum cupom encontrado para exportar.');
        return;
      }

      // Verificar se jsPDF está disponível
      if (typeof jsPDF === 'undefined') {
        console.error('jsPDF não está disponível');
        alert('Exportação PDF não está disponível no momento. Tente exportar como CSV.');
        return;
      }

      console.log('jsPDF disponível, criando documento...');

      // Criar novo documento PDF
      const doc = new jsPDF('landscape', 'mm', 'a4');
      
      // Adicionar título
      doc.setFontSize(18);
      doc.text('Relatório de Cupons', 14, 20);
      
      // Adicionar data de geração
      doc.setFontSize(10);
      doc.text(`Gerado em: ${new Date().toLocaleString('pt-BR')}`, 14, 30);
      
      // Configurar colunas da tabela
    const colunas = [
      'Produto',
      'Código',
      'Descrição',
      'Data Resgate',
      'Data Uso',
        'Data Validade',
      'Preço',
        'Desconto',
      'Valor Final',
      'Categoria',
      'Total Vendido',
    ];
  
      // Preparar dados da tabela
    const linhas = this.cuponsFiltrados.map(cupom => {
      const preco = cupom.ofertaParceiro?.preco || 0;
      const desconto = cupom.ofertaParceiro?.desconto || 0;
      const valorFinal = preco - (preco * desconto) / 100;
      const total = this.totalPorProduto[cupom.ofertaParceiro?.nomeProduto] || 0;
  
      return [
        cupom.ofertaParceiro?.nomeProduto || '',
        this.gerarId(cupom.id),
        cupom.ofertaParceiro?.descricao || '',
          cupom.dataResgate ? new Date(cupom.dataResgate).toLocaleString('pt-BR') : '',
          cupom.dataUtilizacao ? new Date(cupom.dataUtilizacao).toLocaleDateString('pt-BR') : '—',
          cupom.ofertaParceiro?.validade ? new Date(cupom.ofertaParceiro.validade).toLocaleDateString('pt-BR') : '',
        this.formatarValorBR(preco),
        `${desconto}%`,
        this.formatarValorBR(valorFinal),
        cupom.ofertaParceiro?.categoria || '',
        this.formatarValorBR(total)
      ];
    });
    
      console.log('Dados preparados, gerando tabela...');
  
      // Verificar se autoTable está disponível
      if (typeof autoTable === 'undefined') {
        console.error('autoTable não está disponível, usando fallback');
        // Fallback: criar tabela simples
        this.createSimplePDFTable(doc, colunas, linhas);
      } else {
        console.log('autoTable disponível, gerando tabela...');
        // Gerar tabela usando autoTable
    autoTable(doc, {
      head: [colunas],
      body: linhas,
          startY: 35,
          styles: { 
            fontSize: 8,
            cellPadding: 2
          },
          headStyles: { 
            fillColor: [106, 0, 244], // Cor roxa do tema
            textColor: 255,
            fontStyle: 'bold'
          },
          alternateRowStyles: {
            fillColor: [248, 249, 250]
          },
          columnStyles: {
            0: { cellWidth: 25 }, // Produto
            1: { cellWidth: 15 }, // Código
            2: { cellWidth: 30 }, // Descrição
            3: { cellWidth: 20 }, // Data Resgate
            4: { cellWidth: 20 }, // Data Uso
            5: { cellWidth: 20 }, // Data Validade
            6: { cellWidth: 15 }, // Preço
            7: { cellWidth: 15 }, // Desconto
            8: { cellWidth: 20 }, // Valor Final
            9: { cellWidth: 20 }, // Categoria
            10: { cellWidth: 20 } // Total Vendido
          },
          margin: { top: 35, right: 14, bottom: 14, left: 14 }
        });
      }
    
      console.log('Tabela gerada, salvando PDF...');
    
      // Salvar o PDF
      const fileName = `relatorio-cupons-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Verificar se estamos no ambiente mobile (APK)
      if (this.isMobile()) {
        console.log('Ambiente mobile detectado, usando blob e compartilhamento');
        // Para mobile, usar blob e download
        const pdfBlob = doc.output('blob');
        
        // Tentar compartilhar o PDF no APK
        this.compartilharPDF(pdfBlob, fileName);
      } else {
        console.log('Ambiente desktop detectado, usando doc.save');
        // Para navegador desktop
      doc.save(fileName);
        console.log('PDF salvo via doc.save para desktop');
      }
      
      console.log('Exportação PDF concluída com sucesso');
      alert('PDF gerado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      alert(`Erro ao gerar PDF: ${errorMessage}. Tente exportar como CSV.`);
    }
  }

  private createSimplePDFTable(doc: any, colunas: string[], linhas: any[]) {
    // Fallback: criar tabela simples sem autoTable
    let y = 35;
    const lineHeight = 8;
    const colWidth = 25;
    
    // Cabeçalho
    doc.setFillColor(106, 0, 244);
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(10);
    
    colunas.forEach((coluna, index) => {
      const x = 14 + (index * colWidth);
      doc.rect(x, y, colWidth, lineHeight, 'F');
      doc.text(coluna, x + 2, y + 6);
    });
    
    y += lineHeight;
    
    // Dados
    doc.setFillColor(255, 255, 255);
    doc.setTextColor(0, 0, 0);
    
    linhas.forEach((linha, rowIndex) => {
      if (y > 200) { // Nova página se necessário
        doc.addPage();
        y = 20;
      }
      
      linha.forEach((campo: string, colIndex: number) => {
        const x = 14 + (colIndex * colWidth);
        doc.rect(x, y, colWidth, lineHeight, 'S');
        doc.text(String(campo), x + 2, y + 6);
      });
      
      y += lineHeight;
    });
  }

  private isMobile(): boolean {
    // Verificar se estamos no Capacitor (APK)
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      console.log('Detectado ambiente Capacitor (APK)');
      return true;
    }
    
    // Verificar se estamos no Ionic DevApp ou similar
    if (typeof window !== 'undefined' && (window as any).Ionic) {
      console.log('Detectado ambiente Ionic (APK)');
      return true;
    }
    
    // Verificar user agent para mobile
    const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
    const isMobileUserAgent = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent.toLowerCase());
    
    if (isMobileUserAgent) {
      console.log('Detectado mobile via user agent');
      return true;
    }
    
    console.log('Detectado ambiente desktop/navegador');
    return false;
  }
    
  gerarId(id: string): string {
    if (!id) {
      return '';
    }
    const firstBlock = id.split('-')[0];
    return firstBlock.toUpperCase();
  }
  
  // Formatar número para padrão brasileiro (vírgula para decimal, ponto para milhar)
  formatarValorBR(valor: number): string {
    return formatCurrencyBRL(valor);
  }

  calcularTotaisPorProduto() {
    this.totalPorProduto = {};
    console.log('Calculando totais por produto...');
    console.log('Cupons filtrados:', this.cuponsFiltrados);
  
    for (const cupom of this.cuponsFiltrados) {
      const nomeProduto = cupom.ofertaParceiro?.nomeProduto;
      console.log('>> Processando cupom:', cupom.id, 'Produto:', nomeProduto, 'Data uso:', cupom.dataUtilizacao);

      if (!nomeProduto) {
        console.log('>> Produto não encontrado para cupom:', cupom.id);
        continue;
      }
  
      if (cupom.dataUtilizacao) {
        const preco = cupom.ofertaParceiro?.preco || 0;
        const desconto = cupom.ofertaParceiro?.desconto || 0;
        const valorFinal = preco - (preco * desconto / 100);
  
        if (!this.totalPorProduto[nomeProduto]) {
          this.totalPorProduto[nomeProduto] = 0;
        }
  
        this.totalPorProduto[nomeProduto] += valorFinal;
        console.log('>> Adicionando valor final:', valorFinal, 'para produto:', nomeProduto, 'Total atual:', this.totalPorProduto[nomeProduto]);
      } else {
        console.log('>> Cupom não utilizado:', cupom.id);
      }
    }

    console.log('Totais por produto calculados:', this.totalPorProduto);
  }
  
  voltarParaListaCupons(){
    this.router.navigate(['/dashboard-parceiro']);
  }

  private async compartilharPDF(pdfBlob: Blob, fileName: string) {
    try {
      // Verificar se o Capacitor Share está disponível
      if (typeof Share !== 'undefined' && Share.share) {
        await Share.share({
          title: 'Relatório de Cupons',
          text: `Aqui está seu relatório de cupons: ${fileName}`,
          url: URL.createObjectURL(pdfBlob),
        });
        console.log('PDF compartilhado com sucesso via Capacitor Share!');
      } else {
        console.log('Capacitor Share não disponível, usando fallback de download');
        // Fallback: download direto
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('PDF baixado via fallback');
      }
    } catch (error) {
      console.error('Erro ao compartilhar/compartilhar PDF:', error);
      
      // Fallback em caso de erro
      try {
        const url = URL.createObjectURL(pdfBlob);
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log('PDF baixado via fallback após erro');
        alert('PDF baixado com sucesso!');
      } catch (fallbackError) {
        console.error('Erro no fallback também:', fallbackError);
        alert('Erro ao baixar PDF. Tente novamente.');
      }
    }
  }
}
