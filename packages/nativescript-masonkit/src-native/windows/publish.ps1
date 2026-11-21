<#
.SYNOPSIS
  Builds the mason-c Rust static library + the NativeScript.Mason C++/WinRT component and copies the
  resulting .dll + .winmd into packages/nativescript-masonkit/platforms/windows/{x64,arm64} (the
  layout the NativeScript Windows runtime consumes, matching @nativescript/core's platforms/windows
  and @nativescript/font-manager).

.PARAMETER Platforms
  Which platforms to build. Defaults to x64 and ARM64.

.PARAMETER Configuration
  MSBuild configuration. Defaults to Release.

.EXAMPLE
  pwsh ./publish.ps1
  pwsh ./publish.ps1 -Platforms x64
#>
param(
  [string[]] $Platforms = @('x64', 'ARM64'),
  [string] $Configuration = 'Release'
)

$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$project = Join-Path $root 'Mason\NativeScript.Mason.vcxproj'
$repoRoot = (Resolve-Path (Join-Path $root '..\..\..\..')).Path
$platformsRoot = Join-Path $root '..\..\platforms\windows'

# Per-platform Rust target triple + output arch folder (matches core/platforms/windows: x64, arm64).
$rustTriple = @{ 'x64' = 'x86_64-pc-windows-msvc'; 'ARM64' = 'aarch64-pc-windows-msvc' }
$archFolder = @{ 'x64' = 'x64'; 'ARM64' = 'arm64' }

# Resolve MSBuild via vswhere.
$vswhere = "${env:ProgramFiles(x86)}\Microsoft Visual Studio\Installer\vswhere.exe"
if (-not (Test-Path $vswhere)) { throw "vswhere not found - install Visual Studio 2022/2026 with the C++ (Desktop) workload." }
$msbuild = & $vswhere -latest -products * -requires Microsoft.Component.MSBuild -find 'MSBuild\**\Bin\MSBuild.exe' | Select-Object -First 1
if (-not $msbuild) { throw 'MSBuild.exe not found via vswhere.' }

$cargo = (Get-Command cargo -ErrorAction SilentlyContinue).Source
if (-not $cargo) { throw 'cargo not found on PATH - install the Rust MSVC toolchain (rustup).' }

Write-Host "Using MSBuild: $msbuild"
Write-Host "Using cargo:   $cargo"
Write-Host "Repo root:     $repoRoot"

$built = @()
$failed = @()

foreach ($plat in $Platforms) {
  $triple = $rustTriple[$plat]
  Write-Host "`n=== Building $plat | $Configuration (rust: $triple) ===" -ForegroundColor Cyan
  try {
    if (-not $triple) { throw "unknown platform '$plat' (expected x64 or ARM64)" }

    # 1. Rust static library (masonnative.lib). +crt-static so it links the static CRT (libcmt),
    #    matching the component's /MT RuntimeLibrary -> no VC++ redist dependency. The target-scoped
    #    env var avoids clobbering any global RUSTFLAGS and only affects this triple.
    $flagsVar = "CARGO_TARGET_$($triple.ToUpper().Replace('-', '_'))_RUSTFLAGS"
    $oldFlags = [Environment]::GetEnvironmentVariable($flagsVar)
    [Environment]::SetEnvironmentVariable($flagsVar, '-C target-feature=+crt-static')
    try {
      Push-Location $repoRoot
      & $cargo build -p mason-windows --release --target $triple
      if ($LASTEXITCODE -ne 0) { throw "cargo build failed ($LASTEXITCODE)" }
    }
    finally {
      Pop-Location
      [Environment]::SetEnvironmentVariable($flagsVar, $oldFlags)
    }

    $rustLib = Join-Path $repoRoot "target\$triple\release\masonnative.lib"
    if (-not (Test-Path $rustLib)) { throw "expected Rust lib missing: $rustLib" }

    # 2. C++/WinRT component (links the Rust lib produced above).
    $outDir = Join-Path $root "Mason\bin\$plat\$Configuration\"
    & $msbuild $project -restore `
      -p:Configuration=$Configuration `
      -p:Platform=$plat `
      "-p:OutDir=$outDir" `
      -m -v:minimal
    if ($LASTEXITCODE -ne 0) { throw "MSBuild exited with code $LASTEXITCODE" }

    $dll = Join-Path $outDir 'NativeScript.Mason.dll'
    $winmd = Join-Path $outDir 'NativeScript.Mason.winmd'
    if (-not (Test-Path $dll)) { throw "expected output missing: $dll" }
    if (-not (Test-Path $winmd)) { throw "expected output missing: $winmd" }

    $dest = Join-Path $platformsRoot $archFolder[$plat]
    New-Item -ItemType Directory -Force -Path $dest | Out-Null
    Copy-Item $dll $dest -Force
    Copy-Item $winmd $dest -Force
    Write-Host "Copied NativeScript.Mason.{dll,winmd} -> $dest" -ForegroundColor Green
    $built += $plat
  }
  catch {
    Write-Warning "Build/publish for $plat failed: $($_.Exception.Message)"
    $failed += $plat
  }
}

Write-Host "`n=== Summary ===" -ForegroundColor Cyan
if ($built.Count)  { Write-Host "Published: $($built -join ', ')" -ForegroundColor Green }
if ($failed.Count) { Write-Host "Failed/skipped: $($failed -join ', ')" -ForegroundColor Yellow }
if (-not $built.Count) { throw 'No platforms were published.' }
