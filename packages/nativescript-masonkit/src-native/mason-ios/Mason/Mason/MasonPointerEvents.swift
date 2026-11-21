//
//  MasonPointerEvents.swift
//  Mason
//
//  DOM pointer events and CSS pointer-events.
//

#if canImport(UIKit)
import UIKit
#else
import AppKit
#endif

/// DOM PointerEvent. Coordinates are CSS pixels (points); client coordinates are relative to the window.
@objcMembers
@objc(MasonPointerEvent)
public class MasonPointerEvent: MasonEvent {
  public internal(set) var pointerId: Int = 0
  public internal(set) var pointerType: String = "touch"
  public internal(set) var isPrimary: Bool = false

  public internal(set) var clientX: Double = 0
  public internal(set) var clientY: Double = 0
  public internal(set) var screenX: Double = 0
  public internal(set) var screenY: Double = 0
  public internal(set) var offsetX: Double = 0
  public internal(set) var offsetY: Double = 0
  public internal(set) var movementX: Double = 0
  public internal(set) var movementY: Double = 0
  public var pageX: Double { clientX }
  public var pageY: Double { clientY }
  public var x: Double { clientX }
  public var y: Double { clientY }

  public internal(set) var button: Int = -1
  public internal(set) var buttons: Int = 0

  public internal(set) var width: Double = 1
  public internal(set) var height: Double = 1
  public internal(set) var pressure: Double = 0
  public internal(set) var tangentialPressure: Double = 0
  public internal(set) var tiltX: Double = 0
  public internal(set) var tiltY: Double = 0
  public internal(set) var twist: Double = 0

  public internal(set) var ctrlKey = false
  public internal(set) var shiftKey = false
  public internal(set) var altKey = false
  public internal(set) var metaKey = false

  /// pointerover/out/enter/leave: the element the pointer came from or went to.
  public internal(set) var relatedTarget: Any? = nil

  public static let types: Set<String> = [
    "pointerdown", "pointermove", "pointerup", "pointercancel", "pointerover", "pointerout",
    "pointerenter", "pointerleave", "gotpointercapture", "lostpointercapture",
  ]

  // Mason bubbles pointer events itself, so they report bubbles = false: a host framework's DOM
  // shim re-dispatching one must not bubble it again.
  init(type: String) {
    let cancelable = ["pointerdown", "pointermove", "pointerup", "pointerover", "pointerout"].contains(type)
    super.init(type: type, bubbles: false, cancelable: cancelable)
  }

  func copyPointer(_ from: MasonPointerEvent) {
    pointerId = from.pointerId
    pointerType = from.pointerType
    isPrimary = from.isPrimary
    clientX = from.clientX
    clientY = from.clientY
    screenX = from.screenX
    screenY = from.screenY
    button = from.button
    buttons = from.buttons
    width = from.width
    height = from.height
    pressure = from.pressure
    tiltX = from.tiltX
    tiltY = from.tiltY
    ctrlKey = from.ctrlKey
    shiftKey = from.shiftKey
    altKey = from.altKey
    metaKey = from.metaKey
  }
}

/// CSS `pointer-events` values for `MasonNode.pointerEvents`.
public enum MasonPointerEventsValue {
  public static let auto = 0
  public static let none = 1
}

/// One input sample, in window coordinates (`raw` is the platform's, for converting into views).
struct MasonPointerSample {
  var client: CGPoint
  var raw: CGPoint
  var button = -1
  var buttons = 0
  var pressure = 0.0
  var width = 1.0
  var height = 1.0
  var tiltX = 0.0
  var tiltY = 0.0
  var ctrl = false
  var shift = false
  var alt = false
  var meta = false
}

/// Pointer state and DOM dispatch, shared by the touch, mouse and hover sources.
final class MasonPointerDispatch {
  static let shared = MasonPointerDispatch()
  static let mouseId = 1

