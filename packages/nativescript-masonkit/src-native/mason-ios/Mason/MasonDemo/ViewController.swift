//
//  ViewController.swift
//  MasonDemo
//
//  Created by Osei Fortune on 28/11/2022.
//

import UIKit
import Mason

class ViewController: UIViewController, UICollectionViewDataSource, UICollectionViewDelegate, UICollectionViewDelegateFlowLayout {
  
  let scale = Float(UIScreen.main.scale)
  
  var items: [String] = []
  
  var textTopLeft: MasonText? = nil
  
  var textTopRight: MasonText? = nil
  
  var textBottomLeft: MasonText? = nil
  
  var textBottomRight: MasonText? = nil
  
  var list: UICollectionView? = nil
  
  let document = NSCMason.shared.createDocument()
  
  let body = NSCMason.shared.createView()
  
  var mason: NSCMason {
    get {
      NSCMason.shared
    }
  }
  
  
  class DefaultCellView: UICollectionViewCell {
    let bodyView = NSCMason.shared.createView()
    let listTextView = NSCMason.shared.createTextView()
    let listImageView = UIImageView(frame: .zero)
    
    override init(frame: CGRect) {
      super.init(frame: .zero)
      setupView()
    }
    
    override func prepareForReuse() {
      super.prepareForReuse()
      listTextView.textContent = ""
      listImageView.image = nil
    }
    
    
    
    func setupView(){
      let scale = Float(UIScreen.main.scale)
      bodyView.configure { style in
        style.alignItems = .Center
        style.flexDirection = .Column
        style.setSizeWidth(MasonDimension.Percent(1))
        //            style.size = MasonSize(MasonDimension.Points(Float(frame.size.width) * scale), MasonDimension.Points(Float(frame.size.height) * scale))
      }
      
      
      NSCMason.shared.configureStyleForView(listImageView) { style in
        style.setSizeHeight(MasonDimension.Points(50 * scale))
      }
      
      
      let label1 = NSCMason.shared.createTextView()
      label1.textContent = "Laffy Taffy!!!!"
      
      bodyView.addView(listTextView)
      bodyView.addView(label1)
      bodyView.addView(listImageView)
      
      backgroundColor = .clear
      
      contentView.addSubview(bodyView)
      
    }
    
    required init?(coder: NSCoder) {
      fatalError("init(coder:) has not been implemented")
    }
  }
  
  override func viewDidAppear(_ animated: Bool) {
    //        view?.mason.computeWithMaxContent()
    guard view.subviews.first is MasonUIView else {return}
    //      view.uiView.frame.origin.x += view.safeAreaInsets.left
    //                view.uiView.frame.origin.y += view.safeAreaInsets.top
    
  }
  
  override func viewSafeAreaInsetsDidChange() {
    // body.frame = body.frame.offsetBy(dx: view.safeAreaInsets.left, dy: view.safeAreaInsets.top)
    let left = Float(self.view.safeAreaInsets.left) * scale
    let right = Float(self.view.safeAreaInsets.right) * scale
    let top = Float(self.view.safeAreaInsets.top) * scale
    let bottom = Float(self.view.safeAreaInsets.bottom) * scale
    
    body.style.padding = MasonRect(.Points(top),.Points(right), .Points(bottom), .Points(left))
    
   // body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    guard view.subviews.first is MasonUIView else {return}
    
    
    //      view.style.inset = MasonRect(
    //               .Points(left),
    //               .Points(right),
    //               .Points(top),
    //               .Points(bottom)
    //              )
    //
    //
    //      view.computeWithSize(scale * Float(self.view.bounds.width), scale * Float(self.view.bounds.height))
    //
    
    //         guard let rootView = rootView else {return}
    //
    //
    //         rootView.mason.style.inset = MasonRect(
    //         .Points(left),
    //         .Points(right),
    //         .Points(top),
    //         .Points(bottom)
    //         )
    //
    //         textTopLeft?.configure({ mason in
    //         mason.style.topInset = .Points(top)
    //         })
    //
    //         textTopRight?.configure({ mason in
    //         mason.style.topInset = .Points(top)
    //         })
    //
    //         textBottomLeft?.configure({ mason in
    //         mason.style.bottomInset = .Points(bottom)
    //         })
    //
    //         textBottomRight?.configure({ mason in
    //         mason.style.bottomInset = .Points(bottom)
    //         })
    //
    //         view.mason.computeWithMaxContent()
    //
    
    
  }
  
  func textSample(){
    print("=== textSample() STARTING ===")
    let text = mason.createTextView()
    text.setColor(ui: .blue)
    text.decorationLine = .Underline
    text.setDecorationColor(ui: .orange)
    text.fontStyle = .Italic
    text.fontWeight = "bold"
    text.textWrap = .Wrap
    text.append(text: "Hello World!!!!! ")
    
    
    let child = mason.createView()
    child.configure { style in
      style.size = MasonSize<MasonDimension>(
        MasonDimension.Points(300),
        MasonDimension.Points(300))
    }
    
    child.backgroundColor = .blue
    
    text.addView(child)
    
    
    let spacer = mason.createTextView()
    spacer.append(text: " OMG ??? ")
    spacer.textTransform = .FullWidth
    spacer.setColor(ui: .red)
    text.addView(spacer)
    
    
    let image = mason.createImageView()
    image.configure { style in
      style.size = MasonSize<MasonDimension>(
        MasonDimension.Points(300),
        MasonDimension.Points(300))
    }
    image.src = "https://picsum.photos/300/300"
    
    // loadImage("https://picsum.photos/300/300", imageInstance: image, parent: text)
    
    text.addView(image)
    
    
    
    
    let first = mason.createTextView()
    first.append(text: " this")
    // first.setColor(ui: .magenta)
    text.addView(first)
    
    
    let first_first = mason.createTextView()
    first_first.append(text: " is a nested text")
    first_first.fontSize = 30
    
    first.addView(first_first)
    
    
    let other = mason.createTextView()
    other.append(text: " <- inserted here ->")
    
    
    
    let image2 = mason.createImageView()
    image.configure{ style in
      style.size = MasonSize<MasonDimension>(
        MasonDimension.Points(300),
        MasonDimension.Points(300))
    }
    image2.src = "https://picsum.photos/300/300"
    // loadImage("https://picsum.photos/300/300", imageInstance: image2, parent: text)
    
    other.append(image2)
    
    
    text.addView(other)
    
    
    let con = mason.createView()
    con.style.marginTop = .Points(200)
    con.addView(text)
    body.addView(con)
    
    //    con.style.size =  MasonSize(MasonDimension.Points(scale * Float(body.bounds.width)), MasonDimension.Points(scale * Float(body.bounds.height)))
    
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    
  }
  
  let urlSession: URLSession = {
    return URLSession(configuration: .ephemeral)
  }()
  
  func loadImage(_ urlAddress: String, imageInstance: UIImageView, parent: UIView? = nil) {
    guard let url = URL(string: urlAddress) else {
      print("Invalid URL")
      return
    }
    
    // Asynchronous network call using URLSession
    urlSession.dataTask(with: url) {  data, response, error in
      // Check for errors
      if let error = error {
        print("Error loading image: \(error.localizedDescription)")
        return
      }
      
      // Validate data and convert it into an image
      guard let data = data, let image = UIImage(data: data) else {
        print("Unable to load image from data")
        return
      }
      
      // Update UI on the main thread
      DispatchQueue.main.async {
        imageInstance.image = image
        parent!.setNeedsDisplay()
      }
    }.resume() // Don't forget to start the task!
  }
  
  deinit {
    print("Dispose controller")
  }
  
  func toPx(_ value: Float) -> Float {
    return value * scale
  }
  var data:Data!
  
  override func viewWillTransition(to size: CGSize, with coordinator: any UIViewControllerTransitionCoordinator) {
    body.style.size = .init(.Points(Float(size.width * UIScreen.main.scale)), .Points(Float(size.height * UIScreen.main.scale)))
  }
  override func viewDidLoad() {
    NSCMason.shared.setDeviceScale(Float(UIScreen.main.scale))
    print("=== viewDidLoad() STARTING ===")
    //  super.viewDidLoad()
    //        var i = 0
    //        repeat {
    //            items.append("https://robohash.org/\(i + 1)?set=set4")
    //            i+=1
    //        } while i < 1000
    
    //    body.style.size = .init(.Points(Float(view.bounds.width * UIScreen.main.scale)), (.Points(Float(view.bounds.height * UIScreen.main.scale))))
    // document.node.appendChild(body.node)
    
    view.addSubview(body)
    
    body.style.size = .init(.Points(Float(view.frame.width * UIScreen.main.scale)), .Points(Float(view.frame.height * UIScreen.main.scale)))
    
    
    
    // let root = mason.createView()
    // body.addView(root)
    
    /*
     
     let text = mason.createTextView(type: .Pre)
     root.addView(text)
     text.textContent = """
     S
     A
     LUT
     M
     O N
     D  E
     DONT
     E SUIS
     LA LAN
     G U E  É
     L O Q U E N
     TE      QUESA
     B  O  U  C  H  E
     O        P A R I S
     T I R E   ET   TIRERA
     T O U             JOURS
     AUX                  A  L
     LEM                      ANDS   - Apollinaire
     """
     
     mason.printTree(root.node)
     
     
     root.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
     
     
     */
    // textWithImage()
    
    //imageTest()
    
    
    //textSample()
    
    //flexIssue()
    
    // testLayout()
    
    //  showFlexExample()
    
    // showGridExample()
    // animationExample()
    
    //wrapper5()
    // wrapper6()
    
    /*
     let con = mason.createView()
     let text = mason.createTextView()
     text.style.setSizeHeight(.Points(48))
     text.textContent = "Hello, World!"
     con.addView(text)
     body.addView(con)
     
     con.backgroundColor = .blue
     text.backgroundColor = .red
     
     text.color = UIColor.green.toUInt32()
     
     body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
     
     */
    
    //  textDemo()
    
    // imageExample()
    // textSample()
    // gridSample()
    
    // testLateUpdate()
    
    // scrollTest()
    
    //headers()
    
    //      let root = mason.createView()
    //      root.backgroundColor = .red
    //
    //      body.addView(root)
    //
    //      let a = mason.createTextView(type: .H1)
    //      let b = mason.createTextView()
    //      print(a.style.valuesCompat)
    //
    //      root.addView(a)
    //
    //
    //      a.textContent = "a"
    //      b.updateText("b")
    //
    //
    //
    //      let fg = mason.createView()
    //      let f = mason.createView()
    //      let g = mason.createView()
    //
    //      fg.addView(f)
    //      fg.addView(g)
    //
    //      root.addView(fg)
    //
    //      f.backgroundColor = .blue
    //      f.style.size = MasonSize(.Points(100), .Points(100))
    //      g.backgroundColor = .yellow
    //      g.style.size = MasonSize(.Points(100), .Points(100))
    //
    //      root.node.computeWithMaxContent()
    
   // inlineTest()
    //  testTextInsert()
    // testInsert()
    // testInlineStyleChange()
    //testTextNodeInsertingInline()
   // testTextNodeReplaceWithImage()
    // testTextAppend()
    //flexDirection()
    
    // gridTemplateColumns()
    // padding()
    // fontSize()
   //   textAlignment()
    //wrapper8()
    //filter()
  //  renderFloat(body)
//    let sv = mason.createScrollView()
   // sv.style.overflowY = .Scroll
//    body.append(sv)
//    objectFit(sv)
        //filter()
   // buttons()
   // background()
   // verticalAlignment()
    
    
//    let container = mason.createView()
//    container.background = "linear-gradient(180deg, #FEE2E2 0%, #FECACA 50%, #FCA5A5 100%);"
//    container.configure { style in
//     //container.setPadding(30, 30, 30, 30)
//    //  style.size = .init(.Points(300), .Auto)
//    }
//    let a = mason.createButton()
//    a.append(text: "Hello")
//    a.append(text: " World!")
//    
//    container.append(a)
//    
//    body.append(container)
//    
//    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
   // radius()
  //  button()
    
   // grid_template_areas_500(body)
    input()
  }
  
