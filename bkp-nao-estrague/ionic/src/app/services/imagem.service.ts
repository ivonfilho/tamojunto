import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiConfig } from '../services/api/api.config';

export interface Imagem {
  id: string;
  path: string;
  idOfertaParceiro: string;
}

@Injectable({
  providedIn: 'root',
})
export class ImagemService extends ApiConfig {
  constructor(private http: HttpClient) {
    super();
  }

  @Injectable({
    providedIn: 'root',
  })
 
    criarImagem(imagem: Partial<Imagem>): Observable<Imagem> {
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
  
      return this.http
        .post<Imagem>(`${this.URL_API}/api/imagem/Criar`, imagem, { headers })
        .pipe(
          catchError((error) => {
            console.error('Erro ao criar imagem:', error);
            throw error;
          })
        );
    }
  }
  
  

