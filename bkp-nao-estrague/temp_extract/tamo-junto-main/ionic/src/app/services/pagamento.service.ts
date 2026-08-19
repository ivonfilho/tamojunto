import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiConfig } from '../services/api/api.config';

@Injectable({
  providedIn: 'root',
})
export class PagamentoService extends ApiConfig {
  constructor(private http: HttpClient) {
    super();
  }


  criarPagamento(dados: any): Observable<any> {
    return this.http.post(`${this.URL_API}/api/assinatura/CriarPagamento`, dados);
  }

  listarPlanos(): Observable<any> {
    return this.http.get(`${this.URL_API}/api/plano/ListarPorTipoUsuario`);
  }

  // Método para buscar cliente pelo ID do usuário
  buscarClientePorUsuario(idUsuario: string): Observable<any> {
    return this.http.get(`${this.URL_API}/api/cliente/obterPorUsuario?idUsuario=${idUsuario}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Erro ao buscar cliente:', error);
          return throwError(() => error);
        })
      );
  }

  // Método para buscar parceiro pelo ID do usuário
  buscarParceiroPorUsuario(idUsuario: string): Observable<any> {
    return this.http.get(`${this.URL_API}/api/parceiro/parceiroPorUsuario/${idUsuario}`)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Erro ao buscar parceiro:', error);
          return throwError(() => error);
        })
      );
  }

  // Método para criar assinatura gratuita (cliente)
  criarAssinaturaGratuita(dados: any): Observable<any> {
    return this.http.post(`${this.URL_API}/api/assinatura/CriarAssinaturaCliente`, dados)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Erro ao criar assinatura gratuita:', error);
          return throwError(() => error);
        })
      );
  }

  // Método para criar assinatura de parceiro
  criarAssinaturaParceiro(dados: any): Observable<any> {
    return this.http.post(`${this.URL_API}/api/assinatura/CriarAssinaturaParceiro`, dados)
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Erro ao criar assinatura de parceiro:', error);
          return throwError(() => error);
        })
      );
  }

  gerarLinkPagamento(idPlano: string): Observable<any> {
    return this.http.post(`${this.URL_API}/api/pagamento/GerarLinkPagamento?idPlano=${idPlano}`, {})
      .pipe(
        catchError((error: HttpErrorResponse) => {
          console.error('Erro no serviço de pagamento:', error);
          return throwError(() => error);
        })
      );
  }

  minhasAssinaturas(): Observable<any> {
    return this.http.get(`${this.URL_API}/api/pagamento/MinhasAssinaturas`);
  }

  verificarAssinaturaAtiva(): Observable<any> {
    return this.http.get(`${this.URL_API}/api/pagamento/VerificarAssinaturaAtiva`);
  }
}
