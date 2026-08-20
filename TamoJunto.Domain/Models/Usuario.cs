using System;
using System.Collections.Generic;


namespace TamoJunto.Domain.Models;


public enum UserRole
{
    Cliente,
    Parceiro,
    Admin
}

public partial class Usuario : BaseEntity
{
    public Guid Id { get; set; }

    public string Nome { get; set; } = null!;

    public string Email { get; set; } = null!;

    public string Senha { get; set; } = null!;

    public DateTime DataCadastro { get; set; }
    
    public string? UrlImagem { get; set; } = null!;

    public string? ResetPasswordToken { get; set; }
    
    public DateTime? ResetPasswordTokenExpiry { get; set; }
    
    public bool EmailConfirmed { get; set; } = false;
    
    public string? EmailConfirmationToken { get; set; }

    public virtual Backoffice? Backoffice { get; set; }

    public virtual Cliente? Cliente { get; set; }

    public virtual ICollection<Endereco> Endereco { get; set; } = new List<Endereco>();

    public virtual Parceiro? Parceiro { get; set; }

    public UserRole Role { get; set; }
}