  final class Pointer {
    let id: Int
    let type: String
    let primary: Bool
    var target: MasonNode?
    var capture: MasonNode?
    var pendingCapture: MasonNode?
    var hasPendingCapture = false
    var client = CGPoint(x: CGFloat.nan, y: CGFloat.nan)
    var buttons = 0
    var cancelled = false
    weak var owner: AnyObject?

    init(id: Int, type: String, primary: Bool) {
      self.id = id
      self.type = type
      self.primary = primary
    }
  }

  private(set) var pointers: [Int: Pointer] = [:]
  private var nextTouchId = 2
  private var hoverGeneration = 0

  // MARK: Sources

  func begin(id: Int, type: String, owner: AnyObject?) -> Pointer {
    hoverGeneration += 1
    if let existing = pointers[id] {
      if existing.type == "mouse" {
        existing.cancelled = false
        existing.owner = owner
        return existing
      }
      end(existing)
    }
    let primary = type == "mouse" || !pointers.values.contains { $0.type == type }
    let pointer = Pointer(id: id, type: type, primary: primary)
    pointer.owner = owner
    pointers[id] = pointer
    return pointer
  }

  func newTouchId() -> Int {
    defer { nextTouchId += 1 }
    return nextTouchId
  }

  func down(_ pointer: Pointer, _ sample: MasonPointerSample, target: MasonNode?) {
    let event = build("pointerdown", pointer, sample)
    retarget(pointer, target, event)
    // Touch and pen are captured to their target, as if setPointerCapture ran before pointerdown.
    if pointer.type != "mouse", let target {
      pointer.pendingCapture = target
      pointer.hasPendingCapture = true
    }
    fire(target, event, sample)
  }

  /// `hit` finds what's under the pointer, used unless it's captured.
  func move(_ pointer: Pointer, _ sample: MasonPointerSample, hit: () -> MasonNode?) {
    guard !pointer.cancelled, sample.client != pointer.client else { return }
    hoverGeneration += 1
    let event = build("pointermove", pointer, sample)
    processPendingCapture(pointer, event, sample)
    if pointer.capture == nil, pointer.type == "mouse" { retarget(pointer, hit(), event, sample) }
    fire(pointer.capture ?? pointer.target, event, sample)
  }

  func up(_ pointer: Pointer, _ sample: MasonPointerSample, hit: () -> MasonNode?) {
    if pointer.cancelled {
      if pointer.type != "mouse" { end(pointer) } else { pointer.cancelled = false }
      return
    }
    let event = build("pointerup", pointer, sample)
    processPendingCapture(pointer, event, sample)
    if pointer.capture == nil, pointer.type == "mouse" { retarget(pointer, hit(), event, sample) }
    fire(pointer.capture ?? pointer.target, event, sample)
    release(pointer, event, sample)
    if pointer.type != "mouse" {
      retarget(pointer, nil, event, sample)
      end(pointer)
    }
  }

  func cancel(_ pointer: Pointer) {
    guard !pointer.cancelled else { return }
    pointer.cancelled = true
    var sample = MasonPointerSample(client: pointer.client, raw: .zero)
    sample.buttons = 0
    let event = build("pointercancel", pointer, sample)
    fire(pointer.capture ?? pointer.target, event, nil)
    release(pointer, event, nil)
    retarget(pointer, nil, event, nil)
    if pointer.type == "mouse" { pointer.cancelled = false }
  }

  /// Mouse movement with no button down.
  func hover(id: Int, type: String, _ sample: MasonPointerSample, hit: () -> MasonNode?) {
    let pointer = pointers[id] ?? begin(id: id, type: type, owner: nil)
    hoverGeneration += 1
    guard sample.client != pointer.client else { return }
    let event = build("pointermove", pointer, sample)
    processPendingCapture(pointer, event, sample)
    if pointer.capture == nil { retarget(pointer, hit(), event, sample) }
    fire(pointer.capture ?? pointer.target, event, sample)
  }

