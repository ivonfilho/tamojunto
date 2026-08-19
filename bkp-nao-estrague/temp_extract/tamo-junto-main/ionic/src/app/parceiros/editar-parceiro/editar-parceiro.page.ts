import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ParceiroService } from '../../services/parceiro.service';
import { Parceiro, Empresa } from '../parceiro.model';

@Component({
  selector: 'app-editar-parceiro',
  templateUrl: './editar-parceiro.page.html',
  styleUrls: ['./editar-parceiro.page.scss'],
})
export class EditarParceiroPage implements OnInit {
  Parceiro: Parceiro = {
      id: '',
    nome: '',
    website: '',
    contato:  '',
    status: true,
    dataCriacao: new Date().toISOString(),
    idUsuario: '',
    idEmpresa: ''
    };
  
    Empresa: Empresa ={
      id: '',
      nome: '',
      cnpj: '',
  
    };
  

  constructor(
    private route: ActivatedRoute,
    private parceiroService: ParceiroService,
    private router: Router
  ) {}

  ngOnInit() {
   
    const id = this.route.snapshot.paramMap.get('id');
  if (id) {
    this.parceiroService.obterPorId(id).subscribe((data: Parceiro) => {
      this.Parceiro = data;
    });
  }
  }

 

  salvarAlteracoes() {
    this.parceiroService.atualizar(this.Parceiro).subscribe({
      next: () => {
        alert('Parceiro atualizado com sucesso!');
        this.router.navigate(['/parceiros']);
      },
      error: () => alert('Erro ao atualizar parceiro.'),
    });
  }
  
}