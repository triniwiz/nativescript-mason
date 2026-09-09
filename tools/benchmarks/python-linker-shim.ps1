$ErrorActionPreference = 'Stop'
$rawArguments = $env:MASON_LINKER_RAW_ARGUMENTS
if ([string]::IsNullOrWhiteSpace($rawArguments)) { throw 'Missing linker arguments.' }
$Arguments = @([regex]::Matches($rawArguments, '(?:[^\s"]+|"[^"]*")+') | ForEach-Object {
  $_.Value.Trim('"')
} | Select-Object -Skip 1)

# rust-android-gradle normally runs a tiny Python script which prepends clang and
# replaces the removed NDK -lgcc library with -lunwind. This is the same job in
# PowerShell for Windows hosts that do not have Python installed.
$linkArguments = @($env:RUST_ANDROID_GRADLE_CC_LINK_ARG)
foreach ($argument in $Arguments) {
  if ($argument.StartsWith('@')) {
    $responseFile = $argument.Substring(1)
    $content = Get-Content -Raw -LiteralPath $responseFile
    $content = $content -replace '(?m)^-lgcc', '-lunwind'
    [IO.File]::WriteAllText($responseFile, $content)
    $linkArguments += $argument
  }
  elseif ($argument.StartsWith('-lgcc')) {
    $linkArguments += '-lunwind' + $argument.Substring(5)
  }
  else {
    $linkArguments += $argument
  }
}

$linker = $env:RUST_ANDROID_GRADLE_CC
if ($linker.EndsWith('.cmd', [StringComparison]::OrdinalIgnoreCase)) {
  $commandName = [IO.Path]::GetFileNameWithoutExtension($linker)
  if ($commandName -notmatch '^(?<target>.+)-clang$') { throw "Unsupported NDK linker wrapper: $linker" }
  $linkArguments = @("--target=$($Matches.target)") + $linkArguments
  $linker = Join-Path ([IO.Path]::GetDirectoryName($linker)) 'clang.exe'
}

# PowerShell 5 splits commas while forwarding arguments to .cmd files. Feed
# clang one response file instead, preserving Rust's -Wl,a,b arguments exactly.
$responseFile = [IO.Path]::GetTempFileName()
try {
  $quoted = $linkArguments | ForEach-Object { '"' + $_.Replace('\', '\\').Replace('"', '\"') + '"' }
  [IO.File]::WriteAllLines($responseFile, $quoted)
  if ($env:MASON_LINKER_SHIM_DEBUG) {
    Write-Host "linker=$linker"
    Write-Host "linker-args=$($linkArguments -join '|')"
  }
  & $linker "@$responseFile"
  exit $LASTEXITCODE
}
finally {
  Remove-Item -LiteralPath $responseFile -Force
}
