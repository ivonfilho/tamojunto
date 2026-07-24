import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ApiConfig } from '../services/api/api.config';

@Injectable({
  providedIn: 'root',
})
export class NotificacaoService extends ApiConfig {
  constructor(private http: HttpClient) {
    super();
  }

  listarPorIdCliente(idCliente: string): Observable<any> {
    return this.http.get(`${this.URL_API}/api/notificacao/ListarPorIdCliente`, {
      params: { idCliente },
    });
  }
}
