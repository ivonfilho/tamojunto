import { Injectable } from '@angular/core';
import { ApiConfig } from './api/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { Oferta } from '../ofertas/oferta.model';
import { Imagem } from '../imagens/imagem.model';
import { catchError, tap, map, switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class OfertaService extends ApiConfig {
  private ofertas: Oferta[] = [];
  constructor(private http: HttpClient) {
    super();
  }

  criarOferta(oferta: Oferta): Observable<Oferta> {
    return this.http.post<Oferta>(`${this.URL_API}/api/ofertaParceiro/Criar`, oferta).pipe(
      catchError((error) => {
        console.error('Erro ao criar oferta:', error);
        throw error;
      })
    );
  }

  listarOfertas(): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.URL_API}/api/ofertaParceiro/Listar`).pipe(
      tap((ofertas) => (this.ofertas = ofertas)),
      catchError((error) => {
        console.error(`Erro ao carregar ofertas:`, error);
        return of([]);
      })
    );
  }

  listarOfertasPorParceiro(idParceiro: string): Observable<Oferta[]> {
    return this.http.get<Oferta[]>(`${this.URL_API}/api/ofertaParceiro/ListarPorParceiro/${idParceiro}`).pipe(
      tap((ofertas) => (this.ofertas = ofertas)),
      catchError((error) => {
        console.error(`Erro ao carregar ofertas do parceiro:`, error);
        return of([]);
      })
    );
  }

  editarOferta(oferta: Oferta): Observable<Oferta> {
    return this.http.put<Oferta>(`${this.URL_API}/api/ofertaParceiro/Alterar`, oferta).pipe(
      catchError((error) => {
        console.error(`Erro ao editar oferta com ID ${oferta.id}:`, error);
        throw error;
      })
    );
  }

  editarOfertaPorId(id:string):Oferta | undefined {
    return this.ofertas.find(oferta => oferta.id === id);
  }

  obterOfertaPorId(id: string): Observable<Oferta> {
    return this.http.get<Oferta>(`${this.URL_API}/api/ofertaParceiro/ObterPorId/${id}`).pipe(
      catchError((error) => {
        console.error(`Erro ao obter oferta com ID ${id}:`, error);
        throw error;
      })
    );
  }

  excluirOferta(id: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.URL_API}/api/ofertaParceiro/Deletar?id=${id}`).pipe(
      catchError((error) => {
        console.error(`Erro ao excluir oferta com ID ${id}:`, error);
        return of(false);
      })
    );
  }

  atualizarStatus(ofertaId: string, status: string) {
    return this.http.put(`${this.URL_API}/api/ofertaParceiro/AlterarStatus/${ofertaId}`, 
      { novoStatus: status },  // Enviar como JSON
      { headers: { 'Content-Type': 'application/json' } }
    );
  }
  
  listarComDescontoECategoria(): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL_API}/api/ofertaParceiro/ListarComDescontoECategoria`).pipe(
      catchError((error) => {
        console.error('Erro ao carregar categorias e descontos:', error);
        return of([]);
      })
    );
  }
}