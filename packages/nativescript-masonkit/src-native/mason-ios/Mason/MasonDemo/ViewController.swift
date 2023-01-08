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
    
    var masonView: UIView? = nil
    
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
    
    override func viewSafeAreaInsetsDidChange() {
        let left = Float(self.view.safeAreaInsets.left) * scale
        let right = Float(self.view.safeAreaInsets.right) * scale
        let top = Float(self.view.safeAreaInsets.top) * scale
        let bottom = Float(self.view.safeAreaInsets.bottom) * scale
        
        masonView?.mason.style.inset = MasonRect(
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
        
        masonView?.mason.computeWithMaxContent()
        
        
    }
    
    
    override func viewDidLoad() {
        super.viewDidLoad()
        var i = 0
        repeat {
            items.append("https://robohash.org/\(i + 1)?set=set4")
            i+=1
        } while i < 1000
        
        
        
        let sv = UIScrollView(frame: view.bounds)
        
        view!.addSubview(sv)
        
        self.masonView = UIView(frame: sv.bounds)
        guard let masonView = self.masonView else {return}
        sv.addSubview(masonView)
        
        
        
        /*
         .parent {
         display: grid;
         grid-template-columns: repeat(5, 1fr);
         grid-template-rows: repeat(5, 1fr);
         grid-column-gap: 0px;
         grid-row-gap: 0px;
         }

         .div1 { grid-area: 1 / 1 / 2 / 2; }
         .div2 { grid-area: 1 / 5 / 2 / 6; }
         .div3 { grid-area: 3 / 3 / 4 / 4; }
         .div4 { grid-area: 5 / 1 / 6 / 2; }
         .div5 { grid-area: 5 / 5 / 6 / 6; }

         
         */
        
        
        masonView.configure { node in
            node.isEnabled = true
            node.style.display = .Grid
            node.style.gridTemplateColumns = [
                TrackSizingFunction.Single(.Flex(flex: 1)),
                TrackSizingFunction.Single(.Flex(flex: 1)),
                TrackSizingFunction.Single(.Flex(flex: 1)),
                TrackSizingFunction.Single(.Flex(flex: 1)),
                TrackSizingFunction.Single(.Flex(flex: 1))
            ]
            
            node.style.gridTemplateRows = [
                TrackSizingFunction.Single(.Flex(flex: 1)),
                TrackSizingFunction.Single(.Flex(flex: 1)),
                TrackSizingFunction.Single(.Flex(flex: 1)),
                TrackSizingFunction.Single(.Flex(flex: 1)),
                TrackSizingFunction.Single(.Flex(flex: 1))
            ]
            
            node.style.gap = MasonSize(.Points(0), .Points(0))
            
        }
        
        
        let view1 = UIView(frame: .zero)
        view1.configure { node in
            node.isEnabled = true
            node.style.gridRow = Line<GridPlacement>(.Line(1),.Line(2))
            node.style.gridColumn = Line<GridPlacement>(.Line(1),.Line(2))
        }
        
        let label1 = UILabel(frame: .zero)
        label1.mason.isEnabled = true
        label1.text = "1"
        view1.addSubview(label1)
        
        let view2 = UIView(frame: .zero)
        
  
        view2.configure { node in
            node.isEnabled = true
            node.style.gridRow = Line<GridPlacement>(.Line(1),.Line(2))
            node.style.gridColumn = Line<GridPlacement>(.Line(5),.Line(6))
        }
        
        let label2 = UILabel(frame: .zero)
        label2.mason.isEnabled = true
        label2.text = "2"
        view2.addSubview(label2)
        
        let view3 = UIView(frame: .zero)
        
        view3.configure { node in
            node.isEnabled = true
            node.style.gridRow = Line<GridPlacement>(.Line(3),.Line(4))
            node.style.gridColumn = Line<GridPlacement>(.Line(3),.Line(4))
        }
        
        let label3 = UILabel(frame: .zero)
        label3.mason.isEnabled = true
        label3.text = "3"
        view3.addSubview(label3)
        
        
        let view4 = UIView(frame: .zero)
        
        view4.configure { node in
            node.isEnabled = true
            node.style.gridRow = Line<GridPlacement>(.Line(5),.Line(6))
            node.style.gridColumn = Line<GridPlacement>(.Line(1),.Line(2))
        }
        
        let label4 = UILabel(frame: .zero)
        label4.mason.isEnabled = true
        label4.text = "4"
        view4.addSubview(label4)
        
        let view5 = UIView(frame: .zero)
        
        view5.configure { node in
            node.isEnabled = true
            node.style.gridRow = Line<GridPlacement>(.Line(5),.Line(6))
            node.style.gridColumn = Line<GridPlacement>(.Line(5),.Line(6))
        }
        
        let label5 = UILabel(frame: .zero)
        label5.mason.isEnabled = true
        label5.text = "5"
        view5.addSubview(label5)
        
        masonView.addSubview(view1)
        masonView.addSubview(view2)
        masonView.addSubview(view3)
        masonView.addSubview(view4)
        masonView.addSubview(view5)
        
        
        masonView.mason.computeMaxContent()
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
        guard let masonView = masonView else {return}
        
        masonView.mason.configure { mason in
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
        
        masonView.addSubview(text0)
        
        
        
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
        
        masonView.addSubview(text1)
        
        
        
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
        
        masonView.addSubview(text2)
        
        
        
        
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
        
        masonView.addSubview(text3)
        
        
        
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
        
        masonView.addSubview(text4)
        
        
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
        
        
        masonView.addSubview(view0)
        
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
        
        masonView.addSubview(view1)
        
        
        //  masonView.mason.computeWithViewSize()
        
        
        let text6 = UILabel(frame: .zero)
        text6.text = "Hello this"
        text6.configure { node in
            node.isEnabled = true
            text6.textColor = .white
            text6.backgroundColor = .red
        }
        
        masonView.addSubview(text6)
        
        let text7 = UILabel(frame: .zero)
        text7.text = " is the new"
        text7.configure { node in
            node.isEnabled = true
            text7.backgroundColor = .green
        }
        
        masonView.addSubview(text7)
        
        let text8 = UILabel(frame: .zero)
        text8.text = " layout"
        text8.configure { node in
            text8.backgroundColor = .orange
            node.isEnabled = true
        }
        
        masonView.addSubview(text8)
        
        
        let text9 = UILabel(frame: .zero)
        text9.text = " powered by taffy"
        text9.configure { node in
            text9.backgroundColor = .blue
            text9.textColor = .white
            node.isEnabled = true
        }
        
        masonView.addSubview(text9)
        
        
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
        
        masonView.addSubview(view2)
        
        let imageView1 = UIImageView(frame: .zero)
        imageView1.mason.isEnabled = true
        
        masonView.addSubview(imageView1)
        
        masonView.mason.computeWithMaxContent()
        
        
        
        DispatchQueue.global().async { [self] in
            do {
                let data = try Data(contentsOf: URL(string: "https://hips.hearstapps.com/digitalspyuk.cdnds.net/17/19/1494434353-deadpool.jpg")!)
                
                let side = CGFloat(500 / scale)
                
                let image = resizeImage(UIImage(data: data)!, CGSize(width: side, height: side))
                
                DispatchQueue.main.async {
                    imageView1.image = image
                    masonView.mason.computeWithMaxContent()
                }
            }catch{
                print(error)
            }
        }
    
    }
    
    
}

