package org.nativescript.mason.masondemo

import android.graphics.Color
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import android.widget.Button
import org.nativescript.mason.masondemo.databinding.ActivityFlexBinding
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import org.nativescript.mason.masonkit.enums.FlexWrap
import org.nativescript.mason.masonkit.enums.JustifyContent
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.AlignSelf
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.NodeHelper
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextView

class FlexActivity : AppCompatActivity() {
  private lateinit var binding: ActivityFlexBinding
  val mason = Mason.shared
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    // binding = ActivityFlexBinding.inflate(layoutInflater)
    // setContentView(binding.root)

//    mason:mason_width="300dp"
//    mason:mason_minWidth="10dp"

    val rootLayout = mason.createView(this)
    rootLayout.setBackgroundColor(Color.WHITE)
    rootLayout.configure {
      it.display = Display.Flex
      it.flexDirection = FlexDirection.Column
      it.flexWrap = FlexWrap.NoWrap
      it.justifyContent = JustifyContent.FlexStart
      it.alignItems = AlignItems.Stretch
      it.setPadding(0f, 0f, 0f, 0f)
      it.size = org.nativescript.mason.masonkit.Size(org.nativescript.mason.masonkit.Dimension.Percent(1f), org.nativescript.mason.masonkit.Dimension.Percent(1f))
    }

    // Top app bar
    val appBar = mason.createView(this)
    appBar.setBackgroundColor(Color.parseColor("#6D28D9")) // purple
    appBar.configure {
      it.size = Size(Dimension.Points(-1f), Dimension.Points(64f))
      it.setPadding(16f, 12f, 16f, 12f)
      it.justifyContent = JustifyContent.Center
      it.alignItems = AlignItems.Center
    }
    val title = mason.createTextView(this)
    title.textContent = "Mason Demo"
    title.configure { s ->
      s.color = android.graphics.Color.WHITE
      s.fontSize = 20
    }
    appBar.addView(title)
    rootLayout.addView(appBar)

    // Content container: wrapping row of cards
    val content = mason.createView(this)
    content.configure {
      it.display = Display.Flex
      it.flexDirection = FlexDirection.Row
      it.flexWrap = FlexWrap.Wrap
      it.justifyContent = JustifyContent.SpaceAround
      it.alignItems = AlignItems.FlexStart
      it.setPadding(12f, 12f, 12f, 12f)
    }

    val cardColors = listOf("#FFFFFF", "#FEF3C7", "#ECFDF5", "#EFF6FF", "#F5F3FF")
    for (i in 0 until 6) {
      val card = mason.createView(this)
      card.configure {
        it.setPadding(12f, 12f, 12f, 12f)
        it.size = Size(Dimension.Points(160f), Dimension.Points(180f))
      }
      // card background and subtle border
      card.setBackgroundColor(Color.parseColor(cardColors[i % cardColors.size]))

      // Add card title
      val cTitle = mason.createTextView(this)
      cTitle.textContent = "Card ${i + 1}"
      cTitle.configure { s -> s.fontSize = 16; s.color = Color.DKGRAY }
      card.addView(cTitle)

      // Add placeholder content block
      val contentBlock = mason.createView(this)
      contentBlock.setBackgroundColor(Color.parseColor("#F3F4F6"))
      contentBlock.configure {
        it.size = Size(Dimension.Points(-1f), Dimension.Points(110f))
        it.setPadding(8f, 8f, 8f, 8f)
      }
      card.addView(contentBlock)

      content.addView(card)
    }

    // Add a footer/info row
    val footer = mason.createView(this)
    footer.configure {
      it.display = Display.Flex
      it.flexDirection = FlexDirection.Row
      it.justifyContent = JustifyContent.Center
      it.alignItems = AlignItems.Center
      it.size = Size(Dimension.Points(-1f), Dimension.Points(56f))
    }
    val info = mason.createTextView(this)
    info.textContent = "Flex demo — responsive cards with wrapping"
    info.configure { s -> s.fontSize = 14; s.color = Color.DKGRAY }
    footer.addView(info)

    rootLayout.addView(content)
    rootLayout.addView(footer)

    setContentView(rootLayout)

  }
}
