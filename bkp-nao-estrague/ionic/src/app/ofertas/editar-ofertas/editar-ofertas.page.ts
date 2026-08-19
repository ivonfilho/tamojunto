import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Oferta } from '../oferta.model';
import { OfertaService } from 'src/app/services/oferta.service';
import { AlertController } from '@ionic/angular';
import { CATEGORIAS_OFERTA } from '../../utils/constants';
import { formatCurrencyBRL } from '../../utils/currency.util';


@Component({
  selector: 'app-editar-oferta',
  templateUrl: './editar-ofertas.page.html',
  styleUrls: ['./editar-ofertas.page.scss'],
})
export class EditarOfertasPage implements OnInit {

  oferta: Oferta = {
    id: '',
    idParceiro: '',
    dataCriacao: '',
    validade: '',
    descricao: '',
    categoria: undefined as any,
    idEndereco: '',
    nomeProduto: '',
    preco: 0,
    desconto: 0,
    tipoProduto: undefined as any,
    tipoOferta: '',
    idUsuarioCadastrante: '',
    imagem: [],
    imagemPaths: ['']
  };

  valorFinal: number = 0;
  errors: any = {};

  categorias: string[] = [...CATEGORIAS_OFERTA];

  // Propriedades para categoria personalizada
  categoriaPersonalizada: string = '';
  mostrarCategoriaPersonalizada: boolean = false;

  // Strings mostradas nos inputs (iniciam vazias)
  precoInput: string = '';
  descontoInput: string = '';

