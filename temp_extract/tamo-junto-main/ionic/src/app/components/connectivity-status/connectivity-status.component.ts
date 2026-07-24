import { Component, OnInit } from '@angular/core';
import { ApiConnectivityService } from '../../services/api-connectivity.service';

@Component({
  selector: 'app-connectivity-status',
  template: `
    <ion-card>
      <ion-card-header>
        <ion-card-title>Status da API</ion-card-title>
      </ion-card-header>
      <ion-card-content>
        <div class="status-info">
          <div class="status-item">
            <ion-icon 
              [name]="isConnected ? 'checkmark-circle' : 'close-circle'"
              [color]="isConnected ? 'success' : 'danger'">
            </ion-icon>
            <span>Conectado: {{ isConnected ? 'Sim' : 'Não' }}</span>
          </div>
          
          <div class="status-item">
            <ion-icon name="link"></ion-icon>
            <span>API Atual: {{ currentApiUrl }}</span>
          </div>
          
          <div class="status-item">
            <ion-icon name="list"></ion-icon>
            <span>APIs Disponíveis: {{ availableUrls.length }}</span>
          </div>
        </div>
        
        <ion-button 
          (click)="refreshConnectivity()" 
          [disabled]="refreshing"
          expand="block"
          fill="outline">
          <ion-icon src="assets/icon/Refresh.svg" *ngIf="!refreshing"></ion-icon>
          <ion-spinner name="crescent" *ngIf="refreshing"></ion-spinner>
          {{ refreshing ? 'Testando...' : 'Testar Conectividade' }}
        </ion-button>
        
        <div class="urls-list" *ngIf="availableUrls.length > 0">
          <h4>APIs Disponíveis:</h4>
          <ion-list>
            <ion-item *ngFor="let url of availableUrls">
              <ion-icon 
                [name]="url === currentApiUrl ? 'checkmark' : 'ellipse'"
                [color]="url === currentApiUrl ? 'success' : 'medium'"
                slot="start">
              </ion-icon>
              <ion-label>{{ url }}</ion-label>
              <ion-button 
                slot="end" 
                size="small"
                (click)="testUrl(url)"
                [disabled]="testingUrl === url">
                {{ testingUrl === url ? 'Testando...' : 'Testar' }}
              </ion-button>
            </ion-item>
          </ion-list>
        </div>
      </ion-card-content>
    </ion-card>
  `,
  styles: [`
    .status-info {
      margin-bottom: 1rem;
    }
    
    .status-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
    }
    
    .urls-list {
      margin-top: 1rem;
    }
    
    .urls-list h4 {
      margin-bottom: 0.5rem;
      color: var(--ion-color-medium);
    }
  `]
})
export class ConnectivityStatusComponent implements OnInit {
  isConnected = false;
  currentApiUrl = '';
  availableUrls: string[] = [];
  refreshing = false;
  testingUrl = '';

  constructor(private apiConnectivity: ApiConnectivityService) {}

  ngOnInit() {
    this.loadConnectivityInfo();
    
    // Observar mudanças na conectividade
    this.apiConnectivity.isConnected$.subscribe(status => {
      this.isConnected = status;
    });
    
    this.apiConnectivity.currentApiUrl$.subscribe(url => {
      this.currentApiUrl = url;
    });
  }

  loadConnectivityInfo() {
    const info = this.apiConnectivity.getConnectivityInfo();
    this.isConnected = info.isConnected;
    this.currentApiUrl = info.currentUrl;
    this.availableUrls = info.availableUrls;
  }

  async refreshConnectivity() {
    this.refreshing = true;
    
    try {
      const newUrl = await this.apiConnectivity.refreshConnectivity();
      this.loadConnectivityInfo();
    } catch (error) {
    } finally {  

      this.refreshing = false;
    }
  }

  async testUrl(url: string) {
    this.testingUrl = url;
    
    try {
      const isWorking = await this.apiConnectivity.testUrl(url);
      
      if (isWorking && url !== this.currentApiUrl) {
      }
    } catch (error) {
    } finally {
      this.testingUrl = '';
    }
  }
} 