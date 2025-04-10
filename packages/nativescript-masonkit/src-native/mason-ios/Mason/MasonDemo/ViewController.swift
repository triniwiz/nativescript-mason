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
    
    var textTopLeft: UILabel? = nil
    
    var textTopRight: UILabel? = nil
    
    var textBottomLeft: UILabel? = nil
    
    var textBottomRight: UILabel? = nil
    
    var list: UICollectionView? = nil
  
    let mason = NSCMason()
  
  let container = UIView(frame: .zero)
    
    
    class DefaultCellView: UICollectionViewCell {
      var containerView: MasonUIView
        var listTextView: UILabel
        var listImageView: UIImageView

        
        override func prepareForReuse() {
            super.prepareForReuse()
            listTextView.text = nil
            listImageView.image = nil
            setup = false
        }
        
      
      var setup = false
      func setupView(_ mason: NSCMason){
        
        let scale = Float(UIScreen.main.scale)
      let container = mason.createView()
        container.configure { node in
            node.style.alignItems = .Center
            node.style.flexDirection = .Column
            node.style.size = MasonSize(MasonDimension.Points(Float(frame.size.width) * scale), MasonDimension.Points(Float(frame.size.height) * scale))
        }
        
        let label0 = UILabel(frame: .zero)
        
        let label1 = UILabel(frame: .zero)
        label1.text = "Laffy Taffy!!!!"
        
        let image0 = UIImageView(frame: .zero)
        
        containerView = container
        listTextView = label0
        listImageView = image0
        
        container.addSubview(label0)
        container.addSubview(label1)
        container.addSubview(image0)
        
        backgroundColor = .clear
        
        contentView.addSubview(container)
        
        setup = true
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
    
    let link = URL(string: "https://picsum.photos/300/300")
    do {
      try image.image = UIImage(data: Data(Data(contentsOf:link!)))
    }catch {
      print(error)
    }
   
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

  
    text.addView(other)
    
    let con = mason.createView()
    con.backgroundColor = .red
    con.addSubview(text)
    con.style.setSizeHeight(MasonDimension.Percent(1))
    
    view.addSubview(container)
    
    container.addSubview(con)
    
    
    con.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
    
    print(con.frame)
    
    
  }
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        var i = 0
        repeat {
            items.append("https://robohash.org/\(i + 1)?set=set4")
            i+=1
        } while i < 1000
      
      container.frame = view.bounds
      
      view.addSubview(container)
    
      
     // textSample()
        
       // flexIssue()
        
       // testLayout()
        
        // showFlexExample()
        
   //  showGridExample()
         // animationExample()
        
      //  wrapper6()
        
      //  imageExample()
      gridSample()
    }
    
    func imageExample(){
        view.subviews.forEach { view in
            view.removeFromSuperview()
        }
        

      let root = mason.createView()
                
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
        
 
      root.addSubview(image)
        
        view.addSubview(root)
      
      
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
        let width = Float(view.frame.size.width)
        let height = Float(view.frame.size.height)
        root.configure({ node in
            node.style.size = MasonSize( .Points(width * scale), .Points(height * scale))
            node.style.flexDirection = .Column
        })
        
        view!.addSubview(root)
        
      root.node.computeWithMaxContent()
        
        UIView.animate(withDuration: 3, delay: 1, usingSpringWithDamping: 0.4, initialSpringVelocity: 5){
            root.setSizeHeight(0.3, 2)
            root.setSizeWidth(0.3, 2)
            root.backgroundColor = .red
          root.node.computeWithMaxContent()
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

    a.backgroundColor = childBg
   // a.setBackgroundColor(ui: childBg!)
    a.configure { node in
      node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    let b  = mason.createView()
    b.backgroundColor = .orange
    let bText  = mason.createTextView()
    bText.text = "B"
    bText.backgroundColor = .green
   // b.setBackgroundColor(ui: childBg!)
    bText.configure { node in
     node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
   
    b.addSubview(bText)
    
   
    let c  = mason.createTextView()
    c.text = "C"
    c.setBackgroundColor(ui: childBg!)
    c.configure { node in
   //   node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    let d  = mason.createTextView()
    d.text = "A"
    d.setBackgroundColor(ui: childBg!)
    d.configure { node in
    //  node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
    
    
    let e  = mason.createTextView()
    e.text = "E"
    e.setBackgroundColor(ui: childBg!)
    e.configure { node in
     // node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
    }
   
    let f  = mason.createTextView()
    f.text = "F"
    f.setBackgroundColor(ui: childBg!)
    f.configure { node in
     // node.style.padding = MasonRect<MasonLengthPercentage>(uniform: MasonLengthPercentage.Points(20 * scale))
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
      if(!cell.setup){
        cell.setupView(mason)
      }
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
            return CGSizeMake(collectionView.frame.width, CGFloat(layout.height / scale))
        }
        
      let layout = cell.containerView.node.layout()
        
        
        return CGSizeMake(CGFloat(layout.width / scale), CGFloat(layout.height / scale))
    }
    
    
    
    func testLayout(){
      let root = mason.createView()
        
        root.configure { mason in
            mason.style.alignContent = .Stretch
            mason.style.alignItems = .Center
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .Start
            mason.style.display = .Flex
            
//            mason.style.size = MasonSize(MasonDimension.Points(Float(view.bounds.size.width) * scale), MasonDimension.Points(Float(view.bounds.size.height) * scale))
            
        }
        
        
        
        let text0 = UILabel(frame: .zero)
        text0.text = "Test"
      mason.nodeForView(text0).configure { node in
            text0.textColor = .white
        }
        
        root.addSubview(text0)
        
        
        
        let text1 = UILabel(frame: .zero)
        text1.text = "Top Left"
      mason.nodeForView(text1).configure { node in
            node.style.position = .Absolute
            node.style.leftInset = .Points(0)
            node.style.topInset = .Points(0)
            text1.backgroundColor = .blue
            text1.textColor = .white
        }
        
        textTopLeft = text1
        
        root.addSubview(text1)
        
        
        
        let text2 = UILabel(frame: .zero)
        text2.text = "Top Right"
      mason.nodeForView(text2).configure { node in
            node.style.position = .Absolute
            node.style.rightInset = .Points(0)
            node.style.topInset = .Points(0)
            text2.backgroundColor = .blue
            text2.textColor = .white
        }
        
        textTopRight = text2
        
        root.addSubview(text2)
        
        
        
        
        let text3 = UILabel(frame: .zero)
        text3.text = "Bottom Left"
      mason.nodeForView(text3).configure { node in
            node.style.position = .Absolute
            node.style.leftInset = .Points(0)
            node.style.bottomInset = .Points(0)
            text3.backgroundColor = .blue
            text3.textColor = .white
        }
        
        textBottomLeft = text3
        
        root.addSubview(text3)
        
        
        
        let text4 = UILabel(frame: .zero)
        text4.text = "Bottom Right"
      mason.nodeForView(text4).configure { node in
            node.style.position = .Absolute
            node.style.rightInset = .Points(0)
            node.style.bottomInset = .Points(0)
            text4.backgroundColor = .blue
            text4.textColor = .white
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
        
        
        let text5 = UILabel(frame: .zero)
        text5.text = "Nested TextView in mason"
      mason.nodeForView(text5).configure { node in

        }
        
        view1.addSubview(text5)
        
        root.addSubview(view1)
        
        
        //  masonView.mason.computeWithViewSize()
        
        
        let text6 = UILabel(frame: .zero)
        text6.text = "Hello this"
      mason.nodeForView(text6).configure { node in
            text6.textColor = .white
            text6.backgroundColor = .red
        }
        
        root.addSubview(text6)
        
        let text7 = UILabel(frame: .zero)
        text7.text = " is the new"
      mason.nodeForView(text7).configure { node in
            text7.backgroundColor = .green
        }
        
        root.addSubview(text7)
        
        let text8 = UILabel(frame: .zero)
        text8.text = " layout"
      mason.nodeForView(text8).configure { node in
            text8.backgroundColor = .orange
        }
        
        root.addSubview(text8)
        
        
        let text9 = UILabel(frame: .zero)
        text9.text = " powered by taffy"
      mason.nodeForView(text9).configure { node in
            text9.backgroundColor = .blue
            text9.textColor = .white
        }
        
        root.addSubview(text9)
        
        
        let view2 = mason.createView()
        view2.backgroundColor = .white
       
        
        let view3 = mason.createView()
        view3.backgroundColor = .white

        
        let text10 = UILabel(frame: .zero)
        text10.text = "Hello World Nested"
      mason.nodeForView(text10).configure { node in
        }
        
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
                    root.node.computeWithSize(Float(self.view.bounds.size.width) * self.scale, Float(self.view.bounds.size.height) * self.scale)
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
            
            if hexColor.count == 8 {
                let scanner = Scanner(string: hexColor)
                var hexNumber: UInt64 = 0
                
                if scanner.scanHexInt64(&hexNumber) {
                    r = CGFloat((hexNumber & 0xff000000) >> 24) / 255
                    g = CGFloat((hexNumber & 0x00ff0000) >> 16) / 255
                    b = CGFloat((hexNumber & 0x0000ff00) >> 8) / 255
                    a = CGFloat(hexNumber & 0x000000ff) / 255
                    
                    self.init(red: r, green: g, blue: b, alpha: a)
                    return
                }
            }
        }
        
        return nil
    }
}
