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
        
        let masonView = MasonView(frame: view.frame)
        masonView.style.alignContent = .Stretch
        masonView.style.alignItems = .Center
        masonView.style.alignSelf = .Auto
        masonView.style.flexDirection = .Column
        masonView.style.justifyContent = .FlexStart
        
        masonView.backgroundColor = .red
        
        let child1 = MasonView(frame: .zero)
        child1.backgroundColor = .green
        child1.style.flexDirection = .Column
        child1.style.justifyContent = .FlexStart
        
        
        
        let child2 = MasonView(frame: .zero)
        child2.backgroundColor = .blue
        child2.style.flexDirection = .Column
        child2.style.justifyContent = .FlexStart
        
        
        let child3 = MasonView(frame: .zero)
        child3.backgroundColor = .orange
        child3.style.flexDirection = .Column
        child3.style.justifyContent = .FlexStart
        
        
        let child4 = MasonView(frame: .zero)
        child4.backgroundColor = .purple
        
        child4.style.flexDirection = .Column
        child4.style.justifyContent = .FlexStart

        masonView.addSubview(child1)
        masonView.addSubview(child2)
        masonView.addSubview(child3)
        masonView.addSubview(child4)
        
        
        let text1 = UILabel(frame: .zero)
        text1.text = "First Child"
        
        child1.addSubview(text1)
        
        
        let text2 = UILabel(frame: .zero)
        text2.text = "Second Child"
        child2.addSubview(text2)
        
        
        let text3 = UILabel(frame: .zero)
        text3.text = "Third Child"
        child3.addSubview(text3)
        
        
        let text4 = UILabel(frame: .zero)
        text4.text = "Fourth Child"
        child4.addSubview(text4)
        
        
        let image1 = UIImageView(frame: view.frame)
        image1.contentMode = .scaleAspectFill
        
        let image2 = UIImageView(frame: view.frame)
        image2.contentMode = .scaleAspectFill
        
        let image3 = UIImageView(frame: view.frame)
        image3.contentMode = .scaleAspectFill
        
        let image4 = UIImageView(frame: view.frame)
        image4.contentMode = .scaleAspectFill
        
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
        child1.addSubview(image1)
        child2.addSubview(image2)
        child3.addSubview(image3)
        child4.addSubview(image4)
        
    
        
        view.addSubview(masonView)
        
        print("end", CACurrentMediaTime() - start)
        
    }


}