  /// The pointer left a hover source. Settled a turn later: it may have only moved to another one.
  func hoverEnded(id: Int) {
    guard let pointer = pointers[id] else { return }
    hoverGeneration += 1
    let generation = hoverGeneration
    DispatchQueue.main.async { [weak self] in
      guard let self, generation == self.hoverGeneration, self.pointers[id] === pointer, pointer.buttons == 0 else { return }
      let event = self.build("pointerout", pointer, MasonPointerSample(client: pointer.client, raw: .zero))
      self.retarget(pointer, nil, event, nil)
      self.end(pointer)
    }
  }

  func pointers(ownedBy owner: AnyObject) -> [Pointer] {
    pointers.values.filter { $0.owner === owner }
  }

  func end(_ pointer: Pointer) {
    if pointers[pointer.id] === pointer { pointers[pointer.id] = nil }
  }

  // MARK: Capture

  func setCapture(_ node: MasonNode, _ id: Int) -> Bool {
    guard let pointer = pointers[id], pointer.type != "mouse" || pointer.buttons != 0 else { return false }
    pointer.pendingCapture = node
    pointer.hasPendingCapture = true
    return true
  }

  func releaseCapture(_ node: MasonNode, _ id: Int) {
    guard let pointer = pointers[id], hasCapture(node, id) else { return }
    pointer.pendingCapture = nil
    pointer.hasPendingCapture = true
  }

  func hasCapture(_ node: MasonNode, _ id: Int) -> Bool {
    guard let pointer = pointers[id] else { return false }
    return (pointer.hasPendingCapture ? pointer.pendingCapture : pointer.capture) === node
  }

  // MARK: Targets

  /// The node a pointer over `hitView` (at `point` in its coordinates) targets: the nearest element,
  /// or the inline element a text view draws there; pointer-events: none nodes pass it up.
  static func target(hitView: UIView?, point: CGPoint) -> MasonNode? {
    var view = hitView
    while let v = view, !(v is MasonElement) { view = v.superview }
    guard let element = view as? MasonElement else { return nil }
    var node: MasonNode? = element.node
    if view === hitView, let text = view as? MasonText, let inline = text.engine.inlineNode(at: point), inline !== text.node {
      node = inline
    }
    while let n = node, n.pointerEvents == MasonPointerEventsValue.none { node = n.parent }
    return node
  }

  // MARK: Dispatch

  private func build(_ type: String, _ pointer: Pointer, _ sample: MasonPointerSample) -> MasonPointerEvent {
    let event = MasonPointerEvent(type: type)
    event.pointerId = pointer.id
    event.pointerType = pointer.type
    event.isPrimary = pointer.primary
    event.clientX = Double(sample.client.x)
    event.clientY = Double(sample.client.y)
    event.screenX = event.clientX
    event.screenY = event.clientY
    event.button = sample.button
    event.buttons = sample.buttons
    event.pressure = sample.buttons == 0 ? 0 : sample.pressure
    event.width = sample.width
    event.height = sample.height
    event.tiltX = sample.tiltX
    event.tiltY = sample.tiltY
    event.ctrlKey = sample.ctrl
    event.shiftKey = sample.shift
    event.altKey = sample.alt
    event.metaKey = sample.meta
    if !pointer.client.x.isNaN, !sample.client.x.isNaN {
      event.movementX = Double(sample.client.x - pointer.client.x)
      event.movementY = Double(sample.client.y - pointer.client.y)
    }
    if !sample.client.x.isNaN { pointer.client = sample.client }
    pointer.buttons = sample.buttons
    return event
  }

  private func copy(_ type: String, _ from: MasonPointerEvent, related: MasonNode?) -> MasonPointerEvent {
    let event = MasonPointerEvent(type: type)
    event.copyPointer(from)
    event.relatedTarget = related?.view
    return event
  }

  private func viewFor(_ node: MasonNode) -> UIView? {
    var current: MasonNode? = node
    while let n = current {
      if let view = n.view, view.window != nil { return view }
      current = n.parent
    }
    return nil
  }

