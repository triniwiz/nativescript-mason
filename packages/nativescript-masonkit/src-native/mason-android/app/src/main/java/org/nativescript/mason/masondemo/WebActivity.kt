package org.nativescript.mason.masondemo

import android.os.Bundle
import android.util.Log
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.FontFace
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Point
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Scroll
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.ObjectFit
import org.nativescript.mason.masonkit.enums.Overflow
import org.nativescript.mason.masonkit.enums.Position
import org.nativescript.mason.masonkit.enums.TextAlign
import org.nativescript.mason.masonkit.enums.TextType
import org.nativescript.mason.masonkit.toCSSColorInt
import kotlin.math.ceil
import kotlin.random.Random

class WebActivity : AppCompatActivity() {
  val mason = Mason.shared
  fun toPx(dip: Float): Float {
    return dip * resources.displayMetrics.density
  }

  lateinit var body: Scroll
  lateinit var root: View
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    body = mason.createScrollView(this)
    root = mason.createView(this)
    body.addView(root)
    body.style.overflowY = Overflow.Scroll
    enableEdgeToEdge()
    setContentView(body)
    ViewCompat.setOnApplyWindowInsetsListener(body) { v, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      body.style.setPadding(
        systemBars.left, systemBars.top, systemBars.right, systemBars.bottom
      )
      insets
    }
    webTextSample()
  }

  private fun webTextSample() {
    root.style.background = "#FAFBFC"

    // ════════════════════════════════════════════════════════════════════════════
    // HERO SECTION
    // ════════════════════════════════════════════════════════════════════════════
    val hero = mason.createView(this)
    hero.display = Display.Flex
    hero.flexDirection = FlexDirection.Column
    hero.style.setSizeWidth(1f, 2.toByte()) // 100%
    hero.style.setSizeHeight(toPx(380f), 1.toByte())
    hero.style.position = Position.Relative

    // Hero background image
    val heroImage = mason.createImageView(this)
    heroImage.style.position = Position.Absolute
    heroImage.style.inset = Rect.zeroAuto
    heroImage.style.setSizeWidth(1f, 2.toByte())
    heroImage.style.setSizeHeight(1f, 2.toByte())
    heroImage.objectFit = ObjectFit.Cover
    heroImage.src = "https://picsum.photos/800/600?random=1"
    hero.addView(heroImage)

    // Gradient overlay
    val heroOverlay = mason.createView(this)
    heroOverlay.style.position = Position.Absolute
    heroOverlay.style.inset = Rect.zeroAuto
    heroOverlay.style.background =
      "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.7) 100%)"
    hero.addView(heroOverlay)

    // Hero content
    val heroContent = mason.createView(this)
    heroContent.display = Display.Flex
    heroContent.flexDirection = FlexDirection.Column
    heroContent.style.justifyContent = JustifyContent.FlexEnd
    heroContent.style.position = Position.Absolute
    heroContent.style.inset = Rect.zeroAuto
    heroContent.style.padding = Rect.withPx(0f, toPx(24f), toPx(32f), toPx(24f))

    val heroTag = mason.createTextView(this, TextType.Span)
    heroTag.append("FEATURED DESTINATION")
    heroTag.color = "#FFFFFF".toCSSColorInt()
    heroTag.fontSize = 11
    heroTag.fontWeight = FontFace.NSCFontWeight.SemiBold
    heroTag.style.marginBottom = LengthPercentageAuto.Points(toPx(8f))
    heroContent.addView(heroTag)

    val heroTitle = mason.createTextView(this, TextType.H1)
    heroTitle.append("Discover the World")
    heroTitle.color = "#FFFFFF".toCSSColorInt()
    heroTitle.fontSize = 32
    heroTitle.fontWeight = FontFace.NSCFontWeight.Bold
    heroTitle.style.marginBottom = LengthPercentageAuto.Points(toPx(8f))
    heroContent.addView(heroTitle)

    val heroSubtitle = mason.createTextView(this, TextType.P)
    heroSubtitle.append("Explore breathtaking destinations and create unforgettable memories")
    heroSubtitle.style.color = "rgba(255,255,255,0.9)".toCSSColorInt()
    heroSubtitle.fontSize = 16
    heroContent.addView(heroSubtitle)

    hero.addView(heroContent)
    root.append(hero)

    // ════════════════════════════════════════════════════════════════════════════
    // STATS BAR
    // ════════════════════════════════════════════════════════════════════════════
    val statsBar = mason.createView(this)
    statsBar.display = Display.Flex
    statsBar.flexDirection = FlexDirection.Row
    statsBar.style.justifyContent = JustifyContent.SpaceAround
    statsBar.style.alignItems = AlignItems.Center
    statsBar.style.padding = Rect.withPx(toPx(20f), toPx(20f), toPx(20f), toPx(20f))
    statsBar.style.background = "#FFFFFF"
    statsBar.style.border = "0 0 1px 0 solid #E5E7EB"

    val stats = listOf(
      Pair("2.4M+", "Users"),
      Pair("150K", "Reviews"),
      Pair("4.9", "Rating")
    )
    for ((value, label) in stats) {
      val statItem = mason.createView(this)
      statItem.display = Display.Flex
      statItem.flexDirection = FlexDirection.Column
      statItem.style.alignItems = AlignItems.Center

      val statValue = mason.createTextView(this, TextType.Span)
      statValue.append(value)
      statValue.fontSize = 22
      statValue.fontWeight = FontFace.NSCFontWeight.Bold
      statValue.color = "#1E293B".toCSSColorInt()
      statItem.addView(statValue)

      val statLabel = mason.createTextView(this, TextType.Span)
      statLabel.append(label)
      statLabel.fontSize = 12
      statLabel.color = "#64748B".toCSSColorInt()
      statItem.addView(statLabel)

      statsBar.addView(statItem)
    }
    root.append(statsBar)

    // ════════════════════════════════════════════════════════════════════════════
    // SECTION: Popular Destinations
    // ════════════════════════════════════════════════════════════════════════════
    val destSection = mason.createView(this)
    destSection.style.padding = Rect.withPx(toPx(24f), toPx(24f), toPx(24f), toPx(24f))

    val destHeader = mason.createView(this)
    destHeader.display = Display.Flex
    destHeader.flexDirection = FlexDirection.Row
    destHeader.style.justifyContent = JustifyContent.SpaceBetween
    destHeader.style.alignItems = AlignItems.Center
    destHeader.style.marginBottom = LengthPercentageAuto.Points(toPx(16f))

    val destTitle = mason.createTextView(this, TextType.H2)
    destTitle.append("Popular Destinations")
    destTitle.fontSize = 22
    destTitle.fontWeight = FontFace.NSCFontWeight.Bold
    destTitle.color = "#1E293B".toCSSColorInt()
    destHeader.addView(destTitle)

    val viewAllLink = mason.createTextView(this, TextType.A)
    viewAllLink.append("View All")
    viewAllLink.fontSize = 14
    viewAllLink.fontWeight = FontFace.NSCFontWeight.SemiBold
    viewAllLink.color = "#3B82F6".toCSSColorInt()
    destHeader.addView(viewAllLink)

    destSection.addView(destHeader)

    // Destinations Grid - 2x2
    val destGrid = mason.createView(this)
    destGrid.display = Display.Grid
    destGrid.style.gridTemplateColumns = "1fr 1fr"
    destGrid.style.gap =
      Size(LengthPercentage.Points(toPx(12f)), LengthPercentage.Points(toPx(12f)))

    val destinations = listOf(
      Triple("Paris", "France", "https://picsum.photos/400/300?random=10"),
      Triple("Tokyo", "Japan", "https://picsum.photos/400/300?random=11"),
      Triple("New York", "USA", "https://picsum.photos/400/300?random=12"),
      Triple("London", "UK", "https://picsum.photos/400/300?random=13")
    )

    for ((city, country, imageUrl) in destinations) {
      val card = mason.createView(this)
      card.display = Display.Flex
      card.flexDirection = FlexDirection.Column
      card.style.borderRadius = "${toPx(16f)}px"
      card.style.overflow = Point(Overflow.Hidden, Overflow.Hidden)
      card.style.setSizeHeight(toPx(200f), 1.toByte())
      card.style.position = Position.Relative

      // Full-bleed background image
      val cardImage = mason.createImageView(this)
      cardImage.style.position = Position.Absolute
      cardImage.style.inset = Rect.zeroAuto
      cardImage.style.setSizeWidth(1f, 2.toByte())
      cardImage.style.setSizeHeight(1f, 2.toByte())
      cardImage.objectFit = ObjectFit.Cover
      cardImage.src = imageUrl
      card.addView(cardImage)

      // Gradient overlay for text readability
      val cardOverlay = mason.createView(this)
      cardOverlay.style.position = Position.Absolute
      cardOverlay.style.inset = Rect.zeroAuto
      cardOverlay.style.background =
        "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.6) 100%)"
      card.addView(cardOverlay)

      // Text content positioned at bottom
      val cardContent = mason.createView(this)
      cardContent.display = Display.Flex
      cardContent.flexDirection = FlexDirection.Column
      cardContent.style.justifyContent = JustifyContent.FlexEnd
      cardContent.style.position = Position.Absolute
      cardContent.style.inset = Rect.zeroAuto
      cardContent.style.padding = Rect.withPx(toPx(16f), toPx(16f), toPx(16f), toPx(16f))

      val cardTitle = mason.createTextView(this, TextType.H3)
      cardTitle.append(city)
      cardTitle.fontSize = 20
      cardTitle.fontWeight = FontFace.NSCFontWeight.Bold
      cardTitle.color = "#FFFFFF".toCSSColorInt()
      cardContent.addView(cardTitle)

      val cardSubtitle = mason.createTextView(this, TextType.P)
      cardSubtitle.append(country)
      cardSubtitle.fontSize = 14
      cardSubtitle.color = "#E2E8F0".toCSSColorInt()
      cardContent.addView(cardSubtitle)

      card.addView(cardContent)
      destGrid.addView(card)
    }

    destSection.addView(destGrid)
    root.append(destSection)

    // ════════════════════════════════════════════════════════════════════════════
    // FEATURE SHOWCASE
    // ════════════════════════════════════════════════════════════════════════════
    val featureSection = mason.createView(this)
    featureSection.style.padding = Rect.withPx(0f, toPx(24f), toPx(24f), toPx(24f))

    val featureCard = mason.createView(this)
    featureCard.display = Display.Flex
    featureCard.flexDirection = FlexDirection.Column
    featureCard.style.background = "#0F172A"
    featureCard.style.borderRadius = "${toPx(20f)}px"
    featureCard.style.padding = Rect.withPx(toPx(24f), toPx(24f), toPx(24f), toPx(24f))

    val featureLabel = mason.createTextView(this, TextType.Span)
    featureLabel.append("WHY CHOOSE US")
    featureLabel.fontSize = 11
    featureLabel.fontWeight = FontFace.NSCFontWeight.SemiBold
    featureLabel.color = "#60A5FA".toCSSColorInt()
    featureLabel.style.marginBottom = LengthPercentageAuto.Points(toPx(12f))
    featureCard.addView(featureLabel)

    val featureTitle = mason.createTextView(this, TextType.H2)
    featureTitle.append("Travel with Confidence")
    featureTitle.fontSize = 24
    featureTitle.fontWeight = FontFace.NSCFontWeight.Bold
    featureTitle.color = "#FFFFFF".toCSSColorInt()
    featureTitle.style.marginBottom = LengthPercentageAuto.Points(toPx(12f))
    featureCard.addView(featureTitle)

    val featureDesc = mason.createTextView(this, TextType.P)
    featureDesc.append("Expert local guides, 24/7 support, and flexible booking options make your journey seamless.")
    featureDesc.fontSize = 15
    featureDesc.color = "#94A3B8".toCSSColorInt()
    featureDesc.style.marginBottom = LengthPercentageAuto.Points(toPx(20f))
    featureCard.addView(featureDesc)

    // Feature icons row
    val featureIcons = mason.createView(this)
    featureIcons.display = Display.Flex
    featureIcons.flexDirection = FlexDirection.Row
    featureIcons.style.gap =
      Size(LengthPercentage.Points(toPx(16f)), LengthPercentage.Points(0f))

    for (feature in listOf("🛡️ Secure", "⭐ Rated", "🌍 Global")) {
      val featureItem = mason.createTextView(this, TextType.Span)
      featureItem.append(feature)
      featureItem.fontSize = 13
      featureItem.color = "#CBD5E1".toCSSColorInt()
      featureItem.style.flexShrink = 0f
      featureIcons.addView(featureItem)
    }
    featureCard.addView(featureIcons)

    featureSection.addView(featureCard)
    root.append(featureSection)

    // ════════════════════════════════════════════════════════════════════════════
    // TESTIMONIALS
    // ════════════════════════════════════════════════════════════════════════════
    val testimonialSection = mason.createView(this)
    testimonialSection.style.padding = Rect.withPx(0f, toPx(24f), toPx(24f), toPx(24f))

    val testimonialsTitle = mason.createTextView(this, TextType.H2)
    testimonialsTitle.append("What Travelers Say")
    testimonialsTitle.fontSize = 22
    testimonialsTitle.fontWeight = FontFace.NSCFontWeight.Bold
    testimonialsTitle.color = "#1E293B".toCSSColorInt()
    testimonialsTitle.style.marginBottom = LengthPercentageAuto.Points(toPx(16f))
    testimonialSection.addView(testimonialsTitle)

    val h100 = ceil(toPx(100f)).toInt()
    val h150 = ceil(toPx(150f)).toInt()

    val testimonials = listOf(
      Triple(
        "Sarah M.",
        "Amazing experience! The app made planning so easy.",
        "https://i.pravatar.cc/$h100?img=1"
      ),
      Triple(
        "James K.",
        "Best travel app I've ever used. Highly recommend!",
        "https://i.pravatar.cc/$h100?img=3"
      )
    )

    for ((name, quote, avatarUrl) in testimonials) {
      val testimonialCard = mason.createView(this)
      testimonialCard.display = Display.Flex
      testimonialCard.flexDirection = FlexDirection.Row
      testimonialCard.style.background = "#FFFFFF"
      testimonialCard.style.borderRadius = "${toPx(16f)}px"
      testimonialCard.style.padding = Rect.withPx(toPx(16f), toPx(16f), toPx(16f), toPx(16f))
      testimonialCard.style.marginBottom = LengthPercentageAuto.Points(toPx(12f))
      testimonialCard.style.border = "1px solid #E5E7EB"

      // Avatar
      val avatarContainer = mason.createView(this)
      avatarContainer.style.setSizeWidth(toPx(48f), 1.toByte())
      avatarContainer.style.setSizeHeight(toPx(48f), 1.toByte())
      avatarContainer.style.setMinSizeWidth(toPx(48f), 1.toByte())
      avatarContainer.style.setMinSizeHeight(toPx(48f), 1.toByte())
      avatarContainer.style.borderRadius = "50%"
      avatarContainer.style.overflow = Point(Overflow.Hidden, Overflow.Hidden)
      avatarContainer.style.marginRight = LengthPercentageAuto.Points(toPx(12f))
      avatarContainer.style.flexShrink = 0f
      avatarContainer.style.position = Position.Relative

      val avatar = mason.createImageView(this)
      avatar.style.position = Position.Absolute
      avatar.style.inset = Rect.zeroAuto
      avatar.style.setSizeWidth(1f, 2.toByte())
      avatar.style.setSizeHeight(1f, 2.toByte())
      avatar.objectFit = ObjectFit.Cover
      avatar.src = avatarUrl
      avatarContainer.addView(avatar)
      testimonialCard.addView(avatarContainer)

      // Content
      val testimonialContent = mason.createView(this)
      testimonialContent.display = Display.Flex
      testimonialContent.flexDirection = FlexDirection.Column
      testimonialContent.style.flexGrow = 1f

      // Stars
      val stars = mason.createTextView(this, TextType.Span)
      stars.append("★★★★★")
      stars.fontSize = 14
      stars.color = "#FBBF24".toCSSColorInt()
      stars.style.marginBottom = LengthPercentageAuto.Points(toPx(4f))
      testimonialContent.addView(stars)

      val quoteText = mason.createTextView(this, TextType.P)
      quoteText.append("\"$quote\"")
      quoteText.fontSize = 14
      quoteText.color = "#475569".toCSSColorInt()
      quoteText.style.marginBottom = LengthPercentageAuto.Points(toPx(8f))
      testimonialContent.addView(quoteText)

      val authorName = mason.createTextView(this, TextType.Span)
      authorName.append(name)
      authorName.fontSize = 13
      authorName.fontWeight = FontFace.NSCFontWeight.SemiBold
      authorName.color = "#1E293B".toCSSColorInt()
      testimonialContent.addView(authorName)

      testimonialCard.addView(testimonialContent)
      testimonialSection.addView(testimonialCard)
    }
    root.append(testimonialSection)

    // ════════════════════════════════════════════════════════════════════════════
    // TRAVEL GALLERY
    // ════════════════════════════════════════════════════════════════════════════
    val gallerySection = mason.createView(this)
    gallerySection.style.padding = Rect.withPx(0f, toPx(24f), toPx(24f), toPx(24f))

    val galleryTitle = mason.createTextView(this, TextType.H2)
    galleryTitle.append("Travel Gallery")
    galleryTitle.fontSize = 22
    galleryTitle.fontWeight = FontFace.NSCFontWeight.Bold
    galleryTitle.color = "#1E293B".toCSSColorInt()
    galleryTitle.style.marginBottom = LengthPercentageAuto.Points(toPx(16f))
    gallerySection.addView(galleryTitle)

    // Masonry-style gallery using two flex columns
    val galleryGrid = mason.createView(this)
    galleryGrid.display = Display.Flex
    galleryGrid.flexDirection = FlexDirection.Row
    galleryGrid.style.gap =
      Size(LengthPercentage.Points(toPx(8f)), LengthPercentage.Points(0f))

    val current = Random(System.currentTimeMillis())
    val seed1 = current.nextInt(1, Int.MAX_VALUE)
    val seed2 = current.nextInt(1, Int.MAX_VALUE)
    val seed3 = current.nextInt(1, Int.MAX_VALUE)
    val seed4 = current.nextInt(1, Int.MAX_VALUE)

    // Column 1: 150px then 100px
    val col1 = mason.createView(this)
    col1.display = Display.Flex
    col1.flexDirection = FlexDirection.Column
    col1.style.flexGrow = 1f
    col1.style.flexBasis = Dimension.Points(0f)
    col1.style.gap = Size(LengthPercentage.Points(0f), LengthPercentage.Points(toPx(8f)))

    // Column 2: 100px then 150px
    val col2 = mason.createView(this)
    col2.display = Display.Flex
    col2.flexDirection = FlexDirection.Column
    col2.style.flexGrow = 1f
    col2.style.flexBasis = Dimension.Points(0f)
    col2.style.gap = Size(LengthPercentage.Points(0f), LengthPercentage.Points(toPx(8f)))

    val galleryImages = listOf(
      Triple("https://picsum.photos/seed/${seed1}/${h150}/${h150}", 150, col1),
      Triple("https://picsum.photos/seed/${seed2}/${h100}/${h100}", 100, col2),
      Triple("https://picsum.photos/seed/${seed3}/${h100}/${h100}", 100, col1),
      Triple("https://picsum.photos/seed/${seed4}/${h150}/${h150}", 150, col2)
    )

    for ((imageUrl, height, column) in galleryImages) {
      val galleryItem = mason.createView(this)
      galleryItem.style.setSizeHeight(toPx(height.toFloat()), 1.toByte())
      galleryItem.style.borderRadius = "${toPx(12f)}px"
      galleryItem.style.overflow = Point(Overflow.Hidden, Overflow.Hidden)
      galleryItem.style.position = Position.Relative

      val galleryImage = mason.createImageView(this)
      galleryImage.style.position = Position.Absolute
      galleryImage.style.inset = Rect.zeroAuto
      galleryImage.style.setSizeWidth(1f, 2.toByte())
      galleryImage.style.setSizeHeight(1f, 2.toByte())
      galleryImage.objectFit = ObjectFit.Cover
      galleryImage.src = imageUrl
      galleryItem.addView(galleryImage)

      column.addView(galleryItem)
    }

    galleryGrid.addView(col1)
    galleryGrid.addView(col2)
    gallerySection.addView(galleryGrid)
    root.append(gallerySection)

    // ════════════════════════════════════════════════════════════════════════════
    // CTA SECTION
    // ════════════════════════════════════════════════════════════════════════════
    val ctaSection = mason.createView(this)
    ctaSection.display = Display.Flex
    ctaSection.flexDirection = FlexDirection.Column
    ctaSection.style.alignItems = AlignItems.Center
    ctaSection.style.padding = Rect.uniform(
      LengthPercentage.Points(32f)
    )
    ctaSection.style.margin = Rect.withPxAuto(0f, toPx(24f), toPx(24f), toPx(24f))
    ctaSection.style.background = "linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)"
    ctaSection.style.borderRadius = "${toPx(20f)}px"


    val ctaTitle = mason.createTextView(this, TextType.H2)
    ctaTitle.append("Start Your Journey")
    ctaTitle.fontSize = 26
    ctaTitle.fontWeight = FontFace.NSCFontWeight.Bold
    ctaTitle.color = "#FFFFFF".toCSSColorInt()
    ctaTitle.style.textAlign = TextAlign.Center
    ctaTitle.style.marginBottom = LengthPercentageAuto.Points(toPx(8f))
    ctaSection.addView(ctaTitle)

    val ctaSubtitle = mason.createTextView(this, TextType.P)
    ctaSubtitle.append("Join millions of happy travelers today")
    ctaSubtitle.fontSize = 15
    ctaSubtitle.style.color = "rgba(255,255,255,0.9)".toCSSColorInt()
    ctaSubtitle.style.textAlign = TextAlign.Center
    ctaSubtitle.style.marginBottom = LengthPercentageAuto.Points(toPx(20f))
    ctaSection.addView(ctaSubtitle)

    val ctaButton = mason.createButton(this)
    ctaButton.append("Get Started Free")
    ctaButton.style.fontSize = 16
    ctaButton.style.fontWeight = FontFace.NSCFontWeight.SemiBold
    ctaButton.style.color = "#3B82F6".toCSSColorInt()
    ctaButton.style.background = "#FFFFFF"
    ctaButton.style.borderRadius = "${toPx(12f)}px"
    ctaButton.style.border = "0"
    ctaButton.style.padding = Rect.withPx(toPx(14f), toPx(32f), toPx(14f), toPx(32f))
    ctaButton.style.textWrap = org.nativescript.mason.masonkit.Styles.TextWrap.NoWrap

    ctaSection.addView(ctaButton)
    root.append(ctaSection)

    // ════════════════════════════════════════════════════════════════════════════
    // FOOTER
    // ════════════════════════════════════════════════════════════════════════════
    val footer = mason.createView(this)
    footer.display = Display.Flex
    footer.flexDirection = FlexDirection.Column
    footer.style.alignItems = AlignItems.Center
    footer.style.padding = Rect.withPx(toPx(32f), toPx(24f), toPx(48f), toPx(24f))
    footer.style.background = "#1E293B"

    val footerLogo = mason.createTextView(this, TextType.Span)
    footerLogo.append("✈ Wanderlust")
    footerLogo.fontSize = 20
    footerLogo.fontWeight = FontFace.NSCFontWeight.Bold
    footerLogo.color = "#FFFFFF".toCSSColorInt()
    footerLogo.style.marginBottom = LengthPercentageAuto.Points(toPx(16f))
    footer.addView(footerLogo)

    val footerLinks = mason.createView(this)
    footerLinks.display = Display.Flex
    footerLinks.flexDirection = FlexDirection.Row
    footerLinks.style.gap = Size(LengthPercentage.Points(toPx(24f)), LengthPercentage.Points(0f))
    footerLinks.style.marginBottom = LengthPercentageAuto.Points(toPx(16f))

    for (linkText in listOf("About", "Privacy", "Terms", "Contact")) {
      val link = mason.createTextView(this, TextType.A)
      link.append(linkText)
      link.fontSize = 14
      link.color = "#94A3B8".toCSSColorInt()
      footerLinks.addView(link)
    }
    footer.addView(footerLinks)

    val copyright = mason.createTextView(this, TextType.P)
    copyright.append("© 2024 Wanderlust. All rights reserved.")
    copyright.fontSize = 12
    copyright.color = "#64748B".toCSSColorInt()
    footer.addView(copyright)

    root.append(footer)
  }
}
