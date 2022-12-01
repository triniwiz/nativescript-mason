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
        
        let masonView = self.view!
        masonView.mason.configure { mason in
            mason.isEnabled = true
            mason.style.alignContent = .Stretch
            mason.style.alignItems = .Center
            mason.style.alignSelf = .Auto
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .FlexStart
        }
    
        masonView.backgroundColor = .red
        
        let scale = Float(UIScreen.main.scale)
        
        let child1 = UIView(frame: .zero)
        child1.mason.configure { mason in
            mason.isEnabled = true
            child1.backgroundColor = .green
            mason.style.flexDirection = .Column
            mason.style.justifyContent = .FlexStart
           // mason.style.size = MasonSize(MasonDimension.Points(100 * scale), MasonDimension.Points(100 * scale))
        }
    
        
        let child2 = UIView(frame: .zero)
        child2.mason.isEnabled = true
        child2.backgroundColor = .blue
        child2.style.flexDirection = .Column
        child2.style.justifyContent = .FlexStart
        
        
        let child3 = UIView(frame: .zero)
        child3.mason.isEnabled = true
        child3.backgroundColor = .orange
        child3.style.flexDirection = .Column
        child3.style.justifyContent = .FlexStart
        
        
        let child4 = UIView(frame: .zero)
        child4.mason.isEnabled = true
        child4.backgroundColor = .purple
        
        child4.style.flexDirection = .Column
        child4.style.justifyContent = .FlexStart

        masonView.addSubview(child1)
        masonView.addSubview(child2)
        masonView.addSubview(child3)
        masonView.addSubview(child4)
        
        
        let text1 = UILabel(frame: .zero)
        text1.text = "First Child"
        text1.mason.isEnabled = true
    
        
     //   child1.addSubview(text1)
        
        
        let text2 = UILabel(frame: .zero)
        text2.text = "Second Child"
     //   child2.addSubview(text2)
        
        
        let text3 = UILabel(frame: .zero)
        text3.text = "Third Child"
      //  child3.addSubview(text3)
        
        
        let text4 = UILabel(frame: .zero)
        text4.text = "Fourth Child"
     //   child4.addSubview(text4)
        
        
        let image1 = UIImageView(frame: view.frame)
        image1.contentMode = .scaleAspectFill
        
        let image2 = UIImageView(frame: view.frame)
        image2.contentMode = .scaleAspectFill
        
        let image3 = UIImageView(frame: view.frame)
        image3.contentMode = .scaleAspectFill
        
        let image4 = UIImageView(frame: view.frame)
        image4.contentMode = .scaleAspectFill
        
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
                    
                }
            }catch{}
        }
        */
        
       // child1.addSubview(image1)
       // child2.addSubview(image2)
       // child3.addSubview(image3)
      //  child4.addSubview(image4)
        
        print("root", masonView)
        
        masonView.mason.computeWithViewSize()
        
        print("root", masonView)
        
        print("end", CACurrentMediaTime() - start)
        
    }


}

