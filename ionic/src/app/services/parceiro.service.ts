import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '../services/api/api.config';
import { Parceiro, Empresa } from '../parceiros/parceiro.model';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ParceiroService {
  private baseUrl = new ApiConfig().URL_API + '/api/parceiro';
  private baseUrl1 = new ApiConfig().URL_API + '/api/empresa';    

  constructor(private http: HttpClient) {}

  // Cache em memória para evitar requisições redundantes
  private cacheParceiro: any = null;
  private cacheIdUsuario: string | null = null;

  // Método para buscar parceiro por ID de usuário
  buscarParceiroPorUsuario(idUsuario: string): Observable<any> {
    if (this.cacheParceiro && this.cacheIdUsuario === idUsuario) {
      console.log('[ParceiroService] Retornando parceiro do cache em memória');
      return of(this.cacheParceiro);
    }

    const url = `${this.baseUrl}/ParceiroPorUsuario/${idUsuario}`;
    console.log('[ParceiroService] Fazendo requisição para:', url);
    return this.http.get<any>(url).pipe(
      tap(res => {
        if (res && res.idParceiro) {
          this.cacheParceiro = res;
          this.cacheIdUsuario = idUsuario;
        }
      })
    );
  }

  listar(): Observable<Parceiro[]> {
    const url = `${this.baseUrl}/Listar`;
    return this.http.get<Parceiro[]>(url);
  }

  
  deletar(id: string): Observable<void> {
    const url = `${this.baseUrl}/Deletar?id=${id}`;
    return this.http.delete<void>(url);
  }

  criar(parceiro: Parceiro): Observable<any> {
    const url = `${this.baseUrl}/Criar`;
    return this.http.post<any>(url, parceiro);
  }
  
  atualizar(parceiro: Parceiro): Observable<any> {
    const url = `${this.baseUrl}/Alterar`;
    return this.http.put<any>(url, parceiro);
  }

  obterPorId(id: string): Observable<Parceiro> {
    return this.http.get<Parceiro>(`${this.baseUrl}/Detalhar/${id}`);
  }
  criarEmpresa(empresa: Empresa): Observable<any> {
    return this.http.post(`${this.baseUrl1}/Criar`, empresa); 
  }
  
  
}


