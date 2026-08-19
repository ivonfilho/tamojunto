#!/bin/bash
sed -i '1i SET session_replication_role = '"'"'replica'"'"';' /tmp/backup_railway.sql
sed -i 's/"ResetPasswordToken"/resetpasswordtoken/g' /tmp/backup_railway.sql
sed -i 's/"ResetPasswordTokenExpiry"/resetpasswordtokenexpiry/g' /tmp/backup_railway.sql
sed -i 's/"EmailConfirmed"/emailconfirmed/g' /tmp/backup_railway.sql
sed -i 's/"EmailConfirmationToken"/emailconfirmationtoken/g' /tmp/backup_railway.sql
sed -i 's/"MigrationId"/migrationid/g' /tmp/backup_railway.sql
sed -i 's/"ProductVersion"/productversion/g' /tmp/backup_railway.sql
