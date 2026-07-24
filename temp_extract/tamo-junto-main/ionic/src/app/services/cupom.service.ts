import { Injectable } from '@angular/core';
import { ApiConfig } from './api/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable, of, forkJoin } from 'rxjs';
import { resgatarOferta } from '../ofertas/oferta.model';
import { catchError, tap } from 'rxjs/operators';
import { Cupom, CupomClienteCriarResponse, RelatorioResponse } from '../cupons/cupom.model';
import { map } from 'rxjs/operators';


@Injectable({
  providedIn: 'root'
})
export class CupomService extends ApiConfig {

  constructor(private http: HttpClient) {
    super();
  }

  resgatarOferta(ofertaResgate: resgatarOferta): Observable<CupomClienteCriarResponse> {
    return this.http.post<CupomClienteCriarResponse>(`${this.URL_API}/api/cupomCliente/Criar`, ofertaResgate).pipe(
      tap(() => {
        console.log('Oferta resgatada com sucesso:', ofertaResgate);
      }),
      catchError((error) => {
        console.error('Erro ao resgatar oferta:', error);
        throw error;
      })
    );
  }

  listarCupoms(idCliente: string): Observable<any> {
    const url = `${this.URL_API}/api/cupomCliente/Listar?idCliente=${idCliente}`;
  
    return this.http.get<any>(url).pipe(
      tap((response) => {
        
        if (response && response.length > 0) {
          // Verificar se tem ofertaParceiro
          const oferta = response[0].ofertaParceiro || response[0].OfertaParceiro;
          if (oferta) {
            
            // Verificar se tem parceiro
            const parceiro = oferta.idParceiroNavigation || oferta.IdParceiroNavigation;
            if (parceiro) {
              // Verificar se tem empresa
              const empresa = parceiro.idEmpresaNavigation || parceiro.IdEmpresaNavigation;
              if (empresa) {
              }
            }
          } else {
          }
        }
      }),
      catchError((error) => {
        console.error('[CupomService] Erro ao listar cupons:', error);
        console.error('[CupomService] URL da requisição:', error.url);
        console.error('[CupomService] Stack trace:', error.stack);
        
        throw error;
      })
    );
  }
  listarCuponsPorParceiro(idParceiro: string): Observable<any[]> {
    return this.http.get<any[]>(`${this.URL_API}/api/ofertaParceiro/ListarCuponsPorParceiro/${idParceiro}`);
  }


  listarCupomOfertaParceiro(idOfertaParceiro: string): Observable<Cupom[]> {
    return this.http.get<Cupom[]>(`${this.URL_API}/api/cupomCliente/ListarPorParceiro/${idOfertaParceiro}`);
  }
  cupomQRCODE(cupomId:string): Observable<any>{
    return this.http.get<any>(`${this.URL_API}/api/cupomCliente/QrCode?id=${cupomId}`).pipe(
      catchError((error) => {
        console.error('Erro ao Qrcode:', error);
        throw error;
      })
    );
  }

  resgatarCupom(cupomId: string): Observable<any> {
    return this.http.post<any>(`${this.URL_API}/api/cupomCliente/Resgatar?idCupom=${cupomId}`, {}).pipe(
      catchError((error) => {
        console.error('Erro ao validar cupom:', error);
        throw error;
      })
    );
  }

  buscarCupomDaOferta(ofertaId: string): Observable<string | null> {
    return this.http.get<Cupom[]>(`${this.URL_API}/api/cupomCliente/ListarPorParceiro/${ofertaId}`).pipe(
      map((cupons) => (cupons.length > 0 ? cupons[0].id : null)),
      catchError((error) => {
        console.error('Erro ao buscar cupom vinculado:', error);
        return of(null); // Retorna null em caso de erro
      })
    );
  }

  ListarCupomPorCategoria(categoria: string): Observable<Cupom[]> {
    return this.http.get<Cupom[]>(`${this.URL_API}/api/cupomCliente/ListarPorCategoria?categoria=${categoria}`).pipe(
      map((cupons) => cupons),
      catchError((error) => {
        console.error('Erro ao buscar cupons:', error);
        return of([]);
      })
    );
  }


  excluirCupom(cupomId: string): Observable<boolean> {
    return this.http.delete<boolean>(`${this.URL_API}/api/cupomCliente/Deletar?id=${cupomId}`).pipe(
      catchError((error) => {
        console.error('Erro ao excluir cupom:', error);
        return of(false);
      })
    );
  }

  receberRelatorio(params: any): Observable<RelatorioResponse>{
    return this.http.get<RelatorioResponse>(`${this.URL_API}/relatorio`, { params });
  }

  exportarRelatorioCSV(filtros: any): Observable<Blob> {
    return this.http.get(`${this.URL_API}/relatorio/exportar`, {
      params: filtros,
      responseType: 'blob'
    });
  }
  listarCuponsComStatus(idCliente?: string): Observable<any[]> {
    let url = `${this.URL_API}/api/cupomCliente/ListarCuponsComStatus`;
    if (idCliente) {
      url += `?idCliente=${idCliente}`;
    }

    
    return this.http.get<any[]>(url).pipe(
      tap((response) => {
        
        if (response && response.length > 0) {
        }
      }),
      catchError((error) => {
        console.error('[CupomService] Erro ao listar cupons com status:', error);
        console.error('[CupomService] URL da requisição:', error.url);
        console.error('[CupomService] Stack trace:', error.stack);
        
        // Retornar array vazio em caso de erro
        return of([]);
      })
    );
  }  
}