  private func setOffset(_ event: MasonPointerEvent, _ node: MasonNode, _ sample: MasonPointerSample?) {
    guard let view = viewFor(node) else { return }
#if canImport(UIKit)
    let local = view.convert(CGPoint(x: event.clientX, y: event.clientY), from: nil)
#else
    guard let sample, !sample.raw.x.isNaN else { return }
    let local = view.convert(sample.raw, from: nil)
#endif
    event.offsetX = Double(local.x - view.bounds.minX)
    event.offsetY = Double(local.y - view.bounds.minY)
  }

  private func fire(_ target: MasonNode?, _ event: MasonPointerEvent, _ sample: MasonPointerSample?) {
    guard let target else { return }
    setOffset(event, target, sample)
    event.target = target.view
    target.mason.dispatch(event, target)
  }

  private func fireAt(_ type: String, _ node: MasonNode, _ from: MasonPointerEvent, related: MasonNode?, _ sample: MasonPointerSample?) {
    guard node.mason.hasListener(node, type) else { return }
    let event = copy(type, from, related: related)
    setOffset(event, node, sample)
    event.target = node.view
    node.mason.dispatchAtTarget(event, node)
  }

  private func chain(_ node: MasonNode?) -> [MasonNode] {
    var out: [MasonNode] = []
    var current = node
    while let n = current {
      out.append(n)
      current = n.parent
    }
    return out
  }

  private func retarget(_ pointer: Pointer, _ target: MasonNode?, _ from: MasonPointerEvent, _ sample: MasonPointerSample? = nil) {
    let old = pointer.target
    guard old !== target else { return }
    pointer.target = target
    let oldChain = chain(old)
    let newChain = chain(target)
    if let old {
      fire(old, copy("pointerout", from, related: target), sample)
      for node in oldChain {
        if newChain.contains(where: { $0 === node }) { break }
        fireAt("pointerleave", node, from, related: target, sample)
      }
    }
    if let target {
      fire(target, copy("pointerover", from, related: old), sample)
      for node in newChain.reversed() where !oldChain.contains(where: { $0 === node }) {
        fireAt("pointerenter", node, from, related: old, sample)
      }
    }
  }

  private func processPendingCapture(_ pointer: Pointer, _ from: MasonPointerEvent, _ sample: MasonPointerSample?) {
    guard pointer.hasPendingCapture else { return }
    pointer.hasPendingCapture = false
    let next = pointer.pendingCapture
    let previous = pointer.capture
    guard next !== previous else { return }
    pointer.capture = next
    if let previous { fire(previous, copy("lostpointercapture", from, related: nil), sample) }
    if let next {
      fire(next, copy("gotpointercapture", from, related: nil), sample)
      retarget(pointer, next, from, sample)
    }
  }

  private func release(_ pointer: Pointer, _ from: MasonPointerEvent, _ sample: MasonPointerSample?) {
    pointer.pendingCapture = nil
    pointer.hasPendingCapture = false
    guard let previous = pointer.capture else { return }
    pointer.capture = nil
    fire(previous, copy("lostpointercapture", from, related: nil), sample)
  }
}

// MARK: - Touch and mouse-button source

/// Watches the touches (on macOS, mouse presses) inside the element it's on and raises pointer
/// events. It never recognizes, so it doesn't compete with other gestures; a pan or pinch that
/// takes the touch over fails it, which cancels the pointer as a browser's scroll does.
final class MasonPointerRecognizer: MasonGestureRecognizerBase {
  private var tracked: Set<ObjectIdentifier> = []

#if canImport(UIKit)
  private static var touchPointers: [ObjectIdentifier: Int] = [:]
#endif

  init() {
    super.init(target: nil, action: nil)
#if canImport(UIKit)
    cancelsTouchesInView = false
    delaysTouchesBegan = false
    delaysTouchesEnded = false
#endif
  }

#if os(macOS)
  required init?(coder: NSCoder) {
    fatalError("init(coder:) has not been implemented")
  }

  private static let mouseKey = NSObject()
#endif

  private var dispatcher: MasonPointerDispatch { .shared }

