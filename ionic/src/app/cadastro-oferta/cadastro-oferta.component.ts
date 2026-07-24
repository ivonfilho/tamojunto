import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { OfertaService } from '../services/oferta.service';
import { Oferta, Endereco } from '../ofertas/oferta.model';
import { ToastController } from '@ionic/angular';
import { UsuarioService } from '../services/api/usuario.service';
import { ParceiroService } from '../services/parceiro.service';
import { EnderecoService } from '../services/api/endereco.service';
import { Router } from '@angular/router';
import { LoadingController } from '@ionic/angular';
import { CATEGORIAS_OFERTA } from '../utils/constants';


@Component({
  selector: 'app-cadastro-oferta',
  templateUrl: './cadastro-oferta.component.html',
  styleUrls: ['./cadastro-oferta.component.scss'],
})
export class CadastroOfertaPage implements OnInit {
  @ViewChild('validade7Dias', { static: false }) validade7DiasRef!: ElementRef<HTMLInputElement>;

  validadeSelecionada: string = '';
  diasValidade: number = 0; 
  imagens: { file: File; path: string }[] = [];
  tipoOfertaSelecionado: string = '';

  // Strings mostradas nos inputs (iniciam vazias)
  precoInput: string = '';
  descontoInput: string = '';

  // Propriedades para categoria personalizada
  categoriaPersonalizada: string = '';
  mostrarCategoriaPersonalizada: boolean = false;
  
  
  counterFormatter = (inputLength: number, maxLength: number) => {
    return `${inputLength} / ${maxLength}`;
  };

  oferta: Oferta = {
    idParceiro: '',
    dataCriacao: new Date().toISOString(),
    validade: new Date().toISOString(),
    descricao: '',
    categoria: undefined as any,
    idEndereco: '',
    nomeProduto: '',
    preco: 0.0,
    desconto: 0.0,
    tipoProduto: undefined as any,
    tipoOferta: '',
    idUsuarioCadastrante: '',
    imagemPaths: [] as string[]
  };

  endereco: Endereco = {
   
    nome:'',
    pais: '',
    rua: '',
    complemento: '',
    estado: undefined as any,
    cidade: '',
    bairro: '',
    idUsuario: '',
  };

  

  estados = [
    'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT',
    'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO',
    'RR', 'SC', 'SP', 'SE', 'TO'
  ];

  categorias = [...CATEGORIAS_OFERTA];

  valorFinal: number = 0;
  valorFinalStr: string = '0,00';

