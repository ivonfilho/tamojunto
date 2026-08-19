/** Compara apenas a data (UTC) para alinhar com o backend (CupomCliente / ObterPorId). */
export function ofertaExpirada(oferta: { validade?: string | Date } | null | undefined): boolean {
  if (!oferta?.validade) {
    return false;
  }

  const validade = new Date(oferta.validade);
  if (isNaN(validade.getTime())) {
    return true;
  }

  const hojeUtc = new Date();
  const hojeDate = Date.UTC(hojeUtc.getUTCFullYear(), hojeUtc.getUTCMonth(), hojeUtc.getUTCDate());
  const validadeDate = Date.UTC(validade.getUTCFullYear(), validade.getUTCMonth(), validade.getUTCDate());

  return validadeDate < hojeDate;
}

export function ofertaStatusAtivo(oferta: { status?: boolean | string } | null | undefined): boolean {
  const status = oferta?.status;
  if (status === true || status === 'true') {
    return true;
  }
  if (status === false || status === 'false') {
    return false;
  }
  return status === undefined;
}

export function ofertaDisponivel(
  oferta: { validade?: string | Date; status?: boolean | string } | null | undefined
): boolean {
  return ofertaStatusAtivo(oferta) && !ofertaExpirada(oferta);
}
