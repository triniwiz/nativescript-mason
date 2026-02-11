# Mason Android Performance Benchmarks

This directory contains performance benchmarks for the Mason Android native implementation, starting with the `View` class.

## Overview

The benchmarks use AndroidX Benchmark library to measure performance of critical operations. Benchmarks are designed to:
- Measure real-world performance on actual devices
- Provide consistent, repeatable results
- Track performance regressions over time
- Identify optimization opportunities

## Benchmark Categories

### 1. View Creation Benchmarks
Tests the performance of creating different types of views:
- `benchmark_createSimpleView` - Basic View instantiation
- `benchmark_createFlexView` - Flex container creation
- `benchmark_createGridView` - Grid container creation
- `benchmark_createBlockView` - Block container creation

### 2. Layout Computation Benchmarks
Measures layout calculation performance:
- `benchmark_layoutSimpleView` - Single view layout
- `benchmark_layoutWithChildren` - Parent with 10 children
- `benchmark_layoutDeeplyNested` - 5 levels of nesting
- `benchmark_layoutComplexFlexbox` - Flexbox with 20 children and varying flex properties
- `benchmark_layoutGrid` - 3x3 grid layout

### 3. Measure Benchmarks
Tests Android's measure pass performance:
- `benchmark_measureView` - Single view measurement
- `benchmark_measureWithChildren` - Parent with children measurement

### 4. Style Update Benchmarks
Measures the cost of style changes:
- `benchmark_updateSingleStyleProperty` - Single property update
- `benchmark_updateMultipleStyleProperties` - Batch property updates
- `benchmark_updatePadding` - Padding changes
- `benchmark_updateMargin` - Margin changes
- `benchmark_updateSize` - Size changes
- `benchmark_updateDisplay` - Display mode changes
- `benchmark_updatePosition` - Position changes

### 5. Child Operations Benchmarks
Tests view hierarchy manipulation:
- `benchmark_addSingleChild` - Adding one child
- `benchmark_addMultipleChildren` - Adding 10 children
- `benchmark_removeChild` - Removing a child
- `benchmark_removeAllChildren` - Clearing all children
- `benchmark_addChildAtIndex` - Inserting at specific position

### 6. Z-Index / Sorting Benchmarks
Measures z-index sorting performance:
- `benchmark_zIndexSorting` - Sorting 20 children by z-index

### 7. Complex Scenarios
Real-world performance tests:
- `benchmark_createComplexHierarchy` - 3-level hierarchy with 9 total views
- `benchmark_fullLayoutCycle` - Complete measure + layout cycle
- `benchmark_styleSerializationToString` - Style to JSON conversion

## Running Benchmarks

### Prerequisites
- Android device or emulator (physical device recommended for accurate results)
- Animations disabled on device:
  - Go to Settings > Developer Options
  - Set all animation scales to "Animation off":
    - Window animation scale
    - Transition animation scale
    - Animator duration scale

### Important Configuration
The build.gradle is configured to:
- Use `testBuildType = "release"` for accurate measurements
- Enable `debuggable = true` in release builds (required by benchmark library)
- This ensures benchmarks run with optimizations enabled

### Run All Benchmarks
```bash
cd packages/nativescript-masonkit/src-native/mason-android
./gradlew :masonkit:connectedAndroidTest
```

### Run Specific Benchmark Class
```bash
./gradlew :masonkit:connectedAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=org.nativescript.mason.masonkit.ViewBenchmark
```

### Run Single Benchmark Method
```bash
./gradlew :masonkit:connectedAndroidTest \
  -Pandroid.testInstrumentationRunnerArguments.class=org.nativescript.mason.masonkit.ViewBenchmark#benchmark_createSimpleView
```

Note: Error suppression for ACTIVITY-MISSING, DEBUGGABLE, and EMULATOR is configured in build.gradle.

### Common Issues and Fixes

#### "ACTIVITY-MISSING", "DEBUGGABLE", or "EMULATOR" Warnings
These warnings are automatically suppressed using the `suppressErrors` parameter. The benchmarks are designed to work without a foreground Activity since they only require a Context.

**Why suppress these warnings?**
- **ACTIVITY-MISSING**: Our benchmarks use ApplicationContext, not Activity context
- **DEBUGGABLE**: We're using release builds with debuggable=true for benchmark requirements
- **EMULATOR**: While physical devices are better, emulators provide consistent results for relative comparisons

The suppressErrors parameter tells AndroidX Benchmark to ignore these warnings and run anyway. Results are still accurate for measuring relative performance and identifying regressions.

**For production benchmarks:**
- Use a physical device when possible
- Run multiple times and compare median values
- Track results over time to identify performance regressions

#### Tests Fail to Run
If benchmarks don't execute at all:
1. Verify animations are disabled on device
2. Ensure device is not in battery saver mode
3. Check that the device is unlocked during test execution
4. Try running on a different device/emulator

## Understanding Results

Benchmark results include:
- **min** - Minimum execution time (nanoseconds)
- **median** - Median execution time (nanoseconds)
- **max** - Maximum execution time (nanoseconds)
- **Allocations** - Memory allocations during benchmark

Results are written to:
```
masonkit/build/outputs/connected_android_test_additional_output/
```

### Interpreting Results
- Focus on **median** values for typical performance
- Check **allocations** to identify memory pressure
- Compare results across:
  - Different devices
  - Before/after code changes
  - Release vs debug builds

## Best Practices

1. **Run on Physical Device**: Emulators can have inconsistent performance
2. **Disable Animations**: System animations affect timing
3. **Multiple Runs**: Run benchmarks multiple times to ensure consistency
4. **Consistent Environment**:
   - Close other apps
   - Disable battery saver
   - Keep device plugged in
   - Use same Android version for comparisons

## Adding New Benchmarks

To add benchmarks for other classes:

1. Create a new test file: `[ClassName]Benchmark.kt`
2. Use `@RunWith(AndroidJUnit4::class)`
3. Add `BenchmarkRule` as a `@get:Rule`
4. Write test methods with `@Test` annotation
5. Use `benchmarkRule.measureRepeated { }` to measure code

Example:
```kotlin
@RunWith(AndroidJUnit4::class)
class MyClassBenchmark {
    @get:Rule
    val benchmarkRule = BenchmarkRule()

    @Test
    fun benchmark_myOperation() {
        benchmarkRule.measureRepeated {
            // Code to benchmark
        }
    }
}
```

## Continuous Integration

Consider integrating benchmarks into CI:
1. Run on every PR to detect regressions
2. Store historical results
3. Alert on significant performance changes (>10% regression)

## Performance Goals

Current performance targets (median times on mid-range device):
- View creation: < 100µs
- Simple layout: < 500µs
- Layout with 10 children: < 2ms
- Style update: < 50µs
- Add child: < 200µs

## Troubleshooting

### Benchmarks Not Running
- Verify AndroidX Benchmark library is in dependencies
- Check that `androidx.benchmark.output.enable=true` is set
- Ensure test runner is `androidx.test.runner.AndroidJUnitRunner`

### Inconsistent Results
- Disable thermal throttling (run on cooled device)
- Use release build for more consistent results
- Increase warmup iterations if needed

### Build Errors
- Sync Gradle files
- Clean build: `./gradlew clean`
- Invalidate caches in Android Studio

## References

- [AndroidX Benchmark Documentation](https://developer.android.com/studio/profile/benchmark)
- [Benchmark Sample App](https://github.com/android/performance-samples/tree/main/BenchmarkSample)
- [Best Practices Guide](https://developer.android.com/studio/profile/benchmark#what-to-benchmark)
