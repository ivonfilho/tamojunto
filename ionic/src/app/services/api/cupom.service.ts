import { Injectable } from '@angular/core';
import { ApiConfig } from '../api/api.config';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Cupom } from '../../cupons/cupom.model';
import { catchError,tap} from 'rxjs/operators';


@Injectable({
    providedIn: 'root'
  })
  export class CupomService extends ApiConfig {
  
    constructor(private http: HttpClient) {
      super();
    }
  
    listarTodosCupoms(): Observable<Cupom[]> {
      return this.http.get<Cupom[]>(`${this.URL_API}/api/cupomCliente/Listar`).pipe(
        catchError((error) => {
          console.error(`Erro ao carregar cupons:`, error);
          return of([]);
        })
      );
    }
    obterOfertaParceiro(idOfertaParceiro: string): Observable<any> {
      return this.http.get<any>(`${this.URL_API}/api/ofertaParceiro/Listar?id=${idOfertaParceiro}`).pipe(
        catchError((error) => {
          console.error('Erro ao carregar detalhes da oferta parceira:', error);
          return of(null); // Retorna null em caso de erro
        })
      );
    }
    
    cupomQRCODE(cupomId: string): Observable<any> {
      return this.http.get<any>(`${this.URL_API}/api/cupomCliente/QrCode?id=${cupomId}`).pipe(
        tap((qrCode) => {
          console.log('QR Code gerado:', qrCode); // Verifica o valor retornado pela API
        }),
        catchError((error) => {
          console.error('Erro ao Qrcode:', error);
          throw error;
        })
      );
    }
  }
  