$ErrorActionPreference = "Stop"
$sshKey = "d:\localwp\suporte\tamo-junto-main\NAO-MANDE-PARA-GIT\coolify_key"
$hostIp = "31.97.254.35"
$containerId = "uyv3qfxqzeum3yavomg0juac"
$dumpFile = "d:\localwp\suporte\tamo-junto-main\NAO-MANDE-PARA-GIT\db_dump_temp.sql"
$fixedDumpFile = "d:\localwp\suporte\tamo-junto-main\NAO-MANDE-PARA-GIT\db_dump_fixed.sql"

Write-Host "Step 1: Exporting current database (with DROP commands)..."
# Using -c (clean) to drop tables before recreating them during restore
ssh -i $sshKey -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL root@$hostIp "docker exec $containerId pg_dump -U postgres -c -d postgres" > $dumpFile

Write-Host "Step 2: Fixing encoding (Windows-1252 to UTF-8)..."
$content = [System.IO.File]::ReadAllText($dumpFile, [System.Text.Encoding]::UTF8)
$bytes = [System.Text.Encoding]::GetEncoding(1252).GetBytes($content)
$fixedContent = [System.Text.Encoding]::UTF8.GetString($bytes)
[System.IO.File]::WriteAllText($fixedDumpFile, $fixedContent, [System.Text.Encoding]::UTF8)

Write-Host "Step 3: Restoring fixed database..."
Get-Content $fixedDumpFile -Encoding UTF8 | ssh -i $sshKey -o StrictHostKeyChecking=no -o UserKnownHostsFile=NUL root@$hostIp "docker exec -i $containerId psql -U postgres -d postgres"

Write-Host "Database encoding fixed successfully!"
