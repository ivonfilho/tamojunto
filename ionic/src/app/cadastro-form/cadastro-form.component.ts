import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { Component, EventEmitter, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Router } from '@angular/router';
import { UsuarioService } from '../services/api/usuario.service';
import { CnpjService } from '../services/cnpj.service';
import {
  applyMaskCPF,
  isValidCPF,
  applyMaskCNPJ,
  isValidCNPJ,
} from '../utils/cpf-cnpj-utils';
import {
  applyMaskTelefoneBR,
  onlyDigits,
  telefoneBrValidator,
} from '../utils/telefone-br.util';
import { nomeCompletoBrValidator } from '../utils/nome-validators';
import {
  SENHA_COMPLEXIDADE_TEXTO,
  senhaComplexidadeValidator,
} from '../utils/senha-policy';

@Component({
  selector: 'app-cadastro-form',
  templateUrl: './cadastro-form.component.html',
  styleUrls: ['./cadastro-form.component.scss'],
  encapsulation: ViewEncapsulation.ShadowDom,
})
export class CadastroFormComponent implements OnInit {
  readonly senhaRegrasTexto = SENHA_COMPLEXIDADE_TEXTO;

  loginForm: any;
  spinner = false;
  cpfInvalid: boolean = false;
  cnpjInvalid: boolean = false;
  consultandoCNPJ: boolean = false;
  cnpjNaoMEI: boolean = false;
  empresaInativa: boolean = false;
  isFormLarge: boolean = false;
  currentStep: number = 1;


  @Output() Cadastro = new EventEmitter<void>();

  constructor(
    private usuarioService: UsuarioService,
    private formBuilder: FormBuilder,
    private toastController: ToastController,
    private cnpjService: CnpjService,
    private router: Router
  ) { }

  ngOnInit() {
    this.loginForm = this.formBuilder.group(
      {
        tipoCadastro: ['MEI', Validators.required],
        cpf: [''],
        cnpj: ['', Validators.required],
        nomeEmpresa: ['', Validators.required],
        atividade: [''],
        website: [''],
        contato: ['', [Validators.required, telefoneBrValidator()]],
        nome: ['', [Validators.required, nomeCompletoBrValidator()]],
        email: ['', [Validators.required, Validators.email]],
        senha: ['', [Validators.required, senhaComplexidadeValidator()]],
        confirmacaoSenha: ['', Validators.required],
      },
      {
        validators: [this.MatchValidator('senha', 'confirmacaoSenha')],
      }
    );

    this.isFormLarge = false;
  }

  isMEI(): boolean {
    return true;
  }

  /**
   * Limpa campos que podem ser preenchidos automaticamente pela consulta de CNPJ
   */
  limparCamposAutomaticos() {
    this.loginForm.patchValue({
      nomeEmpresa: '',
      nome: '',
      email: '',
      senha: '',
      confirmacaoSenha: '',
      atividade: '',
      website: '',
      contato: ''
    });
  }

  onSegmentChange(event: any) {
    if (event.detail.value === 'PJ') {
      this.router.navigate(['/cadastro-form-parceiro']);
    }
  }


  async presentToastErro(text: string) {
    const toast = await this.toastController.create({
      message: text,
      duration: 3000,
      position: 'top',
      color: 'danger',
    });
    toast.present();
  }


  async presentToastSuccess(text: string) {
    const toast = await this.toastController.create({
      message: text,
      duration: 3000,
      position: 'top',
      color: 'success',
    });
    toast.present();
  }

  private normalizarEmail(email: string): string {
    return (email || '').trim().toLowerCase();
  }

  /** Prefer nome fantasia da API; evita colar razão social com prefixo numérico no campo. */
  private extrairNomeFantasiaCnpj(data: any): string {
    const est = data?.estabelecimento;
    const fantasyRaw = (est?.nome_fantasia ?? data?.nome_fantasia ?? '')
      .toString()
      .trim();
    const razao = (data?.razao_social ?? '').toString().trim();
    const limpaPrefixoNum = (s: string) => s.replace(/^[\d.\/\s-]+/u, '').trim();
    if (
      fantasyRaw &&
      fantasyRaw !== '***' &&
      fantasyRaw.length >= 2 &&
      !/^\d[\d.\s-]*$/u.test(fantasyRaw)
    ) {
      return fantasyRaw;
    }
    const limpo = limpaPrefixoNum(razao);
    return limpo || razao;
  }

