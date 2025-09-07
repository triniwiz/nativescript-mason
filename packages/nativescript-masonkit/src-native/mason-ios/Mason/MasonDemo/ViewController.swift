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
      
      containerView.addView(listTextView)
      containerView.addView(label1)
      containerView.addView(listImageView)
      
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
    print("=== textSample() STARTING ===")
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
  var data:Data!
  override func viewDidLoad() {
    print("=== viewDidLoad() STARTING ===")
    //  super.viewDidLoad()
    //        var i = 0
    //        repeat {
    //            items.append("https://robohash.org/\(i + 1)?set=set4")
    //            i+=1
    //        } while i < 1000
    
//    container.node.style.size = .init(.Points(Float(view.bounds.width * UIScreen.main.scale)), (.Points(Float(view.bounds.height * UIScreen.main.scale))))
    container.setSize(Float(view.bounds.width * UIScreen.main.scale), Float(view.bounds.height * UIScreen.main.scale))
   //  container.frame = view.bounds
    
    view.addSubview(container)
    
    
   // let root = mason.createView()
   // container.addView(root)
    
    /*
    
    let text = mason.createTextView(type: .Pre)
    root.addView(text)
    text.text = """
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
    
    
    root.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
    
    
    */
    
  // imageTest()
    
    
     //textSample()
    
    //flexIssue()
    
    // testLayout()
    
    //  showFlexExample()
    
    // showGridExample()
    // animationExample()
    
   //wrapper5()
   // wrapper6()
    
    
     imageExample()
     //textSample()
     // gridSample()
    
      //testLateUpdate()
    
   // scrollTest()
    
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
  
  func scrollTest(){
    let root = mason.createScrollView()
    root.configure { node in
      node.style.size = MasonSize(.Percent(1), .Percent(1))
      node.style.overflow = MasonPoint(Overflow.Scroll, Overflow.Scroll)
    }
    container.addView(root)
    
    
    let txt = mason.createTextView()
    
    txt.text = """
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
    txt2.text = "Duis ornare ut nulla ac dignissim. Morbi ac orci a ante lacinia ultricies. Donec nec eleifend eros. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Praesent eget turpis erat. Aliquam faucibus ullamcorper risus cursus feugiat. Etiam ac feugiat mauris, sit amet ornare ipsum. Ut a malesuada lectus, non consequat quam. Vestibulum quis molestie augue. Sed id dolor ac dui vehicula tempus. Nam sed pellentesque ipsum."
  

    root.addView(txt2)
    
    root.addView(txt)
    
    container.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
    
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
    img.node.style.marginBottom = .Points(10)
    img.src = "https://picsum.photos/600/600"
    
    root.addView(img)
    
    
    let view = mason.createView()
    view.node.style.size = MasonSize(.Points(400), .Points(400))
    view.backgroundColor = .purple
    
   // root.addView(view)
    
    let txtView = mason.createTextView()
    
    txtView.text = "Hello World"
 
    view.addView(txtView)
    
    txt.addView(view)
    
    root.addView(txt)
    
    
    let txting = mason.createTextView()
    txting.whiteSpace = .Nowrap
    txting.textWrap = .NoWrap
    
    txting.text = " inlining this thing "
    
    txt.addView(txting)
    
  
  
    root.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
    
    UIView.animate(withDuration: 3, delay: 1, usingSpringWithDamping: 0.4, initialSpringVelocity: 5){
      img.configure { node in
        node.style.setSizeHeight(0.3, 2)
        node.style.setSizeWidth(0.3, 2)
      }
      
      
      root.requestLayout()
    }
  
  
    
    
//    UIView.animate(withDuration: 3, delay: 1, usingSpringWithDamping: 0.4, initialSpringVelocity: 5){
//      img.configure { node in
//        node.style.size = MasonSize(.Points(200), .Points(200))
//      }
//    }
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
    
    root.configure { node in
      node.style.marginTop = .Points(200)
      node.style.marginLeft = .Points(10)
    }
    
    root.backgroundColor = .red
    
    container.addView(root)
    
    let text = mason.createTextView()
    text.tag = 100

    root.addView(text)
   // text.textWrap = .Wrap
    // text.setBackgroundColor(ui: .cyan)
    
    let text2 = mason.createTextView()
    text2.whiteSpace = .PreLine

    text.addView(text2)
  

    container.node.computeWithSize(scale * Float(container.bounds.width), scale * Float(container.bounds.height))
    
    text.updateText("Hello World \n Lorem ipsum dolor sit amet, consectetur adipiscing elit. Ut nisi est, iaculis non tellus in, molestie finibus tellus. Integer pulvinar eget massa vel porta. Mauris porttitor felis id dictum egestas. Donec eget venenatis massa, auctor porta elit. Quisque augue urna, eleifend id augue nec, eleifend venenatis felis. Etiam eget magna ac magna feugiat ultricies a eu massa. Maecenas iaculis pellentesque neque, sit amet faucibus magna malesuada et. Morbi sit amet rhoncus nunc. In ultricies urna ac pulvinar consequat. Vivamus feugiat sed elit quis efficitur. Etiam erat magna, sodales consectetur velit eu, fermentum condimentum ex. Nulla rhoncus ligula ac ipsum hendrerit, non tristique tortor pharetra. Pellentesque eu urna turpis. Aliquam sed enim mauris.")
    
    
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
  
  func imageExample(){
    print("=== imageExample() STARTING ===")
    let root = mason.createView()
    root.configure { node in
      node.style.marginTop = .Points(300)
      node.style.marginLeft = .Points(100)
    }
    container.addView(root)
    
    let txt = mason.createTextView()
    txt.backgroundColor = .orange
    
    txt.text = "Hello"
    print("=== Setting text: Hello ===")
    
    let image = mason.createImageView()
    
    image.style.sizeCompatWidth = MasonDimensionCompat(percent: 1)
    
    let view = container.mason.createView()
    view.backgroundColor = .red
    view.style.size = MasonSize(uniform: .Points(300))
    
    print("=== Adding inline red view (100x100) ===")
    txt.addView(view)
    
    
    let txt2 = mason.createTextView()
    
    txt2.text = "Is it working ?"
    
    
    let txt3 = mason.createTextView()
    txt3.backgroundColor = .purple
    
    txt3.text = "HMM"
    print("=== Setting text: Hello ===")
    
    root.addView(txt)
    
    root.addView(txt2)
    
    root.addView(image)
    
    txt2.addView(txt3)
    
    root.backgroundColor = .yellow
    
    DispatchQueue.global().async { [self] in
      do {
        let data = try Data(contentsOf: URL(string: "https://picsum.photos/600/600")!)
        
        let side = CGFloat(300 / scale)
        
        let img = resizeImage(UIImage(data: data)!, CGSize(width: side, height: side))
        
        DispatchQueue.main.async {
          image.image = img
          self.mason.nodeForView(image).style.size = MasonSize(uniform: .Points(Float(side)))
          self.container.node.computeWithMaxContent()
          print("\n","txt",txt.node.computedLayout)
          print("\n","view",view.node.computedLayout)
        }
      }catch{
        print(error)
      }
    }
    
    
    
    
  }
  
  func createParentWith2Kids(_ kidAText: String, _ kidBText: String) -> MasonUIView {
    let parent = mason.createView()
    
    
    let kida = mason.createTextView()
    
    kida.text = kidAText
    
    let kidb = mason.createTextView()
    
    kidb.text = kidBText
    
    parent.addView(kida)
    
    parent.addView(kidb)
    
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
    
    container.addView(wrapper6)
    
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
    
    wrapper6.configure { node in
      node.style.display = .Grid
//      node.style.size = MasonSize(.Points(scale * Float(view.bounds.width)), .Points(scale * Float(view.bounds.height)))
      node.style.gap = MasonSize(.Points(10 ), .Points(10))
      node.style.gridTemplateColumns = [
        TrackSizingFunction.AutoRepeat(.Count(6), [.Points(points: 150 )])
      ]
      
      node.style.gridTemplateRows = [
        TrackSizingFunction.AutoRepeat(.Count(4), [.Points(points: 150 )])
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
    container.node.computeWithMaxContent()
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
    let root = mason.createView()
    container.addView(root)
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
    
    root.addView(child)
    
    let child1 = mason.createTextView()
    child1.backgroundColor = .green
    child1.updateText("1")
    
    child.addView(child1)
    
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
   
    
    let childBg = UIColor(hex: "#444444FF")
    let root = mason.createView()
    container.addView(root)
    
    
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
    
    root.addView(a)
    root.addView(b)
    root.addView(c)
    root.addView(d)
    root.addView(e)
    root.addView(f)
    
    
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
    root.backgroundColor = .lightGray
    container.addView(root)
    
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
    
    root.addView(text0)
    
    
    
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
    
    root.addView(text1)
    
    
    
    let text2 = mason.createTextView()
    text2.text = "Top Right"
    text2.configure { node in
      node.style.position = .Absolute
      node.style.rightInset = .Points(0)
      node.style.topInset = .Points(0)
      text2.backgroundColor = .blue
    }
    
    textTopRight = text2
    
    root.addView(text2)
    
    
    
    
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
    
    root.addView(text3)
    
    
    
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
    
    root.addView(text4)
    
    
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
    
    
    root.addView(view0)
    
    view0.addView(list)
    
    
    let view1 = mason.createView()
    view1.backgroundColor = .green
    
    
    let text5 = mason.createTextView()
    text5.text = "Nested TextView in mason"
    text5.backgroundColor = .yellow
    
    view1.addView(text5)
    
    root.addView(view1)
    
    
    //  masonView.mason.computeWithViewSize()
    
    
    let text6 = mason.createTextView()
    text6.text = "Hello this"
    text6.configure { node in
      text6.setColor(ui: .white)
      text6.backgroundColor = .red
    }
    
    root.addView(text6)
    
    let text7 = mason.createTextView()
    text7.text = " is the new"
    text7.configure { node in
      text7.backgroundColor = .green
    }
    
    root.addView(text7)
    
    let text8 = mason.createTextView()
    text8.text = " layout"
    text8.configure { node in
      text8.backgroundColor = .orange
    }
    
    root.addView(text8)
    
    
    let text9 = mason.createTextView()
    text9.text = " powered by taffy"
    text9.configure { node in
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
    text10.text = "Hello World Nested"
    
    view3.addView(text10)
    
    view2.addView(view3)
    
    root.addView(view2)
    
    let imageView1 = mason.createImageView()
    imageView1.backgroundColor = .yellow
    
    root.addView(imageView1)
    
    //  root.mason.computeWithMaxContent()
    
    
    // root.mason.computeWithSize(Float(view.bounds.size.width) * scale, Float(view.bounds.size.height) * scale)
    
    
    
    container.node.computeWithSize(Float(self.container.bounds.size.width) * self.scale, Float(self.container.bounds.size.height) * self.scale)
    
    
    
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