  // Upload de imagem (edição)
  imagemSelecionada: File | null = null;
  imagemPreview: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private ofertaService: OfertaService,
    private router: Router,
    private alertController: AlertController
  ) {}

  ngOnInit() {
    const ofertaId = this.route.snapshot.paramMap.get('id');
    if (ofertaId) {
      this.ofertaService.obterOfertaPorId(ofertaId).subscribe({
        next: (oferta) => {
          if (!oferta || !oferta.id) {
            this.exibirAlerta('Erro', 'Oferta não encontrada! Retornando à listagem.');
            this.router.navigate(['/ofertas']);
            return;
          }
          this.oferta = oferta;
          
          if (this.oferta.validade) {
            const data = new Date(this.oferta.validade);
            this.oferta.validade = data.toISOString().split('T')[0];
          }
          
          this.oferta.preco = this.formatarParaNumero(this.oferta.preco);
          this.oferta.desconto = this.formatarParaNumero(this.oferta.desconto);
          
          this.precoInput = this.formatBR(this.oferta.preco);
          this.descontoInput = this.formatarParaPorcentagem(this.oferta.desconto);
          
          this.calcularValorFinal();
          this.verificarCategoriaPersonalizada();
        },
        error: (err) => {
          console.error('Erro ao buscar oferta:', err);
          this.exibirAlerta('Erro', 'Oferta não encontrada! Retornando à listagem.');
          this.router.navigate(['/ofertas']);
        }
      });
    }
  }

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
  }

  // Método para verificar se a categoria atual é personalizada
  verificarCategoriaPersonalizada() {
    if (this.oferta.categoria && !this.categorias.includes(this.oferta.categoria as any)) {
      this.mostrarCategoriaPersonalizada = true;
      this.categoriaPersonalizada = this.oferta.categoria;
    }
  }

  async exibirAlerta(titulo: string, mensagem: string) {
    const alert = await this.alertController.create({
      header: titulo,
      message: mensagem,
      buttons: ['OK'],
    });
    await alert.present();
  }



  validarCampos(): boolean {
    this.errors = {};
    console.log('[Validação] Iniciando validação dos campos...');

    // Validar campos obrigatórios
    if (!this.oferta?.nomeProduto || this.oferta.nomeProduto.trim() === '') {
      this.errors.nomeProduto = 'O campo Nome do Produto é de preenchimento obrigatório.';
      console.error('[Validação] Nome do produto inválido:', this.oferta?.nomeProduto);
    }
    
    if (!this.oferta?.categoria || this.oferta.categoria.trim() === '') {
      this.errors.categoria = 'O campo Categoria é de preenchimento obrigatório.';
      console.error('[Validação] Categoria inválida:', this.oferta?.categoria);
    }
    
    // Validação específica para categoria personalizada
    if (this.mostrarCategoriaPersonalizada && (!this.categoriaPersonalizada || this.categoriaPersonalizada.trim() === '')) {
      this.errors.categoriaPersonalizada = 'O campo Categoria Personalizada é de preenchimento obrigatório quando selecionar "Outros".';
      console.error('[Validação] Categoria personalizada inválida:', this.categoriaPersonalizada);
    }
    
    if (!this.oferta?.tipoProduto || this.oferta.tipoProduto.trim() === '') {
      this.errors.tipoProduto = 'O campo Tipo de Produto é de preenchimento obrigatório.';
      console.error('[Validação] Tipo de produto inválido:', this.oferta?.tipoProduto);
    }
    
    if (!this.oferta?.preco || this.oferta.preco <= 0) {
      this.errors.preco = 'O campo Preço deve ser maior que zero.';
      console.error('[Validação] Preço inválido:', this.oferta?.preco);
    }
    
    if (!this.oferta?.validade) {
      this.errors.validade = 'O campo Validade é de preenchimento obrigatório.';
      console.error('[Validação] Validade inválida:', this.oferta?.validade);
    }

    // Validar campos de ID
    if (!this.oferta?.id) {
      this.errors.id = 'ID da oferta não encontrado.';
      console.error('[Validação] ID da oferta inválido:', this.oferta?.id);
    }
    
    if (!this.oferta?.idParceiro) {
      this.errors.idParceiro = 'ID do parceiro não encontrado.';
      console.error('[Validação] ID do parceiro inválido:', this.oferta?.idParceiro);
    }
    
    if (!this.oferta?.idEndereco) {
      this.errors.idEndereco = 'ID do endereço não encontrado.';
      console.error('[Validação] ID do endereço inválido:', this.oferta?.idEndereco);
    }
    
    if (!this.oferta?.idUsuarioCadastrante) {
      this.errors.idUsuarioCadastrante = 'ID do usuário cadastrante não encontrado.';
      console.error('[Validação] ID do usuário cadastrante inválido:', this.oferta?.idUsuarioCadastrante);
    }

    const isValid = Object.keys(this.errors).length === 0;
    console.log('[Validação] Resultado da validação:', isValid ? '✅ VÁLIDO' : '❌ INVÁLIDO');
    
    if (!isValid) {
      console.error('[Validação] Erros encontrados:', this.errors);
    }
    
    return isValid;
  }

  formatarParaBRL(valor: number): string {
    if (!valor && valor !== 0) return formatCurrencyBRL(0);
    return formatCurrencyBRL(valor);
  }

  formatarParaPorcentagem(valor: number): string {
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

  calcularValorFinal() {
    if (this.oferta) {
      const preco = this.oferta.preco || 0;
      const desconto = this.oferta.desconto || 0;
      
      // Calcular desconto como percentual do preço
      const valorDesconto = (preco * desconto) / 100;
      this.valorFinal = Math.max(0, preco - valorDesconto);
      
      console.log('[Cálculo] Preço:', preco, 'Desconto:', desconto + '%', 'Valor Desconto:', valorDesconto, 'Valor Final:', this.valorFinal);
    }
  }

  onPrecoOuDescontoChange(tipo: 'preco' | 'desconto', valorFormatado: any) {
    console.log(`[onPrecoOuDescontoChange] Tipo: ${tipo}, Valor:`, valorFormatado);
    
    if (tipo === 'desconto') {
      // Para desconto, remover o símbolo % antes de converter
      const valorLimpo = valorFormatado.toString().replace('%', '');
      this.oferta[tipo] = this.formatarParaNumero(valorLimpo);
    } else {
      this.oferta[tipo] = this.formatarParaNumero(valorFormatado);
    }
    
    console.log(`[onPrecoOuDescontoChange] ${tipo} atualizado:`, this.oferta[tipo]);
    this.calcularValorFinal();
  }

  onPrecoOuDescontoBlur(tipo: 'preco' | 'desconto') {
    console.log(`[onPrecoOuDescontoBlur] Tipo: ${tipo}`);
    
    if (tipo === 'preco') {
      // Garantir que o preço seja um número válido
      this.oferta.preco = this.formatarParaNumero(this.oferta.preco);
    } else if (tipo === 'desconto') {
      // Garantir que o desconto seja um número válido
      this.oferta.desconto = this.formatarParaNumero(this.oferta.desconto);
    }
    
    this.calcularValorFinal();
  }

  formatarParaNumero(valor: any): number {
    if (valor === null || valor === undefined || valor === '') return 0;
    
    // Se já é um número, retornar diretamente
    if (typeof valor === 'number') return valor;
    
    // Converter string para número
    const stringValor = valor.toString();
    
    // Remover símbolos de moeda e porcentagem
    let valorLimpo = stringValor
      .replace(/[R$\s]/g, '') // Remove R$, espaços
      .replace(/[%]/g, '') // Remove %
      .replace(/\./g, '') // Remove pontos (separadores de milhares)
      .replace(',', '.'); // Substitui vírgula por ponto (decimal)
    
    const resultado = parseFloat(valorLimpo);
    
    // Log para debug
    console.log('formatarParaNumero - Input:', valor, 'Valor limpo:', valorLimpo, 'Output:', resultado);
    
    return isNaN(resultado) ? 0 : resultado;
  }

  // Utilitários de máscara/parse BR (iguais ao cadastro)
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
    this.descontoInput = this.formatarParaPorcentagem(this.oferta.desconto);
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

  onQuantidadeChange(event: any) {
    const quantidade = parseInt(event.target.value, 10);
    if (quantidade <= 0) {
      event.target.value = 1;
    }
  }

  // Dispara o input de arquivo oculto
  triggerFileInput() {
    const input = document.getElementById('fileInputEditar') as HTMLInputElement | null;
    input?.click();
  }

  // Handler para seleção de arquivo
  onFileSelected(event: any) {
    const file: File | undefined = event?.target?.files?.[0];
    if (!file) return;

    // Limite simples de tamanho (5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Arquivo muito grande. Tamanho máximo: 5MB');
      return;
    }

    this.imagemSelecionada = file;

    const reader = new FileReader();
    reader.onload = () => {
      this.imagemPreview = reader.result as string;
    };
    reader.readAsDataURL(file);
  }

  removerImagem() {
    this.imagemSelecionada = null;
    this.imagemPreview = null;
  }

  private async uploadImagemOferta(ofertaId: string): Promise<void> {
    if (!this.imagemSelecionada) return;

    try {
      const formData = new FormData();
      formData.append('file', this.imagemSelecionada);
      formData.append('ofertaId', ofertaId);

      const response = await fetch(`${this.ofertaService.URL_API}/api/ofertaParceiro/${ofertaId}/UploadImagem`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Erro no upload:', errorText);
        throw new Error('Falha ao enviar a imagem.');
      }
      await response.json().catch(() => null);
    } catch (err) {
      console.error('Upload de imagem falhou:', err);
      // Não bloquear a edição por falha no upload
    }
  }

  async salvarOferta() {
    if (!this.validarCampos()) return;

    // Log da oferta original para debug
    console.log('Oferta original:', this.oferta);

    // Teste: verificar se todos os campos obrigatórios existem
    const camposObrigatorios = [
      'id', 'idParceiro', 'idEndereco', 'idUsuarioCadastrante',
      'nomeProduto', 'categoria', 'tipoProduto', 'preco', 'validade'
    ];
    
    const camposFaltando = camposObrigatorios.filter(campo => {
      // Usar type assertion para resolver o problema de tipagem
      return !(this.oferta as any)[campo];
    });
    if (camposFaltando.length > 0) {
      console.error('Campos obrigatórios faltando:', camposFaltando);
      this.exibirAlerta('Erro', `Campos obrigatórios faltando: ${camposFaltando.join(', ')}`);
      return;
    }

    const payload = {
      id: this.oferta.id,
      idParceiro: this.oferta.idParceiro,
      dataCriacao: new Date().toISOString(),
      validade: this.oferta.validade ? new Date(this.oferta.validade).toISOString() : '',
      qrCodePath: 'string',
      descricao: this.oferta.descricao || '',
      categoria: this.oferta.categoria || '',
      idEndereco: this.oferta.idEndereco,
      nomeProduto: this.oferta.nomeProduto || '',
      preco: this.formatarParaNumero(this.oferta.preco) || 0,
      desconto: this.formatarParaNumero(this.oferta.desconto) || 0,
      tipoProduto: this.oferta.tipoProduto || '',
      tipoOferta: this.oferta.tipoOferta || '',
      idUsuarioCadastrante: this.oferta.idUsuarioCadastrante
    };

    // Log do payload para debug
    console.log('Payload para edição:', payload);

    // Validação adicional dos campos obrigatórios
    if (!payload.id || !payload.idParceiro || !payload.idEndereco || !payload.idUsuarioCadastrante) {
      console.error('Campos obrigatórios faltando:', {
        id: payload.id,
        idParceiro: payload.idParceiro,
        idEndereco: payload.idEndereco,
        idUsuarioCadastrante: payload.idUsuarioCadastrante
      });
      this.exibirAlerta('Erro', 'Dados obrigatórios estão faltando. Verifique os campos.');
      return;
    }

    // Teste: verificar se o payload é válido
    try {
      const payloadString = JSON.stringify(payload);
      console.log('Payload JSON válido:', payloadString);
      console.log('Tamanho do payload:', payloadString.length, 'caracteres');
    } catch (error) {
      console.error('Erro ao serializar payload:', error);
      this.exibirAlerta('Erro', 'Erro ao preparar dados para envio.');
      return;
    }

    this.ofertaService.editarOferta(payload).subscribe(
      async () => {
        // Se o usuário selecionou nova imagem, faz upload após editar
        if (this.imagemSelecionada && this.oferta.id) {
          await this.uploadImagemOferta(this.oferta.id);
        }
        await this.exibirAlerta('Sucesso', 'Oferta atualizada com sucesso!');
        this.router.navigate(['/ofertas']);
      },
      (error:any) => {
        console.error('Erro ao salvar oferta:', error);
        console.error('Detalhes do erro:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
        this.exibirAlerta('Erro', 'Houve um erro ao salvar a oferta. Tente novamente.');
      }
    );
  }



  async cancelar() {
    const alerta = await this.alertController.create({
      header: 'Cancelar Edição',
      message: 'Deseja descartar as alterações?',
      buttons: [
        { text: 'Não', role: 'cancel' },
        {
          text: 'Sim',
          handler: () => {
            this.router.navigate(['/ofertas']);
          },
        },
      ],
    });

    await alerta.present();
  }







}











