package org.nativescript.mason.masondemo

import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import org.json.JSONArray
import org.json.JSONObject
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.FontFace
import org.nativescript.mason.masonkit.LengthPercentage
import org.nativescript.mason.masonkit.LengthPercentageAuto
import org.nativescript.mason.masonkit.Li
import org.nativescript.mason.masonkit.ListView
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Rect
import org.nativescript.mason.masonkit.Scroll
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextView
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
import java.io.BufferedReader
import java.io.InputStreamReader
import java.net.HttpURLConnection
import java.net.URL

class WebActivity : AppCompatActivity() {
  val mason = Mason.shared
  fun toPx(dip: Float): Float {
    return dip * resources.displayMetrics.density
  }

  lateinit var body: Scroll
  lateinit var root: View
  lateinit var contentRoot: View
  lateinit var container: View
  lateinit var demoList: ListView

  // Hacker News live state
  private var hnIds: List<Int> = listOf()
  private var hnIndex: Int = 0
  private var hnPageSize: Int = 10
  private var hnLoading: Boolean = false
  private val mainHandler = Handler(Looper.getMainLooper())

  private val demoNames = listOf(
    "Web Sample",
    "Pricing",
    "FAQ",
    "Grid Demo",
    "Gallery",
    "Hacker News"
  )

  private fun clearContent() {
    contentRoot.removeAllViews()
    // Add a back bar at the top of every demo
    val backBar = mason.createView(this)
    backBar.display = Display.Flex
    backBar.flexDirection = FlexDirection.Row
    backBar.style.alignItems = AlignItems.Center
    backBar.style.padding = Rect.withPx(toPx(12f), toPx(12f), toPx(12f), toPx(12f))
    backBar.style.background = "#FFFFFF"
    backBar.style.border = "0 0 1px 0 solid #E5E7EB"

    val backBtn = mason.createButton(this)
    backBtn.append("< Back")
    backBtn.style.fontSize = 16
    backBtn.style.fontWeight = FontFace.NSCFontWeight.Medium
    backBtn.style.color = "#2196F3".toCSSColorInt()
    backBtn.addEventListener("click") {
      contentRoot.post {
        clearContent()
        showDemoList()
      }
    }
    backBar.addView(backBtn)
    contentRoot.append(backBar)
  }

  private fun showDemoList() {
    body.style.padding = Rect.withPx(0f, 0f, 0f, 0f)
    contentRoot.style.display = Display.None
    demoList.style.display = Display.Flex
  }

