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
import org.nativescript.mason.masondemo.databinding.ActivityListBinding
import org.nativescript.mason.masondemo.databinding.ListItemBinding

class ListActivity : AppCompatActivity() {
  lateinit var binding: ActivityListBinding
  val array = ArrayList<String>()
  lateinit var adapter: CustomAdapter

  lateinit var recyclerView: RecyclerView

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ActivityListBinding.inflate(layoutInflater)
    setContentView(binding.root)


    repeat(5) {
      array.add("https://robohash.org/${it + 1}?set=set4")
    }

    adapter = CustomAdapter(array, resources.displayMetrics.density)

    binding.recyclerView.adapter = adapter

    binding.recyclerView.layoutManager = LinearLayoutManager(this).apply {
      orientation = LinearLayoutManager.VERTICAL
    }

  }

  class CustomAdapter(private val dataSet: ArrayList<String>, val scale: Float) :
    RecyclerView.Adapter<CustomAdapter.ViewHolder>() {
    lateinit var binding: ListItemBinding
    class ViewHolder(view: android.view.View) : RecyclerView.ViewHolder(view) {
      val textView: TextView
      val imageView: ImageView

      init {
        textView = view.findViewById(R.id.listTextView)
        imageView = view.findViewById(R.id.listImageView)
      }
    }

    override fun onCreateViewHolder(viewGroup: ViewGroup, viewType: Int): ViewHolder {
      binding = ListItemBinding.inflate(LayoutInflater.from(viewGroup.context))

      return ViewHolder(binding.root)
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