  func input(){
    let root = mason.createView()
    body.append(root)
    root.style.padding = MasonRect(uniform: .Points(40))
    
    let input = root.mason.createInput()
    input.placeholder = "Enter text..."
    
    
    root.append(input)
    
    root.append(text: "\n")
    
    root.mason_addChildAt(element: mason.createBr(), -1)
    
    let button = root.mason.createInput(.Button)
    button.value = "Button"
    
    root.append(button)
    
    root.append(mason.createBr())
    
    let checkbox = root.mason.createInput(.Checkbox)
    root.append(checkbox)
    
    
    root.append(mason.createBr())
    
    let password = root.mason.createInput(.Password)
    password.placeholder = "Enter Password..."
    
    root.append(password)
    
    root.append(mason.createBr())
    
    
    let email = root.mason.createInput(.Email)
    email.placeholder = "Enter Email..."
    
    root.append(email)
    
    
    root.append(mason.createBr())
    
    
    let radio = root.mason.createInput(.Radio)
    root.append(radio)
    
    root.append(mason.createBr())
    
    let range = root.mason.createInput(.Range)
    root.append(range)
  
    root.append(mason.createBr())
    
    
    let number = root.mason.createInput(.Number)
    number.placeholder = "100"
    root.append(number)
     
    root.append(mason.createBr())
    
    let color = root.mason.createInput(.Color)
    root.append(color)
     
    root.append(mason.createBr())
    
    let file = root.mason.createInput(.File)
    file.multiple = true
    root.append(file)
    
    
    root.append(mason.createBr())
    
    let date = root.mason.createInput(.Date)
    root.append(date)
    
    self.body.computeWithSize(scale * Float( self.body.bounds.width), scale * Float( self.body.bounds.height))
  }
  
  func grid_template_areas_500(_ rootLayout: MasonElement) {
    let body = mason.createView()
    body.style.margin = MasonRect(uniform: MasonLengthPercentageAuto.Points(40))
    let root = mason.createView()
    body.append(root)
    root.configure { it in
      it.display = Display.Grid
      it.gridTemplateAreas = """
      "header  header"
      "sidebar content"
      "sidebar2 sidebar2"
      "footer  footer"
      """
      it.gridTemplateColumns = "20% auto"
      it.gap = MasonSize(MasonLengthPercentage.Points(16), MasonLengthPercentage.Points(16))
    }


    let boxPadding = MasonRect(uniform: MasonLengthPercentage.Points(10))
    let header = mason.createView()
    header.append(text: "Header")
    header.configure { it in
      it.color = UIColor.white.toUInt32()
      header.style.background = "#999999"
      header.style.gridArea = "header"
      it.padding = boxPadding
      it.borderRadius = "5px"
    }


    let sidebar = mason.createView()
    sidebar.append(text: "Sidebar")
    sidebar.configure { it in
      it.color = UIColor.white.toUInt32()
      sidebar.style.gridArea = "sidebar"
      sidebar.style.background = "#444444"
      it.padding = boxPadding
      it.borderRadius = "5px"
    }

    let content = mason.createView()
    content.append(
      text: "Content"
    )
    
    let br = mason.createBr()
    content.append(br)
    
    content.append(
      text: "More content than we had before so this column is now quite tall."
    )


    content.configure { it in
      it.color = UIColor.white.toUInt32()
      content.style.gridArea = "content"
      it.background = "#444444"
      it.borderRadius = "5px"
      it.padding = boxPadding
    }
    

    let sidebar2 = mason.createView()
    sidebar2.configure { it in
      sidebar2.style.background = "#cccccc"
      sidebar2.style.setColor(css: "#444")
      sidebar2.style.gridArea = "sidebar2"
      it.borderRadius = "5px"
      it.padding = boxPadding
    }
    sidebar2.append(text: "Sidebar 2")


    let footer = mason.createView()
    footer.configure { it in
      footer.style.gridArea = "footer"
      footer.style.background = "#999999"
      it.borderRadius = "5px"
      it.padding = boxPadding
    }
    footer.append(text: "Footer")

    root.append(elements: [header, sidebar, sidebar2, content, footer])

    rootLayout.append(body)
    
    self.body.computeWithSize(scale * Float( self.body.bounds.width), scale * Float( self.body.bounds.height))
    
  }
  
