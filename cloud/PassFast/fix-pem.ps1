$raw = Get-Content "c:\Users\user\Downloads\bootcamp\cloud\PassFast\passfast-key2.pem" -Raw
$raw = $raw -replace "`r`n", "" -replace "`n", ""
$raw = $raw -replace "-----BEGIN RSA PRIVATE KEY-----", "" -replace "-----END RSA PRIVATE KEY-----", ""
$raw = $raw.Trim()
$lines = @("-----BEGIN RSA PRIVATE KEY-----")
for ($i = 0; $i -lt $raw.Length; $i += 64) {
    $len = [Math]::Min(64, $raw.Length - $i)
    $lines += $raw.Substring($i, $len)
}
$lines += "-----END RSA PRIVATE KEY-----"
$output = $lines -join "`n"
[System.IO.File]::WriteAllText("c:\Users\user\Downloads\bootcamp\cloud\PassFast\passfast-key2-fixed.pem", $output, [System.Text.Encoding]::ASCII)
Write-Host "Done - fixed PEM saved"
