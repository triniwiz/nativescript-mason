//
//  ViewController.swift
//  MasonDemo
//
//  Created by Osei Fortune on 28/11/2022.
//

import UIKit
import Mason

class ViewController: UIViewController, UICollectionViewDataSource, UICollectionViewDelegate, UICollectionViewDelegateFlowLayout, MasonList.MasonListDelegate, UIScrollViewDelegate {
  
  let scale = Float(UIScreen.main.scale)
  
  var items: [String] = []
  var olVirtualData: [String] = []
  weak var olList: MasonList?
  
  var textTopLeft: MasonText? = nil
  
  var textTopRight: MasonText? = nil
  
  var textBottomLeft: MasonText? = nil
  
  var textBottomRight: MasonText? = nil
  
  var list: UICollectionView? = nil
  
  let document = NSCMason.shared.createDocument()
  
  let body = NSCMason.shared.createScrollView()

  // Hacker News state
  var hnIds: [Int] = []
  var hnIndex: Int = 0
  var hnPageSize: Int = 10
  var hnLoading: Bool = false
  var hnContainer: Mason.MasonUIView? = nil
  var numericTimer: Timer?
  
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
    let left = Float(self.view.safeAreaInsets.left) * scale
    let right = Float(self.view.safeAreaInsets.right) * scale
    let top = Float(self.view.safeAreaInsets.top) * scale
    let bottom = Float(self.view.safeAreaInsets.bottom) * scale
    body.style.padding = MasonRect(.Points(top),.Points(right), .Points(bottom), .Points(left))
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
    
    
  //  body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
    
  }
  
  // MARK: - Web-like Text Sample

  func webTextSample() {
    let root = mason.createView()
    body.style.overflowY = .Scroll
    root.style.background = "#FAFBFC"

    // ============================================================
    // MARK: Hero Section with Full-Bleed Image
    // ============================================================
    let heroContainer = mason.createView()
    heroContainer.display = .Flex
    heroContainer.flexDirection = .Column
    heroContainer.style.setSizeWidth(1, 2) // 100%
    heroContainer.style.setSizeHeight(toPx(380), 1)
    heroContainer.style.position = .Relative

    // Hero background image
    let heroImageView = mason.createImageView()
    heroImageView.style.position = .Absolute
    heroImageView.style.inset = MasonRect(.Points(0), .Points(0), .Points(0), .Points(0))
    heroImageView.style.setSizeWidth(1, 2) // 100%
    heroImageView.style.setSizeHeight(1, 2) // 100%
    heroImageView.style.objectFit = .Cover
    loadImage("https://picsum.photos/800/600?random=1", imageInstance: heroImageView, parent: heroContainer)
    heroContainer.addView(heroImageView)

    // Gradient overlay
    let heroOverlay = mason.createView()
    heroOverlay.style.position = .Absolute
    heroOverlay.style.inset = MasonRect(.Points(0), .Points(0), .Points(0), .Points(0))
    heroOverlay.style.background = "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)"
    heroContainer.addView(heroOverlay)

    // Hero content
    let heroContent = mason.createView()
    heroContent.display = .Flex
    heroContent.flexDirection = .Column
    heroContent.style.justifyContent = .FlexEnd
    heroContent.style.position = .Absolute
    heroContent.style.inset = MasonRect(.Points(0), .Points(0), .Points(0), .Points(0))
    heroContent.style.padding = MasonRect(
      .Points(0),
      .Points(toPx(24)),
      .Points(toPx(32)),
      .Points(toPx(24))
    )

    let heroTag = mason.createTextView(type: .Span)
    heroTag.append(text: "FEATURED DESTINATION")
    heroTag.style.setColor(css: "#FFFFFF")
    heroTag.fontSize = 11
    heroTag.fontWeight = "600"
    heroTag.style.marginBottom = .Points(toPx(8))
    heroContent.addView(heroTag)

    let heroTitle = mason.createTextView(type: .H1)
    heroTitle.append(text: "Discover the World")
    heroTitle.style.setColor(css: "#FFFFFF")
    heroTitle.fontSize = 32
    heroTitle.fontWeight = "bold"
    heroTitle.style.marginBottom = .Points(toPx(8))
    heroContent.addView(heroTitle)

    let heroSubtitle = mason.createTextView(type: .P)
    heroSubtitle.append(text: "Explore breathtaking destinations and create unforgettable memories")
    heroSubtitle.style.setColor(css: "rgba(255,255,255,0.9)")
    heroSubtitle.fontSize = 16
    heroContent.addView(heroSubtitle)

    heroContainer.addView(heroContent)
    root.append(heroContainer)

    // ============================================================
    // MARK: Stats Bar
    // ============================================================
    let statsBar = mason.createView()
    statsBar.display = .Flex
    statsBar.flexDirection = .Row
    statsBar.style.justifyContent = .SpaceAround
    statsBar.style.alignItems = .Center
    statsBar.style.padding = MasonRect(uniform: .Points(toPx(20)))
    statsBar.style.background = "#FFFFFF"
    statsBar.style.border = "0 0 1px 0 solid #E5E7EB"

    let statsData = [
      ("2.4M+", "Users"),
      ("150K", "Reviews"),
      ("4.9", "Rating")
    ]

    for (value, label) in statsData {
      let statItem = mason.createView()
      statItem.display = .Flex
      statItem.flexDirection = .Column
      statItem.style.alignItems = .Center

      let statValue = mason.createTextView(type: .Span)
      statValue.append(text: value)
      statValue.fontSize = 22
      statValue.fontWeight = "bold"
      statValue.style.setColor(css: "#1E293B")
      statItem.addView(statValue)

      let statLabel = mason.createTextView(type: .Span)
      statLabel.append(text: label)
      statLabel.fontSize = 12
      statLabel.style.setColor(css: "#64748B")
      statItem.addView(statLabel)

      statsBar.addView(statItem)
    }
    root.append(statsBar)

    // ============================================================
    // MARK: Section - Popular Destinations
    // ============================================================
    let destSection = mason.createView()
    destSection.style.padding = MasonRect(uniform: .Points(toPx(24)))

    let destHeader = mason.createView()
    destHeader.display = .Flex
    destHeader.flexDirection = .Row
    destHeader.style.justifyContent = .SpaceBetween
    destHeader.style.alignItems = .Center
    destHeader.style.marginBottom = .Points(toPx(16))

    let destTitle = mason.createTextView(type: .H2)
    destTitle.append(text: "Popular Destinations")
    destTitle.fontSize = 22
    destTitle.fontWeight = "bold"
    destTitle.style.setColor(css: "#1E293B")
    destHeader.addView(destTitle)

    let viewAllLink = mason.createTextView(type: .A)
    viewAllLink.append(text: "View All")
    viewAllLink.fontSize = 14
    viewAllLink.fontWeight = "600"
    viewAllLink.style.setColor(css: "#3B82F6")
    destHeader.addView(viewAllLink)

    destSection.addView(destHeader)

    // Destinations Grid - 2x2
    let destGrid = mason.createView()
    destGrid.display = .Grid
    destGrid.style.gridTemplateColumns = "1fr 1fr"
    destGrid.style.gap = MasonSize(MasonLengthPercentage.Points(toPx(12)), MasonLengthPercentage.Points(toPx(12)))

    let destinations = [
      ("Paris", "France", "https://picsum.photos/400/300?random=10"),
      ("Tokyo", "Japan", "https://picsum.photos/400/300?random=11"),
      ("New York", "USA", "https://picsum.photos/400/300?random=12"),
      ("London", "UK", "https://picsum.photos/400/300?random=13")
    ]

    for (city, country, imageUrl) in destinations {
      let card = mason.createView()
      card.display = .Flex
      card.flexDirection = .Column
      card.style.borderRadius = "\(toPx(16))px"
      card.style.overflow = MasonPoint(uniform: .Clip)
      card.style.setSizeHeight(toPx(200), 1)
      card.style.position = .Relative

      // Full-bleed background image
      let cardImage = mason.createImageView()
      cardImage.style.position = .Absolute
      cardImage.style.inset = MasonRect(.Points(0), .Points(0), .Points(0), .Points(0))
      cardImage.style.setSizeWidth(1, 2)
      cardImage.style.setSizeHeight(1, 2)
      cardImage.style.objectFit = .Cover
      loadImage(imageUrl, imageInstance: cardImage, parent: card)
      card.addView(cardImage)

      // Gradient overlay for text readability
      let cardOverlay = mason.createView()
      cardOverlay.style.position = .Absolute
      cardOverlay.style.inset = MasonRect(.Points(0), .Points(0), .Points(0), .Points(0))
      cardOverlay.style.background = "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)"
      card.addView(cardOverlay)

      // Text content positioned at bottom
      let cardContent = mason.createView()
      cardContent.display = .Flex
      cardContent.flexDirection = .Column
      cardContent.style.justifyContent = .FlexEnd
      cardContent.style.position = .Absolute
      cardContent.style.inset = MasonRect(.Points(0), .Points(0), .Points(0), .Points(0))
      cardContent.style.padding = MasonRect(uniform: .Points(toPx(16)))

      let cardTitle = mason.createTextView(type: .H3)
      cardTitle.append(text: city)
      cardTitle.fontSize = 20
      cardTitle.fontWeight = "700"
      cardTitle.style.setColor(css: "#FFFFFF")
      cardContent.addView(cardTitle)

      let cardSubtitle = mason.createTextView(type: .P)
      cardSubtitle.append(text: country)
      cardSubtitle.fontSize = 14
      cardSubtitle.style.setColor(css: "#E2E8F0")
      cardContent.addView(cardSubtitle)

      card.addView(cardContent)
      destGrid.addView(card)
    }

    destSection.addView(destGrid)
    root.append(destSection)

    // ============================================================
    // MARK: Feature Showcase Card
    // ============================================================
    let featureSection = mason.createView()
    featureSection.style.padding = MasonRect(
      .Points(0),
      .Points(toPx(24)),
      .Points(toPx(24)),
      .Points(toPx(24))
    )

    let featureCard = mason.createView()
    featureCard.display = .Flex
    featureCard.flexDirection = .Column
    featureCard.style.background = "#0F172A"
    featureCard.style.borderRadius = "\(toPx(20))px"
    featureCard.style.padding = MasonRect(uniform: .Points(toPx(24)))

    let featureLabel = mason.createTextView(type: .Span)
    featureLabel.append(text: "WHY CHOOSE US")
    featureLabel.fontSize = 11
    featureLabel.fontWeight = "600"
    featureLabel.style.setColor(css: "#60A5FA")
    featureLabel.style.marginBottom = .Points(toPx(12))
    featureCard.addView(featureLabel)

    let featureTitle = mason.createTextView(type: .H2)
    featureTitle.append(text: "Travel with Confidence")
    featureTitle.fontSize = 24
    featureTitle.fontWeight = "bold"
    featureTitle.style.setColor(css: "#FFFFFF")
    featureTitle.style.marginBottom = .Points(toPx(12))
    featureCard.addView(featureTitle)

    let featureDesc = mason.createTextView(type: .P)
    featureDesc.append(text: "Expert local guides, 24/7 support, and flexible booking options make your journey seamless.")
    featureDesc.fontSize = 15
    featureDesc.style.setColor(css: "#94A3B8")
    featureDesc.style.marginBottom = .Points(toPx(20))
    featureCard.addView(featureDesc)

    // Feature icons row
    let featureIcons = mason.createView()
    featureIcons.display = .Flex
    featureIcons.flexDirection = .Row
    featureIcons.style.gap = MasonSize(MasonLengthPercentage.Points(toPx(16)), MasonLengthPercentage.Points(0))

    let features = ["🛡️ Secure", "⭐ Rated", "🌍 Global"]
    for feature in features {
      let featureItem = mason.createTextView(type: .Span)
      featureItem.append(text: feature)
      featureItem.fontSize = 13
      featureItem.style.setColor(css: "#CBD5E1")
      featureItem.style.flexShrink = 0
      featureIcons.addView(featureItem)
    }
    featureCard.addView(featureIcons)

    featureSection.addView(featureCard)
    root.append(featureSection)

    // ============================================================
    // MARK: Testimonials
    // ============================================================
    let testimonialSection = mason.createView()
    testimonialSection.style.padding = MasonRect(
      .Points(0),
      .Points(toPx(24)),
      .Points(toPx(24)),
      .Points(toPx(24))
    )

    let testimonialTitle = mason.createTextView(type: .H2)
    testimonialTitle.append(text: "What Travelers Say")
    testimonialTitle.fontSize = 22
    testimonialTitle.fontWeight = "bold"
    testimonialTitle.style.setColor(css: "#1E293B")
    testimonialTitle.style.marginBottom = .Points(toPx(16))
    testimonialSection.addView(testimonialTitle)

    // Testimonial cards
    let testimonials = [
      ("Sarah M.", "Amazing experience! The app made planning so easy.", "https://i.pravatar.cc/\(Int(toPx(100)))?img=1"),
      ("James K.", "Best travel app I've ever used. Highly recommend!", "https://i.pravatar.cc/\(Int(toPx(100)))?img=3")
    ]

    for (name, quote, avatarUrl) in testimonials {
      let testimonialCard = mason.createView()
      testimonialCard.display = .Flex
      testimonialCard.flexDirection = .Row
      testimonialCard.style.background = "#FFFFFF"
      testimonialCard.style.borderRadius = "\(toPx(16))px"
      testimonialCard.style.padding = MasonRect(uniform: .Points(toPx(16)))
      testimonialCard.style.marginBottom = .Points(toPx(12))
      testimonialCard.style.border = "1px solid #E5E7EB"

      // Avatar
      let avatarContainer = mason.createView()
      avatarContainer.style.setSizeWidth(toPx(48), 1)
      avatarContainer.style.setSizeHeight(toPx(48), 1)
      avatarContainer.style.setMinSizeWidth(toPx(48), 1)
      avatarContainer.style.setMinSizeHeight(toPx(48), 1)
      avatarContainer.style.borderRadius = "50%"
      avatarContainer.style.overflow = MasonPoint(.Hidden, .Hidden)
      avatarContainer.clipsToBounds = true
      avatarContainer.style.marginRight = .Points(toPx(12))
      avatarContainer.style.flexShrink = 0
      avatarContainer.style.position = .Relative

      let avatar = mason.createImageView()
      avatar.style.position = .Absolute
      avatar.style.inset = MasonRect(.Points(0), .Points(0), .Points(0), .Points(0))
      avatar.style.setSizeWidth(1, 2)
      avatar.style.setSizeHeight(1, 2)
      avatar.style.objectFit = .Cover
      loadImage(avatarUrl, imageInstance: avatar, parent: avatarContainer)
      avatarContainer.addView(avatar)
      testimonialCard.addView(avatarContainer)

      // Content
      let testimonialContent = mason.createView()
      testimonialContent.display = .Flex
      testimonialContent.flexDirection = .Column
      testimonialContent.style.flexGrow = 1

      // Stars
      let stars = mason.createTextView(type: .Span)
      stars.append(text: "★★★★★")
      stars.fontSize = 14
      stars.style.setColor(css: "#FBBF24")
      stars.style.marginBottom = .Points(toPx(4))
      testimonialContent.addView(stars)

      let quoteText = mason.createTextView(type: .P)
      quoteText.append(text: "\"\(quote)\"")
      quoteText.fontSize = 14
      quoteText.style.setColor(css: "#475569")
      quoteText.style.marginBottom = .Points(toPx(8))
      testimonialContent.addView(quoteText)

      let authorName = mason.createTextView(type: .Span)
      authorName.append(text: name)
      authorName.fontSize = 13
      authorName.fontWeight = "600"
      authorName.style.setColor(css: "#1E293B")
      testimonialContent.addView(authorName)

      testimonialCard.addView(testimonialContent)
      testimonialSection.addView(testimonialCard)
    }
    root.append(testimonialSection)

    // ============================================================
    // MARK: Travel Gallery
    // ============================================================
    let gallerySection = mason.createView()
    gallerySection.style.padding = MasonRect(
      .Points(0),
      .Points(toPx(24)),
      .Points(toPx(24)),
      .Points(toPx(24))
    )

    let galleryTitle = mason.createTextView(type: .H2)
    galleryTitle.append(text: "Travel Gallery")
    galleryTitle.fontSize = 22
    galleryTitle.fontWeight = "bold"
    galleryTitle.style.setColor(css: "#1E293B")
    galleryTitle.style.marginBottom = .Points(toPx(16))
    gallerySection.addView(galleryTitle)

    // Masonry-style gallery using two flex columns
    let galleryGrid = mason.createView()
    galleryGrid.display = .Flex
    galleryGrid.flexDirection = .Row
    galleryGrid.style.gap = MasonSize(MasonLengthPercentage.Points(toPx(8)), MasonLengthPercentage.Points(0))

    var random = SystemRandomNumberGenerator()
    let h150 = Int(toPx(150))
    let h100 = Int(toPx(100))

    // Column 1: 150px then 100px
    let col1 = mason.createView()
    col1.display = .Flex
    col1.flexDirection = .Column
    col1.style.flexGrow = 1
    col1.style.flexBasis = .Points(0)
    col1.style.gap = MasonSize(MasonLengthPercentage.Points(0), MasonLengthPercentage.Points(toPx(8)))

    // Column 2: 100px then 150px
    let col2 = mason.createView()
    col2.display = .Flex
    col2.flexDirection = .Column
    col2.style.flexGrow = 1
    col2.style.flexBasis = .Points(0)
    col2.style.gap = MasonSize(MasonLengthPercentage.Points(0), MasonLengthPercentage.Points(toPx(8)))

    let galleryImages: [(String, Int, MasonUIView)] = [
      ("https://picsum.photos/seed/\(random.next())/\(h150)/\(h150)", 150, col1),
      ("https://picsum.photos/seed/\(random.next())/\(h100)/\(h100)", 100, col2),
      ("https://picsum.photos/seed/\(random.next())/\(h100)/\(h100)", 100, col1),
      ("https://picsum.photos/seed/\(random.next())/\(h150)/\(h150)", 150, col2)
    ]

    for (imageUrl, height, column) in galleryImages {
      let galleryItem = mason.createView()
      galleryItem.style.height = .Points(toPx(Float(height)))
      galleryItem.style.borderRadius = "\(toPx(12))px"
      galleryItem.style.overflow = MasonPoint(uniform: .Clip)
      galleryItem.style.position = .Relative

      let galleryImage = mason.createImageView()
      galleryImage.style.position = .Absolute
      galleryImage.style.inset = MasonRect(.Points(0), .Points(0), .Points(0), .Points(0))
      galleryImage.style.setSizeWidth(1, 2)
      galleryImage.style.setSizeHeight(1, 2)
      galleryImage.style.objectFit = .Cover
      loadImage(imageUrl, imageInstance: galleryImage, parent: galleryItem)
      galleryItem.addView(galleryImage)

      column.addView(galleryItem)
    }

    galleryGrid.addView(col1)
    galleryGrid.addView(col2)
    gallerySection.addView(galleryGrid)
    root.append(gallerySection)

    // ============================================================
    // MARK: CTA Section
    // ============================================================
    let ctaSection = mason.createView()
    ctaSection.display = .Flex
    ctaSection.flexDirection = .Column
    ctaSection.style.alignItems = .Center
    ctaSection.style.padding = MasonRect(uniform: .Points(toPx(32)))
    ctaSection.style.margin = MasonRect(
      .Points(0),
      .Points(toPx(24)),
      .Points(toPx(24)),
      .Points(toPx(24))
    )
    ctaSection.style.background = "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)"
    ctaSection.style.borderRadius = "\(toPx(20))px"

    let ctaTitle = mason.createTextView(type: .H2)
    ctaTitle.append(text: "Start Your Journey")
    ctaTitle.fontSize = 26
    ctaTitle.fontWeight = "bold"
    ctaTitle.style.setColor(css: "#FFFFFF")
    ctaTitle.style.marginBottom = .Points(toPx(8))
    ctaSection.addView(ctaTitle)

    let ctaSubtitle = mason.createTextView(type: .P)
    ctaSubtitle.append(text: "Join millions of happy travelers today")
    ctaSubtitle.fontSize = 15
    ctaSubtitle.style.setColor(css: "rgba(255,255,255,0.9)")
    ctaSubtitle.style.marginBottom = .Points(toPx(20))
    ctaSection.addView(ctaSubtitle)

    let ctaButton = mason.createButton()
    ctaButton.append(text: "Get Started Free")
    ctaButton.style.fontSize = 16
    ctaButton.style.fontWeight = "600"
    ctaButton.style.setColor(css: "#3B82F6")
    ctaButton.style.background = "#FFFFFF"
    ctaButton.style.borderRadius = "\(toPx(12))px"
    ctaButton.style.border = "0"
    ctaButton.style.padding = MasonRect(
      .Points(toPx(14)),
      .Points(toPx(32)),
      .Points(toPx(14)),
      .Points(toPx(32))
    )

    ctaSection.addView(ctaButton)
    root.append(ctaSection)

    // ============================================================
    // MARK: Footer
    // ============================================================
    let footer = mason.createView()
    footer.display = .Flex
    footer.flexDirection = .Column
    footer.style.alignItems = .Center
    footer.style.padding = MasonRect(
      .Points(toPx(32)),
      .Points(toPx(24)),
      .Points(toPx(48)),
      .Points(toPx(24))
    )
    footer.style.background = "#1E293B"

    let footerLogo = mason.createTextView(type: .Span)
    footerLogo.append(text: "✈ Wanderlust")
    footerLogo.fontSize = 20
    footerLogo.fontWeight = "bold"
    footerLogo.style.setColor(css: "#FFFFFF")
    footerLogo.style.marginBottom = .Points(toPx(16))
    footer.addView(footerLogo)

    let footerLinks = mason.createView()
    footerLinks.display = .Flex
    footerLinks.flexDirection = .Row
    footerLinks.style.gap = MasonSize(MasonLengthPercentage.Points(toPx(24)), MasonLengthPercentage.Points(0))
    footerLinks.style.marginBottom = .Points(toPx(16))

    for linkText in ["About", "Privacy", "Terms", "Contact"] {
      let link = mason.createTextView(type: .A)
      link.append(text: linkText)
      link.fontSize = 14
      link.style.setColor(css: "#94A3B8")
      footerLinks.addView(link)
    }
    footer.addView(footerLinks)

    let copyright = mason.createTextView(type: .P)
    copyright.append(text: "© 2024 Wanderlust. All rights reserved.")
    copyright.fontSize = 12
    copyright.style.setColor(css: "#64748B")
    footer.addView(copyright)

    root.append(footer)

    body.append(root)
  }

  // MARK: - Grid Demo
  func gridSample() {
    let root = mason.createView()
    root.display = .Flex
    root.flexDirection = .Column
    root.style.padding = MasonRect(uniform: .Points(toPx(12)))

    let inner = mason.createView()
    inner.display = .Flex
    inner.flexDirection = .Row
    inner.style.flexWrap = .Wrap
    inner.style.gap = MasonSize(MasonLengthPercentage.Points(toPx(12)), MasonLengthPercentage.Points(toPx(12)))
    inner.style.maxWidth = .Points(toPx(720))
    inner.style.margin = MasonRect(.Points(0), .Auto, .Points(0), .Auto)
    root.addView(inner)

    for i in 1...12 {
      let card = mason.createView()
      card.display = .Flex
      card.flexDirection = .Column
      card.style.setSizeWidth(.Points(0))
      card.style.flexGrow = 1
      card.style.minWidth = .Points(toPx(140))

      let iv = mason.createImageView()
      iv.style.setSizeHeight(.Points(toPx(120)))
      iv.style.setSizeWidth(.Percent(1))
      iv.style.objectFit = .Cover
      loadImage("https://picsum.photos/seed/grid\(i)/600/400", imageInstance: iv, parent: inner.uiView)
      card.addView(iv)

      let caption = mason.createTextView(type: .Span)
      caption.append(text: "Image #\(i)")
      caption.fontSize = 14
      caption.style.setColor(css: "#0F172A")
      caption.style.marginTop = .Points(toPx(8))
      card.addView(caption)

      inner.addView(card)
    }

    body.addView(root)
  }

  // MARK: - Gallery Demo (polished cards)
  func gallerySample() {
    let root = mason.createView()
    root.display = .Flex
    root.flexDirection = .Column
    root.style.padding = MasonRect(uniform: .Points(toPx(16)))

    let gallery = mason.createView()
    gallery.display = .Flex
    gallery.flexDirection = .Row
    gallery.style.flexWrap = .Wrap
    gallery.style.gap = MasonSize(MasonLengthPercentage.Points(toPx(16)), MasonLengthPercentage.Points(toPx(24)))
    gallery.style.maxWidth = .Points(toPx(Float(UIScreen.main.bounds.width)))
    gallery.style.marginLeft = .Auto
    gallery.style.marginRight = .Auto
    root.addView(gallery)

    for i in 1...8 {
      let minWidth = toPx(Float(UIScreen.main.bounds.width / 2))
      let card = mason.createView()
      card.display = .Flex
      card.flexDirection = .Column
      card.style.setSizeWidth(.Points(0))
      card.style.flexGrow = 1
      card.style.minWidth = .Points(minWidth)
      card.style.background = "#FFFFFF"
      card.style.borderRadius = "8px"
      card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"
      card.style.overflow = MasonPoint(uniform: .Clip)

      let iv = mason.createImageView()
      iv.style.setSizeHeight(.Points(minWidth))
      iv.style.setSizeWidth(.Percent(1))
      iv.style.objectFit = .Cover
      loadImage("https://picsum.photos/seed/gallery\(i)/800/500", imageInstance: iv, parent: card.uiView)
      card.addView(iv)

      let meta = mason.createView()
      meta.display = .Flex
      meta.flexDirection = .Column
      meta.style.padding = MasonRect(uniform: .Points(toPx(24)))

      let title = mason.createTextView(type: .Span)
      title.append(text: "Gallery Item #\(i)")
      title.fontSize = 16
      title.fontWeight = "500"
      title.style.setColor(css: "#0F172A")
      meta.addView(title)

      let desc = mason.createTextView(type: .Span)
      desc.append(text: "A short description showcasing the image with nice spacing.")
      desc.fontSize = 13
      desc.style.setColor(css: "#64748B")
      desc.style.marginTop = .Points(toPx(6))
      meta.addView(desc)

      card.addView(meta)
      gallery.addView(card)
    }

    body.addView(root)
  }

  let urlSession: URLSession = {
    return URLSession(configuration: .default)
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
  
  func loadImage(_ urlAddress: String, imageInstance: Img, parent: UIView? = nil) {
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


  // Clear Mason content and force layout/invalidate on root and native views
  func clearContent() {
    numericTimer?.invalidate()
    numericTimer = nil
    
    // Remove all Mason node children from the scroll body
    self.body.removeAllChildren()

    self.body.invalidate()
  }
  
  deinit {
    print("Dispose controller")
  }
  
  func toPx(_ value: Float) -> Float {
    return value * scale
  }
  var data:Data!
  
  override func viewWillTransition(to size: CGSize, with coordinator: any UIViewControllerTransitionCoordinator) {
    // body auto-computes in layoutSubviews when bounds change
  }
  override func viewDidLoad() {
    NSCMason.shared.setDeviceScale(Float(UIScreen.main.scale))
    super.viewDidLoad()
    // Add a simple demo picker at the top and the Mason body below it
    let demoPicker = UISegmentedControl(items: ["Web","Text","Grid","Gallery","HN","Pseudo","Nums","Squircle"])
    demoPicker.selectedSegmentIndex = 7
    demoPicker.addTarget(self, action: #selector(demoChanged(_:)), for: .valueChanged)
    demoPicker.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(demoPicker)

    // Configure Mason scroll body and add to view
    body.style.overflowY = .Scroll
    //body.style.background = "#FFFFFF"
    // Add body to view and constrain it below the picker
    body.translatesAutoresizingMaskIntoConstraints = false
    view.addSubview(body)

    NSLayoutConstraint.activate([
      demoPicker.topAnchor.constraint(equalTo: view.safeAreaLayoutGuide.topAnchor, constant: 8),
      demoPicker.leadingAnchor.constraint(equalTo: view.leadingAnchor, constant: 16),
      demoPicker.trailingAnchor.constraint(equalTo: view.trailingAnchor, constant: -16),
      demoPicker.heightAnchor.constraint(equalToConstant: 32),

      body.topAnchor.constraint(equalTo: demoPicker.bottomAnchor, constant: 8),
      body.leadingAnchor.constraint(equalTo: view.leadingAnchor),
      body.trailingAnchor.constraint(equalTo: view.trailingAnchor),
      body.bottomAnchor.constraint(equalTo: view.bottomAnchor)
    ])

    // Run initial sample
    demoChanged(demoPicker)
    // ensure we receive scroll events for pagination
    if let scroll = body.uiView as? UIScrollView {
      scroll.delegate = self
    }
  }

  override func viewDidLayoutSubviews() {
    super.viewDidLayoutSubviews()
    // Ensure Mason computes with actual view size after auto layout
   // body.computeWithViewSize()
    //body.requestLayout()
    //body.invalidate()
  }

  @objc func demoChanged(_ sender: UISegmentedControl) {
    // Clear existing content then run the selected sample
    clearContent()
//    switch sender.selectedSegmentIndex {
//    case 0:
//      webTextSample()
//    case 1:
//      textSample()
//    case 2:
//      gridSample()
//    case 3:
//      gallerySample()
//    case 4:
//      hackerNewsSample()
//    default:
//      webTextSample()
//    }

    switch sender.selectedSegmentIndex {
          case 0:
            webTextSample()
          case 1:
            textSample()
          case 2:
            gridSample()
          case 3:
            gallerySample()
          case 4:
            hackerNewsSample()
    case 5:
      renderPseudoDemo(body)
    case 6:
      renderFloat(body)
     // renderFontVariantNumericDemo(body)
    case 7:
      renderSuperellipseDemo(body)
    default:
      renderSuperellipseDemo(body)
    }
  }
  
  func inputTest(){
    let root = mason.createView()
    
    let input = mason.createInput()
    input.placeholder = "Enter Text"
    
    let txt = mason.createTextView()
    
    let node = MasonTextNode(mason: mason, data: "")
    
    txt.mason_append(node: node)
    
    root.append(input)
    root.append(mason.createBr())
    root.append(txt)
    
    input.addEventListener("input") { event in
      node.data = input.value
    }
    
    body.addView(root)
    
   // body.computeWithSize(scale * Float( self.body.bounds.width), scale * Float( self.body.bounds.height))
  }
  
  
  var uiData: [String] = []

  func list(_ list: UICollectionView, cellForItemAt indexPath: IndexPath) -> UICollectionViewCell {
    let d = list.dequeueReusableCell(withReuseIdentifier: "default", for: indexPath) as? MasonList.MasonListCell ?? MasonList.MasonListCell.initWithEmptyBackground()

    let li = mason.createListItem()
    d.setView(li)

    // Determine which data source to use based on the parent list
    let absolutePos = indexPath.row
    if !olVirtualData.isEmpty, let staticKeys = olList?.staticItems.keys {
      // Map absolute position to virtual-only index (skip static positions)
      let staticsBefore = staticKeys.filter { $0 < absolutePos }.count
      let virtualIndex = absolutePos - staticsBefore
      if virtualIndex < olVirtualData.count {
        let txt = mason.createTextView(type: .P)
        txt.append(text: olVirtualData[virtualIndex])
        li.append(txt)
      }
    } else if !uiData.isEmpty && absolutePos < uiData.count {
      let txt = mason.createTextView()
      txt.append(text: uiData[absolutePos])
      li.append(txt)
      let img = mason.createImageView()
      img.style.size = MasonSize(MasonDimension.Points(100), MasonDimension.Points(100))
      li.append(img)
    } else {
      let txt = mason.createTextView()
      txt.append(text: "")
      li.append(txt)
    }

    return d
  }

  // MARK: - Hacker News Demo
  private func hackerNewsSample() {
    // Top orange header like Hacker News
    let root = mason.createView()
    root.style.background = "#FFFFFF"

    let topBar = mason.createView()
    topBar.style.background = "#ff6600"
    topBar.style.padding = MasonRect(uniform: .Points(toPx(8)))
    topBar.style.setSizeWidth(1, 2)
    topBar.display = .Flex
    topBar.flexDirection = .Row
    topBar.style.alignItems = .Center

    // Y logo + title
    let logo = mason.createTextView(type: .Span)
    logo.append(text: "Y")
    logo.fontSize = 18
    logo.fontWeight = "700"
    logo.style.setColor(css: "#FFFFFF")
    logo.style.marginRight = .Points(toPx(8))
    logo.addEventListener("click") { _ in
      if let url = URL(string: "https://news.ycombinator.com") { UIApplication.shared.open(url) }
    }
    topBar.addView(logo)

    let titleLabel = mason.createTextView(type: .Span)
    titleLabel.append(text: "Hacker News")
    titleLabel.fontSize = 16
    titleLabel.fontWeight = "700"
    titleLabel.style.setColor(css: "#FFFFFF")
    titleLabel.style.marginLeft = .Points(toPx(8))
    topBar.addView(titleLabel)

    // flexible spacer to push nav to the right
    let spacer = mason.createView()
    spacer.style.flexGrow = 1
    topBar.addView(spacer)

    // simple nav links
    let navNames = ["new","past","ask","submit"]
    for n in navNames {
      let a = mason.createTextView(type: .A)
      a.append(text: n)
      a.fontSize = 13
      a.style.setColor(css: "#FFFFFF")
      a.style.marginRight = .Points(toPx(10))
      a.addEventListener("click") { _ in
        var path = "/"
        switch n {
        case "new": path = "newest"
        case "past": path = "front"
        case "ask": path = "ask"
        case "submit": path = "submit"
        default: path = ""
        }
        if let url = URL(string: "https://news.ycombinator.com/\(path)") { UIApplication.shared.open(url) }
      }
      topBar.addView(a)
    }

    root.addView(topBar)


    // Content container with centered constrained inner column
    let container = mason.createView()
    container.display = .Flex
    container.flexDirection = .Column
    container.style.padding = MasonRect(uniform: .Points(toPx(6)))
    container.style.background = "#FFFFFF"
    root.addView(container)

    let inner = mason.createView()
    inner.display = .Flex
    inner.flexDirection = .Column
    // constrain width and center horizontally
    inner.style.setMaxSizeWidth(toPx(Float(UIScreen.main.bounds.width)), 1)
    inner.style.margin = MasonRect(.Points(0), .Auto, .Points(0), .Auto)
    container.addView(inner)

    hnContainer = inner

    body.addView(root)

    // start fetching
    fetchTopStoriesAndLoadInitial()
  }

  private func fetchTopStoriesAndLoadInitial() {
    guard let url = URL(string: "https://hacker-news.firebaseio.com/v0/topstories.json") else { return }
    hnLoading = true
    URLSession.shared.dataTask(with: url) { data, resp, err in
      defer { self.hnLoading = false }
      guard let data = data else { return }
      do {
        if let arr = try JSONSerialization.jsonObject(with: data) as? [Int] {
          DispatchQueue.main.async {
            self.hnIds = arr
            self.hnIndex = 0
            self.loadMoreHnPosts()
          }
        }
      } catch {
        print("HN parse error: \(error)")
      }
    }.resume()
  }

  private func loadMoreHnPosts() {
    guard !hnLoading else { return }
    guard hnIndex < hnIds.count else { return }
    hnLoading = true
    let start = hnIndex
    let end = min(hnIndex + hnPageSize, hnIds.count)
    let slice = Array(hnIds[start..<end])
    hnIndex = end

    let group = DispatchGroup()
    for (i, id) in slice.enumerated() {
      group.enter()
      let itemUrl = URL(string: "https://hacker-news.firebaseio.com/v0/item/\(id).json")!
      URLSession.shared.dataTask(with: itemUrl) { data, resp, err in
        defer { group.leave() }
        guard let data = data else { return }
        do {
          if let obj = try JSONSerialization.jsonObject(with: data) as? [String:Any] {
            DispatchQueue.main.async {
              self.appendHnPost(item: obj, rank: start + i + 1)
            }
          }
        } catch {
          print("HN item parse error: \(error)")
        }
      }.resume()
    }

    group.notify(queue: .main) {
      self.hnLoading = false
    }
  }

  private func appendHnPost(item: [String:Any], rank: Int) {
    guard let container = hnContainer else { return }
    // Row: left rank/upvote, right content
    let itemRow = mason.createView()
    itemRow.display = .Flex
    itemRow.flexDirection = .Row
    itemRow.style.alignItems = .FlexStart
    itemRow.style.padding = MasonRect(uniform: .Points(toPx(6)))
    itemRow.style.border = "0 0 1px 0 solid #E5E7EB"

    // Left column (rank + upvote)
    let leftCol = mason.createView()
    leftCol.style.setSizeWidth(toPx(48), 1)
    leftCol.style.setMinSizeWidth(toPx(48), 1)
    leftCol.style.marginRight = .Points(toPx(8))
    leftCol.display = .Flex
    leftCol.flexDirection = .Column
    leftCol.style.alignItems = .Center

    let upvote = mason.createTextView(type: .Span)
    upvote.append(text: "▲")
    upvote.fontSize = 12
    upvote.style.setColor(css: "#828282")

    let rankText = mason.createTextView(type: .Span)
    rankText.append(text: "\(rank).")
    rankText.fontSize = 13
    rankText.style.setColor(css: "#828282")

    leftCol.addView(rankText)
    leftCol.addView(upvote)

    // Right column (title + meta)
    let rightCol = mason.createView()
    rightCol.display = .Flex
    rightCol.flexDirection = .Column
    rightCol.style.flexGrow = 1

    let title = mason.createTextView(type: .A)
    title.append(text: "\(item["title"] as? String ?? "(no title)")")
    title.fontSize = 18
    title.fontWeight = "600"
    title.style.setColor(css: "#0000EE")
    title.style.marginBottom = .Points(toPx(4))
    // underline title to match Hacker News style
    title.decorationLine = .Underline
    title.style.setDecorationColor(css: "#0000EE")
    title.addEventListener("click") { _ in
      if let urlStr = item["url"] as? String, let url = URL(string: urlStr) {
        UIApplication.shared.open(url)
      } else if let id = item["id"] as? Int, let url = URL(string: "https://news.ycombinator.com/item?id=\(id)") {
        UIApplication.shared.open(url)
      }
    }

    let meta = mason.createTextView(type: .Span)
    let score = item["score"] as? Int ?? 0
    let by = item["by"] as? String ?? ""
    let comments = item["descendants"] as? Int ?? 0
    meta.append(text: "\(score) points by \(by) | \(comments) comments")
    meta.fontSize = 13
    meta.style.setColor(css: "#828282")

    rightCol.addView(title)
    rightCol.addView(meta)

    itemRow.addView(leftCol)
    itemRow.addView(rightCol)

    container.addView(itemRow)
    // Ensure layout is recomputed so native scroll contentSize updates
    body.requestLayout()
    body.invalidate()
    DispatchQueue.main.asyncAfter(deadline: .now() + 0.05) {
      self.body.computeWithViewSize()
      self.body.requestLayout()
      self.body.invalidate()
    }
  }

  // UIScrollViewDelegate — trigger pagination when near bottom
  public func scrollViewDidScroll(_ scrollView: UIScrollView) {
    guard scrollView == body.uiView as? UIScrollView else { return }
    let offsetY = scrollView.contentOffset.y
    let height = scrollView.frame.size.height
    let contentHeight = scrollView.contentSize.height
    if offsetY + height > contentHeight - 200 {
      loadMoreHnPosts()
    }
  }

  func list(_ list: UICollectionView, willDisplay cell: UICollectionViewCell, forItemAt indexPath: IndexPath) {
    guard let cell = cell as? MasonList.MasonListCell else { return }
    if let li = cell.contentView.subviews.first as? MasonLi {
      if !uiData.isEmpty, indexPath.row < uiData.count {
        let url = uiData[indexPath.row]
        if let txt = li.subviews.first as? MasonText {
          if let node = txt.node.getChildren().first as? MasonTextNode {
            node.data = url
          }
        }
        if let img = li.subviews.last as? Img {
          img.src = url
        }
      }
    }
  }
  
  func webList() {
    let ul = mason.createListView()
    ul.isOrdered = true
    ul.style.overflowY = Overflow.Scroll
    ul.register(cellClass: MasonList.MasonListCell.self, forCellWithReuseIdentifier: "default")

    var arr = Array<String>(repeating: "", count: 1000)
    
    ul.delegate = self
    

    ul.configure { it in
      it.size = MasonSize(MasonDimension.Percent(1), MasonDimension.Percent(1))
    }

    body.addView(ul)
    
    //body.computeWithSize(scale * Float( self.body.bounds.width), scale * Float( self.body.bounds.height))
    
    DispatchQueue.global().async {
      for i in 0..<arr.count {
        arr[i] = "https://robohash.org/\(i + 1)?set=set4"
      }
      DispatchQueue.main.async {
        self.uiData = arr
        ul.count = arr.count
        ul.reload()
      }
    }
  }
  
  func zOrder(){
    let root = mason.createView()
    body.append(root)
    
    
    let a = mason.createView()
    a.style.size = .init(.Points(100), .Points(100))
    a.append(text: "A")
    a.style.background = "red"
    a.style.zIndex = 3
    a.style.position = .Absolute
    
    let b = mason.createView()
    b.style.size = .init(.Points(200), .Points(200))
    b.append(text: "B")
    b.style.background = "green"
    b.style.zIndex = 2
    b.style.position = .Absolute
    
    
    
    let c = mason.createView()
    c.style.zIndex = 1
    c.style.position = .Absolute
    c.style.size = .init(.Points(300), .Points(300))
    c.append(text: "C")
    c.style.background = "yellow"
    
    root.append(a)
    root.append(b)
    root.append(c)
    
   // self.body.computeWithSize(scale * Float( self.body.bounds.width), scale * Float( self.body.bounds.height))
    
  }
  
  func input(){
    let root = mason.createView()
    body.append(root)
    root.style.padding = MasonRect(uniform: .Points(40))
    
    let link = mason.createTextView(type: .A)
    root.append(link)
    link.textContent = "Google"
    
    link.addEventListener("click") { event in
      print("????")
    }
    
    
    let btn = mason.createButton()
    root.append(btn)
    btn.textContent = "Button Element"
    
    btn.addEventListener("click") { event in
      print("clicked button")
    }
    
    
    root.append(mason.createBr())
    
    let input = root.mason.createInput(.Tel)
    input.placeholder = "Enter text..."
    
    let view = root.mason.createTextView(type: .P)
    let data = MasonTextNode(mason: root.mason, data: "")
    view.append(node: data)
    input.addEventListener("input") { event in
      data.data = input.value
    }
    
    
    root.append(input)
    
    root.append(view)
    
    root.append(text: "\n")
    root.mason_addChildAt(element: mason.createBr(), -1)
    
    let button = root.mason.createInput(.Button)
    button.value = "Button"
    
    button.addEventListener("click") { event in
      event.preventDefault()
    }
    
    button.addEventListener("click") { event in
      print(event)
    }
    
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
//    
//    body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
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

    
  //  body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
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

  func renderFloat(_ view: Scroll) {
    let section = mason.createView()
    let one = mason.createView()
    one.append(text: "1")
    one.configure { it in
      it.background = "purple"
      it.float = .Left
      applyDivStyle(it)
    }
    let two = mason.createView()
    two.append(text: "2")
    two.configure { it in
      it.background = "blue"
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
    
    
   // view.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
    
//                                                                                                                                                                                                     e
  }
  
  
  // MARK: - Pseudo State Demo

  private func pseudoSetBg(_ buf: UnsafeMutableBufferPointer<UInt8>, _ argb: UInt32) {
    guard buf.count > 0, let base = buf.baseAddress else { return }
    var val = argb
    memcpy(base + StyleKeys.BACKGROUND_COLOR, &val, 4)
    base.advanced(by: StyleKeys.BACKGROUND_COLOR_STATE).pointee = 1
    MasonNode.markPseudoSet(buf, .backgroundColor)
  }

  private func pseudoSetFontColor(_ buf: UnsafeMutableBufferPointer<UInt8>, _ argb: UInt32) {
    guard buf.count > 0, let base = buf.baseAddress else { return }
    var val = argb
    memcpy(base + StyleKeys.FONT_COLOR, &val, 4)
    base.advanced(by: StyleKeys.FONT_COLOR_STATE).pointee = 1
    MasonNode.markPseudoSet(buf, .color)
  }

  private func pseudoSetBorderColor(_ buf: UnsafeMutableBufferPointer<UInt8>, _ argb: UInt32) {
    guard buf.count > 0, let base = buf.baseAddress else { return }
    var val = argb
    for offset in [StyleKeys.BORDER_LEFT_COLOR, StyleKeys.BORDER_RIGHT_COLOR,
                   StyleKeys.BORDER_TOP_COLOR, StyleKeys.BORDER_BOTTOM_COLOR] {
      memcpy(base + offset, &val, 4)
    }
    MasonNode.markPseudoSet(buf, .borderColor)
  }

  private func pseudoSetBorderWidth(_ buf: UnsafeMutableBufferPointer<UInt8>, _ px: Float) {
    guard buf.count > 0, let base = buf.baseAddress else { return }
    var val = px
    for (t, v) in [(StyleKeys.BORDER_LEFT_TYPE, StyleKeys.BORDER_LEFT_VALUE),
                   (StyleKeys.BORDER_RIGHT_TYPE, StyleKeys.BORDER_RIGHT_VALUE),
                   (StyleKeys.BORDER_TOP_TYPE, StyleKeys.BORDER_TOP_VALUE),
                   (StyleKeys.BORDER_BOTTOM_TYPE, StyleKeys.BORDER_BOTTOM_VALUE)] {
      base.advanced(by: t).pointee = 0
      memcpy(base + v, &val, 4)
    }
    MasonNode.markPseudoSet(buf, .border)
  }

  private func pseudoSetBorderRadius(_ buf: UnsafeMutableBufferPointer<UInt8>, _ px: Float) {
    guard buf.count > 0, let base = buf.baseAddress else { return }
    var val = px
    for xType in [StyleKeys.BORDER_RADIUS_TOP_LEFT_X_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_X_TYPE,
                  StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_X_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_X_TYPE] {
      base.advanced(by: xType).pointee = 0
      memcpy(base + xType + 1, &val, 4)
    }
    for yType in [StyleKeys.BORDER_RADIUS_TOP_LEFT_Y_TYPE, StyleKeys.BORDER_RADIUS_TOP_RIGHT_Y_TYPE,
                  StyleKeys.BORDER_RADIUS_BOTTOM_RIGHT_Y_TYPE, StyleKeys.BORDER_RADIUS_BOTTOM_LEFT_Y_TYPE] {
      base.advanced(by: yType).pointee = 0
      memcpy(base + yType + 1, &val, 4)
    }
    MasonNode.markPseudoSet(buf, .borderRadius)
  }

  private func argb(_ hex: String) -> UInt32 {
    var hexStr = hex.trimmingCharacters(in: .whitespacesAndNewlines)
    if hexStr.hasPrefix("#") { hexStr.removeFirst() }
    var val: UInt64 = 0
    Scanner(string: hexStr).scanHexInt64(&val)
    if hexStr.count == 6 {
      return UInt32(0xFF000000 | UInt32(val))
    }
    return UInt32(val)
  }

  // MARK: - Superellipse Demo

  func renderSuperellipseDemo(_ view: Scroll) {
    let container = mason.createView()
    container.configure { style in
      style.display = .Block
      style.padding = MasonRect(uniform: .Points(toPx(16)))
    }

    func sectionLabel(_ text: String) -> MasonText {
      let label = mason.createTextView(type: .P)
      label.append(text: text)
      label.configure { style in
        style.color = self.argb("#9CA3AF")
        style.fontSize = 11
        style.display = .Block
      }
      label.style.margin = MasonRect(
        .Points(toPx(20)), .Zero, .Points(toPx(8)), .Zero
      )
      return label
    }

    // ─── 1. Side-by-Side Comparison ────────────────────────────────
    container.append(sectionLabel("CIRCULAR VS SQUIRCLE"))

    let compRow = mason.createView()
    compRow.display = .Flex
    compRow.flexDirection = .Row
    compRow.style.setSizeWidth(.Auto)
    compRow.style.gap = MasonSize(.Points(toPx(12)), .Points(toPx(12)))

    let circularCard = mason.createView()
    circularCard.configure { style in
      style.display = .Flex
      style.justifyContent = .Center
      style.alignItems = .Center
      style.flexGrow = 1
      style.flexBasis = .Points(0)
      style.size = MasonSize(.Auto, .Points(toPx(140)))
      style.backgroundColor = self.argb("#EEF2FF")
      style.border = "2 solid #6366F1"
      style.borderRadius = "\(toPx(24))px"
      style.cornerShape = "round"
    }
    let circLabel = mason.createTextView()
    circLabel.textContent = "corner-shape: round"
    circLabel.configure { style in
      style.textAlign = .Center
      style.color = self.argb("#4338CA")
      style.fontSize = 12
    }
    circularCard.append(circLabel)

    let squircleCard = mason.createView()
    squircleCard.configure { style in
      style.display = .Flex
      style.justifyContent = .Center
      style.alignItems = .Center
      style.flexGrow = 1
      style.flexBasis = .Points(0)
      style.size = MasonSize(.Auto, .Points(toPx(140)))
      style.backgroundColor = self.argb("#F0FDF4")
      style.border = "2 solid #22C55E"
      style.borderRadius = "\(toPx(24))px"
      style.cornerShape = "squircle"
    }
    let sqLabel = mason.createTextView()
    sqLabel.textContent = "corner-shape: squircle"
    sqLabel.configure { style in
      style.textAlign = .Center
      style.color = self.argb("#15803D")
      style.fontSize = 12
    }
    squircleCard.append(sqLabel)

    compRow.append(circularCard)
    compRow.append(squircleCard)
    container.append(compRow)

    // ─── 2. Exponent Spectrum ──────────────────────────────────────
    container.append(sectionLabel("EXPONENT SPECTRUM"))

    let samples: [(shape: String, label: String, bg: String, border: String)] = [
      ("superellipse(0.3)", "superellipse(0.3) — Super Squircle", "#FFF7ED", "#FB923C"),
      ("squircle",          "squircle — iOS-style (0.5)",          "#F0FDF4", "#22C55E"),
      ("superellipse(0.7)", "superellipse(0.7) — Soft Round",     "#EFF6FF", "#3B82F6"),
      ("round",             "round — Circular (default)",          "#F5F3FF", "#8B5CF6"),
      ("notch",             "notch — Exponent 2",                  "#FDF2F8", "#EC4899"),
      ("bevel",             "bevel — Exponent 4",                  "#FEF2F2", "#EF4444"),
    ]

    for sample in samples {
      let card = mason.createView()
      card.configure { style in
        style.display = .Flex
        style.justifyContent = .Center
        style.alignItems = .Center
        style.size = MasonSize(.Auto, .Points(toPx(100)))
        style.backgroundColor = self.argb(sample.bg)
        style.border = "1 solid \(sample.border)"
        style.borderRadius = "\(toPx(28))px"
        style.margin = MasonRect(.Zero, .Zero, .Points(toPx(10)), .Zero)
        style.cornerShape = sample.shape
      }
      let label = mason.createTextView()
      label.textContent = sample.label
      label.configure { style in
        style.textAlign = .Center
        style.color = self.argb("#374151")
        style.fontSize = 13
      }
      card.append(label)
      container.append(card)
    }

    // ─── 3. Per-Corner Mixed Shapes ────────────────────────────────
    container.append(sectionLabel("PER-CORNER MIXED SHAPES"))

    let mixed = mason.createView()
    mixed.configure { style in
      style.display = .Flex
      style.justifyContent = .Center
      style.alignItems = .Center
      style.size = MasonSize(.Auto, .Points(toPx(160)))
      style.backgroundColor = self.argb("#1E293B")
      style.border = "2 solid #475569"
      style.borderRadius = "\(toPx(32))px"
      style.margin = MasonRect(.Zero, .Zero, .Points(toPx(10)), .Zero)
      // TL: super-squircle, TR: circular, BR: squircle, BL: notch
      style.cornerShape = "superellipse(0.3) round squircle notch"
    }
    let mixedLabel = mason.createTextView()
    mixedLabel.textContent = "TL: superellipse(0.3)\nTR: round\nBR: squircle\nBL: notch"
    mixedLabel.configure { style in
      style.textAlign = .Center
      style.color = self.argb("#E2E8F0")
      style.fontSize = 13
    }
    mixed.append(mixedLabel)
    container.append(mixed)

    // ─── 4. App Icon Grid ──────────────────────────────────────────
    container.append(sectionLabel("APP ICON GRID — SQUIRCLE SHOWCASE"))

    let grid = mason.createView()
    grid.display = .Flex
    grid.flexDirection = .Row
    grid.style.flexWrap = .Wrap
    grid.style.justifyContent = .SpaceBetween
    grid.style.setSizeWidth(.Auto)
    grid.style.gap = MasonSize(.Points(toPx(12)), .Points(toPx(12)))

    let iconColors = [
      "#FF3B30", "#FF9500", "#FFCC00", "#34C759",
      "#00C7BE", "#007AFF", "#5856D6", "#AF52DE",
    ]

    for color in iconColors {
      let icon = mason.createView()
      icon.configure { style in
        style.size = MasonSize(.Points(toPx(64)), .Points(toPx(64)))
        style.backgroundColor = self.argb(color)
        style.borderRadius = "\(toPx(16))px"
        style.cornerShape = "squircle"
      }
      grid.append(icon)
    }
    container.append(grid)

    // ─── 5. Notification Banners ───────────────────────────────────
    container.append(sectionLabel("NOTIFICATION BANNERS"))

    let banners: [(text: String, bg: String, border: String, fg: String)] = [
      ("Payment processed successfully",      "#F0FDF4", "#BBF7D0", "#166534"),
      ("Your session will expire in 5 minutes", "#FFFBEB", "#FDE68A", "#92400E"),
      ("Unable to connect to server",          "#FEF2F2", "#FECACA", "#991B1B"),
    ]

    for b in banners {
      let banner = mason.createView()
      banner.configure { style in
        style.display = .Flex
        style.alignItems = .Center
        style.size = MasonSize(.Auto, .Auto)
        style.backgroundColor = self.argb(b.bg)
        style.border = "1 solid \(b.border)"
        style.borderRadius = "\(toPx(14))px"
        style.cornerShape = "squircle"
        style.padding = MasonRect(
          .Points(toPx(14)), .Points(toPx(18)),
          .Points(toPx(14)), .Points(toPx(18))
        )
        style.margin = MasonRect(.Zero, .Zero, .Points(toPx(10)), .Zero)
      }
      let label = mason.createTextView()
      label.textContent = b.text
      label.configure { style in
        style.color = self.argb(b.fg)
        style.fontSize = 14
      }
      banner.append(label)
      container.append(banner)
    }

    // ─── 6. Pill Buttons ───────────────────────────────────────────
    container.append(sectionLabel("PILL BUTTONS — CIRCULAR VS SQUIRCLE"))

    let pillRow = mason.createView()
    pillRow.display = .Flex
    pillRow.flexDirection = .Row
    pillRow.style.setSizeWidth(.Auto)
    pillRow.style.gap = MasonSize(.Points(toPx(12)), .Points(toPx(12)))

    func pillButton(_ label: String, bg: String, fg: String, shape: String) -> Mason.MasonUIView {
      let pill = mason.createView()
      pill.configure { style in
        style.display = .Flex
        style.justifyContent = .Center
        style.alignItems = .Center
        style.flexGrow = 1
        style.flexBasis = .Points(0)
        style.size = MasonSize(.Auto, .Points(toPx(44)))
        style.backgroundColor = self.argb(bg)
        style.borderRadius = "999px"
        style.cornerShape = shape
        style.padding = MasonRect(
          .Zero, .Points(toPx(24)), .Zero, .Points(toPx(24))
        )
      }
      let text = mason.createTextView()
      text.textContent = label
      text.configure { style in
        style.color = self.argb(fg)
        style.fontSize = 14
      }
      pill.append(text)
      return pill
    }

    pillRow.append(pillButton("Circular", bg: "#4F46E5", fg: "#FFFFFF", shape: "round"))
    pillRow.append(pillButton("Squircle", bg: "#059669", fg: "#FFFFFF", shape: "squircle"))
    container.append(pillRow)

    view.append(container)
  }

  func renderPseudoDemo(_ view: Scroll) {
    let container = mason.createView()
    container.configure { style in
      style.display = .Block
      style.padding = MasonRect(uniform: .Points(toPx(16)))
      style.background = "#FFFFFF"
    }

    func sectionLabel(_ text: String) -> MasonText {
      let label = mason.createTextView(type: .P)
      label.append(text: text)
      label.configure { style in
        style.color = self.argb("#6B7280")
        style.fontSize = 12
        style.display = .Block
      }
      label.style.margin = MasonRect(
        .Points(toPx(12)), .Zero, .Points(toPx(4)), .Zero
      )
      return label
    }

    func styledButton(
      _ label: String,
      bg: String? = nil,
      fg: String? = nil,
      border: String? = nil,
      radius: String? = nil,
      paddingH: Float = 16,
      paddingV: Float = 10,
      fullWidth: Bool = true
    ) -> Button {
      let btn = mason.createButton()
      btn.textContent = label
      btn.configure { style in
        style.display = fullWidth ? .Block : .InlineBlock
        if let bg = bg { style.background = bg }
        if let fg = fg { style.color = self.argb(fg) }
        if let border = border { style.border = border }
        if let radius = radius { style.borderRadius = radius }
        style.padding = MasonRect(
          .Points(self.toPx(paddingV)),
          .Points(self.toPx(paddingH)),
          .Points(self.toPx(paddingV)),
          .Points(self.toPx(paddingH))
        )
        style.margin = MasonRect(
          .Zero, .Zero, .Points(self.toPx(8)), .Zero
        )
        style.textAlign = .Center
      }
      return btn
    }

    let density = scale

    // 1. Primary Button (Indigo)
    container.addView(sectionLabel("Primary Button"))

    let primary = styledButton("Get Started",
      bg: "#4F46E5", fg: "#FFFFFF",
      border: "1 solid #4F46E5", radius: "8")
    container.addView(primary)
    

    let primaryHover = primary.node.preparePseudoBuffer(PseudoState.hover.rawValue)
    pseudoSetBg(primaryHover, argb("#4338CA"))

    let primaryActive = primary.node.preparePseudoBuffer(PseudoState.active.rawValue)
    pseudoSetBg(primaryActive, argb("#3730A3"))

    let primaryFocus = primary.node.preparePseudoBuffer(PseudoState.focus.rawValue)
    pseudoSetBorderColor(primaryFocus, argb("#818CF8"))
    pseudoSetBorderWidth(primaryFocus, 2 * density)

    // 2. Outline / Ghost Button
    container.addView(sectionLabel("Outline Button"))

    let outline = styledButton("Learn More",
      bg: "#00000000", fg: "#4F46E5",
      border: "1 solid #4F46E5", radius: "8")
    container.addView(outline)

    let outlineHover = outline.node.preparePseudoBuffer(PseudoState.hover.rawValue)
    pseudoSetBg(outlineHover, argb("#EEF2FF"))

    let outlineActive = outline.node.preparePseudoBuffer(PseudoState.active.rawValue)
    pseudoSetBg(outlineActive, UIColor(hex: "#4F46E5")!.toUInt32())
    pseudoSetFontColor(outlineActive, argb("#FFFFFF"))

    // 3. Danger Button
    container.addView(sectionLabel("Danger Button"))

    let danger = styledButton("Delete Account",
      bg: "#DC2626", fg: "#FFFFFF",
      border: "0 solid #DC2626", radius: "8")
    container.addView(danger)

    let dangerHover = danger.node.preparePseudoBuffer(PseudoState.hover.rawValue)
    pseudoSetBg(dangerHover, argb("#B91C1C"))

    let dangerActive = danger.node.preparePseudoBuffer(PseudoState.active.rawValue)
    pseudoSetBg(dangerActive, argb("#991B1B"))

    // 4. Success Button
    container.addView(sectionLabel("Success Button"))

    let success = styledButton("Confirm Payment",
      bg: "#059669", fg: "#FFFFFF",
      border: "0 solid #059669", radius: "8")
    container.addView(success)

    let successHover = success.node.preparePseudoBuffer(PseudoState.hover.rawValue)
    pseudoSetBg(successHover, argb("#047857"))

    let successActive = success.node.preparePseudoBuffer(PseudoState.active.rawValue)
    pseudoSetBg(successActive, argb("#065F46"))

    // 5. Pill Button
    container.addView(sectionLabel("Pill Button"))

    let pill = styledButton("Subscribe",
      bg: "#7C3AED", fg: "#FFFFFF",
      border: "0 solid #7C3AED", radius: "999",
      paddingH: 24, paddingV: 10, fullWidth: false)
    container.addView(pill)

    let pillHover = pill.node.preparePseudoBuffer(PseudoState.hover.rawValue)
    pseudoSetBg(pillHover, argb("#6D28D9"))

    let pillActive = pill.node.preparePseudoBuffer(PseudoState.active.rawValue)
    pseudoSetBg(pillActive, argb("#5B21B6"))
    pseudoSetBorderRadius(pillActive, 12 * density)

    // 6. Ghost Button
    container.addView(sectionLabel("Ghost Button"))

    let ghost = styledButton("Cancel",
      bg: "#00000000", fg: "#6B7280",
      border: "0 solid #00000000", radius: "6")
    container.addView(ghost)

    let ghostHover = ghost.node.preparePseudoBuffer(PseudoState.hover.rawValue)
    pseudoSetBg(ghostHover, argb("#F3F4F6"))
    pseudoSetFontColor(ghostHover, argb("#111827"))

    let ghostActive = ghost.node.preparePseudoBuffer(PseudoState.active.rawValue)
    pseudoSetBg(ghostActive, argb("#E5E7EB"))
    pseudoSetFontColor(ghostActive, argb("#111827"))

    // 7. Dark Mode Button
    container.addView(sectionLabel("Dark Mode Button"))

    let dark = styledButton("Sign In",
      bg: "#1F2937", fg: "#F9FAFB",
      border: "1 solid #374151", radius: "8")
    container.addView(dark)

    let darkHover = dark.node.preparePseudoBuffer(PseudoState.hover.rawValue)
    pseudoSetBg(darkHover, argb("#374151"))
    pseudoSetBorderColor(darkHover, argb("#4B5563"))

    let darkActive = dark.node.preparePseudoBuffer(PseudoState.active.rawValue)
    pseudoSetBg(darkActive, argb("#111827"))
    pseudoSetBorderColor(darkActive, argb("#6366F1"))

    // 8. Outline Danger
    container.addView(sectionLabel("Outline Danger"))

    let outlineDanger = styledButton("Remove Item",
      bg: "#00000000", fg: "#DC2626",
      border: "1 solid #DC2626", radius: "8")
    container.addView(outlineDanger)

    let outlineDangerHover = outlineDanger.node.preparePseudoBuffer(PseudoState.hover.rawValue)
    pseudoSetBg(outlineDangerHover, argb("#FEF2F2"))

    let outlineDangerActive = outlineDanger.node.preparePseudoBuffer(PseudoState.active.rawValue)
    pseudoSetBg(outlineDangerActive, argb("#DC2626"))
    pseudoSetFontColor(outlineDangerActive, 0xFFFFFFFF)
    pseudoSetBorderColor(outlineDangerActive, argb("#991B1B"))

    // 9. Focus Ring Demo
    container.addView(sectionLabel("Focus Ring (press to see active)"))

    let focusBtn = styledButton("Tab to Focus Me",
      bg: "#FFFFFF", fg: "#1F2937",
      border: "1 solid #D1D5DB", radius: "8")
    container.addView(focusBtn)

    let focusBtnHover = focusBtn.node.preparePseudoBuffer(PseudoState.hover.rawValue)
    pseudoSetBg(focusBtnHover, argb("#F9FAFB"))
    pseudoSetBorderColor(focusBtnHover, argb("#9CA3AF"))

    let focusBtnFocus = focusBtn.node.preparePseudoBuffer(PseudoState.focus.rawValue)
    pseudoSetBorderColor(focusBtnFocus, argb("#6366F1"))
    pseudoSetBorderWidth(focusBtnFocus, 2 * density)

    let focusBtnActive = focusBtn.node.preparePseudoBuffer(PseudoState.active.rawValue)
    pseudoSetBg(focusBtnActive, argb("#F3F4F6"))

    // 10. Full Cascade
    container.addView(sectionLabel("Full Cascade (hover > focus > active)"))

    let cascade = styledButton("Hover, Focus, or Press",
      bg: "#FFFFFF", fg: "#1F2937",
      border: "1 solid #D1D5DB", radius: "8")
    container.addView(cascade)

    let cascadeHover = cascade.node.preparePseudoBuffer(PseudoState.hover.rawValue)
    pseudoSetBg(cascadeHover, argb("#EEF2FF"))
    pseudoSetBorderColor(cascadeHover, argb("#A5B4FC"))
    pseudoSetFontColor(cascadeHover, argb("#4F46E5"))

    let cascadeFocus = cascade.node.preparePseudoBuffer(PseudoState.focus.rawValue)
    pseudoSetBorderColor(cascadeFocus, argb("#6366F1"))
    pseudoSetBorderWidth(cascadeFocus, 2 * density)

    let cascadeActive = cascade.node.preparePseudoBuffer(PseudoState.active.rawValue)
    pseudoSetBg(cascadeActive, argb("#4F46E5"))
    pseudoSetFontColor(cascadeActive, 0xFFFFFFFF)
    pseudoSetBorderColor(cascadeActive, argb("#4338CA"))
    
    

    view.addView(container)
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
    
    reset.style.setMarginBottom(20, 1)

    rootLayout.append(reset)

     let blur = mason.createView()
    
    defaultStyle(blur)

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
    stackedDropShadow.style.margin = .init(.Points(20), .Zero, .Zero, .Zero)
    stackedDropShadow.append(text: "Stacked DropShadow ")
    stackedDropShadow.append(code("filter: drop-shadow(3px 3px red) sepia(100%) drop-shadow(-3px -3px blue)"))

     setOnClickListener(stackedDropShadow) {
       img.style.filter = "blur(2px) grayscale(50%)"
     }

     rootLayout.append(stackedDropShadow)
    
  


 //
 //    img.style.filter =
 //      "blur(10px) brightness(1.2) contrast(0.8) saturate(2) hue-rotate(0.5turn) invert(50%) drop-shadow(5px 5px 10px rgba(0,0,0,0.5))"

     body.append(rootLayout)
    
   // body.computeWithSize(scale * Float(body.bounds.width), scale * Float(body.bounds.height))
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
  
  func renderFontVariantNumericDemo(_ view: Scroll) {
    let container = mason.createView()
    container.configure { style in
      style.display = .Block
      style.padding = MasonRect(.Zero, .Points(self.toPx(16)), .Points(self.toPx(16)), .Points(self.toPx(16)))
      style.background = "#EEF2FF"
    }

    // --- Title ---
    let title = mason.createTextView(type: .P)
    title.append(text: "font-variant-numeric")
    title.configure { style in
      style.display = .Block
      style.fontSize = 22
      style.fontWeight = "bold"
      style.color = self.argb("#1E293B")
    }
    container.addView(title)

    // --- Timer Row ---
    let timerRow = mason.createView()
    timerRow.configure { style in
      style.display = .Flex
      style.flexDirection = .Row
      style.gap = MasonSize(.Points(self.toPx(12)), .Zero)
      style.margin = MasonRect(.Zero, .Zero, .Points(self.toPx(24)), .Zero)
    }

    func timerCard(label: String, tabular: Bool) -> (MasonUIView, MasonText) {
      let card = self.mason.createView()
      card.configure { style in
        style.display = .Block
        style.flexGrow = 1
        style.background = "#FFFFFF"
        style.borderRadius = "12"
        style.padding = MasonRect(uniform: .Points(self.toPx(16)))
      }

      let timeText = self.mason.createTextView(type: .P)
      timeText.append(text: "00:00.00")
      timeText.configure { style in
        style.display = .Block
        style.fontSize = 32
        style.fontWeight = "bold"
        style.color = self.argb("#1E293B")
        style.textAlign = .Center
        if tabular {
          style.fontVariantNumericString = "tabular-nums"
        }
      }
      card.addView(timeText)

      let badge = self.mason.createView()
      badge.configure { style in
        style.display = .Flex
        style.flexDirection = .Row
        style.gap = MasonSize(.Points(self.toPx(6)), .Zero)
        style.margin = MasonRect(.Points(self.toPx(8)), .Zero, .Zero, .Zero)
        style.alignItems = .Center
        style.justifyContent = .Center
      }

      let dot = self.mason.createTextView(type: .P)
      dot.append(text: tabular ? "✅" : "❌")
      dot.configure { style in
        style.display = .InlineBlock
        style.fontSize = 14
      }
      badge.addView(dot)

      let labelText = self.mason.createTextView(type: .P)
      labelText.append(text: label)
      labelText.configure { style in
        style.display = .InlineBlock
        style.fontSize = 14
        style.color = self.argb("#64748B")
      }
      badge.addView(labelText)

      card.addView(badge)
      return (card, timeText)
    }

    let (leftCard, leftTime) = timerCard(label: "w/o tabular-nums", tabular: false)
    let (rightCard, rightTime) = timerCard(label: "w/ tabular-nums", tabular: true)
    timerRow.addView(leftCard)
    timerRow.addView(rightCard)
    container.addView(timerRow)

    // --- Showcase Cards ---
    let variants: [(String, String)] = [
      ("lining-nums", "0123456789"),
      ("oldstyle-nums", "0123456789"),
      ("tabular-nums", "111  888"),
      ("proportional-nums", "111  888"),
      ("diagonal-fractions", "1/2 3/4 5/6"),
      ("stacked-fractions", "1/2 3/4 5/6"),
      ("ordinal", "1st 2nd 3rd"),
      ("slashed-zero", "0O 00 08"),
    ]

    for (variant, sample) in variants {
      let row = mason.createView()
      row.configure { style in
        style.display = .Block
        style.background = "#FFFFFF"
        style.borderRadius = "8"
        style.padding = MasonRect(uniform: .Points(self.toPx(12)))
        style.margin = MasonRect(.Zero, .Zero, .Points(self.toPx(8)), .Zero)
      }

      let variantLabel = mason.createTextView(type: .P)
      variantLabel.append(text: variant)
      variantLabel.configure { style in
        style.display = .Block
        style.fontSize = 12
        style.fontWeight = "semibold"
        style.color = self.argb("#6366F1")
        style.margin = MasonRect(.Zero, .Zero, .Points(self.toPx(4)), .Zero)
      }
      row.addView(variantLabel)

      let sampleText = mason.createTextView(type: .P)
      sampleText.configure { style in
        style.display = .Block
        style.fontSize = 24
        style.color = self.argb("#1E293B")
        style.fontVariantNumericString = variant
      }
      sampleText.append(text: sample)
      row.addView(sampleText)

      container.addView(row)
    }

    view.addView(container)

    // Start timer (use .common mode so it keeps running during scrolling)
    var elapsed: TimeInterval = 0
    let timer = Timer(timeInterval: 1.0 / 60.0, repeats: true) { [weak self, weak leftTime, weak rightTime] _ in
      guard self != nil else { return }
      elapsed += 1.0 / 60.0
      let mins = Int(elapsed) / 60
      let secs = Int(elapsed) % 60
      let hundredths = Int((elapsed - floor(elapsed)) * 100)
      let str = String(format: "%02d:%02d.%02d", mins, secs, hundredths)

      leftTime?.textContent = str
      rightTime?.textContent = str

      leftTime?.requestLayout()
      rightTime?.requestLayout()
    }
    RunLoop.main.add(timer, forMode: .common)
    numericTimer = timer
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
  
  func gridSampleDefault(){
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
