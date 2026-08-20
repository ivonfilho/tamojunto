$inputFile = "d:\localwp\suporte\tamo-junto-main\NAO-MANDE-PARA-GIT\postgres_backup_fixed.sql"
$outputFile = "d:\localwp\suporte\tamo-junto-main\NAO-MANDE-PARA-GIT\postgres_backup_fixed2.sql"

$lines = Get-Content $inputFile
$outLines = @()
$inUsuarioCopy = $false

foreach ($line in $lines) {
    if ($line -match 'CREATE TABLE public\."Usuario" \(') {
        $outLines += $line
        $outLines += '    "Contato" text,'
        continue
    }
    
    if ($line -match '^COPY public\."Usuario"') {
        $line = $line -replace '\("Id", "Nome",', '("Id", "Contato", "Nome",'
        $outLines += $line
        $inUsuarioCopy = $true
        continue
    }
    
    if ($inUsuarioCopy) {
        if ($line -match '^\\\.') {
            $inUsuarioCopy = $false
            $outLines += $line
        } else {
            # Insert "\N\t" after the first column (Id)
            $parts = $line -split "`t"
            if ($parts.Length -gt 1) {
                $newParts = @()
                $newParts += $parts[0]
                $newParts += "\N"
                for ($i = 1; $i -lt $parts.Length; $i++) {
                    $newParts += $parts[$i]
                }
                $outLines += ($newParts -join "`t")
            } else {
                $outLines += $line
            }
        }
        continue
    }
    
    $outLines += $line
}

[System.IO.File]::WriteAllLines($outputFile, $outLines, [System.Text.Encoding]::UTF8)
Write-Host "Done"
