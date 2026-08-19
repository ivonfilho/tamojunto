using AutoMapper;
using TamoJunto.API.RequestModel;
using TamoJunto.API.ViewModel;
using TamoJunto.Domain.Models;

namespace TamoJunto.API.Mappings;

public class Mapping : Profile
{
    public Mapping()
    {
        CreateMap<OfertaParceiroRequest, OfertaParceiro>()
            .ForMember(dest => dest.QrCodePath, opt => opt.MapFrom(src => src.QrCodePath ?? ""))
            .ForMember(dest => dest.CategoriaCupom, opt => opt.MapFrom(src => src.Categoria));
        CreateMap<EmpresaRequest, Empresa>();
        CreateMap<ClienteRequest, Cliente>();
        CreateMap<ParceiroRequest, Parceiro>()
            .ForMember(dest => dest.DataCriacao, opt => opt.Condition(src => src.DataCriacao.HasValue));
        CreateMap<EnderecoRequest, Endereco>();
        CreateMap<CupomClienteRequest, CupomCliente>();
        CreateMap<CupomCliente, CupomClienteVM>();
        CreateMap<HistoricoCupomRequest, HistoricoCupom>();
        CreateMap<AssinaturaRequest, Assinatura>()
            .ForMember(dest => dest.Id, opt => opt.MapFrom(src => Guid.NewGuid())) 
            .ForMember(dest => dest.DataCompra, opt => opt.MapFrom(src => DateTime.Now))
            .ForMember(dest => dest.DataRenovacao, opt => opt.Ignore())
            .ForMember(dest => dest.IdPagamento, opt => opt.Ignore())
            .ForMember(dest => dest.IdParceiro, opt => opt.Ignore());
    }
}
