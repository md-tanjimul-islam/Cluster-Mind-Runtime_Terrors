param(
    [Parameter(Mandatory = $true)][string]$NodeId
)

$installDirectory = Join-Path $env:LOCALAPPDATA "ClusterMind"
$safeNodeId = $NodeId -replace '[^a-zA-Z0-9._-]', '_'
$pidFile = Join-Path $installDirectory "$safeNodeId.pid"
$launcherPath = Join-Path ([Environment]::GetFolderPath("Startup")) "ClusterMind-$NodeId.cmd"

if (Test-Path $pidFile) {
    $agentPid = Get-Content $pidFile -ErrorAction SilentlyContinue
    if ($agentPid) {
        Stop-Process -Id ([int]$agentPid) -Force -ErrorAction SilentlyContinue
    }
    Remove-Item $pidFile -Force -ErrorAction SilentlyContinue
}

Remove-Item $launcherPath -Force -ErrorAction SilentlyContinue
Write-Host "ClusterMind startup agent removed for $NodeId." -ForegroundColor Yellow
