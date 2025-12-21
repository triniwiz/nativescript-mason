package org.nativescript.mason.masondemo

import android.os.Bundle
import android.util.Log
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.size
import androidx.lifecycle.MutableLiveData
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Img
import org.nativescript.mason.masonkit.Mason
import org.nativescript.mason.masonkit.Scroll
import org.nativescript.mason.masonkit.Size
import org.nativescript.mason.masonkit.View
import org.nativescript.mason.masonkit.enums.AlignContent
import org.nativescript.mason.masonkit.enums.AlignItems
import org.nativescript.mason.masonkit.enums.Display
import org.nativescript.mason.masonkit.enums.FlexDirection
import java.util.concurrent.Executors

class ListActivity : AppCompatActivity() {
  val array = MutableLiveData(ArrayList<String>())
  lateinit var adapter: CustomAdapter
  lateinit var recyclerView: RecyclerView
  val mason = Mason.shared
  lateinit var body: View

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    body = mason.createView(this)
    body.style.size = Size(
      Dimension.Percent(1f),
      Dimension.Percent(1f)
    )
    recyclerView = RecyclerView(this)

    mason.styleForView(recyclerView).apply {
      this.size = Size(
        Dimension.Percent(1f),
        Dimension.Percent(1f)
      )
    }
    recyclerView.layoutParams = RecyclerView.LayoutParams(
      RecyclerView.LayoutParams.MATCH_PARENT,
      RecyclerView.LayoutParams.MATCH_PARENT
    )

    array.observe(this) {
      it?.let {
        if (::adapter.isInitialized) {
          val last = it.lastIndex
          if (last != -1) {
            adapter.notifyItemRangeChanged(0, last)
            mason.nodeForView(recyclerView).apply {
              this.dirty()
            }
            body.invalidateLayout()
          }
        }
      }
    }

    adapter = CustomAdapter(this)

    recyclerView.adapter = adapter

    recyclerView.layoutManager = LinearLayoutManager(this).apply {
      orientation = LinearLayoutManager.VERTICAL
    }

    body.appendView(recyclerView)

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

  class CustomAdapter(private val list: ListActivity) :
    RecyclerView.Adapter<CustomAdapter.ViewHolder>() {
    class ViewHolder(view: android.view.View) : RecyclerView.ViewHolder(view) {
      val textView: org.nativescript.mason.masonkit.TextView
      val imageView: Img

      init {
        val root = view as ViewGroup
        textView = root.getChildAt(0) as org.nativescript.mason.masonkit.TextView
        imageView = root.getChildAt(2) as Img
      }
    }

    override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
      val context = viewGroup.context
      val root = list.mason.createView(context)
      root.configure {
        it.display = Display.Flex
        it.alignContent = AlignContent.Stretch
        it.alignItems = AlignItems.Center
        it.flexDirection = FlexDirection.Column
        it.flexGrow = 1f
      }
      root.append(list.mason.createTextView(context))
      val tv = list.mason.createTextView(context)
      tv.textContent = "Laffy Taffy!!!!"
      root.append(tv)
      val image = list.mason.createImageView(context)
      image.configure {
        it.size = org.nativescript.mason.masonkit.Size(
          Dimension.Points(50 * context.resources.displayMetrics.density),
          Dimension.Points(50 * context.resources.displayMetrics.density),
        )
      }
      root.append(image)

      return ViewHolder(root)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {
      list.array.value?.let {
        val url = it[position]
        viewHolder.textView.textContent = url
        viewHolder.imageView.src = url
        // viewHolder.imageView.style.filter = "drop-shadow(16px 16px 20px red) invert(75%);"
      }
    }

    override fun getItemCount() = list.array.value?.size ?: 0

  }
}
