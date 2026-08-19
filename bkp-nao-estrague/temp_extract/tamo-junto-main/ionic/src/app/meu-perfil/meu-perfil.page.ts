import { Component, OnInit } from '@angular/core';
import {  Router } from '@angular/router';

@Component({
  selector: 'app-meu-perfil',
  templateUrl: './meu-perfil.page.html',
  styleUrls: ['./meu-perfil.page.scss'],
})
export class MeuPerfilPage implements OnInit {

  constructor(private router: Router) { }

  ngOnInit() {
  }

  irParaHistoricoPedidos(){
    this.router.navigate(['historico-pedidos']);
  }
}
