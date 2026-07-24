import { Component, Input, OnInit } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { UsuarioService } from 'src/app/services/api/usuario.service';
import { UsuarioResponse } from './profile-modal.model';
import { ToastController } from '@ionic/angular';
import { AssinaturaService } from 'src/app/services/assinatura.service';
import { Router } from '@angular/router';

import {
  applyMaskCPF,
  isValidCPF,
  applyMaskCNPJ,
  isValidCNPJ,
} from '../../utils/cpf-cnpj-utils';
import {
  applyMaskTelefoneBR,
  onlyDigits,
  telefoneBrValidator,
} from '../../utils/telefone-br.util';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';
import { readStoredFotoPerfil } from '../../utils/foto-perfil-storage.util';
import {
  isUsuarioParceiroComercial,
  resolverTipoCadastroPerfil,
  obterRoleUsuario,
} from '../../utils/usuario-sessao.util';

@Component({
  selector: 'app-profile-modal',
  templateUrl: './profile-modal.component.html',
  styleUrls: ['./profile-modal.component.scss'],
})

export class ProfileModalComponent implements OnInit {
  @Input() usuario: any;
  activeTab: string = 'info';
  lastAccess: string = '';

  profileSettingsForm: any;
  tipoPessoa: string = 'MEI'; // Alterado de PF para MEI
  cpfInvalid: boolean = false;
  cnpjInvalid: boolean = false;
  spinner = false;

  showToast: boolean = false;
  toastMessage: string =  "";
  toastColor: string = "";

  subscriptionInfo: { planoTitulo?: string; dataRenovacao?: string | Date; ativo: boolean } | null = null;

  // Novas propriedades para controle de acesso
  usuarioTipoAtual: string = '';
  podeAlterarTipo: boolean = false;

  /** Após tentar salvar, mostra erros mesmo em campos não tocados */
  formSubmitted = false;

  constructor(
    private modalController: ModalController,
    private formBuilder: FormBuilder,
    private usuarioService: UsuarioService,
    private assinaturaService: AssinaturaService,
    private toastController: ToastController,
    private router: Router
  ) {}

  async ngOnInit(): Promise<void> {
    this.getLastAccess();
    
    // Inicializar o formulário primeiro
    this.profileSettingsForm = this.formBuilder.group(
      {
        tipoCadastro: [{ value: 'MEI'}, Validators.required],
        cpf: ['', Validators.required],
        cnpj: ['', Validators.required],
        nome: ['', [Validators.required, Validators.minLength(5)]],
        email: ['', [Validators.required, Validators.email]],
        senha: ['', [Validators.minLength(8)]], // Senha opcional na edição
        confirmacaoSenha: [''],
        // Campos opcionais que podem ser adicionados dinamicamente
        nomeEmpresa: [''],
        atividade: [''],
        website: [''],
        contato: [''], // Adicionado para evitar erro quando o campo é usado no template
      },
      {
        validators: [this.MatchValidator('senha', 'confirmacaoSenha')],
      }
    );

    // Agora buscar os dados do usuário
    await this.getUsuario();
    await this.carregarStatusAssinatura();
  }

  async carregarStatusAssinatura() {
    try {
      const status = await this.assinaturaService.getStatusUsuario();
      console.log('Status da assinatura carregado:', status);
      
      const roleSessao = obterRoleUsuario(this.usuarioService.getUsuarioLogado());
      if (status.isParceiro && isUsuarioParceiroComercial({ role: roleSessao })) {
        this.subscriptionInfo = {
          planoTitulo: 'Plano Parceiro Grátis',
          dataRenovacao: status.diasRestantes ? new Date(Date.now() + (status.diasRestantes || 0) * 24 * 60 * 60 * 1000) : new Date(Date.now() + 3650 * 24 * 60 * 60 * 1000),
          ativo: true
        };
      } else {
        // Para clientes, usa a lógica existente
      this.subscriptionInfo = {
        planoTitulo: status.temPlanoPago ? 'Plano Ativo' : (status.temTesteGratis ? 'Teste Grátis' : undefined),
        dataRenovacao: status.diasRestantes ? new Date(Date.now() + (status.diasRestantes || 0) * 24 * 60 * 60 * 1000) : undefined,
        ativo: !!(status.temPlanoPago || status.temTesteGratis)
      };
      }
      
      console.log('SubscriptionInfo configurado:', this.subscriptionInfo);
    } catch (e) {
      console.error('Erro ao carregar status da assinatura', e);
      this.subscriptionInfo = { ativo: false } as any;
    }
  }

