using TamoJunto.Domain.Interfaces;
using TamoJunto.Domain.Models;

namespace TamoJunto.Domain.Services
{
    public class CupomClienteService : ICupomClienteService
    {
        private readonly IRepository<CupomCliente> _repository;
        private readonly IRepository<Notificacao> _notificacaoRepository;
        private readonly IRepository<OfertaParceiro> _ofertaParceiroRepository;

        public CupomClienteService(IRepository<CupomCliente> repository, IRepository<Notificacao> notificacaoRepository, IRepository<OfertaParceiro> ofertaParceiroRepository)
        {
            _repository = repository;
            _notificacaoRepository = notificacaoRepository;
            _ofertaParceiroRepository = ofertaParceiroRepository;
        }
        public async Task Resgatar(Guid idCupom)
        {
            if (await FoiUtilizadoAsync(idCupom))
            {
                throw new NotSupportedException("O cupom já havia sido utilizado.");
            }
            var cupom = await _repository.GetByIdAsync(idCupom) ?? throw new NotSupportedException("Cupom nulo");
            cupom.DataUtilizacao = DateTime.Now;
            await _repository.UpdateAsync(cupom);
            await _repository.SaveChangesAsync();
            await CriarNotificacao(cupom);
        }

        private async Task CriarNotificacao(CupomCliente cupomCliente)
        {
            var ofertaParceiro = await _ofertaParceiroRepository.GetByIdAsync(cupomCliente.IdOfertaParceiro);
            //Criar notificação
            var notificacao = new Notificacao
            {
                Id = Guid.NewGuid(),
                Titulo = "Cupom Resgatado",
                SubTitulo = $"Você resgatou o cupom {ofertaParceiro?.NomeProduto}",
                DataCriacao = DateTime.Now,
                IdUsuario = cupomCliente.Id
            };
            await _notificacaoRepository.AddAsync(notificacao);
            await _notificacaoRepository.SaveChangesAsync();
        }
        private async Task<bool> FoiUtilizadoAsync(Guid idCupom)
        {
            var cupomUtilizado = await _repository.GetByIdAsync(idCupom);
            return cupomUtilizado?.DataUtilizacao != null;
        }
    }
}
