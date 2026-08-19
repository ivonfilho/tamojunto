import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './guard/auth.guard';
import { AssinaturaGuard } from './guard/assinatura.guard';
import { ParceiroGuard } from './guard/parceiro.guard';
import { DashboardGuard } from './guard/dashboard.guard';

const routes: Routes = [
  {
    path: '',
    loadChildren: () =>
      import('./login/login.module').then((m) => m.LoginPageModule)
  },
  {
    path: 'dashboard',
    loadChildren: () =>
      import('./dashboard/dashboard.module').then((m) => m.DashboardPageModule),
    canActivate: [AuthGuard, AssinaturaGuard, DashboardGuard]
  },
  {
    path: 'dashboard-parceiro',
    loadChildren: () =>
      import('./dashboard-parceiro/dashboard-parceiro.module').then((m) => m.DashboardParceiroPageModule),
    canActivate: [AuthGuard, AssinaturaGuard, DashboardGuard]
  },
  {
    path: 'minhas-compras',
    loadChildren: () =>
      import('./minhas-compras/minhas-compras.module').then((m) => m.MinhasComprasPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
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
    loadChildren: () =>
      import('./ofertas/ofertas.module').then((m) => m.OfertasPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'editar-oferta/:id',
    loadChildren: () =>
      import('./ofertas/editar-ofertas/editar-ofertas.module').then((m) => m.EditarOfertasPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'oferta/:id',
    loadChildren: () =>
      import('./ofertas/visualizar-ofertas/visualizar-ofertas.module').then((m) => m.VisualizarOfertasPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'oferta-publica/:id',
    loadChildren: () =>
      import('./ofertas/visualizar-ofertas-publica/visualizar-ofertas-publica.module').then((m) => m.VisualizarOfertasPublicaPageModule)
  },
  {
    path: 'cadastro-oferta',
    loadChildren: () =>
      import('./cadastro-oferta/cadastro-oferta.module').then((m) => m.CadastroOfertaPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'mensagens',
    loadChildren: () =>
      import('./mensagens/mensagens.module').then((m) => m.MensagensPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'cupons',
    loadChildren: () =>
      import('./cupons/cupons.module').then((m) => m.CuponsPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'cupom/:id',
    loadChildren: () =>
      import('./cupons/visualizar-cupom/visualizar-cupom.module').then((m) => m.VisualizarCupomPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'resgatar-cupom/:id',
    loadChildren: () => import('./cupons/resgatar-cupom/resgatar-cupom.module').then((m) => m.ResgatarCupomComponentModule),
    canActivate: [AuthGuard, AssinaturaGuard, ParceiroGuard]
  },
  {
    path: 'extrato',
    loadChildren: () =>
      import('./extrato/extrato.module').then((m) => m.ExtratoPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'notificacao',
    loadChildren: () =>
      import('./notificacao/notificacao.module').then((m) => m.NotificacaoPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'meu-perfil',
    loadChildren: () =>
      import('./meu-perfil/meu-perfil.module').then((m) => m.MeuPerfilPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'historico-pedidos',
    loadChildren: () =>
      import('./meu-perfil/historico-pedidos/historico-pedidos.module').then((m) => m.HistoricoPedidosPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'ajuda',
    loadChildren: () =>
      import('./ajuda/ajuda.module').then((m) => m.AjudaPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'parceiros',
    loadChildren: () => import('./parceiros/parceiros.module').then( m => m.ParceirosPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
  },
  {
    path: 'cadastro-parceiro',
    loadChildren: () =>
      import('./parceiros/cadastrar_parceiro/cadastrar-parceiro.module').then((m) => m.EditarParceiroPageModule)
  },
  {
    path: 'editar-parceiro/:id',
    loadChildren: () => import('./parceiros/editar-parceiro/editar-parceiro.module').then(m => m.EditarParceiroPageModule),
    canActivate: [AuthGuard, AssinaturaGuard]
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
  }
];

@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules, useHash: true }),
  ],
  exports: [RouterModule],
})
export class AppRoutingModule {}