  // Utilitários de máscara/parse BR
  private parseBR(valor: string): number {
    if (!valor || valor.trim() === '') return 0;
    
    console.log(`[DEBUG] ParseBR - Valor original: "${valor}"`);
    
    // Remove todos os pontos (separadores de milhares) e substitui vírgula por ponto
    const sanitized = valor.replace(/\./g, '').replace(',', '.');
    console.log(`[DEBUG] ParseBR - Valor sanitizado: "${sanitized}"`);
    
    const parsed = parseFloat(sanitized);
    const result = isNaN(parsed) ? 0 : parsed;
    
    console.log(`[DEBUG] ParseBR - Valor convertido: ${result}`);
    return result;
  }
  private formatBR(num: number, fractionDigits: number = 2): string {
    try {
      return num.toLocaleString('pt-BR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    } catch {
      return '0,00';
    }
  }

  // Propriedades para upload de imagem
  imagemSelecionada: File | null = null;
  imagemPreview: string | null = null;

  // Método para controlar a exibição do campo de categoria personalizada
  onCategoriaChange() {
    console.log('Categoria selecionada:', this.oferta.categoria);
    
    if (this.oferta.categoria === 'Outros') {
      this.mostrarCategoriaPersonalizada = true;
      // Se já existe uma categoria personalizada, mantém ela
      if (this.categoriaPersonalizada && this.categoriaPersonalizada.trim() !== '') {
        this.oferta.categoria = this.categoriaPersonalizada;
      }
    } else if (this.oferta.categoria === this.categoriaPersonalizada) {
      // Se selecionou a categoria personalizada, mantém o campo visível
      this.mostrarCategoriaPersonalizada = true;
    } else {
      // Se selecionou uma categoria predefinida, esconde o campo personalizado
      this.mostrarCategoriaPersonalizada = false;
      this.categoriaPersonalizada = '';
    }
    
    console.log('Mostrar categoria personalizada:', this.mostrarCategoriaPersonalizada);
    console.log('Categoria atual:', this.oferta.categoria);
  }

  // Método para atualizar a categoria quando o usuário digita no campo personalizado
  onCategoriaPersonalizadaChange() {
    // Atualiza a categoria da oferta com o valor personalizado
    this.oferta.categoria = this.categoriaPersonalizada;
    console.log('Categoria personalizada atualizada:', this.oferta.categoria);
    console.log('Valor da oferta.categoria:', this.oferta.categoria);
    
    // Força a detecção de mudanças para atualizar a interface
    this.cdr.detectChanges();
  }

  constructor(
    private ofertaService: OfertaService,
    private toastController: ToastController,
    private usuarioService: UsuarioService,
    private parceiroService: ParceiroService,
    private enderecoService: EnderecoService,
    private cdr: ChangeDetectorRef,
    private cdRef: ChangeDetectorRef,
    private router: Router,
    private loadingController: LoadingController
    
  ) {}

  ngOnInit() {
    this.calcularValorFinal();
    this.oferta.dataCriacao = new Date().toISOString().split('T')[0];
    console.log('Componente inicializado.');

    const usuarioLogado = this.usuarioService.getUsuarioLogado();
    if (usuarioLogado && usuarioLogado.Id) {
      this.oferta.idUsuarioCadastrante = usuarioLogado.Id;
      this.endereco.idUsuario = usuarioLogado.Id;
      this.parceiroService.buscarParceiroPorUsuario(usuarioLogado.Id).subscribe(
        (response) => {
          if (response && response.idParceiro) {
            this.oferta.idParceiro = response.idParceiro;  
          } else {
            console.error('Parceiro não encontrado');
          }
        },(error) => {
          console.error('Erro ao buscar parceiro:', error);
        }
      );
    } else {
      console.error('Usuário não logado ou ID não encontrado.');
    }
      console.log('Usuário logado atribuído:', usuarioLogado);
      console.log('ID do usuário logado:', this.oferta.idUsuarioCadastrante);
      console.log('ID do usuário para o endereço:', this.endereco.idUsuario);

  }

  // Handlers dos inputs (não formatam agressivamente durante a digitação)
  onPrecoInput(event: any) {
    const raw: string = event?.detail?.value ?? event?.target?.value ?? '';
    // Permite dígitos, pontos de milhar e vírgula como decimal
    this.precoInput = raw.replace(/[^0-9\.,]/g, '');
    this.oferta.preco = this.parseBR(this.precoInput);
    this.calcularValorFinal();
  }
  onPrecoBlur() {
    if (this.precoInput.trim() === '') {
      this.oferta.preco = 0;
      this.valorFinal = 0;
      this.valorFinalStr = '0,00';
      return;
    }
    this.precoInput = this.formatBR(this.oferta.preco);
  }

  onDescontoInput(event: any) {
    const raw: string = event?.detail?.value ?? event?.target?.value ?? '';
    // Permitir números, vírgulas e símbolo %
    this.descontoInput = raw.replace(/[^0-9\.,%]/g, '');
    // Usar o parser de porcentagem ao invés do parser de moeda
    this.oferta.desconto = this.parsePorcentagem(this.descontoInput);
    this.calcularValorFinal();
  }
  
  onDescontoBlur() {
    if (this.descontoInput.trim() === '') {
      this.oferta.desconto = 0;
      this.calcularValorFinal();
      return;
    }
    // Formatar como porcentagem ao invés de moeda
    this.descontoInput = this.formatarPorcentagem(this.oferta.desconto);
  }

  /**
   * Formata um número como porcentagem brasileira (ex: 10% ou 12,5%)
   */
  private formatarPorcentagem(valor: number): string {
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

  /**
   * Remove o símbolo % e converte para número
   */
  private parsePorcentagem(valor: string): number {
    if (!valor || valor.trim() === '') return 0;
    
    // Remove o símbolo % e converte vírgula para ponto
    const sanitized = valor.replace('%', '').replace(',', '.');
    const parsed = parseFloat(sanitized);
    
    return isNaN(parsed) ? 0 : parsed;
  }

  get precoFormatado() {
    return this.oferta.preco ? this.oferta.preco.toFixed(2).replace('.', ',') : '0,00';
  }

  atualizarPreco(event: any) {
    let valorDigitado = event.target.value.replace(/[^\d,]/g, '').replace(',', '.');
    
    if (!valorDigitado || valorDigitado === '0') {
      this.oferta.preco = 0;
      return;
    }
    
    let valorNumerico = parseFloat(valorDigitado);
    if (!isNaN(valorNumerico)) {
      this.oferta.preco = valorNumerico;
      this.calcularValorFinal();
    }
  }

  formatarPreco() {
    if (this.oferta.preco !== null && this.oferta.preco !== undefined) {
      this.oferta.preco = parseFloat(this.oferta.preco.toFixed(2));
      this.calcularValorFinal();
    }
  }
  
  get descontoFormatado() {
    return this.oferta.desconto ? this.oferta.desconto.toFixed(2).replace('.', ',') : '0,00';
  }
  
  get valorFinalFormatado() {
    return this.valorFinal ? this.valorFinal.toFixed(2).replace('.', ',') : '0,00';
  }

  formatarDesconto() {
    if (this.oferta.desconto !== null && this.oferta.desconto !== undefined) {
      this.oferta.desconto = parseFloat(this.oferta.desconto.toFixed(2));
      this.calcularValorFinal();
    }
  }

  atualizarDesconto(event: any) {
    let valorDigitado = event.target.value.replace(/[^\d,]/g, '').replace(',', '.');
    
    if (!valorDigitado || valorDigitado === '0') {
      this.oferta.desconto = 0;
    } else {
      let valorNumerico = parseFloat(valorDigitado);
      if (!isNaN(valorNumerico)) {
        this.oferta.desconto = valorNumerico;
      }
    }
    
    this.calcularValorFinal();
  }
  
  
  calcularValorFinal(): void {
    const preco = this.oferta.preco || 0;
    const desconto = this.oferta.desconto || 0;
    
    console.log(`[DEBUG] Calculando valor final:`);
    console.log(`  - Preço: ${preco}`);
    console.log(`  - Desconto: ${desconto}%`);
    
    if (preco > 0) {
      const valorDesconto = (preco * desconto) / 100;
      this.valorFinal = preco - valorDesconto;
      
      console.log(`  - Valor do desconto: ${valorDesconto}`);
      console.log(`  - Valor final: ${this.valorFinal}`);
    } else {
      this.valorFinal = 0;
      console.log(`  - Preço é 0, valor final: 0`);
    }
    
    // Arredondar para 2 casas decimais para evitar problemas de precisão
    this.valorFinal = Math.round(this.valorFinal * 100) / 100;
    this.valorFinalStr = this.formatBR(this.valorFinal);
    
    console.log(`  - Valor final arredondado: ${this.valorFinal}`);
    console.log(`  - Valor final formatado: ${this.valorFinalStr}`);
    
    this.cdr.detectChanges(); 
  }


  async mostrarToast(message: string, isError: boolean = false) {
    const toast = await this.toastController.create({
      message: message,
      duration: 2000,
      position: 'top',
      color: isError ? 'danger' : 'success',
    });
    toast.present();
  }

    onTipoOfertaChange(event: Event): void {
      this.tipoOfertaSelecionado = (event.target as HTMLInputElement).value;

      if (this.tipoOfertaSelecionado === 'relampago') {
        this.diasValidade = 7;
        this.validadeSelecionada = '7 dias'; 
        this.oferta.validade = this.getDataValidade(7); 
      } else if (this.tipoOfertaSelecionado === 'normal') {
        this.diasValidade = 0;
        this.validadeSelecionada = '';  
        this.oferta.validade = '';
      }
    }


    preencherDataValidade(validadeSelecionada: string): void {
      let dias: number;
    
      
      switch (validadeSelecionada) {
        case '7 dias':
          dias = 7;
          break;
        case '15 dias':
          dias = 15;
          break;
        case '30 dias':
          dias = 30;
          break;
        case '60 dias':
          dias = 60;
          break;
        default:
          dias = 0;
      }
    
      if (dias > 0) {
        const dataAtual = new Date();
        const validade = new Date(dataAtual);
        validade.setDate(dataAtual.getDate() + dias);
    
        // Formata a data no formato 'yyyy-MM-dd'
        const ano = validade.getFullYear();
        const mes = (validade.getMonth() + 1).toString().padStart(2, '0');
        const dia = validade.getDate().toString().padStart(2, '0');
        this.oferta.validade = `${ano}-${mes}-${dia}`;
        
        console.log(`Validade ajustada para: ${this.oferta.validade}`);
      }
    }
    
    getDataValidade(dias: number): string {
      const data = new Date();
      data.setDate(data.getDate() + dias); 
      return data.toISOString().split('T')[0]; 
    }

    // Métodos para upload de imagem
    triggerFileInput() {
      const fileInput = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInput) {
        fileInput.click();
      }
    }

    async onFileSelected(event: any) {
      const file: File = event.target.files[0];
      if (file) {
        // Validar tipo de arquivo
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
          await this.mostrarToast('Tipo de arquivo não suportado. Use apenas JPG, PNG ou GIF.', true);
          return;
        }
        
        // Validar tamanho (máximo 5MB)
        if (file.size > 5 * 1024 * 1024) {
          await this.mostrarToast('A imagem deve ter no máximo 5MB.', true);
          return;
        }
        
        this.imagemSelecionada = file;
        
        // Criar preview
        const reader = new FileReader();
        reader.onload = (e: any) => {
          this.imagemPreview = e.target.result;
          this.cdr.detectChanges();
        };
        reader.readAsDataURL(file);
      }
    }

