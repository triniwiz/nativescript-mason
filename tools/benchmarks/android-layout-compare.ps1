[CmdletBinding()]
param(
  [string[]]$Refs = @('chore/android-perf', 'perf/rust-layout-cache'),
  [ValidateRange(1, 20)][int]$Runs = 5,
  [ValidateRange(1, 50)][int]$Samples = 5,
  [ValidateRange(2, 100)][int]$Iterations = 12,
  [string]$Device,
  [string]$RustTarget = 'x86_64',
  [string]$OutputDirectory
)

$ErrorActionPreference = 'Stop'
$className = 'org.nativescript.mason.masonkit.DeepWebLayoutBenchmark#profileDeepWebLayout'
$testPackage = 'org.nativescript.mason.masonkit.test'
$runner = "$testPackage/androidx.test.runner.AndroidJUnitRunner"
$reportName = 'mason-deep-layout-benchmark.json'
$relativeAndroid = 'packages/nativescript-masonkit/src-native/mason-android'
$relativeHarness = "$relativeAndroid/masonkit/src/androidTest/java/org/nativescript/mason/masonkit/DeepWebLayoutBenchmark.kt"
$repo = (& git rev-parse --show-toplevel).Trim()
if ($LASTEXITCODE -ne 0) { throw 'Run this script from the nativescript-mason repository.' }
$sourceHarness = Join-Path $repo $relativeHarness
if (-not (Test-Path -LiteralPath $sourceHarness)) { throw "Shared harness not found: $sourceHarness" }
$pythonShim = Join-Path $repo 'tools/benchmarks/python-linker-shim.cmd'
if (-not (Test-Path -LiteralPath $pythonShim)) { throw "Windows linker shim not found: $pythonShim" }
if ($Refs.Count -lt 2) { throw 'Pass at least two refs to compare.' }

if (-not $Device) {
  $devices = @(& adb devices | Select-String '\tdevice$' | ForEach-Object { ($_ -split '\s+')[0] })
  if ($devices.Count -ne 1) { throw "Expected one connected Android device; found $($devices.Count). Pass -Device." }
  $Device = $devices[0]
}
& adb -s $Device get-state | Out-Null
if ($LASTEXITCODE -ne 0) { throw "Android device is not ready: $Device" }

$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
if (-not $OutputDirectory) { $OutputDirectory = Join-Path $repo "benchmark-results/android-layout/$stamp" }
$OutputDirectory = [IO.Path]::GetFullPath($OutputDirectory)
New-Item -ItemType Directory -Force -Path $OutputDirectory | Out-Null

$tempRoot = Join-Path ([IO.Path]::GetPathRoot($repo)) ("mb-" + [guid]::NewGuid().ToString('N').Substring(0, 10))
$tempRoot = [IO.Path]::GetFullPath($tempRoot)
New-Item -ItemType Directory -Path $tempRoot | Out-Null
$worktrees = @()
$artifacts = @()
$reports = @()

function Invoke-Checked([string]$Name, [scriptblock]$Command) {
  & $Command
  if ($LASTEXITCODE -ne 0) { throw "$Name failed with exit code $LASTEXITCODE" }
}

function Ref-Label([string]$Ref) { return ($Ref -replace '[^A-Za-z0-9_.-]', '-') }

function Remove-BenchmarkDirectory([string]$Path) {
  $full = [IO.Path]::GetFullPath($Path)
  if (-not $full.StartsWith($tempRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase) -and
      $full -ne $tempRoot) {
    throw "refusing to remove directory outside benchmark temp root: $full"
  }
  if (Test-Path -LiteralPath $full) {
    # The Gradle/Rust output tree exceeds Win32 MAX_PATH. .NET's extended path
    # form removes it without requiring git/core.longpaths machine settings.
    [IO.Directory]::Delete("\\?\$full", $true)
  }
}

