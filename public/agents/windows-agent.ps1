param(
    [Parameter(Mandatory = $true)][string]$Endpoint,
    [Parameter(Mandatory = $true)][string]$Token,
    [Parameter(Mandatory = $true)][string]$NodeId,
    [int]$IntervalSeconds = 5
)

$ErrorActionPreference = "Stop"
$agentDirectory = Join-Path $env:LOCALAPPDATA "ClusterMind"
New-Item -ItemType Directory -Path $agentDirectory -Force | Out-Null
$safeNodeId = $NodeId -replace '[^a-zA-Z0-9._-]', '_'
$pidFile = Join-Path $agentDirectory "$safeNodeId.pid"
$mutexName = "Local\ClusterMind-$safeNodeId"
$mutex = New-Object System.Threading.Mutex($false, $mutexName)

if (-not $mutex.WaitOne(0, $false)) {
    Write-Host "A ClusterMind agent is already running for $NodeId."
    exit 0
}

Set-Content -Path $pidFile -Value $PID -Force

function Get-ClusterMindTelemetry {
    $cpuSamples = Get-CimInstance Win32_Processor
    $cpu = [math]::Round(($cpuSamples | Measure-Object -Property LoadPercentage -Average).Average)
    $cpuObj = $cpuSamples | Select-Object -First 1
    $cpuName = if ($cpuObj.Name) { ($cpuObj.Name -replace '\s+', ' ').Trim() } else { "CPU Worker" }

    $os = Get-CimInstance Win32_OperatingSystem
    $usedMemory = $os.TotalVisibleMemorySize - $os.FreePhysicalMemory
    $ram = [math]::Round(($usedMemory / $os.TotalVisibleMemorySize) * 100)
    $totalRamGb = [math]::Round($os.TotalVisibleMemorySize / 1MB)

    $gpu = 0
    $temperature = 45
    $gpuName = ""

    $nvidia = Get-Command nvidia-smi -ErrorAction SilentlyContinue
    if ($nvidia) {
        $gpuLine = & $nvidia.Source --query-gpu=utilization.gpu,temperature.gpu --format=csv,noheader,nounits 2>$null |
            Select-Object -First 1
        if ($gpuLine) {
            $parts = $gpuLine -split ","
            $gpu = [int]$parts[0].Trim()
            $temperature = [int]$parts[1].Trim()
        }
        $gpuNameLine = & $nvidia.Source --query-gpu=name --format=csv,noheader 2>$null | Select-Object -First 1
        if ($gpuNameLine) {
            $gpuName = $gpuNameLine.Trim()
        }
    }
    
    if ([string]::IsNullOrWhiteSpace($gpuName)) {
        try {
            $gpuObj = Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -notmatch 'Virtual|Remote|Basic Display' } | Select-Object -First 1
            if ($gpuObj.Name) {
                $gpuName = $gpuObj.Name.Trim()
            }
        } catch {}
    }

    if (-not $nvidia) {
        try {
            $thermal = Get-CimInstance -Namespace root/wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction Stop |
                Select-Object -First 1
            if ($thermal.CurrentTemperature) {
                $calcTemp = [math]::Round(($thermal.CurrentTemperature / 10) - 273.15)
                if ($calcTemp -gt 0 -and $calcTemp -lt 120) {
                    $temperature = [int]$calcTemp
                }
            }
        } catch {
            # Many Windows laptops do not expose CPU temperature through WMI.
        }
    }

    $activeUserProcesses = @(Get-Process -ErrorAction SilentlyContinue | Where-Object { $_.SessionId -gt 0 -and $_.WorkingSet64 -gt 40MB -and $_.ProcessName -notmatch '^(explorer|SearchHost|TextInputHost|cmd|powershell|conhost|ApplicationFrameHost|SystemSettings)$' }).Count
    $activeJobs = [math]::Max(1, [math]::Min(9, $activeUserProcesses))

    $specSummary = if ($gpuName) { "$gpuName · ${totalRamGb}GB" } else { "$cpuName · ${totalRamGb}GB" }

    return @{
        token = $Token
        id    = $NodeId
        type  = $specSummary
        cpu   = [int]$cpu
        gpu   = [int]$gpu
        ram   = [int]$ram
        temp  = [int]$temperature
        jobs  = [int]$activeJobs
    }
}

Write-Host "ClusterMind agent started for $NodeId" -ForegroundColor Cyan
Write-Host "Sending live telemetry every $IntervalSeconds seconds. Press Ctrl+C to stop."

try {
    while ($true) {
        try {
            $telemetry = Get-ClusterMindTelemetry
            $response = Invoke-RestMethod -Uri $Endpoint -Method Post -ContentType "application/json" -Body ($telemetry | ConvertTo-Json -Compress) -TimeoutSec 10
            $timestamp = Get-Date -Format "HH:mm:ss"
            Write-Host "[$timestamp] Online | CPU $($telemetry.cpu)% | GPU $($telemetry.gpu)% | RAM $($telemetry.ram)% | Temp $($telemetry.temp)C | Risk $($response.risk)%" -ForegroundColor Green
        } catch {
            $timestamp = Get-Date -Format "HH:mm:ss"
            Write-Warning "[$timestamp] Telemetry failed: $($_.Exception.Message)"
        }
        Start-Sleep -Seconds $IntervalSeconds
    }
} finally {
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
