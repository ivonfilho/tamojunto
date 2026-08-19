import { Injectable } from '@angular/core';
import { ApiConfig } from './api/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable,  } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { Cupom } from '../cupons/cupom.model';

@Injectable({
  providedIn: 'root'
})
export class ClienteService extends ApiConfig {

  constructor(private http: HttpClient) {
    super();
  }
  listarCuponsPorParceiro(idParceiro: string): Observable<Cupom[]> {
    const url = `${this.URL_API}/ListarCuponsPorParceiro?idParceiro=${idParceiro}`;
    return this.http.get<Cupom[]>(url);
}
  
listarCuponsPorCliente(idCliente: string): Observable<any[]> {
  const url = `${this.URL_API}/api/cupomCliente/Listar?idCliente=${idCliente}`;
  return this.http.get<any[]>(url).pipe(
    catchError((error) => {
      console.error('Erro ao listar cupons por cliente:', error);
      return of([]); 
    })
  );
}
  obterClientePorUsuario(usuarioId: string): Observable<any> {
    return this.http.get<any>(`${this.URL_API}/api/cliente/ObterPorUsuario?idUsuario=${usuarioId}`).pipe(
      catchError((error) => {
        console.error('Erro ao obter cliente por usuário:', error);
        throw error;
      })
    );
  }
}
