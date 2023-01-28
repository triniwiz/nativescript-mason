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
    
    
    class DefaultCellView: UICollectionViewCell {
        let containerView: UIView
        let listTextView: UILabel
        let listImageView: UIImageView
        
        override func prepareForReuse() {
            super.prepareForReuse()
            listTextView.text = nil
            listImageView.image = nil
        }
        
        override init(frame: CGRect) {
            let scale = Float(UIScreen.main.scale)
            let container = UIView(frame: frame)
            container.configure { node in
                node.isEnabled = true
                node.style.alignItems = .Center
                node.style.flexDirection = .Column
                node.style.size = MasonSize(MasonDimension.Points(Float(frame.size.width) * scale), MasonDimension.Points(Float(frame.size.height) * scale))
            }
            
            let label0 = UILabel(frame: .zero)
            label0.mason.isEnabled = true
            
            let label1 = UILabel(frame: .zero)
            label1.mason.isEnabled = true
            label1.text = "Laffy Taffy!!!!"
            
            let image0 = UIImageView(frame: .zero)
            image0.mason.isEnabled = true
            
            containerView = container
            listTextView = label0
            listImageView = image0
            
            container.addSubview(label0)
            container.addSubview(label1)
            container.addSubview(image0)
            
            
            super.init(frame:frame)
            backgroundColor = .clear
            
            
            contentView.addSubview(container)
        }
        
        required init?(coder: NSCoder) {
            fatalError("init(coder:) has not been implemented")
        }
    }
    
    override func viewDidAppear(_ animated: Bool) {
        view?.mason.computeWithMaxContent()
        view?.frame.origin.x += view.safeAreaInsets.left
        view?.frame.origin.y += view.safeAreaInsets.top
    }
    
    override func viewSafeAreaInsetsDidChange() {
        /*
        let left = Float(self.view.safeAreaInsets.left) * scale
        let right = Float(self.view.safeAreaInsets.right) * scale
        let top = Float(self.view.safeAreaInsets.top) * scale
        let bottom = Float(self.view.safeAreaInsets.bottom) * scale
        
        guard let rootView = rootView else {return}
        
    
        rootView.mason.style.inset = MasonRect(
            .Points(left),
            .Points(right),
            .Points(top),
            .Points(bottom)
        )
        
        textTopLeft?.configure({ mason in
            mason.style.topInset = .Points(top)
        })
        
        textTopRight?.configure({ mason in
            mason.style.topInset = .Points(top)
        })
        
        textBottomLeft?.configure({ mason in
            mason.style.bottomInset = .Points(bottom)
        })
        
        textBottomRight?.configure({ mason in
            mason.style.bottomInset = .Points(bottom)
        })
        
         view.mason.computeWithMaxContent()
        
        */
        
    }
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        var i = 0
        repeat {
            items.append("https://robohash.org/\(i + 1)?set=set4")
            i+=1
        } while i < 1000
        
        
        //testLayout()
        
      showFlexExample()
        
      //  showGridExample()
    }
    
    func showFlexExample(){
        view.subviews.forEach { view in
            view.removeFromSuperview()
        }
        
        let root =  view!
        root.backgroundColor = .black
        root.configure({ node in
            node.isEnabled = true
            node.style.flexDirection = .Column
            node.style.size = MasonSize(.Points(scale * Float(view.bounds.width)), .Points(scale * Float(view.bounds.height)))
        })
        
        let childA = UIView()
        childA.configure { node in
            node.isEnabled = true
            node.style.size =  MasonSize(.Points( scale * 100), .Points( scale * 100))
            childA.backgroundColor = .red
        }
        
        
        let childB = UIView()
        
        childB.configure { node in
            node.isEnabled = true
            node.style.size =  MasonSize(.Points( scale * 100), .Points( scale * 100))
            childB.backgroundColor = .blue
        }
        
        root.addSubview(childA)
        root.addSubview(childB)
    
        root.mason.computeWithMaxContent()
        
        print(root.mason.layout())

    }
    
    
    func showGridExample(){
        view.subviews.forEach { view in
            view.removeFromSuperview()
        }
        
        let childBg = UIColor(hex: "#444444FF")
        let root = view!
        root.backgroundColor = .white
        root.configure({ node in
            node.isEnabled = true
            node.style.display = .Grid
            node.style.size = MasonSize(.Points(scale * Float(view.bounds.width)), .Points(scale * Float(view.bounds.height)))
            
            node.style.gap = MasonSize(.Points(scale * 10), .Points(scale * 10))
            node.style.gridTemplateColumns = [
                TrackSizingFunction.Single(MinMax.Points(points: scale * 100)),
                TrackSizingFunction.Single(MinMax.Points(points: scale * 100)),
                TrackSizingFunction.Single(MinMax.Points(points: scale * 100))
            ]
            
        })
        
        let childA = UILabel(frame: .zero)
        childA.text = "A"
        childA.configure { node in
            node.isEnabled = true
            childA.mason.includeInLayout = false
            
            node.style.gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(3))
            node.style.gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(1))
            childA.backgroundColor = .red
        }
        
        
        let childB = UILabel(frame: .zero)
        childB.text = "B"
        childB.configure { node in
            node.isEnabled = true
            node.style.gridColumn = Line(GridPlacement.Line(3), GridPlacement.Line(3))
            node.style.gridRow = Line(GridPlacement.Line(1), GridPlacement.Line(3))
            childB.backgroundColor = childBg
        }
        
        let childC = UILabel(frame: .zero)
        childC.text = "C"
        childC.configure { node in
            node.isEnabled = true
            node.style.gridColumn = Line(GridPlacement.Line(1), GridPlacement.Line(1))
            node.style.gridRow = Line(GridPlacement.Line(2), GridPlacement.Line(2))
            childC.backgroundColor = childBg
        }
        
        let childD = UILabel(frame: .zero)
        childD.text = "D"
        childD.configure { node in
            node.isEnabled = true
            node.style.gridColumn = Line(GridPlacement.Line(2), GridPlacement.Line(2))
            node.style.gridRow = Line(GridPlacement.Line(2), GridPlacement.Line(2))
            childD.backgroundColor = childBg
        }
        
    
        root.addSubview(childA)
        root.addSubview(childB)
        root.addSubview(childC)
        root.addSubview(childD)
        
        root.mason.computeWithMaxContent()
    
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
                    cell.containerView.mason.computeWithMaxContent()
                }
            }catch{}
        }
        return cell
    }
    
    func collectionView(_ collectionView: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {
        (cell as! DefaultCellView).containerView.mason.computeWithMaxContent()
    }
    
    
    func collectionView(_ collectionView: UICollectionView, layout collectionViewLayout: UICollectionViewLayout, sizeForItemAt indexPath: IndexPath) -> CGSize {
        guard let cell = collectionView.cellForItem(at: indexPath) else {
            let layout = collectionView.mason.layout()
            return CGSizeMake(collectionView.frame.width, CGFloat(layout.height / scale))
        }

        let layout = cell.mason.layout()
   
        
        return CGSizeMake(CGFloat(layout.width / scale), CGFloat(layout.height / scale))
    }
    
    
    
    func testLayout(){
        let root = view!
        
        root.configure { mason in
            mason.isEnabled = true
            mason.style.alignContent = .Stretch
            mason.style.alignItems = .Center
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .Start
            mason.style.display = .Flex

            mason.style.size = MasonSize(MasonDimension.Points(Float(view.bounds.size.width) * scale), MasonDimension.Points(Float(view.bounds.size.height) * scale))
        
        }
        
        
        
        let text0 = UILabel(frame: .zero)
        text0.text = "Test"
        text0.configure { node in
            node.isEnabled = true
            text0.textColor = .white
        }
        
        root.addSubview(text0)
        
        
        
        let text1 = UILabel(frame: .zero)
        text1.text = "Top Left"
        text1.configure { node in
            node.isEnabled = true
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
        text2.configure { node in
            node.isEnabled = true
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
        text3.configure { node in
            node.isEnabled = true
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
        text4.configure { node in
            node.isEnabled = true
            node.style.position = .Absolute
            node.style.rightInset = .Points(0)
            node.style.bottomInset = .Points(0)
            text4.backgroundColor = .blue
            text4.textColor = .white
        }
        
        textBottomRight = text4
        
        root.addSubview(text4)
        
        
        let view0 = UIView(frame: .zero)
        
        view0.configure { mason in
            mason.isEnabled = true
            mason.style.size = MasonSize(MasonDimension.Percent(1), MasonDimension.Auto)
        }
        
        let layout = UICollectionViewFlowLayout()
        layout.scrollDirection = .vertical
    
        let list = UICollectionView(frame: .zero, collectionViewLayout: layout)
        

        list.configure { mason in
            mason.isEnabled = true
           mason.style.size =  MasonSize(MasonDimension.Percent(1), MasonDimension.Points(300 * scale))
        }
        
        list.register(DefaultCellView.self, forCellWithReuseIdentifier: "default")
        
        
        self.list = list
        
        list.dataSource = self
        list.delegate = self
        
        
        root.addSubview(view0)
        
        view0.addSubview(list)
        
        
        let view1 = UIView(frame: .zero)
        view1.backgroundColor = .green
        view1.mason.isEnabled = true
        
        
        let text5 = UILabel(frame: .zero)
        text5.text = "Nested TextView in mason"
        text5.configure { node in
            node.isEnabled = true
        }
        
        view1.addSubview(text5)
        
        root.addSubview(view1)
        
        
        //  masonView.mason.computeWithViewSize()
        
        
        let text6 = UILabel(frame: .zero)
        text6.text = "Hello this"
        text6.configure { node in
            node.isEnabled = true
            text6.textColor = .white
            text6.backgroundColor = .red
        }
        
        root.addSubview(text6)
        
        let text7 = UILabel(frame: .zero)
        text7.text = " is the new"
        text7.configure { node in
            node.isEnabled = true
            text7.backgroundColor = .green
        }
        
        root.addSubview(text7)
        
        let text8 = UILabel(frame: .zero)
        text8.text = " layout"
        text8.configure { node in
            text8.backgroundColor = .orange
            node.isEnabled = true
        }
        
        root.addSubview(text8)
        
        
        let text9 = UILabel(frame: .zero)
        text9.text = " powered by taffy"
        text9.configure { node in
            text9.backgroundColor = .blue
            text9.textColor = .white
            node.isEnabled = true
        }
        
        root.addSubview(text9)
        
        
        let view2 = UIView(frame: .zero)
        view2.backgroundColor = .white
        view2.mason.isEnabled = true
        
        let view3 = UIView(frame: .zero)
        view3.backgroundColor = .white
        view3.mason.isEnabled = true
        
        let text10 = UILabel(frame: .zero)
        text10.text = "Hello World Nested"
        text10.configure { node in
            node.isEnabled = true
        }
        
        view3.addSubview(text10)
        
        view2.addSubview(view3)
        
        root.addSubview(view2)
        
        let imageView1 = UIImageView(frame: .zero)
        imageView1.mason.isEnabled = true
        
        root.addSubview(imageView1)
        
        root.mason.computeWithMaxContent()
        
        
        DispatchQueue.global().async { [self] in
            do {
                let data = try Data(contentsOf: URL(string: "https://hips.hearstapps.com/digitalspyuk.cdnds.net/17/19/1494434353-deadpool.jpg")!)
                
                let side = CGFloat(500 / scale)
                
                let image = resizeImage(UIImage(data: data)!, CGSize(width: side, height: side))
                
                DispatchQueue.main.async {
                    imageView1.image = image
                    root.mason.computeWithMaxContent()
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
