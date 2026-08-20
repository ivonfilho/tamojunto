import { Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ApiConfig {
  public URL_API = environment.apiUrl;
  
  // URL do frontend para produÃ§Ã£o
  public FRONTEND_URL = 'http://tamojunto.31.97.254.35.sslip.io';
}
