import { Injectable } from '@angular/core';
import { ApiConfig } from './api/api.config';
import { HttpClient, HttpParams } from '@angular/common/http';
import { catchError, tap } from 'rxjs/operators';
import { Observable, throwError  } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class HistoricoPedidosService extends ApiConfig {
  constructor(private http: HttpClient) {
    super();
  }

  getPedidos(status?: string, page: number = 1, pageSize: number = 10): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());

    if (status && status !== 'Todos') {
      params = params.set('status', status);
    }

    return this.http.get<any>(`${this.URL_API}/Pedido/Listar`, { params }).pipe(
      catchError(this.handleError)
    );
  }

  private handleError(error: any): Observable<never> {
    console.error('Erro na requisição:', error);
    return throwError(() => new Error(error.message || 'Erro desconhecido.'));
  }
}
