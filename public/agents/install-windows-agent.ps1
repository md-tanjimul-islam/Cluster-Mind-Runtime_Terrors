param(
    [Parameter(Mandatory = $true)][string]$Endpoint,
    [Parameter(Mandatory = $true)][string]$AgentUrl,
    [Parameter(Mandatory = $true)][string]$Token,
    [Parameter(Mandatory = $true)][string]$NodeId
)

$ErrorActionPreference = "Stop"
$installDirectory = Join-Path $env:LOCALAPPDATA "ClusterMind"
$agentPath = Join-Path $installDirectory "windows-agent.ps1"
$removeAgentPath = Join-Path $installDirectory "remove-windows-agent.ps1"
$logPath = Join-Path $installDirectory "agent.log"
$startupDirectory = [Environment]::GetFolderPath("Startup")
$launcherPath = Join-Path $startupDirectory "ClusterMind-$NodeId.cmd"

New-Item -ItemType Directory -Path $installDirectory -Force | Out-Null
Invoke-WebRequest -Uri $AgentUrl -OutFile $agentPath
$removeAgentUrl = $AgentUrl.Replace("windows-agent.ps1", "remove-windows-agent.ps1")
Invoke-WebRequest -Uri $removeAgentUrl -OutFile $removeAgentPath

$escapedEndpoint = $Endpoint.Replace('"', '""')
$escapedToken = $Token.Replace('"', '""')
$escapedNodeId = $NodeId.Replace('"', '""')
$escapedAgentPath = $agentPath.Replace('"', '""')
$escapedLogPath = $logPath.Replace('"', '""')

$launcher = @"
@echo off
powershell.exe -NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -Command "& '$escapedAgentPath' -Endpoint '$escapedEndpoint' -Token '$escapedToken' -NodeId '$escapedNodeId' *>> '$escapedLogPath'"
"@

Set-Content -Path $launcherPath -Value $launcher -Encoding ASCII -Force
& icacls.exe $installDirectory /inheritance:r /grant:r "${env:USERNAME}:(OI)(CI)F" | Out-Null

$arguments = "-NoProfile -WindowStyle Hidden -ExecutionPolicy Bypass -File `"$agentPath`" -Endpoint `"$Endpoint`" -Token `"$Token`" -NodeId `"$NodeId`""
Start-Process powershell.exe -WindowStyle Hidden -ArgumentList $arguments

Write-Host "ClusterMind background agent installed." -ForegroundColor Green
Write-Host "Node: $NodeId"
Write-Host "Startup launcher: $launcherPath"
Write-Host "Log: $logPath"
Write-Host "The agent will start automatically whenever this Windows user signs in."
