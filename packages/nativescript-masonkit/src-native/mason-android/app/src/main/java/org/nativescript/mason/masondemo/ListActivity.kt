package org.nativescript.mason.masondemo

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide

class ListActivity : AppCompatActivity() {
  val array = ArrayList<String>()
  lateinit var adapter: CustomAdapter

  lateinit var recyclerView: RecyclerView

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setContentView(R.layout.activity_list)


    adapter = CustomAdapter(array, resources.displayMetrics.density)
    recyclerView = findViewById(R.id.recyclerView)

    repeat(1000) {
      array.add("https://robohash.org/${it + 1}?set=set4")
    }

    recyclerView.adapter = adapter

    recyclerView.layoutManager = LinearLayoutManager(this)

  }

  class CustomAdapter(private val dataSet: ArrayList<String>, val scale: Float) :
    RecyclerView.Adapter<CustomAdapter.ViewHolder>() {

    class ViewHolder(view: android.view.View) : RecyclerView.ViewHolder(view) {
      val textView: TextView
      val imageView: ImageView

      init {
        textView = view.findViewById(R.id.listTextView)
        imageView = view.findViewById(R.id.listImageView)
      }
    }

    override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
      val view = LayoutInflater.from(viewGroup.context)
        .inflate(R.layout.list_item, viewGroup, false)

      return ViewHolder(view)
    }

    override fun onBindViewHolder(viewHolder: ViewHolder, position: Int) {
      val url = dataSet[position]
      viewHolder.textView.text = url
      Glide
        .with(viewHolder.imageView)
        .load(url)
        .fitCenter()
        .override((150 * scale).toInt(), (150 * scale).toInt())
        .into(viewHolder.imageView)
    }

    override fun getItemCount() = dataSet.size

  }
}
