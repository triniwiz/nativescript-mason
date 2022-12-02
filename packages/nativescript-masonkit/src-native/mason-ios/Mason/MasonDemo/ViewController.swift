//
//  ViewController.swift
//  MasonDemo
//
//  Created by Osei Fortune on 28/11/2022.
//

import UIKit
import Mason

class ViewController: UIViewController {
    

    override func viewDidLoad() {
        super.viewDidLoad()
        
        let start = CACurrentMediaTime()
        
        let scale = Float(UIScreen.main.scale)
        
        let sv = UIScrollView(frame: view.bounds)
        
        view!.addSubview(sv)
        
        let masonView = UIView(frame: sv.bounds)
        
        sv.addSubview(masonView)
        masonView.backgroundColor = .red
        masonView.mason.configure { mason in
            mason.isEnabled = true
            //mason.style.alignContent = .Stretch
            //mason.style.alignItems = .Stretch
            mason.style.alignSelf = .Stretch
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .FlexStart
           // mason.style.maxSize = MasonSize(MasonDimension.Points(Float(masonView.frame.size.width) * scale), MasonDimension.Points(Float(masonView.frame.size.height) * scale))
        }
    
        let child1 = UIView(frame: .zero)
        child1.backgroundColor = .green
        child1.mason.configure { mason in
            mason.isEnabled = true
            mason.style.alignSelf = .Stretch
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .FlexStart
            mason.style.size = MasonSizeMaxPercentWH
        }
    
        let child2 = UIView(frame: .zero)
        child2.backgroundColor = .blue
        child2.mason.configure { mason in
            mason.isEnabled = true
            mason.style.alignSelf = .Stretch
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .FlexStart
            mason.style.size = MasonSizeMaxPercentWH
        }
        
        let child3 = UIView(frame: .zero)
        child3.backgroundColor = .orange
        child3.mason.configure { mason in
            mason.isEnabled = true
            mason.style.alignSelf = .Stretch
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .FlexStart
            mason.style.size = MasonSizeMaxPercentWH
        }
        
        
        let child4 = UIView(frame: .zero)
        child4.mason.configure { mason in
            mason.isEnabled = true
            mason.style.alignSelf = .Stretch
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .FlexStart
            mason.style.size = MasonSizeMaxPercentWH
        }
        
        child4.backgroundColor = .purple

       // masonView.addSubview(child1)
      //  masonView.addSubview(child2)
      //  masonView.addSubview(child3)
      //  masonView.addSubview(child4)
        
        
        let text1 = UILabel(frame: .zero)
        text1.text = "First Child"
        text1.mason.isEnabled = true
        text1.setMargin(0, 10 * scale, 0, 10 * scale)

        let text11 = UILabel(frame: .zero)
        text11.text = "First Second Child"
        text11.mason.isEnabled = true
        text11.setMargin(0, 10 * scale, 0, 10 * scale)

        child1.addSubview(text1)
        child1.addSubview(text11)
        
        
        let text2 = UILabel(frame: .zero)
        text2.text = "Second Child"
        text2.mason.isEnabled = true
        text2.setMargin(0, 10 * scale, 0, 10 * scale)
        child2.addSubview(text2)
        
        
        
        let text3 = UILabel(frame: .zero)
        text3.text = "Third Child"
        text3.mason.configure { mason in
            mason.isEnabled = true
            text3.setMargin(0, 10 * scale, 0, 10 * scale)
        }
        child3.addSubview(text3)
        
        
        let text4 = UILabel(frame: .zero)
        text4.text = "Fourth Child"
        text4.mason.configure { mason in
            text4.mason.isEnabled = true
            text4.setMargin(0, 10 * scale, 0, 10 * scale)
        }
        child4.addSubview(text4)
        
        
        let image1 = UIImageView(frame: view.frame)
        image1.mason.configure { mason in
            mason.isEnabled = true
            //mason.style.alignSelf = .Center
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .FlexStart
        }
        
        image1.contentMode = .scaleAspectFit
        
        let image2 = UIImageView(frame: view.frame)
        image2.contentMode = .scaleAspectFit
            image2.mason.configure { mason in
                mason.isEnabled = true
               // mason.style.alignSelf = .Center
                mason.style.flexDirection = .Column
                mason.style.justifyContent = .FlexStart
            }
        
        let image3 = UIImageView(frame: view.frame)
        image3.contentMode = .scaleAspectFit
        image3.mason.configure { mason in
            mason.isEnabled = true
          //  mason.style.alignSelf = .Center
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .FlexStart
        }
        
        let image4 = UIImageView(frame: view.frame)
        image4.contentMode = .scaleAspectFit
        image4.mason.configure { mason in
            mason.isEnabled = true
           // mason.style.alignSelf = .Center
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .FlexStart
        }
        
        
        /*
        
        DispatchQueue.global(qos: .background).async {
            do {
                let img1 = UIImage(data:  try Data(contentsOf: URL(string: "https://picsum.photos/200/200")!))
                let img2 = UIImage(data:  try Data(contentsOf: URL(string: "https://picsum.photos/300/300")!))
                let img3 = UIImage(data:  try Data(contentsOf: URL(string: "https://picsum.photos/400/400")!))
                let img4 = UIImage(data:  try Data(contentsOf: URL(string: "https://picsum.photos/500/500")!))
                DispatchQueue.main.async {
                    image1.image = img1
                    image2.image = img2
                    image3.image = img3
                    image4.image = img4

                    masonView.mason.computeWithViewSize()
                    
                }
            }catch{}
        }
        
        */
        
        
        
        
     //  child1.addSubview(image1)
     //  child2.addSubview(image2)
     //  child3.addSubview(image3)
    //   child4.addSubview(image4)
        

        print("root", masonView)
        
       // masonView.mason.computeWithViewSize()
        
        print("root", masonView)
        
    
        
        print("end", CACurrentMediaTime() - start)
        
        
        
        let count = 1000
        
        var offset = CGFloat()
        for i in 0..<count {
            let view = UILabel(frame: .zero)
            view.text = "Some View \(i + 1)"
            /*
            let size = view.sizeThatFits(CGSizeMake(.infinity, .infinity))
            
            view.frame = CGRect(origin: .init(x: 0, y: offset), size: size)
        
            offset += size.height
             */
            view.mason.isEnabled = true
            //views.append(view)
            masonView.addSubview(view)
        }

        masonView.mason.isEnabled = true
        
        
        
        let test = CACurrentMediaTime()
        
        masonView.mason.computeWithViewSize()
        
        
     //   sv.contentSize = CGSizeMake(masonView.bounds.size.width, offset)
        
        sv.contentSize = masonView.frame.size
        
        print("big loop", ((CACurrentMediaTime() - test) / 1000))
     
        
    }


}

