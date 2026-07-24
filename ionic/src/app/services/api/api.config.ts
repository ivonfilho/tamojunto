import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiConfig {
  public URL_API = environment.apiUrl;
  
  // URL do frontend para produção
  public FRONTEND_URL = 'https://app.tamojunto.net';
}