  private fun showDemo(index: Int) {
    demoList.style.display = Display.None
    contentRoot.style.display = Display.Flex
    when (index) {
      0 -> webTextSample()
      1 -> pricingSample()
      2 -> faqSample()
      3 -> gridDemoSample()
      4 -> galleryDemoSample()
      5 -> hackerNewsSample()
    }
  }

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)

    container = mason.createView(this)
    container.display = Display.Flex
    container.flexDirection = FlexDirection.Column
    container.style.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))

    body = mason.createScrollView(this)
    root = mason.createView(this)
    contentRoot = mason.createView(this)
    body.addView(root)
    body.style.overflowY = Overflow.Scroll

    body.addView(container)

    enableEdgeToEdge()
    setContentView(body)
    ViewCompat.setOnApplyWindowInsetsListener(root) { v, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      root.style.setPadding(
        systemBars.left, systemBars.top, systemBars.right, systemBars.bottom
      )
      insets
    }

    // ── Demo selection list ─────────────────────────────────────────────
    demoList = mason.createListView(this)
    demoList.configure {
      it.size = Size(Dimension.Percent(1f), Dimension.Percent(1f))
    }
    demoList.count = demoNames.size

    demoList.listener = object : ListView.Listener {
      override fun onCreate(type: Int): android.view.View {
        val item = mason.createListItem(this@WebActivity)
        val row = mason.createView(this@WebActivity)
        row.configure {
          it.display = Display.Flex
          it.flexDirection = FlexDirection.Row
          it.alignItems = AlignItems.Center
          it.padding = Rect.withPx(toPx(16f), toPx(16f), toPx(16f), toPx(16f))
        }
        row.style.border = "0 0 1px 0 solid #E5E7EB"

        val label = mason.createTextView(this@WebActivity)
        label.fontSize = 18
        label.fontWeight = FontFace.NSCFontWeight.Medium
        label.color = "#0F172A".toCSSColorInt()
        label.style.flexGrow = 1f
        row.addView(label)

        val chevron = mason.createTextView(this@WebActivity)
        chevron.textContent = ">"
        chevron.fontSize = 18
        chevron.color = "#94A3B8".toCSSColorInt()
        row.addView(chevron)

        item.addView(row)
        return item
      }

      override fun onBind(holder: ListView.Holder, index: Int) {
        (holder.view as? Li)?.let { li ->
          val row = li.getChildAt(0) as? android.view.ViewGroup
          val label = row?.getChildAt(0) as? TextView
          label?.textContent = demoNames[index]
          li.addEventListener("click") {
            showDemo(index)
          }
        }
      }

      override fun getItemViewType(position: Int): Int = 0
    }

    container.addView(demoList)

    // contentRoot starts hidden; shown when a demo is selected
    contentRoot.style.display = Display.None
    root.addView(contentRoot)

    // Add a back button area above contentRoot
    showDemoList()
  }

  private fun fetchTopStoriesAndLoadInitial(hnContainer: View) {
    Thread {
      try {
        val url = URL("https://hacker-news.firebaseio.com/v0/topstories.json")
        val conn = url.openConnection() as HttpURLConnection
        conn.connectTimeout = 5000
        conn.readTimeout = 5000
        conn.requestMethod = "GET"
        val rr = BufferedReader(InputStreamReader(conn.inputStream))
        val sb = StringBuilder()
        var line: String? = rr.readLine()
        while (line != null) {
          sb.append(line)
          line = rr.readLine()
        }
        rr.close()
        val arr = JSONArray(sb.toString())
        val ids = mutableListOf<Int>()
        for (i in 0 until arr.length()) {
          ids.add(arr.getInt(i))
        }
        hnIds = ids
        // load first page on main thread
        mainHandler.post {
          loadMoreHnPosts(hnContainer)
        }
      } catch (ex: Exception) {
        Log.w("WebActivity", "failed to fetch topstories", ex)
      }
    }.start()
  }

  private fun loadMoreHnPosts(hnContainer: View) {
    if (hnLoading) return
    if (hnIndex >= hnIds.size) return
    hnLoading = true
    val start = hnIndex
    val end = kotlin.math.min(hnIndex + hnPageSize, hnIds.size)
    Thread {
      val posts = mutableListOf<JSONObject>()
      for (i in start until end) {
        try {
          val id = hnIds[i]
          val url = URL("https://hacker-news.firebaseio.com/v0/item/$id.json")
          val conn = url.openConnection() as HttpURLConnection
          conn.connectTimeout = 5000
          conn.readTimeout = 5000
          conn.requestMethod = "GET"
          val rr = BufferedReader(InputStreamReader(conn.inputStream))
          val sb = StringBuilder()
          var line: String? = rr.readLine()
          while (line != null) {
            sb.append(line)
            line = rr.readLine()
          }
          rr.close()
          val obj = JSONObject(sb.toString())
          posts.add(obj)
        } catch (ex: Exception) {
          Log.w("WebActivity", "failed to fetch item", ex)
        }
      }
      // update UI
      mainHandler.post {
        try {
          for (p in posts) {
            appendHnPost(hnContainer, p, hnIndex + 1)
            hnIndex += 1
          }
        } catch (ex: Exception) {
          Log.w("WebActivity", "failed to append posts", ex)
        }
        hnLoading = false
      }
    }.start()
  }

  private fun appendHnPost(hnContainer: View, item: JSONObject, rank: Int) {
    val row = mason.createView(this)
    row.display = Display.Flex
    row.flexDirection = FlexDirection.Row
    row.style.alignItems = AlignItems.FlexStart
    row.style.padding = Rect.withPx(toPx(12f), toPx(8f), toPx(12f), toPx(8f))
    row.style.border = "0 0 1px 0 solid #E5E7EB"

    val rankView = mason.createTextView(this, TextType.Span)
    rankView.append(rank.toString())
    rankView.fontSize = 14
    rankView.fontWeight = FontFace.NSCFontWeight.SemiBold
    rankView.color = "#64748B".toCSSColorInt()
    rankView.style.setSizeWidth(toPx(28f), 1.toByte())
    rankView.style.textAlign = TextAlign.Right
    row.addView(rankView)

    val main = mason.createView(this)
    main.display = Display.Flex
    main.flexDirection = FlexDirection.Column
    main.style.marginLeft = LengthPercentageAuto.Points(toPx(12f))
    main.style.flexGrow = 1f

    val title = mason.createTextView(this, TextType.A)
    val t = item.optString("title", "(no title)")
    title.append(t)
    title.fontSize = 16
    title.fontWeight = FontFace.NSCFontWeight.SemiBold
    title.color = "#0F172A".toCSSColorInt()
    title.style.marginBottom = LengthPercentageAuto.Points(toPx(6f))
    // underline title to match Hacker News style
    title.decorationLine = org.nativescript.mason.masonkit.Styles.DecorationLine.Underline
    title.decorationColor = "#0000EE".toCSSColorInt()
    val itemUrl = item.optString("url", "https://news.ycombinator.com/item?id=${item.optInt("id")}")
    title.setOnClickListener {
      try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(itemUrl))
        startActivity(intent)
      } catch (e: Exception) {
        Log.w("WebActivity", "failed to open URL", e)
      }
    }
    main.addView(title)

    val meta = mason.createView(this)
    meta.display = Display.Flex
    meta.flexDirection = FlexDirection.Row
    meta.style.gap = Size(LengthPercentage.Points(toPx(12f)), LengthPercentage.Points(0f))

    val score = item.optInt("score", 0)
    val by = item.optString("by", "?")
    val descendants = item.optInt("descendants", 0)

    val points = mason.createTextView(this, TextType.Span)
    points.append("$score points")
    points.fontSize = 12
    points.color = "#64748B".toCSSColorInt()
    meta.addView(points)

    val byText = mason.createTextView(this, TextType.Span)
    byText.append("by $by")
    byText.fontSize = 12
    byText.color = "#64748B".toCSSColorInt()
    meta.addView(byText)

    val comments = mason.createTextView(this, TextType.Span)
    comments.append("$descendants comments")
    comments.fontSize = 12
    comments.color = "#64748B".toCSSColorInt()
    meta.addView(comments)

    main.addView(meta)
    row.addView(main)

    // append to container
    try {
      hnContainer.addView(row)
    } catch (ex: Exception) {
      // fallback to appending to contentRoot
      try {
        contentRoot.append(row)
      } catch (_: Exception) {
      }
    }
  }

  // Simple grid demo with images and captions
  private fun gridDemoSample() {
    clearContent()
    body.style.padding = Rect.withPx(toPx(56f), toPx(8f), toPx(8f), toPx(8f))
    contentRoot.style.background = "#FFFFFF"

    val outer = mason.createView(this)
    outer.display = Display.Flex
    outer.flexDirection = FlexDirection.Column
    outer.style.padding = Rect.withPx(toPx(12f), toPx(12f), toPx(12f), toPx(12f))
    contentRoot.append(outer)

    val inner = mason.createView(this)
    inner.display = Display.Flex
    inner.flexDirection = FlexDirection.Row
    inner.style.flexWrap = org.nativescript.mason.masonkit.enums.FlexWrap.Wrap
    inner.style.gap = Size(LengthPercentage.Points(toPx(12f)), LengthPercentage.Points(toPx(12f)))
    inner.style.justifyContent = JustifyContent.FlexStart
    // centered column
    inner.style.maxWidth = org.nativescript.mason.masonkit.Dimension.Points(toPx(720f))
    inner.style.marginLeft = LengthPercentageAuto.Auto
    inner.style.marginRight = LengthPercentageAuto.Auto
    outer.addView(inner)

    // create a set of image cards
    for (i in 1..12) {
      val card = mason.createView(this)
      card.display = Display.Flex
      card.flexDirection = FlexDirection.Column
      card.style.setSizeWidth(0f, 1.toByte())
      card.style.flexGrow = 1f
      card.style.minWidth = org.nativescript.mason.masonkit.Dimension.Points(toPx(140f))

      val img = mason.createImageView(this)
      img.style.setSizeHeight(toPx(120f), 1.toByte())
      img.style.setSizeWidth(1f, 2.toByte())
      img.objectFit = ObjectFit.Cover
      img.src = "https://picsum.photos/seed/grid$i/600/400"
      card.addView(img)

      val caption = mason.createTextView(this, TextType.Span)
      caption.append("Image #$i")
      caption.fontSize = 14
      caption.color = "#0F172A".toCSSColorInt()
      caption.style.marginTop = LengthPercentageAuto.Points(toPx(8f))
      card.addView(caption)

      inner.addView(card)
    }
  }

  // Polished gallery of cards with overlay and metadata
  private fun galleryDemoSample() {
    clearContent()
//    body.style.padding = Rect.withPx(toPx(56f), toPx(8f), toPx(8f), toPx(8f))
    contentRoot.style.background = "#FAFBFC"

    val root = mason.createView(this)
    root.display = Display.Flex
    root.flexDirection = FlexDirection.Column
    root.style.maxWidth =
      org.nativescript.mason.masonkit.Dimension.Points(resources.displayMetrics.widthPixels.toFloat())
    root.style.padding = Rect.withPx(toPx(16f), toPx(16f), toPx(16f), toPx(16f))
    contentRoot.append(root)

    val gallery = mason.createView(this)
    gallery.display = Display.Flex
    gallery.flexDirection = FlexDirection.Row
    gallery.style.flexWrap = org.nativescript.mason.masonkit.enums.FlexWrap.Wrap
    gallery.style.gap = Size(LengthPercentage.Points(toPx(16f)), LengthPercentage.Points(toPx(24f)))
    gallery.style.marginLeft = LengthPercentageAuto.Auto
    gallery.style.marginRight = LengthPercentageAuto.Auto
    root.addView(gallery)

    for (i in 1..8) {
      val minWidth = (resources.displayMetrics.widthPixels / 2).toFloat()
      val card = mason.createView(this)
      card.display = Display.Flex
      card.flexDirection = FlexDirection.Column
      card.style.setSizeWidth(0f, 1.toByte())
      card.style.flexGrow = 1f
      card.style.minWidth = org.nativescript.mason.masonkit.Dimension.Points(minWidth)
      card.style.background = "#FFFFFF"
      card.style.borderRadius = "8px"
      card.style.boxShadow = "0 2px 8px rgba(0,0,0,0.08)"

      val iv = mason.createImageView(this)
      iv.style.setSizeHeight(org.nativescript.mason.masonkit.Dimension.Points(minWidth))
      iv.style.setSizeWidth(org.nativescript.mason.masonkit.Dimension.Percent(1f))
      iv.objectFit = ObjectFit.Cover
      iv.src = "https://picsum.photos/seed/gallery$i/800/500"
      card.addView(iv)

      val meta = mason.createView(this)
      meta.display = Display.Flex
      meta.flexDirection = FlexDirection.Column
      meta.style.padding = Rect.withPx(toPx(12f), toPx(12f), toPx(12f), toPx(12f))

      val title = mason.createTextView(this, TextType.Span)
      title.append("Gallery Item #$i")
      title.fontSize = 16
      title.fontWeight = FontFace.NSCFontWeight.Medium
      title.color = "#0F172A".toCSSColorInt()
      meta.addView(title)

      val desc = mason.createTextView(this, TextType.Span)
      desc.append("A short description showcasing the image with nice spacing.")
      desc.fontSize = 13
      desc.color = "#64748B".toCSSColorInt()
      desc.style.marginTop = LengthPercentageAuto.Points(toPx(6f))
      meta.addView(desc)

      card.addView(meta)
      gallery.addView(card)
    }
  }

  private fun hackerNewsSample() {
    clearContent()
    // add top padding on the scroll body so header and content aren't drawn under the picker / system overscroll
    body.style.padding = Rect.withPx(toPx(56f), toPx(8f), toPx(8f), toPx(8f))
    contentRoot.style.background = "#FFFFFF"

    // Header with Y logo + nav
    val header = mason.createView(this)
    header.display = Display.Flex
    header.flexDirection = FlexDirection.Row
    header.style.background = "#FF6600"
    header.style.padding = Rect.withPx(toPx(12f), toPx(16f), toPx(12f), toPx(16f))
    header.style.alignItems = AlignItems.Center

    val logo = mason.createTextView(this, TextType.Span)
    logo.append("Y")
    logo.fontSize = 18
    logo.fontWeight = FontFace.NSCFontWeight.SemiBold
    logo.color = "#FFFFFF".toCSSColorInt()
    logo.style.marginRight = LengthPercentageAuto.Points(toPx(8f))
    logo.setOnClickListener {
      try {
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://news.ycombinator.com"))
        startActivity(intent)
      } catch (e: Exception) {
        Log.w("WebActivity", "failed to open hn home", e)
      }
    }
    header.addView(logo)

    val hdrText = mason.createTextView(this, TextType.Span)
    hdrText.append("Hacker News — Top Stories")
    hdrText.fontSize = 18
    hdrText.fontWeight = FontFace.NSCFontWeight.Bold
    hdrText.color = "#FFFFFF".toCSSColorInt()
    header.addView(hdrText)

    // spacer to push nav to the right
    val spacer = mason.createView(this)
    spacer.style.flexGrow = 1f
    header.addView(spacer)

    val navNames = listOf("new", "past", "ask", "submit")
    for (n in navNames) {
      val a = mason.createTextView(this, TextType.A)
      a.append(n)
      a.fontSize = 13
      a.color = "#FFFFFF".toCSSColorInt()
      a.style.marginRight = LengthPercentageAuto.Points(toPx(10f))
      a.setOnClickListener {
        try {
          var path = ""
          when (n) {
            "new" -> path = "newest"
            "past" -> path = "front"
            "ask" -> path = "ask"
            "submit" -> path = "submit"
          }
          val intent = Intent(Intent.ACTION_VIEW, Uri.parse("https://news.ycombinator.com/" + path))
          startActivity(intent)
        } catch (e: Exception) {
          Log.w("WebActivity", "failed to open nav", e)
        }
      }
      header.addView(a)
    }

    contentRoot.append(header)

    // Container where posts will be appended (outer + centered inner)
    val hnOuter = mason.createView(this)
    hnOuter.display = Display.Flex
    hnOuter.flexDirection = FlexDirection.Column
    hnOuter.style.padding = Rect.withPx(toPx(8f), toPx(8f), toPx(8f), toPx(8f))
    contentRoot.append(hnOuter)

    val hnInner = mason.createView(this)
    hnInner.display = Display.Flex
    hnInner.flexDirection = FlexDirection.Column
    // constrain width and center horizontally
    hnInner.style.setMaxSizeWidth(
      org.nativescript.mason.masonkit.Dimension.Points(resources.displayMetrics.widthPixels.toFloat())
    )
    hnInner.style.margin = Rect(
      LengthPercentageAuto.Zero,
      LengthPercentageAuto.Auto,
      LengthPercentageAuto.Zero,
      LengthPercentageAuto.Auto,
    )
    hnOuter.addView(hnInner)

    // Reset HN state and start loading
    hnIds = listOf()
    hnIndex = 0
    hnLoading = false

    // attach a scroll listener to the native scroll view to trigger pagination
    try {
      val native = body.view
      native.setOnScrollChangeListener { v, scrollX, scrollY, oldScrollX, oldScrollY ->
        try {
          val child = (v as? android.view.ViewGroup)?.getChildAt(0)
          if (child != null) {
            val diff = child.height - (v.height + v.scrollY)
            if (diff < 300) { // near bottom
              loadMoreHnPosts(hnInner)
            }
          }
        } catch (_: Exception) {
        }
      }
    } catch (ex: Exception) {
      Log.w("WebActivity", "unable to set scroll listener", ex)
    }

    fetchTopStoriesAndLoadInitial(hnInner)
  }

  private fun webTextSample() {
    clearContent()
    contentRoot.style.background = "#FAFBFC"

    // HERO SECTION
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
    contentRoot.append(hero)

    // STATS BAR
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
    contentRoot.append(statsBar)

    // additional sections omitted for brevity in this rebuild; keep existing samples minimal
  }

  private fun pricingSample() {
    clearContent()
    contentRoot.style.background = "#F8FAFC"
    val pricingSection = mason.createView(this)
    pricingSection.style.padding = Rect.withPx(toPx(24f), toPx(24f), toPx(24f), toPx(24f))
    val title = mason.createTextView(this, TextType.H2)
    title.append("Pricing Plans")
    title.fontSize = 22
    title.fontWeight = FontFace.NSCFontWeight.Bold
    pricingSection.addView(title)

    val plans = listOf(
      Triple("Basic", "$9", listOf("1 Project", "Email support")),
      Triple("Pro", "$29", listOf("10 Projects", "Priority support")),
      Triple("Enterprise", "Contact", listOf("Unlimited Projects", "Dedicated support"))
    )

    val row = mason.createView(this)
    row.display = Display.Flex
    row.flexDirection = FlexDirection.Row
    row.style.gap = Size(LengthPercentage.Points(toPx(12f)), LengthPercentage.Points(0f))
    row.style.padding = Rect.withPx(0f, toPx(8f), 0f, toPx(8f))

    for ((name, price, features) in plans) {
      val card = mason.createView(this)
      card.display = Display.Flex
      card.flexDirection = FlexDirection.Column
      card.style.background = "#FFFFFF"
      card.style.padding = Rect.withPx(toPx(16f), toPx(16f), toPx(16f), toPx(16f))
      card.style.borderRadius = "12px"

      val n = mason.createTextView(this, TextType.H3)
      n.append(name)
      n.fontSize = 18
      n.fontWeight = FontFace.NSCFontWeight.SemiBold
      card.addView(n)

      val p = mason.createTextView(this, TextType.Span)
      p.append(price)
      p.fontSize = 20
      p.fontWeight = FontFace.NSCFontWeight.Bold
      p.style.marginBottom = LengthPercentageAuto.Points(toPx(8f))
      card.addView(p)

      for (f in features) {
        val fv = mason.createTextView(this, TextType.Span)
        fv.append("• $f")
        fv.fontSize = 13
        fv.style.marginBottom = LengthPercentageAuto.Points(toPx(6f))
        fv.style.setLineHeight(20f, false)
        card.addView(fv)
      }

      row.addView(card)
    }

    pricingSection.addView(row)
    contentRoot.append(pricingSection)
  }

  private fun faqSample() {
    clearContent()
    contentRoot.style.background = "#FFFFFF"
    val faqSection = mason.createView(this)
    faqSection.style.padding = Rect.withPx(toPx(24f), toPx(24f), toPx(24f), toPx(24f))
    val title = mason.createTextView(this, TextType.H2)
    title.append("Frequently Asked Questions")
    title.fontSize = 22
    title.fontWeight = FontFace.NSCFontWeight.Bold
    faqSection.addView(title)

    val faqs = listOf(
      Pair("How do I book?", "Select a destination and follow the booking flow."),
      Pair(
        "Can I change my dates?",
        "Yes — modify booking from your profile up to 24 hours before travel."
      ),
      Pair("Refund policy?", "Refunds processed within 7-10 business days.")
    )

    for ((q, a) in faqs) {
      val qv = mason.createTextView(this, TextType.H3)
      qv.append(q)
      qv.fontSize = 16
      qv.fontWeight = FontFace.NSCFontWeight.SemiBold
      qv.style.marginBottom = LengthPercentageAuto.Points(toPx(6f))
      faqSection.addView(qv)

      val av = mason.createTextView(this, TextType.P)
      av.append(a)
      av.fontSize = 14
      av.style.setLineHeight(22f, false)
      av.style.marginBottom = LengthPercentageAuto.Points(toPx(16f))
      faqSection.addView(av)
    }

    contentRoot.append(faqSection)
  }
}