  applyMaskContato(ev: Event): void {
    const ce = ev as CustomEvent<{ value?: string }>;
    const raw = ce.detail?.value ?? '';
    this.loginForm.patchValue(
      { contato: applyMaskTelefoneBR(String(raw)) },
      { emitEvent: false }
    );
  }

  /** Mensagens específicas para o toast quando o formulário está inválido. */
  private mensagemErrosFormulario(): string {
    const msgs: string[] = [];
    const nome = this.loginForm.get('nome');
    if (nome?.errors?.['required']) {
      msgs.push('Informe seu nome completo.');
    }
    if (nome?.errors?.['nomeCompleto']) {
      msgs.push('Nome: use nome e sobrenome só com letras (ex.: Maria Silva).');
    }
    const emailCtrl = this.loginForm.get('email');
    if (emailCtrl?.errors?.['required']) {
      msgs.push('Informe o e-mail.');
    }
    if (emailCtrl?.errors?.['email']) {
      msgs.push('E-mail em formato inválido.');
    }
    const senha = this.loginForm.get('senha');
    if (senha?.errors?.['required']) {
      msgs.push('Defina uma senha.');
    }
    if (senha?.errors?.['senhaComplexidade']) {
      msgs.push(SENHA_COMPLEXIDADE_TEXTO);
    }
    const conf = this.loginForm.get('confirmacaoSenha');
    if (conf?.errors?.['required']) {
      msgs.push('Confirme a senha.');
    }
    if (this.loginForm.errors?.['mismatch']) {
      msgs.push('A confirmação de senha não coincide com a senha.');
    }
    if (this.isMEI()) {
      const ne = this.loginForm.get('nomeEmpresa');
      if (ne?.errors?.['required']) {
        msgs.push('Informe o nome fantasia da empresa.');
      }
      const cnpj = this.loginForm.get('cnpj');
      if (cnpj?.errors?.['required']) {
        msgs.push('Informe o CNPJ.');
      }
      const contato = this.loginForm.get('contato');
      if (contato?.errors?.['required']) {
        msgs.push('Informe o telefone de contato.');
      }
      const telErr = contato?.errors?.['telefoneBr'];
      if (typeof telErr === 'string') {
        msgs.push(`Telefone: ${telErr}`);
      }
    }
    if (msgs.length === 0) {
      return 'Revise os campos destacados e tente novamente.';
    }
    return msgs.join(' ');
  }

  private extrairMensagemErroCadastro(error: any): string {
    const backendMessage = error?.error?.message || error?.message || '';
    const backendErrors = error?.error?.errors;
    const status = error?.status;
    const detalhe = `${backendMessage} ${JSON.stringify(backendErrors || '')}`.toLowerCase();

    if (
      status === 409 ||
      detalhe.includes('e-mail') && detalhe.includes('existe') ||
      detalhe.includes('email') && detalhe.includes('existe') ||
      detalhe.includes('duplicate') ||
      detalhe.includes('duplicado') ||
      detalhe.includes('já cadastrado') ||
      detalhe.includes('ja cadastrado') ||
      detalhe.includes('unique') ||
      detalhe.includes('e11000')
    ) {
      return 'Este e-mail já está cadastrado. Use outro e-mail ou faça login/recuperação de senha.';
    }

    if (
      detalhe.includes('email') &&
      (detalhe.includes('invalid') || detalhe.includes('inválido') || detalhe.includes('invalido'))
    ) {
      return 'E-mail inválido. Verifique o endereço informado.';
    }

    if (Array.isArray(backendErrors) && backendErrors.length > 0) {
      return backendErrors.join(' | ');
    }

    return backendMessage || 'Erro ao realizar cadastro. Verifique os dados e tente novamente.';
  }

  prosseguir() {
    if (this.currentStep === 1) {
      if (this.isEtapa1Valida()) {
        this.currentStep = 2;
      } else {
        this.loginForm.markAllAsTouched();
        this.presentToastErro('Preencha os campos obrigatórios desta etapa corretamente.');
      }
    } else if (this.currentStep === 2) {
      if (this.isEtapa2Valida()) {
        this.currentStep = 3;
      } else {
        this.loginForm.markAllAsTouched();
        this.presentToastErro('Preencha os campos de contato corretamente.');
      }
    }
  }

