import { Component, OnInit } from '@angular/core';
import {  Router } from '@angular/router';
import { HistoricoPedidosService } from '../../services/historico-pedidos.service';

@Component({
  selector: 'app-historico-pedidos',
  templateUrl: './historico-pedidos.html',
  styleUrls: ['./historico-pedidos.scss'],
})
export class HistoricoPedidosPage implements OnInit {

  pedidos: any = null;
  statusSelecionado: string = 'Todos';

  showToast: boolean = false;
  toastMessage: string =  "";
  toastColor: string = "";

  constructor(private router: Router, private historicoPedidosService: HistoricoPedidosService) { }

  ngOnInit() {
    this.listarPedidos()
  }

  listarPedidos(){
    this.historicoPedidosService.getPedidos(this.statusSelecionado)
      .subscribe({
        next: (response) => {
          this.pedidos = response?.data || [];
        },
        error: () => {
          this.toastMessage = "Ops, ocorreu um erro ao listar os pedidos. Tente novamente mais tarde.";
          this.toastColor = "danger";
          this.showToast = true
        }
      });
  }

  onStatusChange() {
    this.listarPedidos();
  }
  voltarParaMeuPerfil(){
    this.router.navigate(['meu-perfil']);
  }
}
