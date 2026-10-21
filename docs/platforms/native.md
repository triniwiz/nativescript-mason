# Using Mason natively

The native libraries behind MasonKit are ordinary Kotlin and Swift libraries. NativeScript is one consumer; you can also build views with them directly from an Android or iOS app. The repo's own native demo apps do exactly that.

::: warning Not a published, stable API
There is no separate Maven artifact, Swift package or CocoaPod. The libraries are built from this repo, and their API follows whatever the NativeScript plugin needs, so it can change between releases. Treat direct use as advanced.
:::

## What you get

| Platform | Library | Entry point | Demo app |
| --- | --- | --- | --- |
| Android | `masonkit` (AAR, package `org.nativescript.mason.masonkit`) | `Mason.shared` | `src-native/mason-android/app` |
| iOS | `Mason.framework` (in `Mason.xcframework`) | `NSCMason.shared` | `src-native/mason-ios/Mason/MasonDemo` |
| Windows | `NativeScript.Mason` WinRT component | `NativeScript.Mason.Mason` | `src-native/windows/Demo` (headless) |

Paths are relative to `packages/nativescript-masonkit`. The prebuilt binaries are `platforms/android/masonkit-release.aar` and `platforms/ios/Mason.xcframework`; see [Building from source](/contributing/building) to produce them yourself.

Each library exposes factories for the same elements the plugin uses: views, scroll views, text, images, buttons, inputs, text areas, lists and line breaks. Each element has a `configure` block for its style and accepts native child views.

## Android (Kotlin)

```kotlin
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection

class MainActivity : AppCompatActivity() {
  private val mason = Mason.shared

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    val root = mason.createView(this)
    root.configure {
      it.display = Display.Flex
      it.flexDirection = FlexDirection.Column
      it.alignItems = AlignItems.Center
      it.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
    }

    val title = mason.createTextView(this)
    title.textContent = "Hello from Mason"
    title.configure { s -> s.fontSize = 20 }
    root.addView(title)

    setContentView(root)
  }
}
```

Other factories on `Mason`: `createScrollView`, `createImageView`, `createButton`, `createInput`, `createTextArea`, `createListView`, `createListItem`, `createBr`. `configureStyleForView(view) { ... }` styles a plain Android view placed inside a Mason view.

## iOS (Swift)

```swift
import UIKit
import Mason

class ViewController: UIViewController {
  let body = NSCMason.shared.createView()

  override func viewDidLoad() {
    NSCMason.shared.setDeviceScale(NSCMason.scale)
    super.viewDidLoad()

    body.configure { style in
      style.flexDirection = .Column
      style.alignItems = .Center
      style.setSizeWidth(MasonDimension.Percent(1))
    }

    let title = NSCMason.shared.createTextView()
    title.textContent = "Hello from Mason"
    body.addView(title)

    body.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(body)
    NSLayoutConstraint.activate([
      body.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor),
      body.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      body.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      body.bottomAnchor.constraint(equalTo: view.bottomAnchor),
    ])
  }
}
```

Other factories on `NSCMason`: `createScrollView`, `createImageView`, `createButton`, `createInput`, `createTextArea`, `createListView`, `createListItem`, `createBr`, `createDocument`. `configureStyleForView(view) { style in ... }` styles a plain `UIView` inside a Mason view.

## Units

The typed native style setters take a `Dimension` / `MasonDimension`. `Points` values are **device pixels**, not CSS pixels, so multiply by the screen scale for a CSS-sized value (the iOS demo uses `MasonDimension.Points(50 * NSCMason.scale)`). `Percent(1)` is 100%.

Font sizes set through `configure` (`fontSize`) are in dip / points. This differs from the TypeScript API, where `px` is always a CSS pixel; see [Units](/styling/units).

## HTML

Mason elements also accept markup natively: `innerHTML` is available on Android `Element` and iOS `MasonElement` and builds the tree with the platform's native HTML parser. See [innerHTML](/guide/inner-html) for what the parser supports.
