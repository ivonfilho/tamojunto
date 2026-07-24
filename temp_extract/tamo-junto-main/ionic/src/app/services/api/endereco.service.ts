import { Injectable } from '@angular/core';
import { ApiConfig } from '../api/api.config';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Endereco } from '../../ofertas/oferta.model';

@Injectable({
    providedIn: 'root'
  })
  export class EnderecoService extends ApiConfig {
  
    constructor(private http: HttpClient) {
      super();
    }
  
    criarEndereco(endereco: Endereco): Observable<Endereco> {
      const headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    
      return this.http.post<Endereco>(
        `${this.URL_API}/api/endereco/Criar`,
        endereco,
        { headers }
      ).pipe(
        catchError((error) => {
          console.error('Erro ao criar endereço:', error);
          throw error;
        })
      );
    }
  }
  