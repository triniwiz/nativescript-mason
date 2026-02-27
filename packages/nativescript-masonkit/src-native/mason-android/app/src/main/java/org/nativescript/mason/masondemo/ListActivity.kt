package org.nativescript.mason.masondemo

import android.os.Bundle
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.MutableLiveData
import androidx.recyclerview.widget.RecyclerView
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
  lateinit var adapter: ListView.Adapter
  lateinit var list: ListView
  val mason = Mason.shared
  lateinit var body: View

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    body = mason.createView(this)
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
      override fun onCreate(type: Int): Li {
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
          val url = it[index]
          val root = holder.view.getChildAt(0) as? ViewGroup
          val textView = root?.getChildAt(0) as? TextView
          val imageView = root?.getChildAt(1) as? Img

          textView?.textContent = url
          imageView?.src = url
          // viewHolder.imageView.style.filter = "drop-shadow(16px 16px 20px red) invert(75%);"
        }
      }

      override fun getItemViewType(position: Int): Int {
        return position
      }
    }

    array.observe(this) {
      it?.let {
        if (::adapter.isInitialized) {
          val last = it.lastIndex
          if (last != -1) {
            list.count = it.size
            adapter.notifyItemRangeChanged(0, last)
          }
        }
      }
    }

    body.appendView(list)

    Executors.newSingleThreadExecutor().execute {
      val arr = ArrayList<String>(1000)

      repeat(1000) {
        arr.add("https://robohash.org/${it + 1}?set=set4")
      }
      array.postValue(
        arr
      )
    }

    setContentView(body)

  }

}
