package org.nativescript.mason.masondemo

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.DisplayMetrics
import android.util.Log
import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.bumptech.glide.Glide
import org.nativescript.mason.masonkit.*

class MainActivity : AppCompatActivity() {
    lateinit var imageView: ImageView
    lateinit var rootView: View
    lateinit var container: View
    lateinit var recyclerView: RecyclerView
    val array = ArrayList<String>()
    lateinit var adapter: CustomAdapter
    lateinit var metrics: DisplayMetrics

    fun dipToPx(value: Float): Float{
      return value * metrics.density
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        Mason.shared = false
        metrics = resources.displayMetrics
        adapter = CustomAdapter(array, resources.displayMetrics.density)
        rootView = findViewById(R.id.rootView)
       // container = findViewById(R.id.container)
        imageView = findViewById(R.id.imageView)
        recyclerView = findViewById(R.id.recyclerView)

//      rootView.setGap(dipToPx(10f), dipToPx(10f))
//
//      rootView.gridTemplateColumns = arrayOf(TrackSizingFunction.AutoRepeat(GridTrackRepetition.AutoFill,
//        arrayOf(MinMax.Values(MinSizing.Points(dipToPx(200f)), MaxSizing.Flex(1f)))))



        Glide.with(this)
            .load("https://hips.hearstapps.com/digitalspyuk.cdnds.net/17/19/1494434353-deadpool.jpg")
            .fitCenter()
            .override(500, 500)
            .into(imageView)



        val start = System.currentTimeMillis()

        val params = ViewGroup.LayoutParams(
            ViewGroup.LayoutParams.MATCH_PARENT,
            ViewGroup.LayoutParams.WRAP_CONTENT
        )
        repeat(1000) {
            array.add("https://robohash.org/${it + 1}?set=set4")
          rootView.node.configure {

          }
//            val view = TextView(this)
//            view.text = "Laffy Taffy ${it + 1}"
//
//            container.addView(
//                view, params
//            )
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
