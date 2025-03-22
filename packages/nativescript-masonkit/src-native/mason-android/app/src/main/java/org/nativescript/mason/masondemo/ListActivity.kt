package org.nativescript.mason.masondemo

import android.graphics.Color
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Log
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import org.nativescript.mason.masonkit.AlignContent
import org.nativescript.mason.masonkit.AlignItems
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.Display
import org.nativescript.mason.masonkit.FlexDirection
import org.nativescript.mason.masonkit.Mason

class ListActivity : AppCompatActivity() {
  val array = ArrayList<String>()
  lateinit var adapter: CustomAdapter
  lateinit var recyclerView: RecyclerView
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    recyclerView = RecyclerView(this)
    recyclerView.layoutParams = RecyclerView.LayoutParams(
      RecyclerView.LayoutParams.MATCH_PARENT,
      RecyclerView.LayoutParams.MATCH_PARENT
    )

    repeat(1000) {
      array.add("https://robohash.org/${it + 1}?set=set4")
    }

    adapter = CustomAdapter(this)

    recyclerView.adapter = adapter

    recyclerView.layoutManager = LinearLayoutManager(this).apply {
      orientation = LinearLayoutManager.VERTICAL
    }

    setContentView(recyclerView)

  }

  class CustomAdapter(private val list: ListActivity) :
    RecyclerView.Adapter<CustomAdapter.ViewHolder>() {
    class ViewHolder(view: android.view.View) : RecyclerView.ViewHolder(view) {
      val textView: TextView
      val imageView: ImageView

      init {
        val root = view as ViewGroup
        textView = root.getChildAt(0) as TextView
        imageView = root.getChildAt(2) as ImageView
      }
    }

    override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
      val context = viewGroup.context
      val root = list.mason.createView(context)
      root.configure {
        style.setSizeWidth(Dimension.Percent(1f))
        style.display = Display.Flex
        style.alignContent = AlignContent.Stretch
        style.alignItems = AlignItems.Center
        style.flexDirection = FlexDirection.Column
        style.flexGrow = 1f
      }
      root.addView(TextView(context))
      val tv = TextView(context)
      tv.text = "Laffy Taffy!!!!"
      root.addView(tv)
      val image = ImageView(context)
      list.mason.nodeForView(image).configure {
        style.setSizeHeight(Dimension.Points(50 * context.resources.displayMetrics.density))
      }
      root.addView(image)

      return ViewHolder(root)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {
      val url = list.array[position]
      viewHolder.textView.text = url
      Glide
        .with(viewHolder.imageView)
        .load(url)
        .fitCenter()
        .override(
          (150 * list.resources.displayMetrics.density).toInt(),
          (150 * list.resources.displayMetrics.density).toInt()
        )
        .into(viewHolder.imageView)
    }

    override fun getItemCount() = list.array.size

  }
}
