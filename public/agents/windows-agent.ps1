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

    # 1. Search common NVIDIA SMI executable locations (including NVSMI default install path)
    $nvidiaSmiPaths = @(
        "$env:SystemDrive\Program Files\NVIDIA Corporation\NVSMI\nvidia-smi.exe",
        "$env:SystemRoot\System32\nvidia-smi.exe",
        "$env:SystemDrive\Program Files\NVIDIA Corporation\Control Panel Client\nvidia-smi.exe",
        (Get-Command nvidia-smi -ErrorAction SilentlyContinue).Source
    ) | Where-Object { $_ -and (Test-Path $_) }

    if ($nvidiaSmiPaths.Count -gt 0) {
        $smiPath = $nvidiaSmiPaths[0]
        try {
            $gpuLine = & $smiPath --query-gpu=utilization.gpu,temperature.gpu --format=csv,noheader,nounits 2>$null | Select-Object -First 1
            if ($gpuLine) {
                $parts = $gpuLine -split ","
                if ($parts.Count -ge 2) {
                    $gpu = [int]$parts[0].Trim()
                    $temperature = [int]$parts[1].Trim()
                }
            }
            $gpuNameLine = & $smiPath --query-gpu=name --format=csv,noheader 2>$null | Select-Object -First 1
            if ($gpuNameLine) {
                $gpuName = $gpuNameLine.Trim()
            }
        } catch {}
    }

    # 2. Universal Windows Performance Counter Scanning (Built-in Intel/AMD & External/Dedicated NVIDIA/AMD GPUs)
    try {
        $gpuSamples = (Get-Counter '\GPU Engine(*engtype_3D*)\Utilization Percentage' -ErrorAction SilentlyContinue).CounterSamples
        if (-not $gpuSamples) {
            $gpuSamples = (Get-Counter '\GPU Engine(*)\Utilization Percentage' -ErrorAction SilentlyContinue).CounterSamples
        }
        if ($gpuSamples) {
            $maxVal = ($gpuSamples | Measure-Object -Property CookedValue -Max).Maximum
            if ($maxVal -and $maxVal -gt 0) {
                $counterGpu = [int][math]::Round($maxVal)
                if ($gpu -eq 0 -or $counterGpu -gt $gpu) {
                    $gpu = $counterGpu
                }
            }
        }
    } catch {}

    if ($gpu -eq 0) {
        try {
            $gpuCounters = Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine -ErrorAction SilentlyContinue |
                Where-Object { $_.UtilizationPercentage -gt 0 }
            if ($gpuCounters) {
                $maxGpuUtil = ($gpuCounters | Measure-Object -Property UtilizationPercentage -Max).Maximum
                if ($maxGpuUtil -gt 0) {
                    $gpu = [int]$maxGpuUtil
                }
            }
        } catch {}
    }

    # 3. Dedicated GPU Name Detection via WMI / CIM
    if ([string]::IsNullOrWhiteSpace($gpuName)) {
        try {
            $gpuControllers = Get-CimInstance Win32_VideoController -ErrorAction SilentlyContinue |
                Where-Object { $_.Name -notmatch 'Virtual|Remote|Basic Display|Standard VGA' }
            $dedicatedGpu = $gpuControllers | Where-Object { $_.Name -match 'NVIDIA|AMD|Radeon|GeForce|RTX|GTX|Quadro|Arc' } | Select-Object -First 1
            if ($dedicatedGpu) {
                $gpuName = $dedicatedGpu.Name.Trim()
            } elseif ($gpuControllers) {
                $gpuName = ($gpuControllers | Select-Object -First 1).Name.Trim()
            }
        } catch {}
    }

    if (-not $nvidiaSmiPaths) {
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
            # Thermal zone fallback
        }
    }

    $rawProcesses = @(Get-Process -ErrorAction SilentlyContinue |
        Where-Object { $_.SessionId -gt 0 -and $_.WorkingSet64 -gt 35MB -and $_.ProcessName -notmatch '^(explorer|SearchHost|TextInputHost|cmd|powershell|conhost|ApplicationFrameHost|SystemSettings|wmiprvse|svchost)$' } |
        Sort-Object WorkingSet64 -Descending |
        Select-Object -First 9)

    $processJobs = @()
    foreach ($p in $rawProcesses) {
        $ramMb = [math]::Round($p.WorkingSet64 / 1MB)
        $processJobs += @{
            id       = "$($p.ProcessName)-$($p.Id)"
            name     = "$($p.ProcessName).exe (PID $($p.Id))"
            node     = $NodeId
            category = "System Workload"
            status   = "Running"
            progress = "Memory: ${ramMb} MB"
            vram     = "${ramMb} MB RAM"
            cpu      = "$([math]::Round($p.CPU, 1))s CPU"
            runtime  = "Active Task"
        }
    }

    $activeJobs = [math]::Max(1, $processJobs.Count)

    $specSummary = if ($gpuName) { "$gpuName · ${totalRamGb}GB" } else { "$cpuName · ${totalRamGb}GB" }
    $osVersion = (Get-CimInstance Win32_OperatingSystem -ErrorAction SilentlyContinue).Caption
    if (-not $osVersion) { $osVersion = "Windows " + [System.Environment]::OSVersion.Version.ToString() }

    return @{
        token        = $Token
        id           = $NodeId
        type         = $specSummary
        cpu          = [int]$cpu
        gpu          = [int]$gpu
        ram          = [int]$ram
        temp         = [int]$temperature
        jobs         = [int]$activeJobs
        os           = [string]$osVersion.Trim()
        cpu_name     = [string]$cpuName.Trim()
        gpu_name     = [string]$gpuName.Trim()
        ram_total    = "${totalRamGb} GB"
        agent_ver    = "3.2.0-win"
        process_jobs = $processJobs
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
    Write-Host "`nShutting down agent. Sending offline signal..." -ForegroundColor Yellow
    try {
        $offlinePayload = @{
            token      = $Token
            id         = $NodeId
            connection = "offline"
            cpu        = 0
            gpu        = 0
            ram        = 0
            temp       = 0
            jobs       = 0
        }
        Invoke-RestMethod -Uri $Endpoint -Method Post -ContentType "application/json" -Body ($offlinePayload | ConvertTo-Json -Compress) -TimeoutSec 3 -ErrorAction SilentlyContinue
    } catch {}

    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
    $mutex.ReleaseMutex()
    $mutex.Dispose()
}
