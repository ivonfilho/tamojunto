import { Component, OnInit } from '@angular/core';
import { ConnectivityTestService } from '../services/connectivity-test.service';
import { ToastController, LoadingController } from '@ionic/angular';

@Component({
  selector: 'app-connectivity-test',
  templateUrl: './connectivity-test.page.html',
  styleUrls: ['./connectivity-test.page.scss'],
})
export class ConnectivityTestPage implements OnInit {
  testResults: any = null;
  isRunning = false;

  constructor(
    private connectivityTest: ConnectivityTestService,
    private toastController: ToastController,
    private loadingController: LoadingController
  ) {}

  ngOnInit() {}

  async runConnectivityTests() {
    this.isRunning = true;
    this.testResults = null;

    const loading = await this.loadingController.create({
      message: 'Executando testes de conectividade...',
      duration: 0
    });
    await loading.present();

    console.log('[Connectivity Test Page] Starting tests...');

    // Executar testes individuais
    this.connectivityTest.testBasicConnectivity().subscribe({
      next: (results: any) => {
        console.log('[Connectivity Test Page] Basic connectivity test completed:', results);
        this.testResults = { basic: results };
        this.isRunning = false;
        loading.dismiss();
        
        this.showResultsToast(results);
      },
      error: (error: any) => {
        console.error('[Connectivity Test Page] Test error:', error);
        this.isRunning = false;
        loading.dismiss();
        
        this.showErrorToast('Erro ao executar testes');
      }
    });
  }

  async showResultsToast(results: any) {
    const basicOk = results?.success;

    let message = 'Teste concluído:\n';
    message += `Servidor Railway: ${basicOk ? '✅' : '❌'}`;

    const toast = await this.toastController.create({
      message: message,
      duration: 5000,
      position: 'top',
      color: basicOk ? 'success' : 'warning'
    });
    toast.present();
  }

  async showErrorToast(message: string) {
    const toast = await this.toastController.create({
      message: message,
      duration: 3000,
      position: 'top',
      color: 'danger'
    });
    toast.present();
  }

  getStatusIcon(success: boolean): string {
    return success ? '✅' : '❌';
  }

  getStatusColor(success: boolean): string {
    return success ? 'success' : 'danger';
  }

  copyResultsToClipboard() {
    if (this.testResults) {
      const resultsText = JSON.stringify(this.testResults, null, 2);
      navigator.clipboard.writeText(resultsText).then(() => {
        this.showErrorToast('Resultados copiados para clipboard');
      });
    }
  }
} 