  voltar() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  isEtapa1Valida(): boolean {
    const cnpj = this.loginForm.get('cnpj');
    const nomeEmpresa = this.loginForm.get('nomeEmpresa');

    let valid = cnpj?.valid && !this.cnpjInvalid && !this.consultandoCNPJ && nomeEmpresa?.valid;

    return !!valid;
  }

  isEtapa2Valida(): boolean {
    const contato = this.loginForm.get('contato');
    const nome = this.loginForm.get('nome');
    const email = this.loginForm.get('email');
    return !!(contato?.valid && nome?.valid && email?.valid);
  }

  isEtapa3Valida(): boolean {
    const senha = this.loginForm.get('senha');
    const confSenha = this.loginForm.get('confirmacaoSenha');
    return !!(senha?.valid && confSenha?.valid && !this.loginForm.errors?.['mismatch']);
  }

  cadastrar() {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      this.presentToastErro(this.mensagemErrosFormulario());
      return;
    }

    if (this.isMEI()) {
      if (this.cnpjInvalid) {
        if (this.cnpjNaoMEI) {
          this.presentToastErro('Este CNPJ não é de MEI. Apenas empresas com porte ME e natureza jurídica "Empresário (Individual)" podem se cadastrar nesta categoria.');
        } else {
          this.presentToastErro('CNPJ inválido ou inativo. Corrija para continuar.');
        }
        return;
      }
      if (!this.loginForm.get('nomeEmpresa').value || !this.loginForm.get('contato').value) {
        this.presentToastErro('Por favor, preencha todos os campos obrigatórios para MEI.');
        return;
      }
    }

    this.spinner = true;

    const formData: any = {
      tipoCadastro: this.loginForm.get('tipoCadastro').value,
      nome: this.loginForm.get('nome').value,
      email: this.normalizarEmail(this.loginForm.get('email').value),
      senha: this.loginForm.get('senha').value,
      confirmacaoSenha: this.loginForm.get('confirmacaoSenha').value,
      cnpj: this.loginForm.get('cnpj').value,
      nomeEmpresa: this.loginForm.get('nomeEmpresa').value,
      atividade: null,
      website: null,
      contato: onlyDigits(this.loginForm.get('contato')?.value)
    };

