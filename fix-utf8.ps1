$files = Get-ChildItem -Path 'd:\localwp\suporte\tamo-junto-main' -Include *.cs, *.ts, *.html, *.scss, *.json -Recurse | Where-Object { $_.FullName -notmatch 'node_modules|publish' }
foreach ($file in $files) {
    try {
        $content = [System.IO.File]::ReadAllText($file.FullName, [System.Text.Encoding]::UTF8)
        if ($content -match 'Ã') {
            $bytes = [System.Text.Encoding]::GetEncoding(1252).GetBytes($content)
            $fixed = [System.Text.Encoding]::UTF8.GetString($bytes)
            if ($fixed -ne $content) {
                [System.IO.File]::WriteAllText($file.FullName, $fixed, [System.Text.Encoding]::UTF8)
                Write-Host "Fixed: $($file.FullName)"
            }
        }
    } catch {
        Write-Host "Error processing $($file.FullName): $($_.Exception.Message)"
    }
}
