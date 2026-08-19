import re

with open("backup_railway.sql", "r", encoding="utf-8") as f:
    content = f.read()

# Prepend the session_replication_role
content = "SET session_replication_role = 'replica';\n" + content

# Replace columns
content = content.replace('"ResetPasswordToken"', '"resetPasswordToken"')
content = content.replace('"ResetPasswordTokenExpiry"', '"resetPasswordTokenExpiry"')
content = content.replace('"EmailConfirmed"', '"emailConfirmed"')
content = content.replace('"EmailConfirmationToken"', '"emailConfirmationToken"')
content = content.replace('"MigrationId"', '"migrationId"')
content = content.replace('"ProductVersion"', '"productVersion"')

# The primary keys that had conflicts like "pK_Notificacao": 
# "duplicate key value violates unique constraint pK_Notificacao"
# Wait, this means some data was already inserted into Notificacao before the error happened!
# Because the previous import partially succeeded. We should probably TRUNCATE the tables before importing to avoid duplicates, OR use ON CONFLICT DO NOTHING (not easy in standard inserts).
# Since it's a backup restore, it's safest to truncate all tables before inserting.
# Let's add TRUNCATE statements at the beginning.

tables = [
    "Assinatura", "Backoffice", "Cliente", "CupomCliente", "Empresa", 
    "Endereco", "HistoricoCupom", "HistoricoLogin", "Imagem", "Notificacao", 
    "OfertaParceiro", "Pagamento", "Parceiros", "Plano", "Usuario", "__EFMigrationsHistory"
]

truncate_stmts = "TRUNCATE TABLE " + ", ".join([f'"{t}"' for t in tables]) + " CASCADE;\n"
content = truncate_stmts + content

with open("backup_railway_fixed.sql", "w", encoding="utf-8") as f:
    f.write(content)

print("SQL fixed successfully.")