    removerImagem() {
      this.imagemSelecionada = null;
      this.imagemPreview = null;
      this.cdr.detectChanges();
    }

    async uploadImagemOferta(ofertaId: string): Promise<void> {
      if (!this.imagemSelecionada) return;

      const loading = await this.loadingController.create({
        message: 'Fazendo upload da imagem...',
        spinner: 'crescent'
      });
      await loading.present();

      try {
        const formData = new FormData();
        formData.append('file', this.imagemSelecionada);
        formData.append('ofertaId', ofertaId);

        console.log('=== UPLOAD DE IMAGEM ===');
        console.log('Fazendo upload da imagem para oferta:', ofertaId);
        console.log('Arquivo:', this.imagemSelecionada.name, 'Tamanho:', this.imagemSelecionada.size);
        console.log('URL da API:', `${this.ofertaService.URL_API}/api/ofertaParceiro/${ofertaId}/UploadImagem`);

        const response = await fetch(`${this.ofertaService.URL_API}/api/ofertaParceiro/${ofertaId}/UploadImagem`, {
          method: 'POST',
          body: formData
        });

        console.log('Resposta do upload:', response.status, response.statusText);

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Erro na resposta:', errorText);
          throw new Error(`Erro ao fazer upload da imagem: ${response.status} ${response.statusText}`);
        }

        const responseData = await response.json();
        console.log('Upload realizado com sucesso:', responseData);

        await this.mostrarToast('Imagem enviada com sucesso!');
      } catch (error) {
        console.error('Erro ao fazer upload da imagem:', error);
        await this.mostrarToast('Erro ao fazer upload da imagem.', true);
      } finally {
        await loading.dismiss();
      }
    }


  async cadastrarOferta(): Promise<void> {
    console.log('Dados do endereço:', this.endereco);
  try {
    if (!this.validarEndereco() || !this.validarOferta()) return;

    // Validação da data personalizada
    if (!this.validarData(this.oferta.validade)) {
      await this.mostrarToast('Data inválida. Insira uma data válida para a validade da oferta.', true);
      return;
    }
    
    // Criação do endereço
    const enderecoCriado = await this.criarEndereco(this.endereco);

    if (enderecoCriado?.id) {
      this.oferta.idEndereco = enderecoCriado.id;
    } else {
      throw new Error('Endereço criado sem ID retornado.');
    }
      const enderecoPayload = this.transformarEnderecoParaPascalCase(this.endereco);
      const ofertaPayload = this.transformarParaPascalCase(this.oferta);


      console.log('Enviando dados da oferta e endereço para a API:', { ofertaPayload, enderecoPayload });
      
      const ofertaCriada = await this.ofertaService.criarOferta(ofertaPayload).toPromise();
      console.log('Resposta da API para criar oferta:', ofertaCriada);
      console.log('Tipo da resposta:', typeof ofertaCriada);
      console.log('Chaves da resposta:', Object.keys(ofertaCriada || {}));

      if (!ofertaCriada?.['success']) {
        throw new Error('Erro ao criar oferta.');
      }

      // Upload da imagem se houver
      if (this.imagemSelecionada) {
        const ofertaId = ofertaCriada['id'];
        console.log('Resposta completa da API:', ofertaCriada);
        console.log('ID extraído:', ofertaId, 'Tipo:', typeof ofertaId);
        
        if (ofertaId) {
          console.log('Fazendo upload da imagem para oferta:', ofertaId);
          console.log('Arquivo selecionado:', this.imagemSelecionada.name, 'Tamanho:', this.imagemSelecionada.size, 'Tipo:', this.imagemSelecionada.type);
          await this.uploadImagemOferta(ofertaId);
        } else {
          console.error('ID da oferta não encontrado na resposta:', ofertaCriada);
          await this.mostrarToast('Oferta criada, mas houve erro ao fazer upload da imagem.', true);
        }
      } else {
        console.log('Nenhuma imagem selecionada para upload');
      }

      // Sucesso
      await this.mostrarToast('Oferta cadastrada com sucesso!');
      
      this.limparCampos();
      await this.voltarParaListarOfertas();

    } catch (error) {
      console.error('Erro ao cadastrar a oferta:', (error as Error).message, (error as Error).stack);
      console.error('Erro ao cadastrar a oferta:', error);
      await this.mostrarToast('Erro ao cadastrar a oferta. Verifique os dados e tente novamente.', true);
    }
  }

  private validarEndereco(): boolean {
    if (!this.endereco.rua ||
        !this.endereco.cidade || !this.endereco.estado) {
      this.mostrarToast('Preencha todos os campos obrigatórios do endereço.', true);
      return false;
    }
    return true;
  }

  private validarOferta(): boolean {
    if (!this.oferta.nomeProduto) {
      console.error(`Erro: O campo obrigatório "Nome do Produto" está faltando!`);
      this.mostrarToast('O campo "Nome do Produto" é de preenchimento obrigatório.', true);
      return false;
    }
  
    if (this.oferta.preco <= 0) {
      console.error(`Erro: O campo obrigatório "Preço" deve ser maior que zero! Valor atual: ${this.oferta.preco}`);
      this.mostrarToast('O campo "Preço" deve ser maior que zero.', true);
      return false;
    }
  
    if (!this.oferta.descricao) {
      console.error(`Erro: O campo obrigatório "Descrição" está faltando!`);
      this.mostrarToast('O campo "Descrição" é de preenchimento obrigatório.', true);
      return false;
    }
  
    if (!this.oferta.categoria) {
      console.error(`Erro: O campo obrigatório "Categoria" está faltando!`);
      this.mostrarToast('O campo "Categoria" é de preenchimento obrigatório.', true);
      return false;
    }

    // Validação específica para categoria personalizada
    if (this.mostrarCategoriaPersonalizada && !this.categoriaPersonalizada.trim()) {
      console.error(`Erro: O campo obrigatório "Categoria Personalizada" está faltando!`);
      this.mostrarToast('O campo "Categoria Personalizada" é de preenchimento obrigatório quando selecionar "Outros".', true);
      return false;
    }
  
    return true;
  }
  

  private criarEndereco(endereco: Endereco): Promise<any> {
    return new Promise((resolve, reject) => {
      this.enderecoService.criarEndereco(endereco).subscribe(
        (enderecoCriado) => {
          if (enderecoCriado?.id) {
            console.log('Endereço criado:', enderecoCriado);
            resolve(enderecoCriado);
          } else {
            reject(new Error('Erro: ID do endereço não foi retornado.'));
          }
        },
        (error) => {
          console.error('Erro ao criar endereço:', error);
          this.mostrarToast('Erro ao cadastrar o endereço.', true);
          reject(error);
        }
      );
    });
  }

  transformarEnderecoParaPascalCase(endereco: Endereco): any {
    const transformed = { ...endereco };
    for (const key in transformed) {
      if (transformed.hasOwnProperty(key)) {
        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1); 
        if (pascalKey !== key) {
          transformed[pascalKey] = transformed[key];
          delete transformed[key]; 
        }
      }
    }
  
    return transformed;
  }
  
  transformarParaPascalCase(oferta: Oferta): any {
    const transformed = { ...oferta };
    for (const key in transformed) {
      if (transformed.hasOwnProperty(key)) {
        const pascalKey = key.charAt(0).toUpperCase() + key.slice(1);
        if (pascalKey !== key) {
          transformed[pascalKey] = transformed[key];
          delete transformed[key];
        }
      }
    }
    return transformed;
  }
  

  private limparCampos() {
    this.oferta = {
      idParceiro: '',
      dataCriacao: new Date().toISOString(),
      validade: new Date().toISOString(),
      descricao: '',
      categoria: undefined as any,
      idEndereco: '',
      nomeProduto: '',
      preco: 0.0,
      desconto: 0.0,
      tipoProduto: undefined as any,
      tipoOferta: '',
      idUsuarioCadastrante: '',
      imagemPaths: [] as string[]
    };
    this.endereco = {
      
      nome: '',
      pais: '',
      rua: '',
      complemento: '',
      estado: undefined as any,
      cidade: '',
      bairro: '',
      idUsuario: '',
    };
    this.validadeSelecionada = '';
    this.imagemSelecionada = null;
    this.imagemPreview = null;
    
    // Limpar campos de categoria personalizada
    this.categoriaPersonalizada = '';
    this.mostrarCategoriaPersonalizada = false;
    
    console.log('Campos limpos após cadastro!');
  }

  async voltarParaListarOfertas() {
    // Exibe o loading
    const loading = await this.loadingController.create({
      message: 'Carregando Ofertas...',
      spinner: 'crescent', 
      duration: 2000, 
    });
  
    await loading.present();
    
    // Usar replaceUrl para garantir que a página seja recarregada
    // e não fique no histórico de navegação
    this.router.navigate(['/ofertas'], { replaceUrl: true }).then(() => {
      loading.dismiss();
      console.log('[CadastroOferta] Navegação para ofertas concluída');
    }).catch(error => {
      console.error('[CadastroOferta] Erro na navegação:', error);
      loading.dismiss();
    });
  }
  private validarData(data: string): boolean {
    const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dataRegex.test(data);
  }
}

