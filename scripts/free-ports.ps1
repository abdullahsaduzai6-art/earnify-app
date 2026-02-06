param(
  [Parameter(ValueFromRemainingArguments = $true)]
  [int[]]$Ports
)

if (-not $Ports -or $Ports.Count -eq 0) {
  $Ports = @(3001, 4000)
}

foreach ($port in $Ports) {
  $lines = netstat -ano | Select-String ":$port\s" | ForEach-Object { $_.ToString() }
  $pids = @()

  foreach ($line in $lines) {
    $parts = ($line -split "\s+") | Where-Object { $_ -ne "" }
    if ($parts.Count -ge 5) {
      $procId = $parts[$parts.Count - 1]
      if ($procId -match "^\d+$") {
        $n = [int]$procId
        if ($n -gt 0) {
          $pids += $n
        }
      }
    }
  }

  $pids = $pids | Sort-Object -Unique

  if ($pids.Count -eq 0) {
    Write-Host "Port $port is free"
    continue
  }

  foreach ($procId in $pids) {
    try {
      Write-Host "Killing PID $procId on port $port"
      taskkill /PID $procId /F | Out-Null
    } catch {
      Write-Host "Failed to kill PID ${procId} on port ${port}: $($_.Exception.Message)"
    }
  }
}
