import { Component } from '@angular/core';
import { ParceiroService } from '../../services/parceiro.service';
import { UsuarioService } from '../../services/api/usuario.service';
import { Router } from '@angular/router';
import { Parceiro, Empresa } from '../parceiro.model';

@Component({
  selector: 'app-editar-parceiro',
  templateUrl: './cadastrar-parceiro.page.html',
  styleUrls: ['./cadastrar-parceiro.scss'],
})
export class EditarParceiroPage{
  Parceiro: Parceiro = {

  nome: '',
  website: '',
  contato:  '',
  status: true,
  dataCriacao: new Date().toISOString(),
  idUsuario: '', 
  idEmpresa: ''
 
  };

  Empresa: Empresa ={

    nome: '',
    cnpj: '',

  };
  usuario: any = null;
  constructor(
    private parceiroService: ParceiroService, 
    private router: Router,
    private ParceiroService: ParceiroService,
    private usuarioService: UsuarioService
  ) {}

  ngOnInit() {
    this.carregarUsuarioLogado();
  }
  

  carregarUsuarioLogado() {
    this.usuario = this.usuarioService.getUsuarioLogado();

      if (this.usuario && (this.usuario.Id || this.usuario.id)) {
        const userId = this.usuario.Id || this.usuario.id;
        this.Parceiro.idUsuario = userId;
        console.log('Usuário logado atribuído:', userId);
      } else {
        console.warn('Nenhum usuário logado encontrado.');
      }

  }
  salvar() {
    if (!this.Parceiro.idUsuario) {
      alert('Usuário não encontrado. Faça login novamente.');
      return;
    }
  
    //this.Parceiro.idUsuario = this.usuario.id; 
  
    this.ParceiroService.criarEmpresa(this.Empresa).subscribe({
      next: (empresa) => {
        this.Parceiro.idEmpresaNavigation = empresa; 
        this.Parceiro.idEmpresa = empresa.id; 
        this.parceiroService.criar(this.Parceiro).subscribe({
          next: () => {
            alert('Parceiro criado com sucesso!');
            this.router.navigate(['/parceiro']);
          },
          error: (err) => {
            console.error('Erro ao criar parceiro:', err);
            alert('Erro ao criar parceiro');
          }
        });
      },
      error: (err) => {
        console.error('Erro ao criar empresa:', err);
        alert('Erro ao criar empresa');
      }
    });
  }
}
