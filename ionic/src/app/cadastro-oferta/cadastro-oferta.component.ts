import { Component, OnInit, ViewChild, ElementRef, ChangeDetectorRef } from '@angular/core';
import { OfertaService } from '../services/oferta.service';
import { Oferta, Endereco } from '../ofertas/oferta.model';
import { ToastController, LoadingController } from '@ionic/angular';
import { UsuarioService } from '../services/api/usuario.service';
import { ParceiroService } from '../services/parceiro.service';
import { EnderecoService } from '../services/api/endereco.service';
import { Router } from '@angular/router';
import { CATEGORIAS_OFERTA } from '../utils/constants';

@Component({
  selector: 'app-cadastro-oferta',
  templateUrl: './cadastro-oferta.component.html',
  styleUrls: ['./cadastro-oferta.component.scss'],
})
export class CadastroOfertaPage implements OnInit {
  @ViewChild('validade7Dias', { static: false }) validade7DiasRef!: ElementRef<HTMLInputElement>;
  @ViewChild('fileInput', { static: false }) fileInput!: ElementRef<HTMLInputElement>;

  validadeSelecionada: string = '7 dias';
  diasValidade: number = 7; // Inicia com 7 para o padrão
  imagens: { file: File; path: string }[] = [];
  tipoOfertaSelecionado: string = '';

  precoInput: string = '';
  descontoInput: string = '';

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

  private parseBR(valor: string): number {
    if (!valor || valor.trim() === '') return 0;
    const sanitized = valor.replace(/\./g, '').replace(',', '.');
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : parsed;
  }

  private formatBR(num: number, fractionDigits: number = 2): string {
    try {
      return num.toLocaleString('pt-BR', { minimumFractionDigits: fractionDigits, maximumFractionDigits: fractionDigits });
    } catch {
      return '0,00';
    }
  }

  imagemSelecionada: File | null = null;
  imagemPreview: string | null = null;