function Percentile([double[]]$Values, [double]$P) {
  if ($Values.Count -eq 0) { return 0.0 }
  $sorted = @($Values | Sort-Object)
  $index = [Math]::Max(0, [Math]::Ceiling($P * $sorted.Count) - 1)
  return [double]$sorted[$index]
}

function Median([double[]]$Values) {
  if ($Values.Count -eq 0) { return 0.0 }
  $sorted = @($Values | Sort-Object)
  $middle = [int][Math]::Floor($sorted.Count / 2.0)
  if ($sorted.Count % 2) { return [double]$sorted[$middle] }
  return ([double]$sorted[$middle - 1] + [double]$sorted[$middle]) / 2.0
}

$animationKeys = @('window_animation_scale', 'transition_animation_scale', 'animator_duration_scale')
$oldAnimations = @{}
try {
  foreach ($key in $animationKeys) {
    $oldAnimations[$key] = (& adb -s $Device shell settings get global $key).Trim()
    Invoke-Checked "disable $key" { adb -s $Device shell settings put global $key 0 }
  }

  foreach ($ref in $Refs) {
    $sha = (& git rev-parse --verify "$ref`^{commit}").Trim()
    if ($LASTEXITCODE -ne 0) { throw "Unknown git ref: $ref" }
    $label = Ref-Label $ref
    $worktree = Join-Path $tempRoot $label
    $worktrees += $worktree
    Invoke-Checked "create worktree for $ref" { git worktree add --detach $worktree $sha }

    $harnessTarget = Join-Path $worktree $relativeHarness
    Copy-Item -LiteralPath $sourceHarness -Destination $harnessTarget -Force
    $androidTestRoot = Join-Path $worktree "$relativeAndroid/masonkit/src/androidTest/java"
    Get-ChildItem -LiteralPath $androidTestRoot -Recurse -Filter '*.kt' |
      Where-Object { $_.FullName -ne $harnessTarget -and $_.Name -ne 'BenchmarkActivity.kt' } |
      Remove-Item -Force
    $sourceLocalProperties = Join-Path $repo "$relativeAndroid/local.properties"
    if (Test-Path -LiteralPath $sourceLocalProperties) {
      Copy-Item -LiteralPath $sourceLocalProperties -Destination (Join-Path $worktree "$relativeAndroid/local.properties") -Force
    }

    $android = Join-Path $worktree $relativeAndroid
    $gradle = Join-Path $android 'gradlew.bat'
    Push-Location $android
    try {
      $oldPythonCommand = $env:RUST_ANDROID_GRADLE_PYTHON_COMMAND
      $env:RUST_ANDROID_GRADLE_PYTHON_COMMAND = $pythonShim
      Invoke-Checked "build $ref" {
        & $gradle ':masonkit:assembleReleaseAndroidTest' "-Prust.targets=$RustTarget" '--no-daemon' '--stacktrace'
      }
    }
    finally {
      $env:RUST_ANDROID_GRADLE_PYTHON_COMMAND = $oldPythonCommand
      Pop-Location
    }
    $apk = Join-Path $android 'masonkit/build/outputs/apk/androidTest/release/masonkit-release-androidTest.apk'
    if (-not (Test-Path -LiteralPath $apk)) { throw "Benchmark APK not found for $ref at $apk" }
    $savedApk = Join-Path $OutputDirectory "$label-$($sha.Substring(0, 12)).apk"
    Copy-Item -LiteralPath $apk -Destination $savedApk
    $artifacts += [pscustomobject]@{ Ref = $ref; Label = $label; Commit = $sha; Apk = $savedApk }
  }

  for ($run = 1; $run -le $Runs; $run++) {
    $order = @($artifacts)
    if (-not ($run % 2)) { [array]::Reverse($order) }
    foreach ($artifact in $order) {
      $runLabel = "$($artifact.Label)-run-$run"
      Write-Host "[$runLabel] installing and running on $Device"
      Invoke-Checked "install $runLabel" { adb -s $Device install -r -t $artifact.Apk | Out-Host }
      & adb -s $Device shell run-as $testPackage rm -f "files/$reportName"
      if ($LASTEXITCODE -ne 0) { throw "could not clear stale report for $runLabel" }
      adb -s $Device logcat -c
      $instrumentationLog = Join-Path $OutputDirectory "$runLabel.instrumentation.txt"
      $instrumentationOutput = @(& adb -s $Device shell am instrument -w -r `
        -e class $className `
        -e benchmarkLabel $artifact.Label `
        -e samples $Samples `
        -e iterations $Iterations `
        $runner | Tee-Object -FilePath $instrumentationLog)
      $instrumentationExitCode = $LASTEXITCODE
      $instrumentationText = $instrumentationOutput -join "`n"
      if ($instrumentationExitCode -ne 0 -or $instrumentationText -match 'FAILURES!!!|INSTRUMENTATION_STATUS_CODE: -2' -or $instrumentationText -notmatch 'OK \(1 test\)') {
        throw "instrumentation failed for $runLabel; see $instrumentationLog"
      }

      $reportPath = Join-Path $OutputDirectory "$runLabel.json"
      $reportText = (& adb -s $Device exec-out run-as $testPackage cat "files/$reportName") -join "`n"
      if ($LASTEXITCODE -ne 0 -or [string]::IsNullOrWhiteSpace($reportText)) {
        throw "could not retrieve $reportName for $runLabel"
      }
      [IO.File]::WriteAllText($reportPath, $reportText, [Text.UTF8Encoding]::new($false))
      $parsed = Get-Content -Raw -LiteralPath $reportPath | ConvertFrom-Json
      $reports += [pscustomobject]@{ Ref = $artifact.Ref; Label = $artifact.Label; Commit = $artifact.Commit; Run = $run; Report = $parsed }

      $logcatPath = Join-Path $OutputDirectory "$runLabel.logcat.txt"
      & adb -s $Device logcat -d -s 'MasonDeepLayoutBench:I' '*:S' | Set-Content -LiteralPath $logcatPath
    }
  }

  $sampleRows = foreach ($report in $reports) {
    foreach ($phase in $report.Report.phases) {
      [pscustomobject]@{
        Ref = $report.Ref
        Commit = $report.Commit
        Run = $report.Run
        Sample = $phase.sample
        Phase = $phase.name
        Operations = $phase.operations
        ElapsedMsPerOp = [double]$phase.elapsedNs / [double]$phase.operations / 1e6
        MeasureMsPerOp = [double]$phase.measure.elapsedNs / [double]$phase.operations / 1e6
        OtherMsPerOp = [Math]::Max(0, ([double]$phase.elapsedNs - [double]$phase.measure.elapsedNs) / [double]$phase.operations / 1e6)
        MeasureCallsPerOp = [double]$phase.measure.calls / [double]$phase.operations
        ManagedAllocationsPerOp = [double]$phase.managedAllocations / [double]$phase.operations
        JavaHeapAfterMiB = [double]$phase.memory.after.javaHeapBytes / 1MB
        JavaHeapDeltaKiB = ([double]$phase.memory.after.javaHeapBytes - [double]$phase.memory.before.javaHeapBytes) / 1KB
        NativeHeapAfterMiB = [double]$phase.memory.after.nativeHeapBytes / 1MB
        NativeHeapDeltaKiB = ([double]$phase.memory.after.nativeHeapBytes - [double]$phase.memory.before.nativeHeapBytes) / 1KB
        TotalPssAfterMiB = [double]$phase.memory.after.totalPssKb / 1KB
        TotalPssDeltaKiB = [double]$phase.memory.after.totalPssKb - [double]$phase.memory.before.totalPssKb
      }
    }
  }
  $sampleRows | Export-Csv -NoTypeInformation -LiteralPath (Join-Path $OutputDirectory 'samples.csv')

  $summary = foreach ($group in ($sampleRows | Group-Object Ref, Phase)) {
    $first = $group.Group[0]
    $times = [double[]]@($group.Group.ElapsedMsPerOp)
    [pscustomobject]@{
      Ref = $first.Ref
      Commit = $first.Commit
      Phase = $first.Phase
      Samples = $times.Count
      MedianMs = Median $times
      P95Ms = Percentile $times 0.95
      MinMs = ($times | Measure-Object -Minimum).Minimum
      MaxMs = ($times | Measure-Object -Maximum).Maximum
      MedianMeasureMs = Median ([double[]]@($group.Group.MeasureMsPerOp))
      MedianOtherMs = Median ([double[]]@($group.Group.OtherMsPerOp))
      MedianMeasureCalls = Median ([double[]]@($group.Group.MeasureCallsPerOp))
      MedianManagedAllocations = Median ([double[]]@($group.Group.ManagedAllocationsPerOp))
      MedianJavaHeapAfterMiB = Median ([double[]]@($group.Group.JavaHeapAfterMiB))
      MedianJavaHeapDeltaKiB = Median ([double[]]@($group.Group.JavaHeapDeltaKiB))
      MedianNativeHeapAfterMiB = Median ([double[]]@($group.Group.NativeHeapAfterMiB))
      MedianNativeHeapDeltaKiB = Median ([double[]]@($group.Group.NativeHeapDeltaKiB))
      MedianTotalPssAfterMiB = Median ([double[]]@($group.Group.TotalPssAfterMiB))
      MedianTotalPssDeltaKiB = Median ([double[]]@($group.Group.TotalPssDeltaKiB))
    }
  }
  $summary = @($summary | Sort-Object Phase, Ref)
  $summary | Export-Csv -NoTypeInformation -LiteralPath (Join-Path $OutputDirectory 'summary.csv')
  $summary | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'summary.json')

  $baseline = $Refs[0]
  $baselineArtifact = $artifacts | Where-Object Ref -eq $baseline | Select-Object -First 1
  $comparisons = foreach ($artifact in ($artifacts | Where-Object Ref -ne $baseline)) {
    $mergeBase = (& git merge-base $baselineArtifact.Commit $artifact.Commit).Trim()
    $baselineOnly = [int](& git rev-list --count "$($artifact.Commit)..$($baselineArtifact.Commit)")
    $candidateOnly = [int](& git rev-list --count "$($baselineArtifact.Commit)..$($artifact.Commit)")
    [pscustomobject]@{
      Ref = $artifact.Ref
      MergeBase = $mergeBase
      BaselineOnlyCommits = $baselineOnly
      CandidateOnlyCommits = $candidateOnly
      IsBasedOnBaseline = $mergeBase -eq $baselineArtifact.Commit
    }
  }
  $markdown = @(
    '# Android deep web layout benchmark'
    ''
    "Device: ``$Device``. Runs: $Runs; samples/run: $Samples; inner iterations: $Iterations. Baseline: ``$baseline``."
  )
  foreach ($comparison in ($comparisons | Where-Object { -not $_.IsBasedOnBaseline })) {
    $markdown += ''
    $markdown += "> **History warning:** ``$($comparison.Ref)`` is not based on the tested baseline commit. The baseline has $($comparison.BaselineOnlyCommits) commits it lacks, and it has $($comparison.CandidateOnlyCommits) candidate-only commits. Treat this as a whole-branch result, not an isolated cache result."
  }
  $markdown += @(
    ''
    '| phase | ref | median ms/op | p95 ms/op | measure ms/op | other ms/op | callbacks/op | allocations/op | delta vs baseline |'
    '|---|---|---:|---:|---:|---:|---:|---:|---:|'
  )
  foreach ($row in $summary) {
    $baseRow = $summary | Where-Object { $_.Ref -eq $baseline -and $_.Phase -eq $row.Phase } | Select-Object -First 1
    $delta = if ($row.Ref -eq $baseline -or -not $baseRow -or $baseRow.MedianMs -eq 0) { '-' } else { '{0:+0.0;-0.0;0.0}%' -f (($row.MedianMs / $baseRow.MedianMs - 1) * 100) }
    $markdown += '| {0} | {1} | {2:N3} | {3:N3} | {4:N3} | {5:N3} | {6:N1} | {7:N1} | {8} |' -f `
      $row.Phase, $row.Ref, $row.MedianMs, $row.P95Ms, $row.MedianMeasureMs, $row.MedianOtherMs, $row.MedianMeasureCalls, $row.MedianManagedAllocations, $delta
  }
  $markdown += @(
    ''
    'Memory snapshots are taken outside the timed interval. PSS is total proportional set size; deltas may be negative when Android reclaims memory between snapshots.'
    ''
    '| phase | ref | PSS after MiB | PSS delta KiB | Java heap MiB | Java delta KiB | native heap MiB | native delta KiB |'
    '|---|---|---:|---:|---:|---:|---:|---:|'
  )
  foreach ($row in $summary) {
    $markdown += '| {0} | {1} | {2:N2} | {3:+0.0;-0.0;0.0} | {4:N2} | {5:+0.0;-0.0;0.0} | {6:N2} | {7:+0.0;-0.0;0.0} |' -f `
      $row.Phase, $row.Ref, $row.MedianTotalPssAfterMiB, $row.MedianTotalPssDeltaKiB, $row.MedianJavaHeapAfterMiB, $row.MedianJavaHeapDeltaKiB, $row.MedianNativeHeapAfterMiB, $row.MedianNativeHeapDeltaKiB
  }
  $markdown | Set-Content -LiteralPath (Join-Path $OutputDirectory 'comparison.md')

  $metadata = [pscustomobject]@{
    GeneratedAt = (Get-Date).ToString('o')
    Device = $Device
    DeviceModel = (& adb -s $Device shell getprop ro.product.model).Trim()
    Android = (& adb -s $Device shell getprop ro.build.version.release).Trim()
    Api = (& adb -s $Device shell getprop ro.build.version.sdk).Trim()
    Abi = (& adb -s $Device shell getprop ro.product.cpu.abi).Trim()
    Runs = $Runs
    Samples = $Samples
    Iterations = $Iterations
    Refs = @($artifacts | Select-Object Ref, Commit)
    Comparisons = @($comparisons)
  }
  $metadata | ConvertTo-Json -Depth 5 | Set-Content -LiteralPath (Join-Path $OutputDirectory 'metadata.json')
  Write-Host "Results: $(Join-Path $OutputDirectory 'comparison.md')"
}
finally {
  foreach ($key in $animationKeys) {
    if ($oldAnimations.ContainsKey($key) -and $oldAnimations[$key] -match '^[0-9.]+$') {
      adb -s $Device shell settings put global $key $oldAnimations[$key] | Out-Null
    }
  }
  foreach ($worktree in $worktrees) {
    $full = [IO.Path]::GetFullPath($worktree)
    if (-not $full.StartsWith($tempRoot + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
      throw "refusing to remove worktree outside benchmark temp root: $full"
    }
    $savedErrorActionPreference = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    git worktree remove --force $full 2>$null | Out-Null
    $removeExitCode = $LASTEXITCODE
    $ErrorActionPreference = $savedErrorActionPreference
    if ($removeExitCode -ne 0) {
      Remove-BenchmarkDirectory $full
      git worktree prune | Out-Null
    }
  }
  git worktree prune | Out-Null
  if ((Test-Path -LiteralPath $tempRoot) -and $tempRoot -match '[\\/]mb-[0-9a-f]{10}$') {
    Remove-BenchmarkDirectory $tempRoot
  }
}