    this.usuarioService
      .cadastro(formData)
      .then(async (response: any) => {
        this.spinner = false;

        let msg =
          response?.message ||
          'Cadastro realizado! Confirme seu e-mail pelo link enviado para ativar o acesso.';
        if (response?.emailConfirmacaoEnviado === false) {
          msg +=
            ' Não foi possível enviar o e-mail agora; use "Reenviar e-mail de confirmação" na tela de login.';
        }

        await this.presentToastSuccess(msg);
        this.alterarForm();
      })
      .catch((error) => {
        console.error('Erro no cadastro:', error); // Log para debug
        const mensagemErro = this.extrairMensagemErroCadastro(error);
        this.presentToastErro(mensagemErro);
        this.spinner = false;
      });
  }

  alterarForm() {
    this.router.navigate(['/']);
  }

  applyMaskCPF(event: any): void {
    const value = event.target.value || '';
    this.loginForm.patchValue({ cpf: applyMaskCPF(value) });
  }

  validateCPF(): void {
    const cpf = this.loginForm.get('cpf')?.value || '';
    if (!isValidCPF(cpf)) {
      this.cpfInvalid = true;
    } else {
      this.cpfInvalid = false;
    }
  }

  validateCNPJ() {
    const cnpj = this.loginForm.get('cnpj')?.value;

    if (!this.isValidCNPJ(cnpj)) {
      this.cnpjInvalid = true;
      this.cnpjNaoMEI = false; // Reset da flag de porte
      this.empresaInativa = false; // Reset da flag de empresa inativa
      return;
    }

    // Limpar campos que podem ser preenchidos automaticamente antes de consultar
    this.limparCamposAutomaticos();

    this.consultandoCNPJ = true;
    this.cnpjInvalid = false;
    this.cnpjNaoMEI = false; // Reset da flag de porte
    this.empresaInativa = false; // Reset da flag de empresa inativa

    this.cnpjService.consultarCNPJ(cnpj).subscribe({
      next: async (data: any) => {
        this.consultandoCNPJ = false;

        // Log para debug da estrutura da resposta
        console.log('Resposta da API CNPJ:', data);
        console.log('Situação cadastral:', data.estabelecimento?.situacao_cadastral);
        console.log('Porte da empresa:', data.porte);
        console.log('Descrição do porte:', data.porte?.descricao);
        console.log('Natureza jurídica:', data.natureza_juridica);
        console.log('Descrição da natureza jurídica:', data.natureza_juridica?.descricao);

        const situacao = data.estabelecimento?.situacao_cadastral;
        const porte = data.porte?.descricao;
        const naturezaJuridica = data.natureza_juridica?.descricao;
        const tipoCadastro = this.loginForm.get('tipoCadastro')?.value;

        if (situacao && situacao.toUpperCase() === 'ATIVA') {
          // Verificação específica para MEI
          if (tipoCadastro === 'MEI') {
            // Porte ME (API pode retornar "ME" ou "Micro Empresa") e natureza jurídica "Empresário (Individual)"
            const porteME = porte && (porte === 'ME' || porte === 'Micro Empresa');
            const naturezaMEI = naturezaJuridica && naturezaJuridica === 'Empresário (Individual)';
            if (porteME && naturezaMEI) {
              // CNPJ é MEI válido
              this.cnpjInvalid = false;
              this.cnpjNaoMEI = false;

              // Preencher dados automaticamente (nome da pessoa não vem da razão social)
              this.loginForm.patchValue({
                nomeEmpresa: this.extrairNomeFantasiaCnpj(data),
                email: data.estabelecimento.email || this.loginForm.get('email')?.value,
                atividade: data.estabelecimento.atividade_principal?.descricao || ''
              });

              await this.presentToastSuccess('CNPJ MEI válido! Dados preenchidos automaticamente.');
            } else {
              // CNPJ não é MEI
              this.cnpjInvalid = true;
              this.cnpjNaoMEI = true;
              await this.presentToastErro(`Este CNPJ não é de MEI. Porte: ${porte || 'Não informado'}, Natureza Jurídica: ${naturezaJuridica || 'Não informado'}. Apenas MEIs podem se cadastrar nesta categoria.`);
            }
          }
        } else {
          // CNPJ não está ativo
          this.cnpjInvalid = true;
          this.cnpjNaoMEI = false;
          this.empresaInativa = true;
          await this.presentToastErro('CNPJ não está ativo. Verifique a situação cadastral.');
        }
      },
      error: async (err) => {
        this.consultandoCNPJ = false;
        this.cnpjInvalid = true;
        this.cnpjNaoMEI = false;
        this.empresaInativa = false;
        console.error('Erro ao consultar CNPJ:', err);
        await this.presentToastErro('Erro ao consultar o CNPJ. Tente novamente.');
      }
    });
  }


  isValidCNPJ(cnpj: string): boolean {

    const cleanCNPJ = cnpj.replace(/\D/g, '');
    return cleanCNPJ.length === 14;
  }


  applyMaskCNPJ(event: any): void {
    const value = event.target.value || '';
    this.loginForm.patchValue({ cnpj: applyMaskCNPJ(value) });
  }

  MatchValidator(source: string, target: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const sourceCtrl = control.get(source);
      const targetCtrl = control.get(target);
      return sourceCtrl && targetCtrl && sourceCtrl.value !== targetCtrl.value
        ? { mismatch: true }
        : null;
    };
  }

  get temOitoCaracteres(): boolean {
    const v = this.loginForm.get('senha')?.value || '';
    return v.length >= 8;
  }
  
  get temMaiuscula(): boolean {
    const v = this.loginForm.get('senha')?.value || '';
    return /\p{Lu}/u.test(v);
  }
  
  get temNumero(): boolean {
    const v = this.loginForm.get('senha')?.value || '';
    return /\d/.test(v);
  }

  async copiarSenha() {
    const senha = this.loginForm.get('senha')?.value || '';
    if (senha) {
      try {
        await navigator.clipboard.writeText(senha);
        this.presentToastSuccess('Senha copiada.');
      } catch (err) {
        this.presentToastErro('Erro ao copiar senha.');
      }
    }
  }
}