  irParaPlanos() {
    this.router.navigate(['/Assinatura']);
  }

  async atualizarAssinatura() {
    try {
      await this.assinaturaService.atualizarAssinaturas();
      await this.carregarStatusAssinatura();
      const toast = await this.toastController.create({
        message: 'Status de assinatura atualizado.',
        duration: 1500,
        position: 'top'
      });
      toast.present();
    } catch (e) {
      console.error(e);
    }
  }

  closeModal(): void {
    this.modalController.dismiss();
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  // INFORMAÇÕES DO USUÁRIO
  applyMaskCPF(event: any): void {
    const value = event.target.value || '';
    this.profileSettingsForm.patchValue({ cpf: applyMaskCPF(value) });
  }

  validateCPF(): void {
    const cpf = this.profileSettingsForm.get('cpf')?.value || '';
    const digits = String(cpf).replace(/\D/g, '');
    if (!digits) {
      this.cpfInvalid = false;
      return;
    }
    this.cpfInvalid = !isValidCPF(cpf);
  }

  validateCNPJ(): void {
    const cnpj = this.profileSettingsForm.get('cnpj')?.value || '';
    const digits = String(cnpj).replace(/\D/g, '');
    if (!digits) {
      this.cnpjInvalid = false;
      return;
    }
    this.cnpjInvalid = !isValidCNPJ(cnpj);
  }

  applyMaskCNPJ(event: any): void {
    const value = event.target.value || '';
    this.profileSettingsForm.patchValue({ cnpj: applyMaskCNPJ(value) });
  }

  applyMaskContato(ev: Event): void {
    if (!this.isMEI() && !this.isPessoaJuridica()) {
      return;
    }
    const ce = ev as CustomEvent<{ value?: string }>;
    const raw = ce.detail?.value ?? '';
    this.profileSettingsForm.patchValue(
      { contato: applyMaskTelefoneBR(String(raw)) },
      { emitEvent: false }
    );
  }

  MatchValidator(source: string, target: string): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const sourceCtrl = control.get(source);
      const targetCtrl = control.get(target);
      
      // Se ambos os campos estão vazios, não há erro (senha opcional)
      if (!sourceCtrl?.value && !targetCtrl?.value) {
        return null;
      }
      
      // Se um dos campos está preenchido, ambos devem ser iguais
      return sourceCtrl && targetCtrl && sourceCtrl.value !== targetCtrl.value
        ? { mismatch: true }
        : null;
    };
  }

  isPessoaFisica(): boolean {
     return this.profileSettingsForm.get('tipoCadastro')?.value === 'PF'; // Ocultado temporariamente
  }

  isMEI(): boolean {
    return this.profileSettingsForm.get('tipoCadastro')?.value === 'MEI';
  }

  isPessoaJuridica(): boolean {
    return this.profileSettingsForm.get('tipoCadastro')?.value === 'PJ';
  }

  onTipoPessoaChange() {
    // Verificar se o usuário pode alterar o tipo
    if (!this.podeAlterarTipo) {
      // Restaurar o tipo original
      this.profileSettingsForm.patchValue({
        tipoCadastro: this.usuarioTipoAtual
      });
      this.aplicarValidadoresPorTipoCadastro(this.usuarioTipoAtual);
      // Mostrar mensagem de aviso
      this.mostrarAvisoAlteracaoTipo();
      return;
    }

    const tipoCadastro = this.profileSettingsForm.get('tipoCadastro')?.value;
    
     if (tipoCadastro === 'PF') { // Ocultado temporariamente
      // Limpar campos PJ e MEI
      this.profileSettingsForm.patchValue({
        cnpj: '',
        nomeEmpresa: '',
        atividade: '',
        website: '',
        contato: ''
      });
    } else if (tipoCadastro === 'MEI') {
      // Limpar campos PF e PJ
      this.profileSettingsForm.patchValue({
        cpf: '',
        atividade: '',
        website: ''
      });
    } else if (tipoCadastro === 'PJ') {
      // Limpar campos PF e MEI
      this.profileSettingsForm.patchValue({
        cpf: ''
      });
    }

    this.aplicarValidadoresPorTipoCadastro(tipoCadastro);
  }

  /**
   * Aplica validadores conforme o tipo de cadastro (sem depender de alteração manual do segment).
   * Deve ser chamado após carregar o usuário e quando o tipo muda.
   */
  aplicarValidadoresPorTipoCadastro(tipoCadastro: string): void {
    if (!this.profileSettingsForm) return;

    if (tipoCadastro === 'PF') {
      this.profileSettingsForm.get('cpf')?.setValidators([Validators.required]);
      this.profileSettingsForm.get('cnpj')?.clearValidators();
      this.profileSettingsForm.get('nomeEmpresa')?.clearValidators();
      this.profileSettingsForm.get('contato')?.clearValidators();
      this.profileSettingsForm.get('atividade')?.clearValidators();
      this.profileSettingsForm.get('website')?.clearValidators();
    } else if (tipoCadastro === 'MEI') {
      this.profileSettingsForm.get('cpf')?.clearValidators();
      this.profileSettingsForm.get('cnpj')?.setValidators([Validators.required]);
      this.profileSettingsForm
        .get('nomeEmpresa')
        ?.setValidators([Validators.required, Validators.minLength(3)]);
      this.profileSettingsForm
        .get('contato')
        ?.setValidators([Validators.required, telefoneBrValidator()]);
      this.profileSettingsForm.get('atividade')?.clearValidators();
      this.profileSettingsForm.get('website')?.clearValidators();
    } else if (tipoCadastro === 'PJ') {
      this.profileSettingsForm.get('cpf')?.clearValidators();
      this.profileSettingsForm.get('cnpj')?.setValidators([Validators.required]);
      this.profileSettingsForm
        .get('nomeEmpresa')
        ?.setValidators([Validators.required, Validators.minLength(3)]);
      this.profileSettingsForm
        .get('atividade')
        ?.setValidators([Validators.required, Validators.minLength(3)]);
      this.profileSettingsForm
        .get('contato')
        ?.setValidators([Validators.required, telefoneBrValidator()]);
      this.profileSettingsForm.get('website')?.clearValidators();
    }

    this.profileSettingsForm.get('cpf')?.updateValueAndValidity({ emitEvent: false });
    this.profileSettingsForm.get('cnpj')?.updateValueAndValidity({ emitEvent: false });
    this.profileSettingsForm.get('nomeEmpresa')?.updateValueAndValidity({ emitEvent: false });
    this.profileSettingsForm.get('contato')?.updateValueAndValidity({ emitEvent: false });
    this.profileSettingsForm.get('atividade')?.updateValueAndValidity({ emitEvent: false });
    this.profileSettingsForm.get('website')?.updateValueAndValidity({ emitEvent: false });
  }

  deveMostrarErro(controlName: string): boolean {
    const c = this.profileSettingsForm?.get(controlName);
    if (!c || c.disabled) return false;
    return c.invalid && (c.touched || this.formSubmitted);
  }

  mensagemErroCampo(controlName: string): string {
    const c = this.profileSettingsForm?.get(controlName);
    if (!c || !c.errors) return '';
    const e = c.errors;
    if (e['required']) return 'Campo obrigatório.';
    if (e['email']) return 'E-mail inválido.';
    if (typeof e['telefoneBr'] === 'string') return e['telefoneBr'];
    if (e['minlength']) {
      const m = e['minlength'];
      return `Mínimo de ${m.requiredLength} caracteres.`;
    }
    return 'Valor inválido.';
  }

  deveMostrarErroSenhas(): boolean {
    const mismatch = this.profileSettingsForm?.errors?.['mismatch'];
    if (!mismatch) return false;
    const s = this.profileSettingsForm?.get('senha')?.value;
    const c = this.profileSettingsForm?.get('confirmacaoSenha')?.value;
    if (!s && !c) return false;
    return !!(this.formSubmitted || this.profileSettingsForm?.get('confirmacaoSenha')?.touched);
  }

  async mostrarAvisoAlteracaoTipo() {
    const toast = await this.toastController.create({
      message: `Você não pode alterar seu tipo de cadastro de ${this.getTipoDescricao(this.usuarioTipoAtual)} para outro tipo.`,
      position: 'top',
      duration: 4000,
      color: 'warning',
    });
    await toast.present();
  }

  getTipoDescricao(tipo: string): string {
    switch (tipo) {
      case 'PF': return 'Motorista';
      case 'MEI': return 'MEI';
      case 'PJ': return 'Parceiro';
      default: return 'Usuário';
    }
  }

  getLastAccess(): void {
    const now = new Date();
    this.lastAccess = now.toLocaleString();
  }

  async updateProfile(): Promise<void> {
    this.spinner = true;
    this.formSubmitted = true;
    this.validateCPF();
    this.validateCNPJ();

    try {
      const tipo = this.profileSettingsForm.get('tipoCadastro')?.value;
      if (tipo === 'PF' && this.cpfInvalid) {
        this.profileSettingsForm.markAllAsTouched();
        const toast = await this.toastController.create({
          message: 'Informe um CPF válido.',
          position: 'top',
          duration: 3000,
          color: 'warning',
        });
        await toast.present();
        this.spinner = false;
        return;
      }
      if ((tipo === 'MEI' || tipo === 'PJ') && this.cnpjInvalid) {
        this.profileSettingsForm.markAllAsTouched();
        const toast = await this.toastController.create({
          message: 'Informe um CNPJ válido.',
          position: 'top',
          duration: 3000,
          color: 'warning',
        });
        await toast.present();
        this.spinner = false;
        return;
      }

      // Validar formulário
      if (this.profileSettingsForm.invalid) {
        console.log('Formulário inválido:', this.profileSettingsForm.errors);
        this.profileSettingsForm.markAllAsTouched();
        const toast = await this.toastController.create({
          message: 'Preencha todos os campos obrigatórios corretamente.',
          position: 'top',
          duration: 3000,
          color: 'warning',
        });
        await toast.present();
        this.spinner = false;
        return;
      }
      
      // Preparar dados para envio
      const formData = this.profileSettingsForm.value;
      
      // Obter URL da imagem do usuário (do localStorage, do usuário atual ou da resposta da API)
      let urlImagem = '';
      
      // 1. Cache local só por usuário (evita foto de outra conta)
      const storedFoto = readStoredFotoPerfil(this.usuario?.Id);
      if (storedFoto) {
        urlImagem = storedFoto;
      } 
      // 2. Tentar pegar do objeto usuário atual
      else if (this.usuario && this.usuario.fotoPerfil) {
        // Se a URL já contém o domínio completo, extrair apenas o caminho
        const fotoPerfil = this.usuario.fotoPerfil;
        if (fotoPerfil.includes('/uploads/')) {
          const match = fotoPerfil.match(/\/uploads\/[^?]+/);
          urlImagem = match ? match[0] : fotoPerfil;
        } else {
          urlImagem = fotoPerfil;
        }
      }
      // 3. Tentar buscar da resposta da API (se já foi carregada)
      else {
        try {
          const response = await this.usuarioService.getUsuario();
          const usuarioData = response as UsuarioResponse;
          if (usuarioData && usuarioData.usuario && usuarioData.usuario.imagemUrl) {
            const imagemUrl = usuarioData.usuario.imagemUrl;
            // Extrair apenas o caminho se for URL completa
            if (imagemUrl.includes('/uploads/')) {
              const match = imagemUrl.match(/\/uploads\/[^?]+/);
              urlImagem = match ? match[0] : imagemUrl;
            } else {
              urlImagem = imagemUrl;
            }
          }
        } catch (error) {
          console.warn('Não foi possível obter URL da imagem da API:', error);
        }
      }
      
      const usuarioData = {
        nome: formData.nome,
        email: formData.email,
        senha: formData.senha || '', // Senha vazia se não for preenchida
        tipoCadastro: formData.tipoCadastro,
        cpf: formData.tipoCadastro === 'PF' ? formData.cpf : '',
        cnpj: (formData.tipoCadastro === 'PJ' || formData.tipoCadastro === 'MEI') ? formData.cnpj : '',
        nomeEmpresa: (formData.tipoCadastro === 'PJ' || formData.tipoCadastro === 'MEI') ? formData.nomeEmpresa : '',
        atividade: formData.tipoCadastro === 'PJ' ? formData.atividade : '',
        contato:
          formData.tipoCadastro === 'PJ' || formData.tipoCadastro === 'MEI'
            ? onlyDigits(formData.contato || '')
            : '',
        website: formData.tipoCadastro === 'PJ' ? (formData.website || '') : '',
        urlImagem: urlImagem
      };

      console.log('Dados para envio:', usuarioData);
      
      const response = await this.usuarioService.alterar(usuarioData);
      console.log('Resposta da API:', response);
      
      // Atualizar dados no localStorage
      const usuarioAtual = this.usuarioService.getUsuarioLogado();
      if (usuarioAtual) {
        usuarioAtual.nome = formData.nome;
        usuarioAtual.email = formData.email;
        this.usuarioService.setUsuarioLogado(usuarioAtual);
      }
      
      // Mostrar mensagem de sucesso
      const toast = await this.toastController.create({
        message: 'Informações de usuário foram alteradas com sucesso!',
        position: 'top',
        duration: 2000,
        color: 'success',
      });
      await toast.present();
      
      this.spinner = false;
      this.formSubmitted = false;
      this.closeModal();
      
    } catch (error) {
      console.error('Erro ao atualizar perfil:', error);
      
      let errorMessage = 'Erro ao salvar informações de usuário. Tente novamente mais tarde.';
      
      // Tratar erros específicos da API
      if (error && typeof error === 'object' && 'error' in error) {
        const apiError = error.error;
        if (apiError && typeof apiError === 'object' && 'message' in apiError) {
          errorMessage = String(apiError.message);
        }
      }
      
      const toast = await this.toastController.create({
        message: errorMessage,
        position: 'top',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
      
      this.spinner = false;
    }
  }

  async getUsuario(): Promise<void> {
    try {
      const response = await this.usuarioService.getUsuario();
      const usuarioData = response as UsuarioResponse;
      console.log('Dados recebidos da API:', usuarioData);

      if (usuarioData) {
        const perfil = usuarioData as any;
        const rolePerfil = obterRoleUsuario(perfil) || obterRoleUsuario(this.usuario);
        this.usuarioTipoAtual = resolverTipoCadastroPerfil(perfil, rolePerfil);
        
        // Por padrão, não permitir alteração do tipo (segurança)
        this.podeAlterarTipo = false;
        
        // Determinar o tipo de cadastro para o formulário
        const tipoCadastro = this.usuarioTipoAtual;
        
        // Atualiza os campos básicos do formulário
        const u = perfil.usuario ?? perfil.Usuario;
        this.profileSettingsForm.patchValue({
          tipoCadastro: tipoCadastro,
          nome: u?.nome ?? u?.Nome ?? '',
          email: u?.email ?? u?.Email ?? '',
          senha: '',
          confirmacaoSenha: '',
        });

        // Configurar campos específicos baseado no tipo de cadastro
         if (tipoCadastro === 'PF') { // Ocultado temporariamente
          // Para pessoa física
          this.profileSettingsForm.patchValue({
            cpf: usuarioData.cpf || '',
          });
          
          // Garantir que o campo CPF esteja habilitado e o CNPJ desabilitado
          this.profileSettingsForm.get('cpf')?.enable();
          this.profileSettingsForm.get('cnpj')?.disable();
          
          // Remover campos de PJ se existirem
          if (this.profileSettingsForm.get('nomeEmpresa')) {
            this.profileSettingsForm.removeControl('nomeEmpresa');
          }
          if (this.profileSettingsForm.get('atividade')) {
            this.profileSettingsForm.removeControl('atividade');
          }
        } else if (tipoCadastro === 'MEI') {
          // Para MEI
          if (usuarioData.empresa) {
            this.profileSettingsForm.patchValue({
              cnpj: usuarioData.empresa.cnpj || '',
              nomeEmpresa: usuarioData.empresa.nome || '',
              contato: applyMaskTelefoneBR(
                onlyDigits(String(usuarioData.empresa?.contato || ''))
              ),
            });
          }
          
          // Garantir que o campo CNPJ esteja habilitado e o CPF desabilitado
          this.profileSettingsForm.get('cnpj')?.enable();
          this.profileSettingsForm.get('cpf')?.disable();
          
          // Adicionar campos de MEI se não existirem
          if (!this.profileSettingsForm.get('nomeEmpresa')) {
            this.profileSettingsForm.addControl(
              'nomeEmpresa',
              this.formBuilder.control('', [Validators.required, Validators.minLength(3)])
            );
          }
          if (!this.profileSettingsForm.get('contato')) {
            this.profileSettingsForm.addControl(
              'contato',
              this.formBuilder.control('', [
                Validators.required,
                telefoneBrValidator(),
              ])
            );
          }
        } else if (tipoCadastro === 'PJ') {
          // Para pessoa jurídica
          if (usuarioData.empresa) {
            this.profileSettingsForm.patchValue({
              cnpj: usuarioData.empresa.cnpj || '',
              nomeEmpresa: usuarioData.empresa.nome || '',
              atividade: usuarioData.empresa.atividade || '',
              contato: applyMaskTelefoneBR(
                onlyDigits(
                  String(
                    usuarioData.parceiro?.contato ||
                      usuarioData.empresa?.contato ||
                      ''
                  )
                )
              ),
              website: usuarioData.parceiro?.website || '',
            });
          }
          
          // Garantir que o campo CNPJ esteja habilitado e o CPF desabilitado
          this.profileSettingsForm.get('cnpj')?.enable();
          this.profileSettingsForm.get('cpf')?.disable();
          
          // Adicionar campos de PJ se não existirem
          if (!this.profileSettingsForm.get('nomeEmpresa')) {
            this.profileSettingsForm.addControl(
              'nomeEmpresa',
              this.formBuilder.control('', [Validators.required, Validators.minLength(3)])
            );
          }
          if (!this.profileSettingsForm.get('atividade')) {
            this.profileSettingsForm.addControl(
              'atividade',
              this.formBuilder.control('', [Validators.required, Validators.minLength(3)])
            );
          }
          if (!this.profileSettingsForm.get('contato')) {
            this.profileSettingsForm.addControl(
              'contato',
              this.formBuilder.control('', [
                Validators.required,
                telefoneBrValidator(),
              ])
            );
          }
          if (!this.profileSettingsForm.get('website')) {
            this.profileSettingsForm.addControl(
              'website',
              this.formBuilder.control('')
            );
          }
        }

        this.aplicarValidadoresPorTipoCadastro(this.usuarioTipoAtual);
        this.profileSettingsForm.updateValueAndValidity({ emitEvent: false });
        
        console.log('Formulário preenchido com sucesso');
        console.log('Tipo de usuário atual:', this.usuarioTipoAtual);
        console.log('Pode alterar tipo:', this.podeAlterarTipo);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do usuário:', error);
      const toast = await this.toastController.create({
        message: "Ops, ocorreu um erro ao buscar os dados deste usuário. Tente novamente mais tarde.",
        position: 'top',
        duration: 2000,
        color: 'danger',
      });
      toast.present();
    }
  }

}
