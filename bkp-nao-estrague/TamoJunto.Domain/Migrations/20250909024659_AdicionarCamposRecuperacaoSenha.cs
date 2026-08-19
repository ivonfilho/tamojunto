using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace TamoJunto.Domain.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarCamposRecuperacaoSenha : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assinatura_Parceiro",
                table: "Assinatura");

            migrationBuilder.DropForeignKey(
                name: "FK_Assinatura_Plano",
                table: "Assinatura");

            migrationBuilder.DropIndex(
                name: "iX_Assinatura_IdParceiro",
                table: "Assinatura");

            migrationBuilder.DropIndex(
                name: "iX_Assinatura_idPlanoNavigationId",
                table: "Assinatura");

            migrationBuilder.DropColumn(
                name: "idPlanoNavigationId",
                table: "Assinatura");

            migrationBuilder.AddColumn<string>(
                name: "emailConfirmationToken",
                table: "Usuario",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "emailConfirmed",
                table: "Usuario",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "resetPasswordToken",
                table: "Usuario",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "resetPasswordTokenExpiry",
                table: "Usuario",
                type: "timestamp without time zone",
                nullable: true);

            migrationBuilder.AlterColumn<decimal>(
                name: "Valor",
                table: "Plano",
                type: "numeric",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric(18,2)");

            migrationBuilder.AlterColumn<string>(
                name: "Titulo",
                table: "Plano",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(255)",
                oldUnicode: false,
                oldMaxLength: 255);

            migrationBuilder.AlterColumn<string>(
                name: "Tipo",
                table: "Plano",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "character varying(50)",
                oldUnicode: false,
                oldMaxLength: 50);

            migrationBuilder.CreateIndex(
                name: "iX_Assinatura_idPlano",
                table: "Assinatura",
                column: "idPlano");

            migrationBuilder.AddForeignKey(
                name: "FK_Assinatura_Plano",
                table: "Assinatura",
                column: "idPlano",
                principalTable: "Plano",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Assinatura_Plano",
                table: "Assinatura");

            migrationBuilder.DropIndex(
                name: "iX_Assinatura_idPlano",
                table: "Assinatura");

            migrationBuilder.DropColumn(
                name: "emailConfirmationToken",
                table: "Usuario");

            migrationBuilder.DropColumn(
                name: "emailConfirmed",
                table: "Usuario");

            migrationBuilder.DropColumn(
                name: "resetPasswordToken",
                table: "Usuario");

            migrationBuilder.DropColumn(
                name: "resetPasswordTokenExpiry",
                table: "Usuario");

            migrationBuilder.AlterColumn<decimal>(
                name: "Valor",
                table: "Plano",
                type: "numeric(18,2)",
                nullable: false,
                oldClrType: typeof(decimal),
                oldType: "numeric");

            migrationBuilder.AlterColumn<string>(
                name: "Titulo",
                table: "Plano",
                type: "character varying(255)",
                unicode: false,
                maxLength: 255,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "Tipo",
                table: "Plano",
                type: "character varying(50)",
                unicode: false,
                maxLength: 50,
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AddColumn<Guid>(
                name: "idPlanoNavigationId",
                table: "Assinatura",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));

            migrationBuilder.CreateIndex(
                name: "iX_Assinatura_IdParceiro",
                table: "Assinatura",
                column: "IdParceiro");

            migrationBuilder.CreateIndex(
                name: "iX_Assinatura_idPlanoNavigationId",
                table: "Assinatura",
                column: "idPlanoNavigationId");

            migrationBuilder.AddForeignKey(
                name: "FK_Assinatura_Parceiro",
                table: "Assinatura",
                column: "IdParceiro",
                principalTable: "Parceiros",
                principalColumn: "id");

            migrationBuilder.AddForeignKey(
                name: "FK_Assinatura_Plano",
                table: "Assinatura",
                column: "idPlanoNavigationId",
                principalTable: "Plano",
                principalColumn: "Id");
        }
    }
}
