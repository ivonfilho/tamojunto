import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ApiConfig } from './api/api.config';

@Injectable({
  providedIn: 'root',
})
export class CnpjService {
  constructor(
    private http: HttpClient,
    private apiConfig: ApiConfig
  ) {}

  consultarCNPJ(cnpj: string) {
    const cnpjNumeros = cnpj.replace(/\D/g, '');
    return this.http.get(`${this.apiConfig.URL_API}/api/cnpj/${cnpjNumeros}`);
  }
}
