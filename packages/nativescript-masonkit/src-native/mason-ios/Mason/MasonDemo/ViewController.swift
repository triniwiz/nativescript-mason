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
  
  let container = NSCMason.shared.createView()
  
  var mason: NSCMason {
    get {
      NSCMason.shared
    }
  }
  
  
  class DefaultCellView: UICollectionViewCell {
    let containerView = NSCMason.shared.createView()
    let listTextView = NSCMason.shared.createTextView()
    let listImageView = UIImageView(frame: .zero)
    
    override init(frame: CGRect) {
      super.init(frame: .zero)
      setupView()
    }
    
    override func prepareForReuse() {
      super.prepareForReuse()
      listTextView.text = nil
      listImageView.image = nil
    }
    
    
    
    func setupView(){
      let scale = Float(UIScreen.main.scale)
      containerView.configure { node in
        node.style.alignItems = .Center
        node.style.flexDirection = .Column
        node.style.setSizeWidth(MasonDimension.Percent(1))
        //            node.style.size = MasonSize(MasonDimension.Points(Float(frame.size.width) * scale), MasonDimension.Points(Float(frame.size.height) * scale))
      }
      
      NSCMason.shared.nodeForView(listImageView).configure { node in
        node.style.setSizeHeight(MasonDimension.Points(50 * scale))
      }
      
      let label1 = NSCMason.shared.createTextView()
      label1.text = "Laffy Taffy!!!!"
      
      containerView.addSubview(listTextView)
      containerView.addSubview(label1)
      containerView.addSubview(listImageView)
      
      backgroundColor = .clear
      
      contentView.addSubview(containerView)
      
    }
    
    required init?(coder: NSCoder) {
      fatalError("init(coder:) has not been implemented")
    }
  }
  
  override func viewDidAppear(_ animated: Bool) {
    //        view?.mason.computeWithMaxContent()
    guard let view = view.subviews.first as? MasonUIView else {return}
    //      view.uiView.frame.origin.x += view.safeAreaInsets.left
    //                view.uiView.frame.origin.y += view.safeAreaInsets.top
    
  }
  
  override func viewSafeAreaInsetsDidChange() {
    container.frame = container.frame.offsetBy(dx: view.safeAreaInsets.left, dy: view.safeAreaInsets.top)
    let left = Float(self.view.safeAreaInsets.left) * scale
    let right = Float(self.view.safeAreaInsets.right) * scale
    let top = Float(self.view.safeAreaInsets.top) * scale
    let bottom = Float(self.view.safeAreaInsets.bottom) * scale
    
    guard let view = view.subviews.first as? MasonUIView else {return}
    
    
    //      view.style.inset = MasonRect(
    //               .Points(left),
    //               .Points(right),
    //               .Points(top),
    //               .Points(bottom)
    //              )
    //
    //
    //      view.node.computeWithSize(scale * Float(self.view.bounds.width), scale * Float(self.view.bounds.height))
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
    let text = mason.createTextView()
    text.setColor(ui: .blue)
    text.decorationLine = .Underline
    text.setDecorationColor(ui: .orange)
    text.fontStyle = .Italic
    text.fontWeight = "bold"
    text.textWrap = .Wrap
    text.updateText("Hello World!!!!! ")
    
    
    let child = UIView()
    let node = mason.nodeForView(child)
    node.configure { node in
      node.style.size = MasonSize<MasonDimension>(
        MasonDimension.Points(100),
        MasonDimension.Points(100))
    }
    
    
    child.backgroundColor = .blue
    text.addView(child)
    
    
    let spacer = mason.createTextView()
    spacer.updateText(" OMG ??? ")
    spacer.textTransform = .FullWidth
    spacer.setColor(ui: .red)
    text.addView(spacer)
    
    
    let image = UIImageView()
    let imageNode = mason.nodeForView(image)
    imageNode.configure { node in
      node.style.size = MasonSize<MasonDimension>(
        MasonDimension.Points(100),
        MasonDimension.Points(100))
    }
    
    loadImage("https://picsum.photos/300/300", imageInstance: image, parent: text)
    
    text.addView(image)
    
    
    let first = mason.createTextView()
    first.updateText(" this")
    first.setColor(ui: .magenta)
    text.addView(first)
    
    
    let first_first = mason.createTextView()
    first_first.updateText(" is a nested text")
    first_first.fontSize = 30
    
    first.addView(first_first)
    
    
    let other = mason.createTextView()
    other.updateText(" <- inserted here ->")
    
    
    
    let image2 = UIImageView()
    let imageNode2 = mason.nodeForView(image2)
    imageNode2.configure { node in
      node.style.size = MasonSize<MasonDimension>(
        MasonDimension.Points(300),
        MasonDimension.Points(300))
    }
    
    loadImage("https://picsum.photos/300/300", imageInstance: image2, parent: text)
    
    other.addView(image2)
    
    
    text.addView(other)
    
    let con = mason.createView()
    con.addView(text)
    container.addView(con)
    
    //    con.style.size =  MasonSize(MasonDimension.Points(scale * Float(container.bounds.width)), MasonDimension.Points(scale * Float(container.bounds.height)))
    
    
    con.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
    
    
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
    urlSession.dataTask(with: url) { [weak self] data, response, error in
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
  var data:Data!
  override func viewDidLoad() {
    //  super.viewDidLoad()
    //        var i = 0
    //        repeat {
    //            items.append("https://robohash.org/\(i + 1)?set=set4")
    //            i+=1
    //        } while i < 1000
    
    container.frame = view.bounds
    
    view.addSubview(container)
    
    imageTest()
    
    
    // textSample()
    
    // flexIssue()
    
    // testLayout()
    
    //  showFlexExample()
    
    // showGridExample()
    // animationExample()
    
    // wrapper5()
    
    
    
    // imageExample()
    //  gridSample()
    
    //  testLateUpdate()
    
   // headers()
    
    //      let root = mason.createView()
    //      root.backgroundColor = .red
    //
    //      container.addView(root)
    //
    //      let a = mason.createTextView(type: .H1)
    //      let b = mason.createTextView()
    //      print(a.style.valuesCompat)
    //
    //      root.addView(a)
    //
    //
    //      a.text = "a"
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
    //      f.node.style.size = MasonSize(.Points(100), .Points(100))
    //      g.backgroundColor = .yellow
    //      g.node.style.size = MasonSize(.Points(100), .Points(100))
    //
    //      root.node.computeWithMaxContent()
  }
  
  func imageTest(){
    let root = mason.createView()
    
    container.addView(root)
    
    let txt = mason.createTextView()
    txt.whiteSpace = .Nowrap
    txt.textWrap = .NoWrap
    
    txt.text = "Hello "
    
    let img = mason.createImageView()
    img.node.style.size = MasonSize(.Points(300), .Points(300))
    img.src = "https://picsum.photos/600/600"
    
    txt.addView(img)
    
    root.addView(txt)
    

    
    
    container.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
  }
  
  func headers(){
    
    let root = mason.createView()
    
    container.addView(root)
    
    let h1 = mason.createTextView(type: .H1)
    h1.text = "This is heading 1"
    
    let h2 = mason.createTextView(type: .H2)
    h2.text = "This is heading 2"
    
    let h3 = mason.createTextView(type: .H3)
    h3.text = "This is heading 3"
    
    let h4 = mason.createTextView(type: .H4)
    h4.text = "This is heading 4"
    
    let h5 = mason.createTextView(type: .H5)
    h5.text = "This is heading 5"
    
    let h6 = mason.createTextView(type: .H6)
    h6.text = "This is heading 6"
    
    let p = mason.createTextView(type: .P)
    
    let b = mason.createTextView(type: .B)
    b.text = "Tip:"
    
    p.addView(b)
    
    p.text = " Use h1 to h6 elements only for headings. Do not use them just to make text bold or big. Use other tags for that."
    
    root.addView(h1)
    root.addView(h2)
    root.addView(h3)
    root.addView(h4)
    root.addView(h5)
    root.addView(h6)
    root.addView(p)
    
    
    
    let blockQ = mason.createTextView(type: .P)
    
    
    blockQ.text = "For 50 years, WWF has been protecting the future of nature. The world's leading conservation organization, WWF works in 100 countries and is supported by 1.2 million members in the United States and close to 5 million globally."
    
    blockQ.configure { node in
      node.style.overflowX = .Hidden
      node.style.overflowY = .Hidden
      blockQ.whiteSpace = .Nowrap
      blockQ.textWrap = .NoWrap
      blockQ.textOverflow  = .Custom(" (╯°□°)╯︵ ┻━┻")
    }
    
    blockQ.textWrap = .NoWrap
    
    root.addView(blockQ)
    
    
    
    root.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
    
  }
  
  func testLateUpdate(){
    let root = mason.createView()
    root.backgroundColor = .red
    
    container.addView(root)
    
    let text = mason.createTextView()
    root.addView(text)
   // text.textWrap = .Wrap
    // text.setBackgroundColor(ui: .cyan)
    
    let text2 = mason.createTextView()

    text.addView(text2)
    
    root.addView(text)
    root.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
    
    text.updateText("Hello")
    
    print(text.txtToRender.string)
    /*
    DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
      DispatchQueue.main.async {
        text.updateText("Hello World")
        
        DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
          DispatchQueue.main.async { [self] in
            text2.setBackgroundColor(ui: .green)
            text2.setColor(ui: .blue)
            text2.updateText(" \n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nisi est, iaculis non tellus in, molestie finibus tellus. Integer pulvinar eget massa vel porta. Mauris porttitor felis id dictum egestas. Donec eget venenatis massa, auctor porta elit. Quisque augue urna, eleifend id augue nec, eleifend venenatis felis. Etiam eget magna ac magna feugiat ultricies a eu massa. Maecenas iaculis pellentesque neque, sit amet faucibus magna malesuada et. Morbi sit amet rhoncus nunc. In ultricies urna ac pulvinar consequat. Vivamus feugiat sed elit quis efficitur. Etiam erat magna, sodales consectetur velit eu, fermentum condimentum ex. Nulla rhoncus ligula ac ipsum hendrerit, non tristique tortor pharetra. Pellentesque eu urna turpis. Aliquam sed enim mauris. ")
      
            
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
  
  func imageExample(){
    let root = mason.createView()
    container.addView(root)
    
    let image = UIImageView(frame: .zero)
    
    mason.nodeForView(image).style.sizeCompatWidth = MasonDimensionCompat(percent: 1)
    
    
    DispatchQueue.global().async { [self] in
      do {
        let data = try Data(contentsOf: URL(string: "https://picsum.photos/600/600")!)
        
        let side = CGFloat(500 / scale)
        
        let img = resizeImage(UIImage(data: data)!, CGSize(width: side, height: side))
        
        DispatchQueue.main.async {
          image.image = img
          root.node.computeWithMaxContent()
        }
      }catch{
        print(error)
      }
    }
    
    
    root.addView(image)
    
    
    
  }
  
  func createParentWith2Kids(_ kidAText: String, _ kidBText: String) -> MasonUIView {
    let parent = mason.createView()
    
    
    let kida = UILabel(frame: .zero)
    
    
    kida.text = kidAText
    
    let kidb = UILabel(frame: .zero)
    
    kidb.text = kidBText
    
    parent.addSubview(kida)
    
    parent.addSubview(kidb)
    
    return parent
  }
  
  func wrapper5(){
    let wrapper5 = mason.createView()
    wrapper5.configure { node in
      node.style.display = .Grid
      node.style.margin = MasonRect(uniform: .Points(40 * scale))
      node.style.gap = MasonSize(uniform: .Points(10 * scale))
      node.style.gridTemplateColumns = [.Single(.Points(points: 100 * scale)),.Single(.Points(points: 100 * scale)),.Single(.Points(points: 100 * scale))]
    }
    container.addView(wrapper5)
    
    
    let a = mason.createView()
    
    let box_bg = UIColor(hex: "#444")
    a.backgroundColor = box_bg
    let a_text = mason.createTextView()
    a_text.text = "A"
    a_text.setColor(ui: .white)
    a.addView(a_text)
    a.configure { node in
      node.style.padding = MasonRect(uniform: .Points(20  * scale))
      node.style.gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(3))
      node.style.gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(1))
    }
    
    let b = mason.createView()
    b.backgroundColor = box_bg
    let b_text = mason.createTextView()
    b_text.text = "B"
    b_text.setColor(ui: .white)
    b.addView(b_text)
    
    
    b.configure { node in
      node.style.padding = MasonRect(uniform: .Points(20  * scale))
      node.style.gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(3))
      node.style.gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(3))
    }
    
    let c = mason.createView()
    c.backgroundColor = box_bg
    let c_text = mason.createTextView()
    c_text.text = "C"
    c_text.setColor(ui: .white)
    c.addView(c_text)
    c.configure { node in
      node.style.padding = MasonRect(uniform: .Points(20  * scale))
      node.style.gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(1))
      node.style.gridRow = Line(GridPlacement.Line(2), GridPlacement.Line(2))
    }
    
    
    let d = mason.createView()
    d.backgroundColor = box_bg
    let d_text = mason.createTextView()
    d_text.text = "D"
    d_text.setColor(ui: .white)
    d.addView(d_text)
    
    d.configure { node in
      node.style.padding = MasonRect(uniform: .Points(20 * scale))
      node.style.gridColumn = Line(GridPlacement.Line(2), GridPlacement.Line(2))
      node.style.gridRow = Line(GridPlacement.Line(2), GridPlacement.Line(2))
    }
    
    wrapper5.addView(a)
    wrapper5.addView(b)
    wrapper5.addView(c)
    wrapper5.addView(d)
    
    //    container.node.computeWithMaxContent()
    
    wrapper5.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
  }
  func wrapper6() {
    
    view.subviews.forEach { view in
      view.removeFromSuperview()
    }
    
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
    
    view.addSubview(wrapper6)
    
    let boxA = createParentWith2Kids("This is box A.", "align-self: stretch")
    let boxB = createParentWith2Kids("This is box B.", "align-self: end")
    let boxC = createParentWith2Kids("This is box C.", "align-self: start")
    let boxD = createParentWith2Kids("This is box D.", "align-self: center")
    let boxE = createParentWith2Kids(
      "Each of the boxes on the left has a grid area of 3 columns and 3 rows (we're counting the gutter col/row). So each covers the same size area as box A.",
      "The align-self property is used to align the content inside the grid-area."
    )
    
    
    wrapper6.addSubview(boxA)
    wrapper6.addSubview(boxB)
    wrapper6.addSubview(boxC)
    wrapper6.addSubview(boxD)
    wrapper6.addSubview(boxE)
    
    let bg = UIColor(red: 0.27, green: 0.27, blue: 0.27, alpha: 1.00)
    
    wrapper6.configure { node in
      node.style.display = .Grid
      node.style.size = MasonSize(.Points(scale * Float(view.bounds.width)), .Points(scale * Float(view.bounds.height)))
      node.style.gap = MasonSize(.Points(10 * scale), .Points(10 * scale))
      node.style.gridTemplateColumns = [
        TrackSizingFunction.AutoRepeat(.Count(6), [.Points(points: 150 * scale)])
      ]
      
      node.style.gridTemplateRows = [
        TrackSizingFunction.AutoRepeat(.Count(4), [.Points(points: 150 * scale)])
      ]
    }
    
    boxA.configure { node in
      boxA.backgroundColor = bg
      node.style.flexDirection = .Column
      node.style.gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(3))
      node.style.gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(3))
      node.style.alignSelf = AlignSelf.Stretch
    }
    
    boxB.configure { node in
      boxA.backgroundColor = bg
      node.style.flexDirection = .Column
      node.style.gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(5))
      node.style.gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(3))
      node.style.alignSelf = AlignSelf.End
    }
    
    
    boxC.configure { node in
      boxA.backgroundColor = bg
      node.style.flexDirection = .Column
      node.style.gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(3))
      node.style.gridRow = Line(GridPlacement.Line(3), GridPlacement.Line(6))
      node.style.alignSelf = AlignSelf.Start
    }
    
    boxD.configure { node in
      boxA.backgroundColor = bg
      node.style.flexDirection = .Column
      node.style.gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(5))
      node.style.gridRow = Line(GridPlacement.Line(3), GridPlacement.Line(6))
      node.style.alignSelf = AlignSelf.Center
    }
    
    
    boxE.configure { node in
      boxA.backgroundColor = bg
      node.style.flexDirection = .Column
      node.style.gridColumn = Line(GridPlacement.Line(5), GridPlacement.Line(7))
      node.style.gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(6))
      node.style.alignSelf = AlignSelf.Stretch
    }
    // MasonSize(.Points(scale * Float(view.bounds.width)), .Points(scale * Float(view.bounds.height)))
    wrapper6.node.computeWithMaxContent()
    // wrapper6.mason.computeWithSize(scale * Float(view.bounds.width), scale * Float(view.bounds.height))
    
  }
  
  func animationExample(){
    view.subviews.forEach { view in
      view.removeFromSuperview()
    }
    
    let root = mason.createView()
    root.backgroundColor = .blue
    let width = Float(container.frame.size.width)
    let height = Float(container.frame.size.height)
    root.configure({ node in
      node.style.size = MasonSize( .Points(width * scale), .Points(height * scale))
      node.style.flexDirection = .Column
    })
    
    view!.addSubview(root)
    
    root.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
    
    UIView.animate(withDuration: 3, delay: 1, usingSpringWithDamping: 0.4, initialSpringVelocity: 5){
      root.setSizeHeight(0.3, 2)
      root.setSizeWidth(0.3, 2)
      root.backgroundColor = .red
      
      root.requestLayout()
    }
    
    
  }
  
  func flexIssue(){
    container.subviews.forEach { view in
      container.removeFromSuperview()
    }
    
    let root = mason.createView()
    container.addSubview(root)
    root.backgroundColor = .red
    let width = Float(container.bounds.width)
    let height = Float(container.bounds.height)
    root.backgroundColor = .red
    root.configure({ node in
      node.style.flexGrow = 1
      node.style.display = .Flex
    })
    
    
    let child = mason.createView()
    child.backgroundColor = .blue
    child.configure({ node in
      node.style.display = .Flex
    })
    
    root.addSubview(child)
    
    let child1 = mason.createTextView()
    child1.backgroundColor = .green
    child1.text = "1"
    
    child.addSubview(child1)
    
    root.node.computeWithSize(scale * Float(container.bounds.width), -1)
  }
  
  func showFlexExample(){
    container.subviews.forEach { view in
      container.removeFromSuperview()
    }
    
    let root = mason.createView()
    container.addSubview(root)
    root.backgroundColor = .black
    root.configure({ node in
      node.style.display = .Flex
      node.style.flexDirection = .Column
    })
    
    let childA = mason.createView()
    
    childA.configure { node in
      node.style.size =  MasonSize(.Points( scale * 100), .Points( scale * 100))
      childA.backgroundColor = .red
    }
    
    
    let childB = mason.createView()
    
    childB.configure { node in
      node.style.size =  MasonSize(.Points( scale * 100), .Points( scale * 100))
      childB.backgroundColor = .blue
    }
    
    root.addSubview(childA)
    root.addSubview(childB)
    
    root.node.computeWithMaxContent()
  }
  
  func gridSample(){
    /// https://gridbyexample.com/examples/example1/
    container.subviews.forEach { view in
      container.removeFromSuperview()
    }
    
    let childBg = UIColor(hex: "#444444FF")
    let root = mason.createView()
    container.addSubview(root)
    
    
    root.configure({ node in
      node.style.display = .Grid
      //      node.style.size = MasonSize(.Points(scale * Float(container.bounds.width)), .Points(scale * Float(container.bounds.height)))
      
      node.style.gap = MasonSize(.Points(scale * 10), .Points(scale * 10))
      node.style.gridTemplateColumns = [
        TrackSizingFunction.AutoRepeat(.Count(3), [MinMax.Points(points: scale * 100)])
      ]
      
    })
    
    
    let a  = mason.createTextView()
    a.text = "A"
    a.setColor(ui: .white)
    
    a.backgroundColor = childBg
    // a.setBackgroundColor(ui: childBg!)
    a.configure { node in
      node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    let b  = mason.createTextView()
    b.text = "B"
    b.backgroundColor = childBg
    b.setColor(ui: .white)
    // b.setBackgroundColor(ui: childBg!)
    b.configure { node in
      node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    
    let c  = mason.createTextView()
    c.text = "C"
    c.backgroundColor = childBg
    c.setColor(ui: .white)
    // c.setBackgroundColor(ui: childBg!)
    c.configure { node in
      node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    let d  = mason.createTextView()
    d.text = "D"
    d.backgroundColor = childBg
    d.setColor(ui: .white)
    // d.setBackgroundColor(ui: childBg!)
    d.configure { node in
      node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    let e  = mason.createTextView()
    e.text = "E"
    e.backgroundColor = childBg
    e.setColor(ui: .white)
    // e.setBackgroundColor(ui: childBg!)
    e.configure { node in
      node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    let f  = mason.createTextView()
    f.text = "F"
    f.backgroundColor = childBg
    f.setColor(ui: .white)
    //f.setBackgroundColor(ui: childBg!)
    f.configure { node in
      node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    root.addSubview(a)
    root.addSubview(b)
    root.addSubview(c)
    root.addSubview(d)
    root.addSubview(e)
    root.addSubview(f)
    
    
    root.node.computeWithMaxContent()
    // root.node.computeWithSize(Float(container.bounds.size.width) * scale, Float(container.bounds.size.height) * scale)
  }
  
  
  func showGridExample(){
    container.subviews.forEach { view in
      container.removeFromSuperview()
    }
    
    let childBg = UIColor(hex: "#444444FF")
    let root = mason.createView()
    container.addSubview(root)
    root.backgroundColor = .white
    root.configure({ node in
      node.style.display = .Grid
      node.style.size = MasonSize(.Points(scale * Float(container.bounds.width)), .Points(scale * Float(container.bounds.height)))
      
      node.style.gap = MasonSize(.Points(scale * 10), .Points(scale * 10))
      node.style.gridTemplateColumns = [
        TrackSizingFunction.AutoRepeat(.Count(3), [MinMax.Points(points: scale * 100)])
      ]
      
    })
    
    let childA = mason.createView()
    childA.configure { node in
      node.style.gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(3))
      node.style.gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(1))
      childA.backgroundColor = childBg
    }
    
    
    let childAText = mason.createTextView()
    childAText.text = "A"
    childAText.setColor(ui: .white)
    childAText.style.textAlign = .Center
    childA.addSubview(childAText)
    
    let childB =  mason.createView()
    childB.configure { node in
      node.style.gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(3))
      node.style.gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(3))
      childB.backgroundColor = childBg
    }
    
    
    let childBText =  mason.createTextView()
    childBText.text = "B"
    childBText.setColor(ui: .white)
    childB.addSubview(childBText)
    
    let childC = mason.createView()
    childC.configure { node in
      node.style.gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(1))
      node.style.gridRow = Line(GridPlacement.Line(2), GridPlacement.Line(2))
      childC.backgroundColor = childBg
    }
    
    let childCText = mason.createTextView()
    childCText.text = "C"
    childCText.setColor(ui: .white)
    
    childC.addSubview(childCText)
    
    
    
    let childD =  mason.createView()
    childD.configure { node in
      node.style.gridColumn = Line(GridPlacement.Line(2), GridPlacement.Line(2))
      node.style.gridRow = Line(GridPlacement.Line(2), GridPlacement.Line(2))
      childD.backgroundColor = childBg
    }
    
    let childDText =  mason.createTextView()
    childDText.text = "D"
    childDText.setColor(ui: .white)
    
    childD.addSubview(childDText)
    
    
    root.addSubview(childA)
    root.addSubview(childB)
    root.addSubview(childC)
    root.addSubview(childD)
    
    
    root.node.computeWithMaxContent()
    
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
    cell.listTextView.text = item
    DispatchQueue.global().async { [self] in
      do {
        let data = try Data(contentsOf: URL(string: item)!)
        
        let side = CGFloat(150)
        
        
        let image = resizeImage(UIImage(data: data)!, CGSize(width: side, height: side))
        
        
        DispatchQueue.main.async {
          cell.listImageView.image = image
          cell.containerView.node.computeWithMaxContent()
        }
      }catch{}
    }
    return cell
  }
  
  func collectionView(_ collectionView: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {
    (cell as! DefaultCellView).containerView.node.computeWithMaxContent()
  }
  
  
  func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
    guard let cell = collectionView.cellForItem(at: indexPath) as? DefaultCellView else {
      let layout = mason.nodeForView(collectionView).layout()
      
      return CGSizeMake(collectionView.frame.width, 50 * CGFloat(scale))
    }
    
    
    let layout = cell.containerView.node.layout()
    
    return CGSizeMake(CGFloat(layout.width / scale), CGFloat(layout.height / scale))
  }
  
  
  
  func testLayout(){
    let root = mason.createView()
    container.addSubview(root)
    
    root.configure { mason in
      mason.style.size = MasonSize(MasonDimension.Percent(1), MasonDimension.Auto)
      mason.style.alignContent = .Stretch
      mason.style.alignItems = .Center
      mason.style.flexDirection = .Column
      mason.style.justifyContent = .Start
      mason.style.display = .Flex
      
      //            mason.style.size = MasonSize(MasonDimension.Points(Float(view.bounds.size.width) * scale), MasonDimension.Points(Float(view.bounds.size.height) * scale))
      
    }
    
    
    
    let text0 = mason.createTextView()
    text0.text = "Test"
    text0.setColor(ui: .white)
    
    root.addSubview(text0)
    
    
    
    let text1 = mason.createTextView()
    text1.text = "Top Left"
    text1.configure { node in
      node.style.position = .Absolute
      node.style.leftInset = .Points(0)
      node.style.topInset = .Points(0)
      text1.backgroundColor = .blue
      text1.setColor(ui: .white)
    }
    
    
    textTopLeft = text1
    
    root.addSubview(text1)
    
    
    
    let text2 = mason.createTextView()
    text2.text = "Top Right"
    text2.configure { node in
      node.style.position = .Absolute
      node.style.rightInset = .Points(0)
      node.style.topInset = .Points(0)
      text2.backgroundColor = .blue
    }
    
    textTopRight = text2
    
    root.addSubview(text2)
    
    
    
    
    let text3 = mason.createTextView()
    text3.text = "Bottom Left"
    text3.configure { node in
      node.style.position = .Absolute
      node.style.leftInset = .Points(0)
      node.style.bottomInset = .Points(0)
      text3.backgroundColor = .blue
      text3.setColor(ui: .white)
    }
    
    textBottomLeft = text3
    
    root.addSubview(text3)
    
    
    
    let text4 = text3
    text4.text = "Bottom Right"
    text4.configure { node in
      node.style.position = .Absolute
      node.style.rightInset = .Points(0)
      node.style.bottomInset = .Points(0)
      text4.backgroundColor = .blue
      text4.setColor(ui: .white)
    }
    
    textBottomRight = text4
    
    root.addSubview(text4)
    
    
    let view0 = mason.createView()
    
    view0.configure { mason in
      mason.style.size = MasonSize(MasonDimension.Percent(1), MasonDimension.Auto)
    }
    
    let layout = UICollectionViewFlowLayout()
    layout.scrollDirection = .vertical
    
    let list = UICollectionView(frame: .zero, collectionViewLayout: layout)
    list.backgroundColor = .purple
    
    
    mason.nodeForView(list).configure { mason in
      mason.style.size =  MasonSize(MasonDimension.Percent(1), MasonDimension.Points(300 * scale))
    }
    
    list.register(DefaultCellView.self, forCellWithReuseIdentifier: "default")
    
    
    self.list = list
    
    list.dataSource = self
    list.delegate = self
    
    
    root.addSubview(view0)
    
    view0.addSubview(list)
    
    
    let view1 = mason.createView()
    view1.backgroundColor = .green
    
    
    let text5 = mason.createTextView()
    text5.text = "Nested TextView in mason"
    text5.backgroundColor = .yellow
    
    view1.addSubview(text5)
    
    root.addSubview(view1)
    
    
    //  masonView.mason.computeWithViewSize()
    
    
    let text6 = mason.createTextView()
    text6.text = "Hello this"
    text6.configure { node in
      text6.setColor(ui: .white)
      text6.backgroundColor = .red
    }
    
    root.addSubview(text6)
    
    let text7 = mason.createTextView()
    text7.text = " is the new"
    text7.configure { node in
      text7.backgroundColor = .green
    }
    
    root.addSubview(text7)
    
    let text8 = mason.createTextView()
    text8.text = " layout"
    text8.configure { node in
      text8.backgroundColor = .orange
    }
    
    root.addSubview(text8)
    
    
    let text9 = mason.createTextView()
    text9.text = " powered by taffy"
    text9.configure { node in
      text9.backgroundColor = .orange
      text9.setColor(ui: .white)
    }
    
    root.addSubview(text9)
    
    
    let view2 = mason.createView()
    view2.backgroundColor = .blue
    
    
    let view3 = mason.createView()
    view3.backgroundColor = .orange
    
    list.isHidden = true
    let text10 = mason.createTextView()
    text10.text = "Hello World Nested"
    
    view3.addSubview(text10)
    
    view2.addSubview(view3)
    
    root.addSubview(view2)
    
    let imageView1 = UIImageView(frame: .zero)
    
    root.addSubview(imageView1)
    
    //  root.mason.computeWithMaxContent()
    
    
    // root.mason.computeWithSize(Float(view.bounds.size.width) * scale, Float(view.bounds.size.height) * scale)
    
    
    
    DispatchQueue.global().async { [self] in
      do {
        let data = try Data(contentsOf: URL(string: "https://hips.hearstapps.com/digitalspyuk.cdnds.net/17/19/1494434353-deadpool.jpg")!)
        
        let side = CGFloat(500 / scale)
        
        let image = resizeImage(UIImage(data: data)!, CGSize(width: side, height: side))
        
        DispatchQueue.main.async {
          imageView1.image = image
          // root.mason.computeWithMaxContent()
          root.node.computeWithSize(Float(self.container.bounds.size.width) * self.scale, Float(self.container.bounds.size.height) * self.scale)
        }
      }catch{
        print(error)
      }
    }
    
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
