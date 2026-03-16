package org.nativescript.mason.masondemo

import android.os.Bundle
import android.view.ViewGroup
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.MutableLiveData
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Img
import org.nativescript.mason.masonkit.Li
import org.nativescript.mason.masonkit.ListView
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.TextView
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.enums.AlignContent
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import java.util.concurrent.Executors

class ListActivity : AppCompatActivity() {
  val array = MutableLiveData(ArrayList<String>())
  lateinit var list: ListView
  val mason = Mason.shared
  lateinit var body: View

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    body = mason.createView(this)
    val content = mason.createView(this)

    enableEdgeToEdge()

    ViewCompat.setOnApplyWindowInsetsListener(content) { view, insets ->
      val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
      content.style.setPadding(
        systemBars.left + 24, systemBars.top + 24,
        systemBars.right + 24, 0
      )
      insets
    }

    body.addView(content)

    body.style.size = Size(
      Dimension.Percent(1f),
      Dimension.Percent(1f)
    )
    list = mason.createListView(this)

    list.configure {
      it.size = Size(
        Dimension.Percent(1f),
        Dimension.Percent(1f)
      )
    }

    list.listener = object : ListView.Listener {
      override fun onCreate(type: Int): android.view.View {
        if (type == 1) {
          return mason.createView(this@ListActivity)
        }
        val ret = mason.createListItem(this@ListActivity)

        val root = mason.createView(this@ListActivity)
        root.configure {
          it.display = Display.Flex
          it.alignContent = AlignContent.Stretch
          it.alignItems = AlignItems.Center
          it.flexDirection = FlexDirection.Column
          it.flexGrow = 1f
        }
        root.append(mason.createTextView(this@ListActivity))
        val tv = mason.createTextView(this@ListActivity)
        tv.textContent = "Laffy Taffy!!!!"
        root.append(tv)
        val image = mason.createImageView(this@ListActivity)
        image.configure {
          it.size = Size(
            Dimension.Points(50 * mason.scale),
            Dimension.Points(50 * mason.scale),
          )
        }
        root.append(image)

        ret.addView(root)

        return ret
      }

      override fun onBind(
        holder: ListView.Holder,
        index: Int
      ) {
        array.value?.let {
          (holder.view as? Li)?.let { view ->
            val url = it[index]
            val root = view.getChildAt(0) as? ViewGroup
            val textView = root?.getChildAt(0) as? TextView
            val imageView = root?.getChildAt(2) as? Img

            textView?.textContent = url
            imageView?.src = url
            // viewHolder.imageView.style.filter = "drop-shadow(16px 16px 20px red) invert(75%);"
          }
        }
      }

      override fun getItemViewType(position: Int): Int {
        if (position == array.value?.lastIndex) {
          return 1
        }
        return 0
      }
    }

    array.observe(this) {
      it?.let {
        val last = it.lastIndex
        if (last != -1) {
          list.count = it.size
          list.notifyItemRangeChanged(0, last)
        }
      }
    }

    body.appendView(list)

    Executors.newSingleThreadExecutor().execute {
      Thread.sleep(1000)
      val arr = ArrayList<String>(1000)

      repeat(1000) {
        arr.add("https://robohash.org/${it + 1}?set=set4")
      }
      arr.add("test")
      array.postValue(
        arr
      )
    }

    setContentView(body)

  }

}