  func button(){
    let container = mason.createView()
    container.configure { style in
      container.setPadding(30, 30, 30, 30)
    //  style.size = .init(.Points(300), .Auto)
    }
    let a = mason.createTextView()
    a.append(text: "Hello")
    a.style.marginRight = .Points(10)
    a.color = UIColor.white.toUInt32()
    a.style.textShadow = """
           1px 1px 2px black,
          0 0 1em blue,
          0 0 0.2em blue;
    """
    container.append(a)
    
    
    let b = mason.createButton()
    b.append(text: "World")
    b.style.textShadow = "red 0 -2px"
    
    b.style.border = "1px solid black"
    
    container.append(b)
    
    body.append(container)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  func radius() {
    let content = mason.createView()
    let root = mason.createView()
    
    body.append(content)
    content.append(root)
    
    content.configure { it in
      it.size = MasonSize(
        .Points(240),
        .Auto,
      )
      it.margin = MasonRect(
        .Points(
          20
        ),
        .Auto,
        .Points(
          20
        ),
        .Auto
      )
    }


    root.configure {it in
      it.display = Display.Flex
      it.size = MasonSize(
        .Percent(1),
        .Points(180),
      )
      it.justifyContent = JustifyContent.Center
      it.alignItems = AlignItems.Center
      it.backgroundColor = UIColor.green.toUInt32()
      it.backgroundImage = "linear-gradient(\n" +
        "    to bottom,\n" +
        "    rgb(255 255 255 / 0),\n" +
        "    rgb(255 255 255 / 0.5)\n" +
        "    );"
      it.borderRadius = "0 20% 50 30%;"
    }


//    box-shadow: 1px 1px 3px gray;
//    border-radius: 0 20% 50px 30%;
//    corner-shape: superellipse(0.5) bevel notch squircle;
//

    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  
  func verticalAlignment(){
    let root = NSCMason.shared.createView()
    body.append(root)
    
    let frame_image = UIImage(named: "frame_image")
    let normal = NSCMason.shared.createView()
    let normalImg = NSCMason.shared.createImageView()
    normal.append(text: "An ")
    normalImg.style.size = .init(.Points(toPx(32)), .Points(toPx(32)))
    normal.append(normalImg)
    normal.append(text: " image with a default alignment.")
    normalImg.updateImage(frame_image)
    root.append(normal)
    
    
    let top = NSCMason.shared.createView()
    let topImg = NSCMason.shared.createImageView()
    top.append(text: "An ")
    topImg.image = frame_image
    topImg.style.size = .init(.Points(toPx(32)), .Points(toPx(32)))
    topImg.style.verticalAlign = .TextTop
    top.append(topImg)
    top.append(text: " image with a text-top alignment.")
    root.append(top)
    
    
    
    let bottom = NSCMason.shared.createView()
    let bottomImg = NSCMason.shared.createImageView()
    bottom.append(text: "An ")
    bottomImg.image = frame_image
    bottomImg.style.size = .init(.Points(toPx(32)), .Points(toPx(32)))
    bottomImg.style.verticalAlign = .TextBottom
    bottom.append(bottomImg)
    bottom.append(text: " image with a text-bottom alignment.")
    root.append(bottom)
    
    
    
    let middle = NSCMason.shared.createView()
    let middleImg = NSCMason.shared.createImageView()
    middle.append(text: "An ")
    middleImg.image = frame_image
    middleImg.style.size = .init(.Points(toPx(32)), .Points(toPx(32)))
    middleImg.style.verticalAlign = .Middle
    middle.append(middleImg)
    middle.append(text: " image with a middle alignment.")
    root.append(middle)
    
    
//
    
//    <div>
//      An
//      <img class="top" src="frame_image.svg" alt="link" width="32" height="32" />
//      image with a text-top alignment.
//    </div>
//    <div>
//      An
//      <img class="bottom" src="frame_image.svg" alt="link" width="32" height="32" />
//      image with a text-bottom alignment.
//    </div>
//    <div>
//      An
//      <img class="middle" src="frame_image.svg" alt="link" width="32" height="32" />
//      image with a middle alignment.
//    </div>
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    
  }
  
  
  
  
  func buttons(){
    let container = mason.createView()
    container.style.setBackgroundColor(string: "red")
    container.configure { style in
      container.setPadding(30, 30, 30, 30)
    //  style.size = .init(.Points(300), .Auto)
    }
    let a = mason.createButton()
    a.append(text: "Hello")
    
    
    let ns = mason.createImageView()
    ns.configure { it in
      it.size = MasonSize(.Points(50), .Points(50))
    }
 
    ns.image = UIImage(named: "NativeScript_Logo_White_Blue_Rounded")
      
    a.append(text: "World!")
    
    a.append(ns)
    
    
    a.style.color = UIColor.blue.toUInt32()
    a.style.setBackgroundColor(string: "orange")
    a.style.size = .init(.Points(200), .Auto)
    
    a.style.border = "1px solid black"
    
    container.append(a)
    
    
    
    let btn = UIButton(type: .system)
    let img = UIImage(named: "NativeScript_Logo_White_Blue_Rounded")?.mason_resize(to: .init(width: 50, height: 50))
    btn.setTitle("Hello 2", for: .normal)
    btn.titleEdgeInsets = UIEdgeInsets(top: 0, left:0, bottom: 0, right: 0)
    btn.setImage(img, for: .normal)
    
   // container.addView(btn)
    
    body.append(container)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  func bold(){
    let a = mason.createView()
    a.style.fontFamily = "'Courier New', monospace"
    a.append(text: "Hi")
    a.style.fontWeight = "bold"
    
    let b = mason.createTextView(type:.Span )
    
    b.append(text: "???")
    
    b.style.fontWeight = "black"
    
    a.append(b)
    
    
    body.append(a)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  func insertObjectFit(_ section: MasonElement, _ header: String, _ fit: ObjectFit, _ src: String) {
    let h2 = mason.createTextView(type: .H2)
    h2.append(text: header)

    h2.configure { it in
      it.fontFamily = "'Courier New', monospace"
      it.fontSize = 16
      it.margin = MasonRect(
        .Points(0),
        .Points(0),
        .Points(16),
        .Points(
          16 / 0.3
        )
      )
    }

    section.append(h2)
    let img = mason.createImageView()
    img.configure { it in
      it.objectFit = fit
      it.border = "1px solid black"
      it.margin = MasonRect(
        .Points(0),
        .Points(0),
        .Points(10),
        .Points(10)
      )
      it.size = MasonSize(.Points(toPx(150)), .Points(toPx(100)))
    }
    img.src = src


    let imgNarrow = mason.createImageView()
    imgNarrow.configure { it in
      it.objectFit = fit
      it.border = "1px solid black"
      it.margin = MasonRect(
        .Points(0),
        .Points(0),
        .Points(10),
        .Points(10)
      )
      it.size = MasonSize(.Points(toPx(100)), .Points(toPx(150)))
    }
    imgNarrow.src = src

    section.append(img)
    section.append(text: "\u{00A0}")
    section.append(imgNarrow)
  }

  func objectFit(_ scroll: Scroll) {
    let section = mason.createView()
    let mdnLogoOnlyColor =
      "https://b4eb5495-cf4e-4b34-a1f5-d7ee06ed21f7.mdnplay.dev/en-US/docs/Web/CSS/Reference/Properties/object-fit/mdn_logo_only_color.png"

    insertObjectFit(section, "object-fit: fill", ObjectFit.Fill, mdnLogoOnlyColor)

    insertObjectFit(section, "object-fit: contain", ObjectFit.Contain, mdnLogoOnlyColor)

    insertObjectFit(section, "object-fit: cover", ObjectFit.Cover, mdnLogoOnlyColor)

    insertObjectFit(section, "object-fit: none", ObjectFit.None, mdnLogoOnlyColor)

    insertObjectFit(section, "object-fit: scale-down", ObjectFit.ScaleDown, mdnLogoOnlyColor)

    scroll.append(section)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    
    mason.printTree(body.node)

  }
  
  func applyDivStyle(_ style: MasonStyle) {
    style.margin = MasonRect(uniform: .Points(5))
    style.size = MasonSize(
      .Points(
        50
      ),
      .Points(
        150
      )
    )
  }

  func renderFloat(_ view: MasonUIView) {
    let section = mason.createView()
    let one = mason.createView()
    one.append(text: "1")
    one.configure { it in
      it.background = "pink"
      it.float = .Left
      applyDivStyle(it)
    }
    let two = mason.createView()
    two.append(text: "2")
    two.configure { it in
      it.background = "pink"
      it.float = .Left
      applyDivStyle(it)
    }
    let three = mason.createView()
    three.append(text: "3")

    three.configure { it in
      it.background = "cyan"
      it.float = .Right
      applyDivStyle(it)
    }

    let p = mason.createTextView(type: .P)
    p.append(
      text:  """
     Lorem ipsum dolor sit amet, consectetur adipiscing elit. Morbi tristique
    sapien ac erat tincidunt, sit amet dignissim lectus vulputate. Donec id
    iaculis velit. Aliquam vel malesuada erat. Praesent non magna ac massa
    aliquet tincidunt vel in massa. Phasellus feugiat est vel leo finibus
      congue.
"""
    )
    section.append(elements: [one, two, three, p])

    view.append(section)
    
    view.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    mason.printTree(view.node)
  }
  
  
  private class TapListenerWrapper: NSObject {
      let handler: () -> Void
      init(_ handler: @escaping () -> Void) {
          self.handler = handler
      }

      @objc func handleTap() {
          handler()
      }
  }

  private var tapKey: UInt8 = 0

  func setOnClickListener(_ view: UIView, _ listener: @escaping () -> Void) {
      // Remove any old listener if resetting
    if objc_getAssociatedObject(view, &tapKey) is TapListenerWrapper {
          view.gestureRecognizers?.forEach { gr in
              if gr is UITapGestureRecognizer {
                  view.removeGestureRecognizer(gr)
              }
          }
          objc_setAssociatedObject(view, &tapKey, nil, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)
      }

      let wrapper = TapListenerWrapper(listener)
      let recognizer = UITapGestureRecognizer(target: wrapper, action: #selector(TapListenerWrapper.handleTap))

      // Keep wrapper alive by associating it with the view
      objc_setAssociatedObject(view, &tapKey, wrapper, .OBJC_ASSOCIATION_RETAIN_NONATOMIC)

      view.isUserInteractionEnabled = true
      view.addGestureRecognizer(recognizer)
  }
  
  func code(_ value: String) -> MasonText {
    let ret = mason.createTextView(type: .Code)
    ret.append(text: value)
    ret.style.backgroundColor = 0xFFEFEFEF
    return ret
  }
  
  var selected: MasonElement? = nil
  let defaultBorder = "1px solid #51565d"
  let selectedBorder = "1px solid red"
  
   func defaultStyle(_ element: MasonElement) {
    element.configure { it in
      it.padding = MasonRect(uniform: .Points(toPx(10)))
      it.border = defaultBorder
      it.margin = MasonRect(
        .Points(0),
        .Points(0),
        .Points(toPx(5)),
        .Points(toPx(5))
      )
    }
  }

  
  func filter() {
     let rootLayout = mason.createView()


    let img = mason.createImageView()
     //img.src = "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/1024px-Firefox_logo%2C_2019.svg.png"

     img.style.size = MasonSize(
       .Points(toPx(200)), .Points(toPx(200))
     )

     rootLayout.append(img)

     rootLayout.style.padding = MasonRect(
       .Points(10),
       .Zero,
       .Zero,
       .Zero
     )

    img.image = UIImage(named: "firefox_logo")
  
    
    let reset = mason.createView()
    setOnClickListener(reset) {
      img.style.filter = ""
    }
    reset.append(text: "Reset")

    rootLayout.append(reset)

     let blur = mason.createView()
    
    defaultStyle(blur)
    blur.background = "red"
     setOnClickListener(blur) {
       img.style.filter = "blur(5px);"
     }
      blur.append(text: "Blur ")
     blur.append(code("filter: blur(5px);"))

     rootLayout.append(blur)


     let contrast = mason.createView()
     setOnClickListener(contrast) {
       img.style.filter = "contrast(200%);"
     }
    contrast.append(text: "Contrast ")
     contrast.append(code("filter:contrast(200%);"))

     rootLayout.append(contrast)

    let grayscale = mason.createView()
     grayscale.append(text: "Grayscale ")
     grayscale.append(code("filter:grayscale(80%);"))

     setOnClickListener(grayscale) {
       img.style.filter = "grayscale(80%);"
     }

     rootLayout.append(grayscale)


    let hueRotate = mason.createView()
     hueRotate.append(text: "HueRotate ")
     hueRotate.append(code("filter: hue-rotate(90deg);"))

     setOnClickListener(hueRotate) {
       img.style.filter = "hue-rotate(90deg);"
     }

     rootLayout.append(hueRotate)
    
    
    
    let invert = mason.createView()
    invert.append(text: "Invert ")
    invert.append(code("filter:invert(75%);"))

     setOnClickListener(invert) {
       img.style.filter = "invert(75%);"
     }

     rootLayout.append(invert)


    let dropShadow = mason.createView()
     dropShadow.append(text: "DropShadow ")
     dropShadow.append(code("filter:drop-shadow(16px 16px 20px red) invert(75%);"))

     setOnClickListener(dropShadow) {
       img.style.filter = "drop-shadow(16px 16px 20px red) invert(75%);"
     }

     rootLayout.append(dropShadow)
    
    
    
    let stackedDropShadow = mason.createView()
    stackedDropShadow.append(text: "Stacked DropShadow ")
    stackedDropShadow.append(code("filter: drop-shadow(3px 3px red) sepia(100%) drop-shadow(-3px -3px blue)"))

     setOnClickListener(stackedDropShadow) {
       img.style.filter = "drop-shadow(3px 3px red) sepia(100%) drop-shadow(-3px -3px blue)"
     }

     rootLayout.append(stackedDropShadow)
    
  


 //
 //    img.style.filter =
 //      "blur(10px) brightness(1.2) contrast(0.8) saturate(2) hue-rotate(0.5turn) invert(50%) drop-shadow(5px 5px 10px rgba(0,0,0,0.5))"

     body.append(rootLayout)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
   }
  
  func backgroundTest(){
    let rootLayout = mason.createView()
    rootLayout.style.size = .init(.Points(300), .Points(200))
//    rootLayout.background = "pink"
//    rootLayout.background = """
//                            left 5% / 15% 60% repeat-x
//                              url("https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png");
//                            """
//    rootLayout.background = """
//white no-repeat url('https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/lizard.png')
//"""
//    rootLayout.background = "content-box radial-gradient(crimson, skyblue);"
    
//    rootLayout.background = """
//    center / contain no-repeat url("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/1024px-Firefox_logo%2C_2019.svg.png"),
//      #eeeeee 35% url("https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/lizard.png");
//    """
//    rootLayout.style.background = """
//  linear-gradient(45deg, rgba(255,0,0,0.5) 0%, rgba(255,0,0,0.0) 100%), 
//      radial-gradient(circle at center, rgba(0,0,255,0.3) 0%, rgba(0,0,255,0.0) 70%), 
//      #FFFF00
//"""
    
    body.append(rootLayout)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  
  
  func backgroundShortHandTest(){
    let rootLayout = mason.createView()
    rootLayout.style.size = .init(.Points(300), .Points(200))
//    rootLayout.background = "pink"
//    rootLayout.background = """
//                            left 5% / 15% 60% repeat-x
//                              url("https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/star.png");
//                            """
//    rootLayout.background = """
//white no-repeat url('https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/lizard.png')
//"""
//    rootLayout.background = "content-box radial-gradient(crimson, skyblue);"
    
//    rootLayout.background = """
//    center / contain no-repeat url("https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Firefox_logo%2C_2019.svg/1024px-Firefox_logo%2C_2019.svg.png"),
//      #eeeeee 35% url("https://d78af7b0-82e5-4390-93c4-bba28463aa0f.mdnplay.dev/shared-assets/images/examples/lizard.png");
//    """
//    rootLayout.style.background = """
//  linear-gradient(45deg, rgba(255,0,0,0.5) 0%, rgba(255,0,0,0.0) 100%),
//      radial-gradient(circle at center, rgba(0,0,255,0.3) 0%, rgba(0,0,255,0.0) 70%),
//      #FFFF00
//"""
    
    body.append(rootLayout)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  func wrapper8(){
    let bg =  UIColor(hex: "#444444")
    let rootLayout = mason.createView()
    rootLayout.configure { style in
      rootLayout.backgroundColor = .white
      style.display = .Grid
      style.gap = .init(uniform: .Points(10 * scale))
      style.gridTemplateColumns = "[col] 100px [col] 100px [col] 100px [col] 100px"
      style.gridTemplateRows = "[row] auto [row] auto [row]"
    }
    
    let a = NSCMason.shared.createView()
    a.backgroundColor = bg
    a.gridColumn = "col / span 2"
    a.gridRow = "row"
    a.append(text: "A")
    
    let b = NSCMason.shared.createView()
    b.backgroundColor = bg
    b.gridColumn = "col 3 / span 2"
    b.gridRow = "row"
    b.append(text: "B")
    
    let c = NSCMason.shared.createView()
    c.backgroundColor = bg
    c.gridColumn = "col"
    c.gridRow = "row 2"
    c.append(text: "C")
    
    let d = NSCMason.shared.createView()
    d.backgroundColor = bg
    d.gridColumn = " col 2 / span 3 "
    d.gridRow = "row 2"
    d.append(text: "D")
    
    let e = NSCMason.shared.createView()
    e.backgroundColor = bg
    e.gridColumn = "col / span 4"
    e.gridRow = "row 3 "
    e.append(text: "E")
    
    
    rootLayout.append(elements: [a,b,c,d,e])
    body.append(rootLayout)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    mason.printTree(body.node)
  }
  
  func textAlignment() {
    let root = NSCMason.shared.createView()
    root.backgroundColor = .red
    let text = NSCMason.shared.createTextView(type:.P)
    text.fontSize = 18
    text.style.background = "blue"
    //text.style.setLineHeight(28, false)
    text.append(text: "Hello")
    
    root.append(text)
    
    let btn = UIButton()
    btn.setTitle("Hello", for: .normal)
//    
//    root.addView(btn)
    
    body.append(root)
    
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  func fontSize(){
    let root = NSCMason.shared.createView()
    root.style.fontSize = 30
    
    let outer1 = NSCMason.shared.createTextView(type: .Span)
    outer1.append(text: "Outer")
    
    let outer2 = NSCMason.shared.createTextView(type: .Span)
    outer2.append(text: "Outer")
    outer1.style.size = .init(.Points(0), .Auto)
    outer1.append(outer2)
    
    root.append(outer1)
    
    outer2.style.fontSize = 10
    
    body.append(root)
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    outer2.style.color = UIColor.red.toUInt32()
    outer2.style.fontStyle = .Italic
    outer1.style.fontWeight = "bold"
    
    let text = NSCMason.shared.createTextView(type: .P)
    text.fontSize = 16
    text.append(text: """
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque a tempor nisi. Sed et pellentesque metus, eu luctus tellus. Vivamus interdum pretium lorem, dignissim auctor elit sollicitudin non. Maecenas eget ex in erat sollicitudin elementum. Praesent vitae mattis nisi, sed posuere neque. Sed sit amet aliquet nulla, vel posuere lorem. Nunc quis odio vehicula, facilisis leo at, convallis elit.

Fusce pretium sagittis magna, pellentesque ullamcorper purus molestie a. Fusce sit amet interdum lacus. Morbi tincidunt nisi lectus, sit amet congue libero congue quis. Proin id faucibus dui, quis lacinia massa. Praesent felis ante, finibus vitae malesuada in, euismod vel arcu. Cras tellus lorem, congue at felis a, vulputate elementum augue. Aliquam eget eleifend justo. Vestibulum at rutrum lectus. Curabitur quis augue id lacus fringilla dictum. Mauris in mauris id lorem posuere tempus. Mauris ac ornare velit, in accumsan nibh. Pellentesque vel nibh porttitor, ultricies risus et, tempor ipsum. In eu ante nisi. Donec sed arcu tempus, tempor erat nec, consequat velit. Ut ac auctor purus.

Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Phasellus aliquet, neque a rutrum tristique, velit tellus condimentum arcu, in sodales urna dolor ut lorem. Pellentesque non lobortis sem. Aliquam a cursus ligula. Proin dapibus congue erat, sagittis viverra massa elementum sed. Vestibulum sit amet libero turpis. Vestibulum elit mauris, pharetra vel egestas quis, convallis sed tellus. Nullam sodales hendrerit diam. Fusce in viverra purus. Mauris commodo diam ac mauris molestie suscipit. Nunc massa tellus, sagittis ut consectetur in, maximus at ligula. Nam quis pharetra mi. Donec convallis ante mi, vel dapibus tellus cursus sed.

Integer vel risus quis nulla porta sollicitudin. Vivamus vel convallis ligula, quis finibus metus. Suspendisse sollicitudin sodales accumsan. Ut vel leo efficitur, porta leo at, porta magna. Vivamus laoreet consequat tempor. Suspendisse sodales massa vel iaculis tristique. Vivamus quis nunc fringilla, ultricies sapien in, lobortis purus. Donec sed consequat massa. Nulla placerat ex id urna fringilla, non iaculis ante finibus. Fusce at venenatis augue, a sagittis felis. Vivamus nulla quam, venenatis sit amet sagittis in, faucibus pretium quam. Nullam laoreet et purus et commodo.

Nullam tempor enim in tortor vestibulum, id dapibus lectus volutpat. Interdum et malesuada fames ac ante ipsum primis in faucibus. Duis volutpat, nulla faucibus consectetur porta, nulla ex sollicitudin ex, at imperdiet elit ante tristique ante. Sed finibus risus a risus imperdiet, et condimentum urna vulputate. Phasellus commodo vestibulum risus, vel iaculis elit vehicula id. Vestibulum id lorem sit amet nulla dapibus pulvinar ut at quam. Nullam non metus nisi. Quisque sed leo maximus quam accumsan egestas. Praesent aliquet diam sed iaculis lobortis. Quisque in felis non lacus lacinia lacinia in eget lorem. Aenean vel augue sit amet ligula varius dapibus. Maecenas nec iaculis purus. Maecenas ut libero quis est ornare porttitor eu in nunc. 
""")
    root.append(text)
    
    
    DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
      DispatchQueue.main.async {
        root.style.setLineHeight(50, false)
      }
    }
  }
  
  func padding() {
    let root = NSCMason.shared.createView()
    
    let h4 = NSCMason.shared.createTextView(type: MasonTextType.H4)
    h4.append(text: "This element has moderate padding.")
    
    h4.backgroundColorValue = UIColor.green.toUInt32()
    root.append(h4)
    h4.style.padding = MasonRect(
      MasonLengthPercentage.Points(20),
      MasonLengthPercentage.Points(20),
      MasonLengthPercentage.Points(50),
      MasonLengthPercentage.Points(50)
    )
    
    let h3 = NSCMason.shared.createTextView(type: MasonTextType.H3)
    h3.append(text: "The padding is huge in this element!")
    
    
    h3.backgroundColorValue = UIColor.cyan.toUInt32()
    root.append(h3)
    
    h3.style.padding = MasonRect(
      MasonLengthPercentage.Points(110),
      MasonLengthPercentage.Points(50),
      MasonLengthPercentage.Points(110),
      MasonLengthPercentage.Points(50)
    )
    body.append(root)
    
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  func gridTemplateColumns() {
    let root = NSCMason.shared.createView()
    //root.setBackgroundColor(Color.BLUE)
    root.append(text: "Osei")
    root.append(text: " Fortune")
    
    DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
      DispatchQueue.main.async {
        root.node.inBatch = true
        root.style.color = UIColor.red.toUInt32()
        root.style.fontSize = 20
        root.style.fontStyle = FontStyle.Italic
        root.style.fontWeight = "bold"
        root.node.inBatch = false
      }
    }
    
    
    body.append(root)
    
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  func flexDirection() {
    /*
     <h4>This is a Column-Reverse</h4>
     <div id="col-rev" class="content">
     <div class="box red">A</div>
     <div class="box lightblue">B</div>
     <div class="box yellow">C</div>
     </div>
     <h4>This is a Row-Reverse</h4>
     <div id="row-rev" class="content">
     <div class="box red">A</div>
     <div class="box lightblue">B</div>
     <div class="box yellow">C</div>
     </div>
     */
    let root = NSCMason.shared.createView()
    let h4 = NSCMason.shared.createTextView(type: MasonTextType(rawValue: 6)!)
    h4.mason_addChildAt(text: "This is a Column-Reverse", 1)
    
    root.append(h4)
    
    /*
     .content {
     width: 200px;
     height: 200px;
     border: 1px solid #c3c3c3;
     display: flex;
     }
     
     #col-rev {
     flex-direction: column-reverse;
     }
     */
    
    let colRev = NSCMason.shared.createView()
    colRev.style.flexDirection = FlexDirection.ColumnReverse
    
    colRev.style.size = MasonSize(
      MasonDimension.Points(200),
      MasonDimension.Points(200)
    )
    colRev.style.border =  "1px"
    
    colRev.style.display = Display.Flex
    
    let colA = NSCMason.shared.createView()
    colA.append(text: "A")
    colA.style.size = MasonSize(
      MasonDimension.Points(50),
      MasonDimension.Points(50)
    )
    colA.backgroundColor = .red
    
    let colB = NSCMason.shared.createView()
    colB.append(text:"B")
    colB.style.size = MasonSize(
      MasonDimension.Points(50),
      MasonDimension.Points(50)
    )
    colB.backgroundColor = UIColor(red: 173 / 255, green: 216 / 255, blue: 230 / 255, alpha: 1.00)
    
    let colC = NSCMason.shared.createView()
    colC.append(text:"C")
    colC.style.size = MasonSize(
      MasonDimension.Points(50),
      MasonDimension.Points(50)
    )
    colC.backgroundColor = .yellow
    
    
    colRev.append(elements: [colA, colB, colC])
    
    root.append(colRev)
    
    
    let h4_2 = NSCMason.shared.createTextView(type: .H4)
    h4_2.append(text: "This is a Row-Reverse")
    
    root.append(h4_2)
    
    
    let rowRev = NSCMason.shared.createView()
    rowRev.style.flexDirection = FlexDirection.RowReverse
    
    rowRev.style.size = MasonSize(
      MasonDimension.Points(200),
      MasonDimension.Points(200)
    )
    
    rowRev.style.border = "1px"
    
    rowRev.style.display = Display.Flex
    
    let rowA = NSCMason.shared.createView()
    rowA.append(text:"A")
    rowA.style.size = MasonSize(
      MasonDimension.Points(50),
      MasonDimension.Points(50)
    )
    rowA.backgroundColor = .red
    
    let rowB = NSCMason.shared.createView()
    rowB.append(text:"B")
    rowB.style.size = MasonSize(
      MasonDimension.Points(50),
      MasonDimension.Points(50)
    )
    rowB.backgroundColor = UIColor(red: 173 / 255, green: 216 / 255, blue: 230 / 255, alpha: 1.00)
    
    let rowC = NSCMason.shared.createView()
    rowC.append(text:"C")
    rowC.style.size = MasonSize(
      MasonDimension.Points(50),
      MasonDimension.Points(50)
    )
    rowC.backgroundColor = .yellow
    
    rowRev.append(elements: [rowA, rowB, rowC])
    
    root.append(rowRev)
    
    body.append(root)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
  }
  
  func testTextAppend() {
    let root = NSCMason.shared.createView()
    //  root.backgroundColor = .green
    
    let txt = NSCMason.shared.createTextView()
    txt.append(text: "A")
    
    let txt2 = NSCMason.shared.createTextView()
    txt2.append(text: "B")
    
    let txt3 = NSCMason.shared.createTextView()
    txt3.append(text: "C")
    txt3.style.display = .Block
    
    
    root.addView(txt, at: 0)
    root.addView(txt2, at: 1)
    root.addView(txt3, at: 2)
    
    
    body.append(root)
    
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    
    DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
      DispatchQueue.main.async {
        let view = NSCMason.shared.createView()
        view.replaceChildAt(text: "Hello", 0)
        
        let txt = NSCMason.shared.createTextView()
        txt.append(text: " 1 ")
        
        view.addView(txt, at: 1)
        
        let img = NSCMason.shared.createImageView()
        img.style.size = MasonSize(
          uniform: MasonDimension.Points(100)
        )
        img.src = "https://picsum.photos/600/600"
        
        view.addView(img, at: 2)
        
        let txt2 = NSCMason.shared.createTextView()
        txt2.append(text: " 2 ")
        
        view.addView(txt2, at: 3)
        
        view.replaceChildAt(text: "???", 4)
        
        
        root.addView(view, at: 3)
        
      }
    }
  }
  
  func testTextNodeReplaceWithImage() {
    let root = NSCMason.shared.createView()
    root.append(text: "A")
    root.append(text: "C")
    root.append(text: "C")
    
    body.append(root)
    
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
      DispatchQueue.main.async {
        let checkmark = NSCMason.shared.createImageView()
        checkmark.style.size = MasonSize(
          MasonDimension.Points(100), MasonDimension.Points(100)
        )
        checkmark.image = UIImage.checkmark
        
        root.replaceChildAt(element: checkmark, 1)
      }
    }
    
    
    
  }
  
  func testTextNodeInsertingInline() {
    let root = NSCMason.shared.createView()
    let a = NSCMason.shared.createTextView()
    a.append(text: "A")
    let b = NSCMason.shared.createTextView()
    b.append(text: "B")
    
    let c = NSCMason.shared.createTextView()
    c.append(text: "C")
    
    let other = NSCMason.shared.createView()
    other.backgroundColor  = .blue
    
    let d = NSCMason.shared.createTextView()
    d.append(text: "D")
    
    other.append(d)
    //other.addChildAt(d, 0)
    
    
    let img = NSCMason.shared.createImageView()
    // img.style.size = Size(Dimension.Points(100f), Dimension.Points(100f))
    
    print("image \(img.style.display)")
    
    other.append(img)
    
    let e = NSCMason.shared.createTextView()
    e.append(text: "E")
    
    
    let f = NSCMason.shared.createTextView()
    f.append(text: "F")
    
    
    
    other.append(e)
    other.append(f)
    
    root.append(a)
    root.append(b)
    root.append(c)
    
    root.append(other)
    
    
    DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
      DispatchQueue.main.async {
        img.src = "https://picsum.photos/600/600"
      }
    }
    
    body.append(root)
    
  }
  
  func testInlineStyleChange() {
    let txt = NSCMason.shared.createTextView()
    //txt.backgroundColorValue = UIColor.green.toUInt32()
    txt.color = UIColor.red.toUInt32()
    txt.append(text: "First")
    
    let txt2 = NSCMason.shared.createTextView()
    txt2.backgroundColorValue = UIColor.yellow.toUInt32()
    txt2.append(text: " Second")
    
    txt.append(txt2)
    
    let txt3 = NSCMason.shared.createTextView()
    txt3.append(text: " Third")
    
    txt.append(txt3)
    
    //    let checkmark = NSCMason.shared.createImageView()
    //    checkmark.image = UIImage.checkmark
    //
    //    txt.append(checkmark)
    
    
    
    body.mason_append(elements: [txt])
    body.mason_computeWithMaxContent()
    
    
    DispatchQueue.global().asyncAfter(deadline: .now() + 1) {
      DispatchQueue.main.async {
        //txt.fontSize = 24
        // txt2.fontSize = 40
        txt2.fontWeight = "semibold"
        txt3.decorationLine = .Underline
        txt3.color = UIColor.purple.toUInt32()
        txt.replaceChildAt(text: "??????", 1)
      }
    }
    
    
    
    //  body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
  }
  
  func testInsert(){
    let root = NSCMason.shared.createView()
    root.backgroundColor = .green
    root.style.marginLeft = .Points(50)
    root.style.marginTop = .Points(140)
    
    let view = NSCMason.shared.createTextView()
    view.append(text: "First")
    
    
    let second = NSCMason.shared.createTextView()
    second.append(text: "Second")
    
    view.append(second)
    
    let checkmark = NSCMason.shared.createImageView()
    checkmark.style.size = MasonSize(
      .Points(100), .Points(100)
    )
    checkmark.image = UIImage.checkmark
    
    view.append(checkmark)
    
    
    let div = NSCMason.shared.createView()
    div.backgroundColor = .red
    div.style.size = MasonSize(
      .Points(100), .Points(100)
    )
    
    view.append(div)
    
    
    let remove = NSCMason.shared.createImageView()
    remove.style.size = MasonSize(
      .Points(100), .Points(100)
    )
    remove.image = UIImage.remove
    
    
    view.addChildAt(element: remove, 1)
    
    
    root.append(view)
    body.append(root)
    
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  func testTextInsert() {
    let root = NSCMason.shared.createView()
    root.backgroundColor = .green
    root.style.marginLeft = .Points(50)
    root.style.marginTop = .Points(140)
    
    let view = NSCMason.shared.createView()
    view.append(text: "1")
    view.append(text: "3")
    view.addChildAt(text: "2", 1)
    view.append(text: "4")
    
    let img = NSCMason.shared.createImageView()
    
    img.style.size = MasonSize(
      .Points(100), .Points(100)
    )
    
    img.image = UIImage.checkmark
    
    view.addChildAt(element: img, 3)
    
    view.append(text: "5")
    
    mason.printTree(view.node)
    
    
    root.append(view)
    body.append(root)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  
  
  
  func inlineTest(){
    let root = NSCMason.shared.createView()
    root.style.marginTop = .Points(100)
    root.backgroundColor = .gray
    let txt = NSCMason.shared.createTextView()
    txt.textContent = "First"
    txt.tag =  1
    
    
    let second = NSCMason.shared.createTextView()
    second.backgroundColorValue = UIColor.yellow.toUInt32()
    second.color = UIColor.blue.toUInt32()
    second.textContent = "Second"
    txt.tag =  2
    
    
    let img = NSCMason.shared.createImageView()
    img.backgroundColor = UIColor.blue
    
    img.style.size = MasonSize(
      .Points(100), .Points(100)
    )
    img.image = UIImage.checkmark
    
    txt.append(second)
    
//txt.append(img)
    
    let view = mason.createView()
    view.style.size = .init(.Points(200), .Points(200))
    view.style.backgroundColor = UIColor.systemPink.toUInt32()
    
    txt.append(view)
    
    root.append(elements: [txt])
    
    body.append(root)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
  }
  
  func textWithImage() {
    let txt = NSCMason.shared.createTextView()
    txt.backgroundColorValue = UIColor.green.toUInt32()
    txt.color = UIColor.red.toUInt32()
    txt.append(text: "Inline Image ")
    txt.tag = 1
    
    
    let img = NSCMason.shared.createImageView()
    img.backgroundColor = UIColor.blue
    
    img.style.size = MasonSize(
      .Points(150), .Points(150)
    )
    img.image = UIImage.checkmark
    
    
    let txt2 = NSCMason.shared.createTextView()
    txt2.backgroundColorValue = UIColor.yellow.toUInt32()
    txt2.color = UIColor.blue.toUInt32()
    txt2.append(text: "Hello ???")
    
    txt2.tag = 2
    
    txt.append(txt2)
    
    let txt3 = NSCMason.shared.createTextView()
    
    txt3.backgroundColorValue = UIColor.gray.toUInt32()
    txt3.color = UIColor.green.toUInt32()
    txt3.append(text: " ashbnjmkasijdaskmd")
    
    txt3.tag = 3
    
    txt.append(txt3)
    
    
    body.append(elements: [txt, img])
    body.mason_computeWithMaxContent()
    
    //  body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
  }
  
  func scrollTest(){
    let root = mason.createScrollView()
    root.configure { style in
      style.margin = .init(.Points(0), .Points(0), .Points(200), .Points(0))
      style.size = MasonSize(.Percent(1), .Percent(1))
      style.overflow = MasonPoint(Overflow.Scroll, Overflow.Scroll)
    }
    body.addView(root)
    
    
    let txt = mason.createTextView()
    
    txt.textContent = """
Lorem ipsum dolor sit amet, consectetur adipiscing elit. Maecenas lobortis volutpat interdum. Interdum et malesuada fames ac ante ipsum primis in faucibus. Donec nec velit lacinia, vehicula urna vitae, posuere urna. Sed fermentum commodo leo id ultricies. Nam pulvinar volutpat faucibus. Aenean fermentum tristique pretium. Nulla nec nisl et lorem imperdiet ultricies. Suspendisse potenti. Nam a arcu vel orci rhoncus feugiat eu sit amet nibh. Cras eleifend tincidunt lorem sit amet rutrum. Integer vulputate tortor at velit facilisis blandit. Nulla bibendum lacus ac leo consequat, quis dapibus ante euismod. Nullam eu risus libero.

Suspendisse lectus risus, tincidunt sed dictum eu, blandit ac risus. Cras pharetra odio rhoncus risus mollis aliquet. Nam sit amet vestibulum quam. Ut ligula leo, hendrerit ut finibus nec, mattis non nulla. Donec in quam ipsum. Ut sed imperdiet lorem. Cras aliquet quam eu finibus aliquet. Sed in posuere metus.

Vivamus at feugiat purus. Pellentesque sed ligula blandit, luctus risus vitae, fringilla dolor. Fusce id libero quis nisl vestibulum porttitor at a ex. Aenean vel viverra magna, eu ultrices orci. Cras molestie quam ut lacus feugiat vehicula. Nulla facilisi. Nunc ac diam vel quam condimentum facilisis sit amet maximus lorem. Vivamus mollis in risus eu mattis. Curabitur molestie mauris nibh, a ornare magna porta id. Vestibulum nec metus malesuada, commodo magna eget, luctus nunc. Donec dui enim, lobortis id congue ac, facilisis at nulla. Suspendisse scelerisque lectus eu sem interdum imperdiet.

Duis pellentesque purus vel sapien dapibus, nec mollis ex semper. Quisque ut est vel erat mattis ultrices. Nullam dapibus, felis nec ullamcorper mattis, diam metus placerat turpis, ut vehicula dui sem a lorem. Proin congue vestibulum lectus sit amet blandit. Nunc non ornare turpis. Vestibulum et odio maximus ipsum pellentesque commodo. Suspendisse euismod, turpis non dignissim sodales, est augue rutrum ipsum, nec ornare tortor mi vel nisl. Curabitur et neque et diam placerat porttitor id tempus enim. Vestibulum at imperdiet nulla. Praesent venenatis tellus ligula, quis rhoncus nunc imperdiet a. Sed bibendum sapien et fringilla rutrum. Nullam orci nulla, finibus non turpis nec, imperdiet tincidunt sem. Nunc non porta sem. Nulla semper bibendum nunc in fermentum.

Suspendisse tincidunt urna nisl, at suscipit mauris rhoncus a. Maecenas sollicitudin consectetur tellus. Praesent dictum urna ut varius efficitur. Donec eget lacus sed mauris molestie tristique sed ut eros. Pellentesque condimentum urna a urna iaculis, convallis posuere nulla viverra. Cras vel mollis arcu. Vestibulum mattis justo ac metus faucibus vulputate. Pellentesque viverra pulvinar cursus. Ut faucibus ut tortor eget pulvinar.

Phasellus nec mauris nec ex elementum luctus a eu purus. Proin in justo ligula. Phasellus et pharetra velit, et condimentum felis. Mauris interdum lacinia metus at laoreet. Maecenas varius erat turpis, auctor varius ipsum tristique in. Suspendisse potenti. Donec fermentum tincidunt mauris, facilisis efficitur orci aliquet quis. Curabitur gravida neque et lobortis accumsan. Maecenas ut vehicula justo.

Suspendisse vehicula, leo eu sollicitudin porttitor, nunc mi suscipit eros, vel iaculis massa est at magna. Suspendisse mollis tincidunt odio eu venenatis. Pellentesque cursus, dolor sit amet porta interdum, augue diam ultrices nunc, ut viverra sapien mauris eu lorem. Pellentesque bibendum nisi eu turpis vulputate vehicula. Suspendisse ultrices, nisl eu pellentesque tristique, orci arcu ultricies tellus, ac malesuada libero lorem et risus. Donec quis egestas dolor. Nunc velit nunc, sagittis vitae sollicitudin at, molestie et justo. In efficitur, mauris id eleifend dapibus, nisl mauris pretium velit, in accumsan nisl ante tincidunt quam. Donec sagittis cursus quam, sit amet pellentesque nunc tincidunt a.

Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Vivamus ut lacus id massa porta ornare tristique vitae purus. Vestibulum vestibulum justo vel leo dictum vulputate. In vitae elit purus. Praesent iaculis erat nibh. Quisque in fringilla metus. Suspendisse eu tempus augue. Ut tempus, ex in porta lobortis, risus tellus laoreet sapien, sodales venenatis ante ligula sed mauris. In fermentum porta purus et lacinia. Vivamus vel libero leo. Morbi efficitur libero id sodales vulputate. Proin tempus, ligula vitae consequat molestie, ante augue mattis quam, eget facilisis eros leo vel lorem. Nunc volutpat enim non purus condimentum, sit amet sodales turpis varius.

Aenean tincidunt accumsan varius. Sed posuere diam at enim aliquet, nec facilisis metus dapibus. Fusce eu blandit odio. Phasellus convallis urna id efficitur ornare. Praesent luctus lorem et eros interdum, vel rutrum orci viverra. Duis ultrices scelerisque blandit. Nam porta nisl ipsum. Curabitur placerat purus ac tortor hendrerit, at dignissim enim tempor. In laoreet lacinia mauris, vitae bibendum ipsum commodo vitae. Cras quis felis neque. Donec pretium pellentesque lacinia. Donec diam risus, semper eget justo mattis, posuere blandit lectus. Curabitur et nunc sit amet erat semper auctor ut eget leo. Ut tempus nisl pharetra venenatis tempus.

Donec iaculis sed mi vitae consectetur. Phasellus tincidunt est velit, feugiat suscipit felis porta sed. Vestibulum maximus leo ut dolor tristique, nec commodo nunc luctus. Proin nec ex metus. Curabitur congue, erat quis bibendum laoreet, sem leo blandit lorem, quis venenatis mi felis sed tellus. Suspendisse eu tempor enim. Ut posuere orci libero, et vulputate justo hendrerit consectetur.

Proin in nibh non dui venenatis cursus. Proin quis hendrerit augue. Donec mollis sem nulla, et accumsan ligula facilisis sit amet. Nunc vitae elit malesuada, mollis arcu quis, porttitor mi. Integer eget ultricies ex, nec convallis nisi. Curabitur mattis tincidunt diam in tristique. Praesent viverra euismod convallis. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Morbi ut tincidunt mi. Pellentesque pulvinar eros vitae metus dapibus sodales.

Fusce tempus volutpat erat, sed tincidunt metus bibendum a. Pellentesque ut neque ut metus vehicula malesuada a sit amet lectus. Sed ac ultricies lorem. Proin ultricies, libero ut facilisis luctus, urna mi dictum mi, a vulputate risus felis eget lacus. Duis vestibulum ante eget lorem condimentum fermentum. Suspendisse potenti. Quisque iaculis fermentum ullamcorper. Nulla sagittis eros non libero mollis finibus. Duis quis leo vel ante finibus rhoncus. Cras porta facilisis magna sed molestie. Fusce quis libero quis eros mattis semper in vitae magna. Donec pellentesque, sapien quis tincidunt semper, mauris quam viverra ante, quis ultricies dui mi ultrices lacus. Vestibulum volutpat tempus sapien sed accumsan.

Nulla velit dui, hendrerit vitae nisl a, pulvinar semper purus. Phasellus ac interdum urna, ut dictum mauris. Mauris vulputate quam sit amet sollicitudin mollis. Morbi lobortis malesuada orci nec porttitor. Proin facilisis, leo non ultrices iaculis, dolor libero porta nunc, vitae consequat nibh lorem a nunc. In hac habitasse platea dictumst. Aliquam venenatis augue ut ultrices pulvinar. Ut dictum nunc mauris, sit amet lacinia elit molestie vel. Duis luctus magna vel odio vulputate, eu fringilla nisl feugiat. Sed laoreet lacinia nunc eu vulputate. Nulla pellentesque accumsan nunc. Nullam aliquet libero id dolor accumsan cursus.

In et augue sem. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Pellentesque ullamcorper consequat diam, et viverra ante lobortis sed. Proin arcu leo, interdum sed pellentesque id, viverra quis nunc. Sed scelerisque dictum metus. Ut luctus risus ut risus pharetra, ac fringilla justo consectetur. Maecenas porta accumsan dolor. In et ex eu purus bibendum vestibulum. Aliquam erat volutpat. Suspendisse sagittis quam sed lectus sagittis, in semper lorem facilisis. Nullam eu nisl elit. Phasellus nibh magna, tincidunt sed faucibus rhoncus, consequat ut enim. Aenean venenatis ligula ut neque rutrum, nec facilisis urna vestibulum. Duis quis iaculis sapien, eget mattis diam. Nunc ornare est quam, lacinia mollis urna faucibus nec. Sed et vulputate turpis.

Proin quis gravida est. In malesuada mollis porttitor. Morbi ipsum lacus, interdum non ultricies auctor, consequat eget tortor. Aliquam ante dolor, sollicitudin a ex eget, molestie semper arcu. Morbi dolor nisl, volutpat in rutrum at, cursus et purus. Nam sollicitudin odio ut justo fringilla mattis. Sed suscipit ligula massa. Nunc eu felis in dui facilisis pretium. Donec bibendum odio diam, at cursus velit ornare sed.

Duis neque libero, scelerisque in gravida sed, laoreet sit amet erat. Praesent varius felis nec mauris rutrum malesuada. Etiam cursus leo non mauris bibendum pellentesque. Donec sodales luctus metus finibus tristique. Proin congue, turpis accumsan molestie ullamcorper, odio justo consectetur nisi, in euismod ante tellus at lectus. Nullam nec consectetur metus. Curabitur a ligula nec enim accumsan finibus sit amet nec neque. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Praesent sollicitudin tincidunt libero nec facilisis. Class aptent taciti sociosqu ad litora torquent per conubia nostra, per inceptos himenaeos. Quisque malesuada ullamcorper varius. In nec mi rhoncus, tempus felis et, porttitor turpis. Aenean imperdiet sit amet nunc quis blandit.

Cras auctor imperdiet vulputate. Morbi viverra magna eu nunc mattis, sed tempus metus elementum. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Fusce hendrerit eros risus, eget semper metus efficitur quis. Nam sit amet quam at lacus cursus commodo eu blandit ex. Vivamus hendrerit blandit massa ac sollicitudin. Morbi eu urna pharetra, lacinia libero eu, blandit leo. Sed non sollicitudin tortor, at cursus massa. Pellentesque libero risus, condimentum ut ultrices at, malesuada ac sem. Suspendisse ut urna metus. Quisque lobortis dapibus rutrum.

Mauris id elit velit. Aliquam eget tincidunt tortor. Ut nec elit metus. Nunc neque massa, consectetur ut tempus nec, molestie id odio. Nullam sagittis felis nec augue rutrum fringilla. In nibh libero, rhoncus ac tellus eget, rutrum placerat risus. Praesent ornare, erat id tempor faucibus, purus leo ornare leo, vitae fringilla dui ipsum a odio. Aenean auctor tincidunt suscipit. Ut ac velit posuere, finibus urna in, mollis est. Sed sit amet commodo diam. Suspendisse eget felis eget diam interdum accumsan. Etiam enim est, vulputate eu gravida nec, interdum porta diam.

Proin rhoncus porttitor lorem, vitae hendrerit ligula imperdiet sed. Maecenas sodales, enim ac suscipit vehicula, tortor diam egestas sem, in molestie libero ipsum tristique nulla. Vivamus accumsan ligula id sapien luctus blandit sed et lorem. Vivamus ut malesuada lorem. Praesent magna magna, tempor vulputate mauris at, mollis elementum mauris. Integer laoreet, orci eget pretium mollis, nisi quam congue purus, id condimentum ipsum sem in arcu. Quisque mattis convallis lorem ut sollicitudin. Donec pulvinar leo vitae sapien cursus suscipit. Pellentesque cursus varius metus non fermentum. Sed rutrum hendrerit turpis, sit amet ultrices turpis dictum eget.

Duis ornare ut nulla ac dignissim. Morbi ac orci a ante lacinia ultricies. Donec nec eleifend eros. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Praesent eget turpis erat. Aliquam faucibus ullamcorper risus cursus feugiat. Etiam ac feugiat mauris, sit amet ornare ipsum. Ut a malesuada lectus, non consequat quam. Vestibulum quis molestie augue. Sed id dolor ac dui vehicula tempus. Nam sed pellentesque ipsum. 
"""
    
    
    
    let txt2 = mason.createTextView()
    txt2.backgroundColor = .red
    txt2.textWrap = .NoWrap
    txt2.textContent = "Duis ornare ut nulla ac dignissim. Morbi ac orci a ante lacinia ultricies. Donec nec eleifend eros. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Praesent eget turpis erat. Aliquam faucibus ullamcorper risus cursus feugiat. Etiam ac feugiat mauris, sit amet ornare ipsum. Ut a malesuada lectus, non consequat quam. Vestibulum quis molestie augue. Sed id dolor ac dui vehicula tempus. Nam sed pellentesque ipsum."
    
    
    //root.addView(txt2)
    
    root.addView(txt)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
  }
  
  var animator: UIViewPropertyAnimator?
  
  
  var animateBlock: ((CGFloat) -> Void)?
  
  var displayLink: CADisplayLink?
  
  @objc func updateProgress() {
    guard let animator = animator else { return }
    animateBlock?(animator.fractionComplete)
    animator.fractionComplete += 0.001
    if animator.state == .stopped || animator.state == .inactive || animator.fractionComplete >= 1 {
      displayLink?.invalidate()
    }
  }
  
  
  func imageTest(){
    let root = mason.createView()
    
    body.addView(root)
    
    let txt = mason.createTextView()
    txt.whiteSpace = .NoWrap
    txt.textWrap = .NoWrap
    
    txt.textContent = "Hello "
    
    let img = mason.createImageView()
    img.style.size = MasonSize(.Points(300), .Points(300))
    img.style.marginBottom = .Points(10)
    img.src = "https://picsum.photos/600/600"
    
    root.append(img)
    
    
    let view = mason.createView()
    view.style.size = MasonSize(.Points(400), .Points(400))
    view.backgroundColor = .purple
    
    // root.addView(view)
    
    let txtView = mason.createTextView()
    
    txtView.textContent = "Hello World"
    
    view.addView(txtView)
    
    txt.addView(view)
    
    //root.addView(txt)
    
    
    let txting = mason.createTextView()
    txting.whiteSpace = .NoWrap
    txting.textWrap = .NoWrap
    
    txting.textContent = " inlining this thing "
    
    txt.addView(txting)
    
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    let timing = UISpringTimingParameters(
      dampingRatio: 0.4,
      initialVelocity: CGVector(dx: 0, dy: 5)
    )
    
    let animator = UIViewPropertyAnimator(
      duration: 3,
      timingParameters: timing
    )
    
    
    let originalSize = img.style.sizeCompat
    animateBlock = { fractionComplete in
      img.configure { style in
        style.size = MasonSize(.Points(Float(originalSize.width.value * Float(fractionComplete))), .Points(Float(originalSize.height.value * Float(fractionComplete))))
      }
      
      
      self.body.requestLayout()
    }
    
    self.animator = animator
    
    // animator.startAnimation()
    
    displayLink = CADisplayLink(target: self, selector: #selector(updateProgress))
    displayLink?.add(to: .main, forMode: .default)
    
    
    //
    //    UIView.animate(withDuration: 3, delay: 1, usingSpringWithDamping: 0.4, initialSpringVelocity: 5){
    //      print("animate", Date.now)
    //      img.configure { style in
    //        style.size = MasonSize(.Percent(0.3), .Percent(0.3))
    //      }
    //
    //      self.body.requestLayout()
    //    }
    
    
    
    
    //    UIView.animate(withDuration: 3, delay: 1, usingSpringWithDamping: 0.4, initialSpringVelocity: 5){
    //      img.configure { style in
    //        style.size = MasonSize(.Points(200), .Points(200))
    //      }
    //    }
  }
  
  func headers(){
    
    let root = mason.createView()
    
    body.addView(root)
    
    let h1 = mason.createTextView(type: .H1)
    h1.textContent = "This is heading 1"
    
    let h2 = mason.createTextView(type: .H2)
    h2.append(text: "This is heading 2")
    
    let h3 = mason.createTextView(type: .H3)
    h3.textContent = "This is heading 3"
    
    let h4 = mason.createTextView(type: .H4)
    h4.textContent = "This is heading 4"
    
    let h5 = mason.createTextView(type: .H5)
    h5.textContent = "This is heading 5"
    
    let h6 = mason.createTextView(type: .H6)
    h6.textContent = "This is heading 6"
    
    let p = mason.createTextView(type: .P)
    
    p.textContent = "Tip:"
    
    let span = mason.createTextView(type: .Span)
    span.fontSize = 24
    
    span.textContent = " Use h1 to h6 elements only for headings. Do not use them just to make text bold or big. Use other tags for that."
    
    p.addView(span)
    
    root.addView(h1)
    root.addView(h2)
    root.addView(h3)
    root.addView(h4)
    root.addView(h5)
    root.addView(h6)
    root.addView(p)
    
    
    
    let blockQ = mason.createTextView(type: .P)
    
    
    blockQ.textContent = "For 50 years, WWF has been protecting the future of nature. The world's leading conservation organization, WWF works in 100 countries and is supported by 1.2 million members in the United States and close to 5 million globally."
    
    blockQ.configure { style in
      style.overflowX = .Hidden
      style.overflowY = .Hidden
      blockQ.whiteSpace = .NoWrap
      blockQ.textWrap = .NoWrap
      blockQ.textOverflow  = .Custom(" (╯°□°)╯︵ ┻━┻")
    }
    
    blockQ.textWrap = .NoWrap
    
    root.addView(blockQ)
    
    
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
  }
  
  func testLateUpdate(){
    let root = mason.createView()
    
    root.configure { style in
      style.marginTop = .Points(200)
      style.marginLeft = .Points(10)
    }
    
    root.backgroundColor = .red
    
    body.addView(root)
    
    let text = mason.createTextView()
    
    root.addView(text)
    // text.textWrap = .Wrap
    // text.setBackgroundColor(ui: .cyan)
    
    let text2 = mason.createTextView()
    text2.whiteSpace = .PreLine
    
    text.addView(text2)
    
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    text.append(text: "Hello World \n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nisi est, iaculis non tellus in, molestie finibus tellus. Integer pulvinar eget massa vel porta. Mauris porttitor felis id dictum egestas. Donec eget venenatis massa, auctor porta elit. Quisque augue urna, eleifend id augue nec, eleifend venenatis felis. Etiam eget magna ac magna feugiat ultricies a eu massa. Maecenas iaculis pellentesque neque, sit amet faucibus magna malesuada et. Morbi sit amet rhoncus nunc. In ultricies urna ac pulvinar consequat. Vivamus feugiat sed elit quis efficitur. Etiam erat magna, sodales consectetur velit eu, fermentum condimentum ex. Nulla rhoncus ligula ac ipsum hendrerit, non tristique tortor pharetra. Pellentesque eu urna turpis. Aliquam sed enim mauris.")
    
    /*
     DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
     DispatchQueue.main.async {
     text.updateText("Hello World")
     
     DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
     DispatchQueue.main.async {
     text2.setBackgroundColor(ui: .green)
     text2.setColor(ui: .blue)
     text2.updateText("\n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nisi est, iaculis non tellus in, molestie finibus tellus. Integer pulvinar eget massa vel porta. Mauris porttitor felis id dictum egestas. Donec eget venenatis massa, auctor porta elit. Quisque augue urna, eleifend id augue nec, eleifend venenatis felis. Etiam eget magna ac magna feugiat ultricies a eu massa. Maecenas iaculis pellentesque neque, sit amet faucibus magna malesuada et. Morbi sit amet rhoncus nunc. In ultricies urna ac pulvinar consequat. Vivamus feugiat sed elit quis efficitur. Etiam erat magna, sodales consectetur velit eu, fermentum condimentum ex. Nulla rhoncus ligula ac ipsum hendrerit, non tristique tortor pharetra. Pellentesque eu urna turpis. Aliquam sed enim mauris.")
     
     
     
     
     //            DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
     //              DispatchQueue.main.async {
     //                text.removeView(text2)
     //                root.node.computeWithMaxContent()
     //              }
     //            }
     
     }
     }
     }
     }
     */
    
    
  }
  
  func textDemo(){
    let div = mason.createView()
    
    div.configure { style in
      style.marginTop = .Points(300)
      style.marginLeft = .Points(100)
    }
    
    div.backgroundColor = .white
    let p1 = mason.createTextView()
    p1.textContent = "Test nativescript-masonkit"
    p1.color = UIColor.red.toUInt32()
    
    let sspan1 = mason.createTextView()
    sspan1.textContent = " inline text"
    sspan1.color = UIColor.blue.toUInt32()
    
    p1.addView(sspan1)
    div.addView(p1)
    
    
    let p2 = mason.createTextView(type: .P)
    //p2.backgroundColor = UIColor.systemPink
    p2.append(text: "Paragraph with image ")
    
    
    let img1 = mason.createImageView()
    
    img1.configure { style in
      style.size = MasonSize(.Points(100 * scale), .Points(100 * scale))
    }
    
    img1.src = "https://picsum.photos/200/300"
    
    p2.addView(img1)
    
    
    let img2 = mason.createImageView()
    
    img2.configure { style in
      style.size = MasonSize(.Points(300 * scale), .Points(300 * scale))
    }
    
    img2.src = "https://picsum.photos/200/300"
    
    div.addView(p2)
    div.addView(img2)
    
    body.addView(div)
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    //
    //    <div backgroundColor="red">
    //        <p style="color: red;">Test nativescript-masonkit
    //          <sspan style="color: blue;"> inline text</sspan>
    //        </p>
    //        <p style="color: black;background-color: pink;">Paragraph with image <img width="100" height="100" src="https://picsum.photos/200/300" /></p>
    //        <img width="300" height="300" src="https://picsum.photos/200/300" />
    //      </div>
  }
  
  func imageExample(){
    print("=== imageExample() STARTING ===")
    let root = mason.createView()
    root.configure { style in
      style.marginTop = .Points(300)
      // style.marginLeft = .Points(100)
    }
    body.addView(root)
    
    let txt = mason.createTextView()
    txt.backgroundColor = .orange
    
    txt.textContent = "Hello"
    print("=== Setting text: Hello ===")
    
    let image = mason.createImageView()
    
    image.style.sizeCompatWidth = MasonDimensionCompat(percent: 1)
    
    image.src = "https://picsum.photos/600/600"
    
    let view = body.mason.createView()
    view.backgroundColor = .red
    view.style.size = MasonSize(uniform: .Points(300))
    
    print("=== Adding inline red view (100x100) ===")
    txt.append(view)
    
    
    let txt2 = mason.createTextView()
    
    txt2.textContent = "Is it working ?"
    
    
    let txt3 = mason.createTextView()
    txt3.backgroundColor = .purple
    
    txt3.textContent = "HMM"
    print("=== Setting text: Hello ===")
    
    root.addView(txt)
    
    root.addView(txt2)
    
    root.addView(image)
    
    txt2.addView(txt3)
    
    root.backgroundColor = .yellow
    
    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    //    DispatchQueue.global().async { [self] in
    //      do {
    //        let data = try Data(contentsOf: URL(string: "https://picsum.photos/600/600")!)
    //
    //        let side = CGFloat(300 / scale)
    //
    //        let img = resizeImage(UIImage(data: data)!, CGSize(width: side, height: side))
    //
    //        DispatchQueue.main.async {
    //          image.image = img
    //          image.style.size = MasonSize(uniform: .Points(Float(side)))
    //          self.body.computeWithMaxContent()
    //        }
    //      }catch{
    //        print(error)
    //      }
    //    }
    
    
    
    
  }
  
  func createParentWith2Kids(_ kidAText: String, _ kidBText: String) -> MasonUIView {
    let parent = mason.createView()
    
    
    let kida = mason.createTextView()
    
    kida.textContent = kidAText
    
    let kidb = mason.createTextView()
    
    kidb.textContent = kidBText
    
    parent.addView(kida)
    
    parent.addView(kidb)
    
    return parent
  }
  
  func wrapper5(){
    let wrapper5 = mason.createView()
    wrapper5.configure { style in
      style.display = .Grid
      style.margin = MasonRect(uniform: .Points(40 * scale))
      style.gap = MasonSize(uniform: .Points(10 * scale))
      style.gridTemplateColumns = "100 100 100"
    }
    body.addView(wrapper5)
    
    
    let a = mason.createView()
    
    let box_bg = UIColor(hex: "#444")
    a.backgroundColor = box_bg
    let a_text = mason.createTextView()
    a_text.textContent = "A"
    a_text.setColor(ui: .white)
    a.addView(a_text)
    a.configure { style in
      style.padding = MasonRect(uniform: .Points(20  * scale))
      style.gridColumn = "1/3"
      style.gridRow =  "1"
    }
    
    let b = mason.createView()
    b.backgroundColor = box_bg
    let b_text = mason.createTextView()
    b_text.textContent = "B"
    b_text.setColor(ui: .white)
    b.addView(b_text)
    
    
    b.configure { style in
      style.padding = MasonRect(uniform: .Points(20  * scale))
      style.gridColumn = "3"
      style.gridRow = "1/3"
    }
    
    let c = mason.createView()
    c.backgroundColor = box_bg
    let c_text = mason.createTextView()
    c_text.textContent = "C"
    c_text.setColor(ui: .white)
    c.addView(c_text)
    c.configure { style in
      style.padding = MasonRect(uniform: .Points(20  * scale))
      style.gridColumn = "1"
      style.gridRow = "2"
    }
    
    
    let d = mason.createView()
    d.backgroundColor = box_bg
    let d_text = mason.createTextView()
    d_text.textContent = "D"
    d_text.setColor(ui: .white)
    d.addView(d_text)
    
    d.configure { style in
      style.padding = MasonRect(uniform: .Points(20 * scale))
      style.gridColumn = "2"
      style.gridRow = "2"
    }
    
    wrapper5.addView(a)
    wrapper5.addView(b)
    wrapper5.addView(c)
    wrapper5.addView(d)
    
    //    body.node.computeWithMaxContent()
    
    wrapper5.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
  }
  func wrapper6() {
    
    /*
     display: grid;
     background: no-repeat url(https://s3-us-west-2.amazonaws.com/s.cdpn.io/12005/grid.png);
     grid-gap: 10px;
     grid-template-columns:  repeat(6, 150px);
     grid-template-rows: repeat( 4, 150px);
     background-color: #fff;
     color: #444;
     */
    
    let wrapper6 = mason.createView()
    
    body.addView(wrapper6)
    
    let boxA = createParentWith2Kids("This is box A.", "align-self: stretch")
    let boxB = createParentWith2Kids("This is box B.", "align-self: end")
    let boxC = createParentWith2Kids("This is box C.", "align-self: start")
    let boxD = createParentWith2Kids("This is box D.", "align-self: center")
    let boxE = createParentWith2Kids(
      "Each of the boxes on the left has a grid area of 3 columns and 3 rows (we're counting the gutter col/row). So each covers the same size area as box A.",
      "The align-self property is used to align the content inside the grid-area."
    )
    
    
    wrapper6.addView(boxA)
    wrapper6.addView(boxB)
    wrapper6.addView(boxC)
    wrapper6.addView(boxD)
    wrapper6.addView(boxE)
    
    let bg = UIColor(red: 0.27, green: 0.27, blue: 0.27, alpha: 1.00)
    
    wrapper6.configure { style in
      style.display = .Grid
      //      style.size = MasonSize(.Points(scale * Float(view.bounds.width)), .Points(scale * Float(view.bounds.height)))
      style.gap = MasonSize(.Points(10 ), .Points(10))
      style.gridTemplateColumns = "repeat(6, 150)"
      style.gridTemplateRows = "repeat(4, 150)"
    }
    
    boxA.configure { style in
      boxA.backgroundColor = bg
      style.flexDirection = .Column
      style.gridColumn = "1/3"
      style.gridRow = "1/3"
      style.alignSelf = AlignSelf.Stretch
    }
    
    boxB.configure { style in
      boxA.backgroundColor = bg
      style.flexDirection = .Column
      style.gridColumn =  "3/5"
      style.gridRow = "1/3"
      style.alignSelf = AlignSelf.End
    }
    
    
    boxC.configure { style in
      boxA.backgroundColor = bg
      style.flexDirection = .Column
      style.gridColumn = "1/3"
      style.gridRow = "3/6"
      style.alignSelf = AlignSelf.Start
    }
    
    boxD.configure { style in
      boxA.backgroundColor = bg
      style.flexDirection = .Column
      style.gridColumn = "3/5"
      style.gridRow = "3/6"
      style.alignSelf = AlignSelf.Center
    }
    
    
    boxE.configure { style in
      boxA.backgroundColor = bg
      style.flexDirection = .Column
      style.gridColumn = "5/7"
      style.gridRow = "1/6"
      style.alignSelf = AlignSelf.Stretch
    }
    // MasonSize(.Points(scale * Float(view.bounds.width)), .Points(scale * Float(view.bounds.height)))
    body.computeWithMaxContent()
    // wrapper6.mason.computeWithSize(scale * Float(view.bounds.width), scale * Float(view.bounds.height))
    
  }
  
  func animationExample(){
    //    view.subviews.forEach { view in
    //      view.removeFromSuperview()
    //    }
    
    let root = mason.createView()
    root.backgroundColor = .blue
    let width = Float(view.bounds.size.width) * scale
    let height = Float(view.bounds.size.height) * scale
    root.configure({ style in
      style.size = MasonSize( .Points(width), .Points(height))
      style.flexDirection = .Column
    })
    
    body.addView(root)
    
    body.computeWithSize(width, height)
    
    UIView.animate(withDuration: 3, delay: 1, usingSpringWithDamping: 0.4, initialSpringVelocity: 5){
      root.setSizeHeight(0.3, 2)
      root.setSizeWidth(0.3, 2)
      root.backgroundColor = .red
      
      self.body.requestLayout()
    }
    
    
  }
  
  func flexIssue(){
    let root = mason.createView()
    body.addView(root)
    root.backgroundColor = .red
    
    root.configure({ style in
      style.flexGrow = 1
      style.display = .Flex
    })
    
    
    let child = mason.createView()
    child.backgroundColor = .blue
    child.configure({ style in
      style.display = .Flex
    })
    
    root.addView(child)
    
    let child1 = mason.createTextView()
    child1.backgroundColor = .green
    child1.append(text: "1")
    
    child.addView(child1)
    
    root.computeWithSize(scale * Float(body.bounds.width), -1)
    
    
  }
  
  func showFlexExample(){
    body.subviews.forEach { view in
      body.removeFromSuperview()
    }
    
    let root = mason.createView()
    body.addSubview(root)
    root.backgroundColor = .black
    root.configure({ style in
      style.display = .Flex
      style.flexDirection = .Column
    })
    
    let childA = mason.createView()
    
    childA.configure { style in
      style.size =  MasonSize(.Points( scale * 100), .Points( scale * 100))
      childA.backgroundColor = .red
    }
    
    
    let childB = mason.createView()
    
    childB.configure { style in
      style.size =  MasonSize(.Points( scale * 100), .Points( scale * 100))
      childB.backgroundColor = .blue
    }
    
    root.addSubview(childA)
    root.addSubview(childB)
    
    root.computeWithMaxContent()
  }
  
  func gridSample(){
    /// https://gridbyexample.com/examples/example1/
    
    
    let childBg = UIColor(hex: "#444444FF")
    let root = mason.createView()
    body.addView(root)
    
    root.backgroundColor = .white
    root.configure({ style in
      root.style.display = .Grid
      //      style.size = MasonSize(.Points(scale * Float(body.bounds.width)), .Points(scale * Float(body.bounds.height)))
      
      style.gap = MasonSize(.Points(scale * 10), .Points(scale * 10))
      style.gridTemplateColumns = "100 100 100"
    })
    
    
    let a  = mason.createTextView()
    a.style.color = UIColor.white.toUInt32()
    a.append(text: "A")
    
    a.backgroundColor = childBg
    // a.setBackgroundColor(ui: childBg!)
    a.configure { style in
      style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    let b  = mason.createTextView()
    b.append(text: "B")
    b.backgroundColor = childBg
    b.style.color = UIColor.white.toUInt32()
    // b.setBackgroundColor(ui: childBg!)
    b.configure { style in
      style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    
    let c  = mason.createTextView()
    c.append(text: "C")
    c.style.color = UIColor.white.toUInt32()
    c.backgroundColor = childBg
    // c.setBackgroundColor(ui: childBg!)
    c.configure { style in
      style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    let d  = mason.createTextView()
    d.append(text: "D")
    d.backgroundColor = childBg
    d.style.color = UIColor.white.toUInt32()
    // d.setBackgroundColor(ui: childBg!)
    d.configure { style in
      style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    let e  = mason.createTextView()
    e.append(text: "E")
    e.backgroundColor = childBg
    e.style.color = UIColor.white.toUInt32()
    // e.setBackgroundColor(ui: childBg!)
    e.configure { style in
      style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    let f  = mason.createTextView()
    f.append(text: "F")
    f.backgroundColor = childBg
    f.style.color = UIColor.white.toUInt32()
    //f.setBackgroundColor(ui: childBg!)
    f.configure { style in
      style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    root.addView(a)
    root.addView(b)
    root.addView(c)
    root.addView(d)
    root.addView(e)
    root.addView(f)
    
    
    // root.computeWithMaxContent()
    //     root.computeWithSize(Float(body.bounds.size.width) * scale, Float(body.bounds.size.height) * scale)
    body.computeWithSize(Float(body.bounds.size.width) * scale, Float(body.bounds.size.height) * scale)
  }
  
  
  func showGridExample(){
    body.subviews.forEach { view in
      body.removeFromSuperview()
    }
    
    let childBg = UIColor(hex: "#444444FF")
    let root = mason.createView()
    body.addSubview(root)
    root.backgroundColor = .white
    root.configure({ style in
      style.display = .Grid
      style.size = MasonSize(.Points(scale * Float(body.bounds.width)), .Points(scale * Float(body.bounds.height)))
      
      style.gap = MasonSize(.Points(scale * 10), .Points(scale * 10))
      style.gridTemplateColumns = "100 100 100"
      
    })
    
    let childA = mason.createView()
    childA.configure { style in
      style.gridColumn = "1/3"
      style.gridRow = "1"
      childA.backgroundColor = childBg
    }
    
    
    let childAText = mason.createTextView()
    childAText.textContent = "A"
    childAText.setColor(ui: .white)
    childAText.style.textAlign = .Center
    childA.addSubview(childAText)
    
    let childB =  mason.createView()
    childB.configure { style in
      style.gridColumn = "3"
      style.gridRow = "1/3"
      childB.backgroundColor = childBg
    }
    
    
    let childBText =  mason.createTextView()
    childBText.textContent = "B"
    childBText.setColor(ui: .white)
    childB.addSubview(childBText)
    
    let childC = mason.createView()
    childC.configure { style in
      style.gridColumn = "1"
      style.gridRow = "2"
      childC.backgroundColor = childBg
    }
    
    let childCText = mason.createTextView()
    childCText.textContent = "C"
    childCText.setColor(ui: .white)
    
    childC.addSubview(childCText)
    
    
    
    let childD =  mason.createView()
    childD.configure { style in
      style.gridColumn = "2"
      style.gridRow = "2"
      childD.backgroundColor = childBg
    }
    
    let childDText =  mason.createTextView()
    childDText.textContent = "D"
    childDText.setColor(ui: .white)
    
    childD.addSubview(childDText)
    
    
    root.addSubview(childA)
    root.addSubview(childB)
    root.addSubview(childC)
    root.addSubview(childD)
    
    
    root.computeWithMaxContent()
    
  }
  
  func resizeImage(_ image: UIImage, _ newSize: CGSize) -> UIImage{
    let newImage = UIGraphicsImageRenderer(size: newSize).image { _ in
      image.draw(in: CGRect(origin: .zero, size: newSize))
    }
    
    return newImage.withRenderingMode(image.renderingMode)
  }
  
  
  func numberOfSections(in collectionView: UICollectionView) -> Int {
    return 1
  }
  
  func collectionView(_ collectionView: UICollectionView, numberOfItemsInSection section: Int) -> Int {
    return items.count
  }
  
  func collectionView(_ collectionView: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
    let cell = collectionView.dequeueReusableCell(withReuseIdentifier: "default", for: indexPath) as! DefaultCellView
    let item = items[indexPath.row]
    cell.listTextView.textContent = item
    DispatchQueue.global().async { [self] in
      do {
        let data = try Data(contentsOf: URL(string: item)!)
        
        let side = CGFloat(150)
        
        
        let image = resizeImage(UIImage(data: data)!, CGSize(width: side, height: side))
        
        
        DispatchQueue.main.async {
          cell.listImageView.image = image
          cell.bodyView.computeWithMaxContent()
        }
      }catch{}
    }
    return cell
  }
  
  func collectionView(_ collectionView: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {
    (cell as! DefaultCellView).bodyView.computeWithMaxContent()
  }
  
  
  func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
    guard let cell = collectionView.cellForItem(at: indexPath) as? DefaultCellView else {
      let layout = mason.layoutForView(collectionView)
      
      return CGSizeMake(collectionView.frame.width, 50 * CGFloat(scale))
    }
    
    
    let layout = cell.bodyView.layout()
    
    return CGSizeMake(CGFloat(layout.width / scale), CGFloat(layout.height / scale))
  }
  
  
  
  func testLayout(){
    let root = mason.createView()
    root.backgroundColor = .lightGray
    body.addView(root)
    
    
    root.configure { style in
      style.size = MasonSize(MasonDimension.Percent(1), MasonDimension.Auto)
      style.alignContent = .Stretch
      style.alignItems = .Center
      style.flexDirection = .Column
      style.justifyContent = .Start
      style.display = .Flex
      
      //            mason.style.size = MasonSize(MasonDimension.Points(Float(view.bounds.size.width) * scale), MasonDimension.Points(Float(view.bounds.size.height) * scale))
      
    }
    
    
    
    let text0 = mason.createTextView()
    text0.textContent = "Test"
    text0.setColor(ui: .white)
    
    root.addView(text0)
    
    
    
    let text1 = mason.createTextView()
    text1.textContent = "Top Left"
    text1.configure { style in
      style.position = .Absolute
      style.leftInset = .Points(0)
      style.topInset = .Points(0)
      text1.backgroundColor = .blue
      text1.setColor(ui: .white)
    }
    
    
    textTopLeft = text1
    
    root.addView(text1)
    
    
    
    let text2 = mason.createTextView()
    text2.textContent = "Top Right"
    text2.configure { style in
      style.position = .Absolute
      style.rightInset = .Points(0)
      style.topInset = .Points(0)
      text2.backgroundColor = .blue
    }
    
    textTopRight = text2
    
    root.addView(text2)
    
    
    
    
    let text3 = mason.createTextView()
    text3.textContent = "Bottom Left"
    text3.configure { style in
      style.position = .Absolute
      style.leftInset = .Points(0)
      style.bottomInset = .Points(0)
      text3.backgroundColor = .blue
      text3.setColor(ui: .white)
    }
    
    textBottomLeft = text3
    
    root.addView(text3)
    
    
    
    let text4 = text3
    text4.textContent = "Bottom Right"
    text4.configure { style in
      style.position = .Absolute
      style.rightInset = .Points(0)
      style.bottomInset = .Points(0)
      text4.backgroundColor = .blue
      text4.setColor(ui: .white)
    }
    
    textBottomRight = text4
    
    root.addView(text4)
    
    
    let view0 = mason.createView()
    
    view0.configure { style in
      style.size = MasonSize(MasonDimension.Percent(1), MasonDimension.Auto)
    }
    
    let layout = UICollectionViewFlowLayout()
    layout.scrollDirection = .vertical
    
    let list = UICollectionView(frame: .zero, collectionViewLayout: layout)
    list.backgroundColor = .purple
    
    
    mason.configureStyleForView(list) { style in
      style.size =  MasonSize(MasonDimension.Percent(1), MasonDimension.Points(300 * scale))
    }
    
    list.register(DefaultCellView.self, forCellWithReuseIdentifier: "default")
    
    
    self.list = list
    
    list.dataSource = self
    list.delegate = self
    
    
    root.addView(view0)
    
    view0.addView(list)
    
    
    let view1 = mason.createView()
    view1.backgroundColor = .green
    
    
    let text5 = mason.createTextView()
    text5.textContent = "Nested TextView in mason"
    text5.backgroundColor = .yellow
    
    view1.addView(text5)
    
    root.addView(view1)
    
    
    //  masonView.mason.computeWithViewSize()
    
    
    let text6 = mason.createTextView()
    text6.textContent = "Hello this"
    text6.configure { style in
      text6.setColor(ui: .white)
      text6.backgroundColor = .red
    }
    
    root.addView(text6)
    
    let text7 = mason.createTextView()
    text7.textContent = " is the new"
    text7.configure { style in
      text7.backgroundColor = .green
    }
    
    root.addView(text7)
    
    let text8 = mason.createTextView()
    text8.textContent = " layout"
    text8.configure { style in
      text8.backgroundColor = .orange
    }
    
    root.addView(text8)
    
    
    let text9 = mason.createTextView()
    text9.textContent = " powered by taffy"
    text9.configure { style in
      text9.backgroundColor = .orange
      text9.setColor(ui: .white)
    }
    
    root.addView(text9)
    
    
    let view2 = mason.createView()
    view2.backgroundColor = .blue
    
    
    let view3 = mason.createView()
    view3.backgroundColor = .orange
    
    list.isHidden = true
    let text10 = mason.createTextView()
    text10.textContent = "Hello World Nested"
    
    view3.addView(text10)
    
    view2.addView(view3)
    
    root.addView(view2)
    
    let imageView1 = mason.createImageView()
    imageView1.backgroundColor = .yellow
    
    root.addView(imageView1)
    
    //  root.mason.computeWithMaxContent()
    
    
    // root.mason.computeWithSize(Float(view.bounds.size.width) * scale, Float(view.bounds.size.height) * scale)
    
    
    
    body.computeWithSize(Float(self.body.bounds.size.width) * self.scale, Float(self.body.bounds.size.height) * self.scale)
    
    
    
    imageView1.src = "https://hips.hearstapps.com/digitalspyuk.cdnds.net/17/19/1494434353-deadpool.jpg"
    
    
  }
  
  
}



extension UIColor {
  public convenience init?(hex: String) {
    let r, g, b, a: CGFloat
    
    if hex.hasPrefix("#") {
      let start = hex.index(hex.startIndex, offsetBy: 1)
      let hexColor = String(hex[start...])
      
      let scanner = Scanner(string: hexColor)
      var hexNumber: UInt64 = 0
      
      if hexColor.count == 8 {
        if scanner.scanHexInt64(&hexNumber) {
          r = CGFloat((hexNumber & 0xff000000) >> 24) / 255
          g = CGFloat((hexNumber & 0x00ff0000) >> 16) / 255
          b = CGFloat((hexNumber & 0x0000ff00) >> 8) / 255
          a = CGFloat(hexNumber & 0x000000ff) / 255
          
          self.init(red: r, green: g, blue: b, alpha: a)
          return
        }
      } else if hexColor.count == 6 {
        if scanner.scanHexInt64(&hexNumber) {
          r = CGFloat((hexNumber & 0xFF0000) >> 16) / 255
          g = CGFloat((hexNumber & 0x00FF00) >> 8) / 255
          b = CGFloat(hexNumber & 0x0000FF) / 255
          a = 1.0
          self.init(red: r, green: g, blue: b, alpha: a)
          return
        }
      } else if hexColor.count == 3 {
        let rHex = hexColor[hexColor.startIndex]
        let gHex = hexColor[hexColor.index(hexColor.startIndex, offsetBy: 1)]
        let bHex = hexColor[hexColor.index(hexColor.startIndex, offsetBy: 2)]
        
        let rStr = "\(rHex)\(rHex)"
        let gStr = "\(gHex)\(gHex)"
        let bStr = "\(bHex)\(bHex)"
        let fullHex = rStr + gStr + bStr
        
        let fullScanner = Scanner(string: fullHex)
        if fullScanner.scanHexInt64(&hexNumber) {
          r = CGFloat((hexNumber & 0xFF0000) >> 16) / 255
          g = CGFloat((hexNumber & 0x00FF00) >> 8) / 255
          b = CGFloat(hexNumber & 0x0000FF) / 255
          a = 1.0
          self.init(red: r, green: g, blue: b, alpha: a)
          return
        }
      }
    }
    
    return nil
  }
}