  private func key(_ touch: UITouch) -> ObjectIdentifier {
#if canImport(UIKit)
    return ObjectIdentifier(touch)
#else
    return ObjectIdentifier(Self.mouseKey)
#endif
  }

  private func type(_ touch: UITouch) -> String {
#if canImport(UIKit)
    switch touch.type {
    case .pencil: return "pen"
    case .indirectPointer: return "mouse"
    default: return "touch"
    }
#else
    return "mouse"
#endif
  }

  static func sample(_ touch: UITouch, _ event: UIEvent?, phase: Int) -> MasonPointerSample {
#if canImport(UIKit)
    let raw = touch.location(in: nil)
    var sample = MasonPointerSample(client: raw, raw: raw)
    let ended = phase == 2
    sample.buttons = ended ? 0 : 1
    sample.button = phase == 1 ? -1 : 0
    if touch.type == .indirectPointer, let event {
      if event.buttonMask.contains(.secondary) { sample.buttons = ended ? 0 : 2 }
    }
    if touch.maximumPossibleForce > 0 {
      sample.pressure = Double(touch.force / touch.maximumPossibleForce)
    } else {
      sample.pressure = 0.5
    }
    if touch.type == .direct {
      sample.width = max(1, Double(touch.majorRadius * 2))
      sample.height = sample.width
    }
    if touch.type == .pencil {
      let altitude = Double(touch.altitudeAngle)
      let azimuth = Double(touch.azimuthAngle(in: touch.view))
      let t = tan(altitude)
      if t > 0 {
        sample.tiltX = atan(cos(azimuth) / t) * 180 / .pi
        sample.tiltY = atan(sin(azimuth) / t) * 180 / .pi
      }
    }
    if let flags = event?.modifierFlags {
      sample.ctrl = flags.contains(.control)
      sample.shift = flags.contains(.shift)
      sample.alt = flags.contains(.alternate)
      sample.meta = flags.contains(.command)
    }
    return sample
#else
    return macSample(touch.event, phase: phase)
#endif
  }

#if os(macOS)
  static func macSample(_ event: NSEvent, phase: Int) -> MasonPointerSample {
    let raw = event.locationInWindow
    var client = raw
    if let content = event.window?.contentView {
      let p = content.convert(raw, from: nil)
      client = content.isFlipped ? p : CGPoint(x: p.x, y: content.bounds.height - p.y)
    }
    var sample = MasonPointerSample(client: client, raw: raw)
    let pressed = NSEvent.pressedMouseButtons
    sample.buttons = (pressed & 1 != 0 ? 1 : 0) | (pressed & 2 != 0 ? 2 : 0) | (pressed & 4 != 0 ? 4 : 0)
    if phase == 2 { sample.buttons &= ~1 }
    sample.button = phase == 1 || phase == 3 ? -1 : 0
    sample.pressure = 0.5
    let flags = event.modifierFlags
    sample.ctrl = flags.contains(.control)
    sample.shift = flags.contains(.shift)
    sample.alt = flags.contains(.option)
    sample.meta = flags.contains(.command)
    return sample
  }
#endif

  private func hitTarget(_ touch: UITouch) -> MasonNode? {
    guard let hit = touch.view else { return nil }
    return MasonPointerDispatch.target(hitView: hit, point: touch.location(in: hit))
  }

  override func touchesBegan(_ touches: Set<UITouch>, with event: UIEvent) {
    for touch in touches {
      let k = key(touch)
      tracked.insert(k)
#if canImport(UIKit)
      // Every recognizer on the way up sees the touch; the first one raises its events.
      if let id = Self.touchPointers[k], let pointer = dispatcher.pointers[id], pointer.owner != nil { continue }
      let type = type(touch)
      let id = type == "mouse" ? MasonPointerDispatch.mouseId : dispatcher.newTouchId()
      Self.touchPointers[k] = id
#else
      if let existing = dispatcher.pointers[MasonPointerDispatch.mouseId], existing.owner != nil, existing.buttons != 0 { continue }
      let type = "mouse"
      let id = MasonPointerDispatch.mouseId
#endif
      let pointer = dispatcher.begin(id: id, type: type, owner: self)
      dispatcher.down(pointer, Self.sample(touch, event, phase: 0), target: hitTarget(touch))
    }
  }

