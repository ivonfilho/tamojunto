/** Resposta de POST /api/cupomCliente/Criar */
export interface CupomClienteCriarResponse {
  success?: boolean;
  id?: string;
  message?: string;
}

export interface Cupom {
    id: string,
    nomeProduto: string,
    preco: string,
    dataResgate: string,
    dataUtilizacao: string,
    idOfertaParceiro: string,
    idCliente: string,
    idClienteNavigation?: string,
    ofertaParceiro?: any,
    qrCode?:string,
    utilizado?: boolean,
    aUtilizacao?: string, // Data de utilização do cupom
    status?: 'Gerados' | 'Utilizados' | 'Indisponíveis',
    valorComDesconto?: number | string;
    
}

export interface RelatorioCupom {
    codigoCupom: string;
    descricaoOferta: string;
    quantidadeUsos: number;
    valorTotalVendido: number;
    ticketMedio: number;
    dataExpiracao: Date;
  }

  export interface ResumoGeral {
    totalVendido: number;
    ticketMedioGeral: number;
  }
  
  export interface RelatorioCupomResponse {
    resumoGeral: ResumoGeral;
    registros: RelatorioCupom[];
    paginacao: {
      paginaAtual: number;
      totalPaginas: number;
      totalRegistros: number;
    };
    
}
  export interface RelatorioResponse {
    dados: RelatorioCupom[];
    resumo: ResumoGeral;
    total: number;
    }
