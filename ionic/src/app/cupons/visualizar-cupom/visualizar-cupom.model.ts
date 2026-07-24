export interface VisualizarCupom {
  id: string,
  dataResgate: string,
  idOfertaParceiro: string,
  idCliente: string,
  idClienteNavigation?: string,
  ofertaParceiro?: any,
  qrCode?:string
}