  private func owned(_ touch: UITouch) -> MasonPointerDispatch.Pointer? {
#if canImport(UIKit)
    guard let id = Self.touchPointers[key(touch)] else { return nil }
#else
    let id = MasonPointerDispatch.mouseId
#endif
    guard let pointer = dispatcher.pointers[id], pointer.owner === self else { return nil }
    return pointer
  }

  override func touchesMoved(_ touches: Set<UITouch>, with event: UIEvent) {
    for touch in touches {
      guard let pointer = owned(touch) else { continue }
      dispatcher.move(pointer, Self.sample(touch, event, phase: 1)) { hitTarget(touch) }
    }
  }

  override func touchesEnded(_ touches: Set<UITouch>, with event: UIEvent) {
    for touch in touches {
      if let pointer = owned(touch) {
        dispatcher.up(pointer, Self.sample(touch, event, phase: 2)) { hitTarget(touch) }
        pointer.owner = nil
      }
      forget(touch)
    }
    if tracked.isEmpty { state = .failed }
  }

  override func touchesCancelled(_ touches: Set<UITouch>, with event: UIEvent) {
    for touch in touches {
      if let pointer = owned(touch) { dispatcher.cancel(pointer) }
      forget(touch)
    }
    if tracked.isEmpty { state = .failed }
  }

  private func forget(_ touch: UITouch) {
    let k = key(touch)
    tracked.remove(k)
#if canImport(UIKit)
    if let id = Self.touchPointers[k], dispatcher.pointers[id]?.owner == nil || dispatcher.pointers[id] == nil {
      Self.touchPointers[k] = nil
    }
#endif
  }

#if os(macOS)
  /// A native control's tracking loop ate the mouse-up: finish the press it saw.
  func finishTracked(_ up: NSEvent) {
    if let pointer = dispatcher.pointers[MasonPointerDispatch.mouseId], pointer.owner === self {
      dispatcher.up(pointer, Self.macSample(up, phase: 2)) { nil }
      pointer.owner = nil
    }
    tracked.removeAll()
    state = .failed
  }
#endif

  override func reset() {
    // Failed with touches still down: a pan or pinch took them over.
    for pointer in dispatcher.pointers(ownedBy: self) {
      dispatcher.cancel(pointer)
      pointer.owner = nil
      if pointer.type != "mouse" { dispatcher.end(pointer) }
    }
#if canImport(UIKit)
    for k in tracked where Self.touchPointers[k].map({ dispatcher.pointers[$0] == nil }) ?? false {
      Self.touchPointers[k] = nil
    }
#endif
    tracked.removeAll()
    super.reset()
  }

#if canImport(UIKit)
  override func canPrevent(_ preventedGestureRecognizer: UIGestureRecognizer) -> Bool { false }

  override func canBePrevented(by preventingGestureRecognizer: UIGestureRecognizer) -> Bool {
    preventingGestureRecognizer is UIPanGestureRecognizer || preventingGestureRecognizer is UIPinchGestureRecognizer
  }
#endif
}

// MARK: - Hover

#if canImport(UIKit)
/// iPad pointer and Mac Catalyst mouse movement over an element with pointer listeners.
final class MasonPointerHoverHandler: NSObject {
  static let shared = MasonPointerHoverHandler()

