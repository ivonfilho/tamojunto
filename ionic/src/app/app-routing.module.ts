import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { ParceiroGuard } from './guard/parceiro.guard';
import { ClienteGuard } from './guard/cliente.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then((m) => m.DashboardPageModule)
  },
  {
    path: 'dashboard-parceiro',
    loadChildren: () =>
      import('./dashboard-parceiro/dashboard-parceiro.module').then((m) => m.DashboardParceiroPageModule)
  },
  {
    path: 'minhas-compras',
    loadChildren: () =>
      import('./minhas-compras/minhas-compras.module').then((m) => m.MinhasComprasPageModule)
  },
  {
    path: 'Assinatura',
    loadChildren: () =>
      import('./pagamentos/pagamentos.module').then((m) => m.PagamentosPageModule)
  },
  {
    path: 'pagamentos',
    loadChildren: () =>
      import('./pagamentos/pagamentos.module').then((m) => m.PagamentosPageModule)
  },
  {
    path: 'ofertas',
    canActivate: [ClienteGuard],
    loadChildren: () =>
      import('./ofertas/ofertas.module').then((m) => m.OfertasPageModule)
  },
  {
    path: 'editar-oferta/:id',
    canActivate: [ParceiroGuard],
    loadChildren: () =>
      import('./ofertas/editar-ofertas/editar-ofertas.module').then((m) => m.EditarOfertasPageModule)
  },
  {
    path: 'oferta/:id',
    loadChildren: () =>
      import('./ofertas/visualizar-ofertas/visualizar-ofertas.module').then((m) => m.VisualizarOfertasPageModule)
  },
  {
    path: 'oferta-publica/:id',
    loadChildren: () =>
      import('./ofertas/visualizar-ofertas-publica/visualizar-ofertas-publica.module').then((m) => m.VisualizarOfertasPublicaPageModule)
  },
  {
    path: 'cadastro-oferta',
    canActivate: [ParceiroGuard],
    loadChildren: () =>
      import('./cadastro-oferta/cadastro-oferta.module').then((m) => m.CadastroOfertaPageModule)
  },
  {
    path: 'mensagens',
    loadChildren: () =>
      import('./mensagens/mensagens.module').then((m) => m.MensagensPageModule)
  },
  {
    path: 'cupons',
    loadChildren: () =>
      import('./cupons/cupons.module').then((m) => m.CuponsPageModule)
  },
  {
    path: 'cupom/:id',
    loadChildren: () =>
      import('./cupons/visualizar-cupom/visualizar-cupom.module').then((m) => m.VisualizarCupomPageModule)
  },
  {
    path: 'resgatar-cupom/:id',
    canActivate: [ParceiroGuard],
    loadChildren: () => import('./cupons/resgatar-cupom/resgatar-cupom.module').then((m) => m.ResgatarCupomComponentModule)
  },
  {
    path: 'extrato',
    loadChildren: () =>
      import('./extrato/extrato.module').then((m) => m.ExtratoPageModule)
  },
  {
    path: 'notificacao',
    loadChildren: () =>
      import('./notificacao/notificacao.module').then((m) => m.NotificacaoPageModule)
  },
  {
    path: 'meu-perfil',
    loadChildren: () =>
      import('./meu-perfil/meu-perfil.module').then((m) => m.MeuPerfilPageModule)
  },
  {
    path: 'historico-pedidos',
    loadChildren: () =>
      import('./meu-perfil/historico-pedidos/historico-pedidos.module').then((m) => m.HistoricoPedidosPageModule)
  },
  {
    path: 'ajuda',
    loadChildren: () =>
      import('./ajuda/ajuda.module').then((m) => m.AjudaPageModule)
  },
  {
    path: 'parceiros',
    loadChildren: () => import('./parceiros/parceiros.module').then( m => m.ParceirosPageModule)
  },
  {
    path: 'cadastro-parceiro',
    loadChildren: () =>
      import('./parceiros/cadastrar_parceiro/cadastrar-parceiro.module').then((m) => m.EditarParceiroPageModule)
  },
  {
    path: 'editar-parceiro/:id',
    loadChildren: () => import('./parceiros/editar-parceiro/editar-parceiro.module').then(m => m.EditarParceiroPageModule)
  },
  {
    path: 'connectivity-test',
    loadChildren: () => import('./connectivity-test/connectivity-test.module').then(m => m.ConnectivityTestPageModule)
  },
  {
    path: 'confirmar-email',
    loadChildren: () => import('./confirmar-email/confirmar-email.module').then( m => m.ConfirmarEmailPageModule)
  },
  {
    path: 'recuperar-senha-email',
    loadChildren: () => import('./recuperar-senha-email/recuperar-senha-email.module').then( m => m.RecuperarSenhaEmailPageModule)
  },
  {
    path: 'recuperar-senha-sms',
    loadChildren: () => import('./recuperar-senha-sms/recuperar-senha-sms.module').then( m => m.RecuperarSenhaSmsPageModule)
  },
  {
    path: 'confirmar-codigo-sms',
    loadChildren: () => import('./confirmar-codigo-sms/confirmar-codigo-sms.module').then( m => m.ConfirmarCodigoSmsPageModule)
  },
  {
    path: 'ofertas-parceiro',
    canActivate: [ParceiroGuard],
    loadChildren: () => import('./ofertas-parceiro/ofertas-parceiro.module').then( m => m.OfertasParceiroPageModule)
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, useHash: true }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