  constructor(
    private ofertaService: OfertaService,
    private toastController: ToastController,
    private usuarioService: UsuarioService,
    private parceiroService: ParceiroService,
    private enderecoService: EnderecoService,
    private cdr: ChangeDetectorRef,
    private router: Router,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {
    this.calcularValorFinal();
    this.oferta.dataCriacao = new Date().toISOString().split('T')[0];

    const usuarioLogado = this.usuarioService.getUsuarioLogado();
    if (usuarioLogado && usuarioLogado.Id) {
      this.oferta.idUsuarioCadastrante = usuarioLogado.Id;
      this.endereco.idUsuario = usuarioLogado.Id;
      this.parceiroService.buscarParceiroPorUsuario(usuarioLogado.Id).subscribe(
        (response) => {
          if (response && response.idParceiro) {
            this.oferta.idParceiro = response.idParceiro;
          }
        },
        (error) => console.error('Erro ao buscar parceiro:', error)
      );
    }
  }

  onCategoriaChange() {
    if (this.oferta.categoria === 'Outros') {
      this.mostrarCategoriaPersonalizada = true;
      if (this.categoriaPersonalizada && this.categoriaPersonalizada.trim() !== '') {
        this.oferta.categoria = this.categoriaPersonalizada;
      }
    } else if (this.oferta.categoria === this.categoriaPersonalizada) {
      this.mostrarCategoriaPersonalizada = true;
    } else {
      this.mostrarCategoriaPersonalizada = false;
      this.categoriaPersonalizada = '';
    }
  }

  onCategoriaPersonalizadaChange() {
    this.oferta.categoria = this.categoriaPersonalizada;
    this.cdr.detectChanges();
  }

  onPrecoInput(event: any) {
    const raw: string = event?.detail?.value ?? event?.target?.value ?? '';
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
    this.descontoInput = raw.replace(/[^0-9\.,%]/g, '');
    this.oferta.desconto = this.parsePorcentagem(this.descontoInput);
    this.calcularValorFinal();
  }

  onDescontoBlur() {
    if (this.descontoInput.trim() === '') {
      this.oferta.desconto = 0;
      this.calcularValorFinal();
      return;
    }
    this.descontoInput = this.formatarPorcentagem(this.oferta.desconto);
  }

  private formatarPorcentagem(valor: number): string {
    if (valor === null || valor === undefined || isNaN(valor)) {
      return '0%';
    }
    if (Number.isInteger(valor)) {
      return `${valor}%`;
    }
    const valorFormatado = valor.toFixed(2).replace(/\.?0+$/, '').replace('.', ',');
    return `${valorFormatado}%`;
  }

  private parsePorcentagem(valor: string): number {
    if (!valor || valor.trim() === '') return 0;
    const sanitized = valor.replace('%', '').replace(',', '.');
    const parsed = parseFloat(sanitized);
    return isNaN(parsed) ? 0 : parsed;
  }

  calcularValorFinal(): void {
    const preco = this.oferta.preco || 0;
    const desconto = this.oferta.desconto || 0;

    if (preco > 0) {
      const valorDesconto = (preco * desconto) / 100;
      this.valorFinal = preco - valorDesconto;
    } else {
      this.valorFinal = 0;
    }

    this.valorFinal = Math.round(this.valorFinal * 100) / 100;
    this.valorFinalStr = this.formatBR(this.valorFinal);
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

  // Lógica corrigida para selecionar "7 dias" automaticamente e renderizar
  onTipoOfertaChange(event: Event): void {
    this.tipoOfertaSelecionado = (event.target as HTMLInputElement).value;

    if (this.tipoOfertaSelecionado === 'relampago') {
      this.diasValidade = 7;
      this.validadeSelecionada = '7 dias';
      this.preencherDataValidade('7 dias');
    } else if (this.tipoOfertaSelecionado === 'normal') {
      this.diasValidade = 7;
      this.validadeSelecionada = '7 dias';
      this.preencherDataValidade('7 dias');
    }

    this.cdr.detectChanges();
  }

  preencherDataValidade(validadeSelecionada: string): void {
    let dias: number;
    switch (validadeSelecionada) {
      case '7 dias': dias = 7; break;
      case '15 dias': dias = 15; break;
      case '30 dias': dias = 30; break;
      case '60 dias': dias = 60; break;
      default: dias = 0;
    }

    if (dias > 0) {
      const dataAtual = new Date();
      const validade = new Date(dataAtual);
      validade.setDate(dataAtual.getDate() + dias);

      const ano = validade.getFullYear();
      const mes = (validade.getMonth() + 1).toString().padStart(2, '0');
      const dia = validade.getDate().toString().padStart(2, '0');
      this.oferta.validade = `${ano}-${mes}-${dia}`;
    }
  }

  getDataValidade(dias: number): string {
    const data = new Date();
    data.setDate(data.getDate() + dias);
    return data.toISOString().split('T')[0];
  }

  triggerFileInput() {
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.click();
    } else {
      const fileInp = document.getElementById('fileInput') as HTMLInputElement;
      if (fileInp) fileInp.click();
    }
  }

  async onFileSelected(event: any) {
    const file: File = event.target.files[0];
    if (file) {
      if (!['image/jpeg', 'image/jpg', 'image/png', 'image/gif'].includes(file.type)) {
        await this.mostrarToast('Tipo de arquivo não suportado. Use apenas JPG, PNG ou GIF.', true);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        await this.mostrarToast('A imagem deve ter no máximo 5MB.', true);
        return;
      }

      this.imagemSelecionada = file;
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
    if (this.fileInput && this.fileInput.nativeElement) {
      this.fileInput.nativeElement.value = '';
    }
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

      const response = await fetch(`${this.ofertaService.URL_API}/api/ofertaParceiro/${ofertaId}/UploadImagem`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Erro ao fazer upload da imagem: ${response.status} ${response.statusText}`);
      }

      await this.mostrarToast('Imagem enviada com sucesso!');
    } catch (error) {
      console.error('Erro ao fazer upload:', error);
      await this.mostrarToast('Erro ao fazer upload da imagem.', true);
    } finally {
      await loading.dismiss();
    }
  }

  async cadastrarOferta(): Promise<void> {
    try {
      if (!this.validarEndereco() || !this.validarOferta()) return;
      if (!this.validarData(this.oferta.validade)) {
        await this.mostrarToast('Data inválida.', true);
        return;
      }

      const enderecoCriado = await this.criarEndereco(this.endereco);
      if (enderecoCriado?.id) {
        this.oferta.idEndereco = enderecoCriado.id;
      } else {
        throw new Error('Endereço criado sem ID.');
      }

      const ofertaPayload = this.transformarParaPascalCase(this.oferta);
      const ofertaCriada = await this.ofertaService.criarOferta(ofertaPayload).toPromise();

      if (!ofertaCriada?.['success']) {
        throw new Error('Erro ao criar oferta.');
      }

      if (this.imagemSelecionada) {
        const ofertaId = ofertaCriada['id'];
        if (ofertaId) {
          await this.uploadImagemOferta(ofertaId);
        } else {
          await this.mostrarToast('Oferta criada, erro ao anexar imagem.', true);
        }
      }

      await this.mostrarToast('Oferta cadastrada com sucesso!');
      this.limparCampos();
      await this.voltarParaListarOfertas();

    } catch (error) {
      console.error('Erro geral ao cadastrar:', error);
      await this.mostrarToast('Erro ao cadastrar a oferta. Verifique os dados.', true);
    }
  }

  private validarEndereco(): boolean {
    if (!this.endereco.rua || !this.endereco.cidade || !this.endereco.estado) {
      this.mostrarToast('Preencha todos os campos obrigatórios do endereço.', true);
      return false;
    }
    return true;
  }

  private validarOferta(): boolean {
    if (!this.oferta.nomeProduto) {
      this.mostrarToast('O campo "Nome do Produto" é obrigatório.', true);
      return false;
    }
    if (this.oferta.preco <= 0) {
      this.mostrarToast('O campo "Preço" deve ser maior que zero.', true);
      return false;
    }
    if (!this.oferta.descricao) {
      this.mostrarToast('O campo "Descrição" é obrigatório.', true);
      return false;
    }
    if (!this.oferta.categoria) {
      this.mostrarToast('O campo "Categoria" é obrigatório.', true);
      return false;
    }
    if (this.mostrarCategoriaPersonalizada && !this.categoriaPersonalizada.trim()) {
      this.mostrarToast('O campo "Categoria Personalizada" é obrigatório.', true);
      return false;
    }
    return true;
  }

  private criarEndereco(endereco: Endereco): Promise<any> {
    return new Promise((resolve, reject) => {
      this.enderecoService.criarEndereco(endereco).subscribe(
        (enderecoCriado) => {
          if (enderecoCriado?.id) {
            resolve(enderecoCriado);
          } else {
            reject(new Error('Erro: ID do endereço não retornado.'));
          }
        },
        (error) => {
          this.mostrarToast('Erro ao cadastrar o endereço.', true);
          reject(error);
        }
      );
    });
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
      idParceiro: '', dataCriacao: new Date().toISOString(), validade: new Date().toISOString(),
      descricao: '', categoria: undefined as any, idEndereco: '', nomeProduto: '', preco: 0.0,
      desconto: 0.0, tipoProduto: undefined as any, tipoOferta: '', idUsuarioCadastrante: '',
      imagemPaths: [] as string[]
    };
    this.endereco = {
      nome: '', pais: '', rua: '', complemento: '', estado: undefined as any,
      cidade: '', bairro: '', idUsuario: '',
    };
    this.validadeSelecionada = '7 dias';
    this.imagemSelecionada = null;
    this.imagemPreview = null;
    this.categoriaPersonalizada = '';
    this.mostrarCategoriaPersonalizada = false;
  }

  async voltarParaListarOfertas() {
    const loading = await this.loadingController.create({
      message: 'Carregando Ofertas...',
      spinner: 'crescent',
      duration: 2000,
    });
    await loading.present();

    this.router.navigate(['/ofertas-parceiro'], { replaceUrl: true }).then(() => {
      loading.dismiss();
    }).catch(error => {
      loading.dismiss();
    });
  }

  private validarData(data: string): boolean {
    const dataRegex = /^\d{4}-\d{2}-\d{2}$/;
    return dataRegex.test(data);
  }
}