  @objc func hovered(_ recognizer: UIHoverGestureRecognizer) {
    guard let view = recognizer.view, let window = view.window else { return }
    let dispatcher = MasonPointerDispatch.shared
    switch recognizer.state {
    case .began, .changed:
      let raw = recognizer.location(in: nil)
      var sample = MasonPointerSample(client: raw, raw: raw)
      sample.buttons = 0
      let flags = recognizer.modifierFlags
      sample.ctrl = flags.contains(.control)
      sample.shift = flags.contains(.shift)
      sample.alt = flags.contains(.alternate)
      sample.meta = flags.contains(.command)
      dispatcher.hover(id: MasonPointerDispatch.mouseId, type: "mouse", sample) {
        let hit = window.hitTest(raw, with: nil)
        return MasonPointerDispatch.target(hitView: hit, point: hit.map { window.convert(raw, to: $0) } ?? .zero)
      }
    case .ended, .cancelled, .failed:
      dispatcher.hoverEnded(id: MasonPointerDispatch.mouseId)
    default:
      break
    }
  }
}
#endif

// MARK: - Listener hookup

extension MasonEventTarget {
  /// Raises pointer events for touches and mouse input inside this element from now on.
  internal func ensurePointerRecognizer() {
    guard let element = self as? MasonElement else { return }
    element.node.listensForPointer = true
    install(on: element.uiView)
    // An element drawn by a text view has no view of its own on screen: watch the nearest one that is.
    if element.uiView.window == nil {
      DispatchQueue.main.async {
        guard element.uiView.window == nil else { return }
        var node = element.node.parent
        while let n = node {
          if let view = n.view, view.window != nil {
            self.install(on: view)
            return
          }
          node = n.parent
        }
      }
    }
  }

  private func install(on view: UIView) {
    let recognizers: [UIGestureRecognizer]? = view.gestureRecognizers
    if recognizers?.contains(where: { $0 is MasonPointerRecognizer }) == true { return }
    view.isUserInteractionEnabled = true
    view.addGestureRecognizer(MasonPointerRecognizer())
#if canImport(UIKit)
    if #available(iOS 13.0, *) {
      view.addGestureRecognizer(UIHoverGestureRecognizer(target: MasonPointerHoverHandler.shared, action: #selector(MasonPointerHoverHandler.hovered(_:))))
    }
#else
    (view as? MasonViewBase)?.masonTracksPointer = true
#endif
  }
}

extension UIView {
  /// The hit view for `pointer-events`: an element set to none isn't hit itself, its children still can be.
  internal func masonPointerHit(_ hit: UIView?) -> UIView? {
    if hit === self, let element = self as? MasonElement, element.node.pointerEvents == MasonPointerEventsValue.none {
      return nil
    }
    return hit
  }

  @objc public func mason_setPointerCapture(_ pointerId: Int) -> Bool {
    guard let element = self as? MasonElement else { return false }
    return MasonPointerDispatch.shared.setCapture(element.node, pointerId)
  }

  @objc public func mason_releasePointerCapture(_ pointerId: Int) {
    guard let element = self as? MasonElement else { return }
    MasonPointerDispatch.shared.releaseCapture(element.node, pointerId)
  }

  @objc public func mason_hasPointerCapture(_ pointerId: Int) -> Bool {
    guard let element = self as? MasonElement else { return false }
    return MasonPointerDispatch.shared.hasCapture(element.node, pointerId)
  }
}

#if canImport(UIKit)
// pointer-events: none elements aren't hit themselves; their subviews still are.
extension MasonUIView {
  public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    masonPointerHit(super.hitTest(point, with: event))
  }
}

extension Scroll {
  public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    masonPointerHit(super.hitTest(point, with: event))
  }
}

extension MasonText {
  public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    masonPointerHit(super.hitTest(point, with: event))
  }
}

extension Button {
  public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    masonPointerHit(super.hitTest(point, with: event))
  }
}

extension Img {
  public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    masonPointerHit(super.hitTest(point, with: event))
  }
}

extension MasonInput {
  public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    masonPointerHit(super.hitTest(point, with: event))
  }
}

extension MasonLi {
  public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    masonPointerHit(super.hitTest(point, with: event))
  }
}

extension MasonList {
  public override func hitTest(_ point: CGPoint, with event: UIEvent?) -> UIView? {
    masonPointerHit(super.hitTest(point, with: event))
  }
}
#endif
