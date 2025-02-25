package org.nativescript.mason.masondemo

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import org.nativescript.mason.masondemo.databinding.ActivityMainBinding
import org.nativescript.mason.masonkit.*

class MainActivity : AppCompatActivity() {
  private lateinit var binding: ActivityMainBinding
  val mason = Mason()
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)


    val now = System.currentTimeMillis()

    // 1000 :- 90
    // 10000 :- 457
    // 100000 :- 3270
    // 1000000 :- 90 x

    // crit

    // 1000 :- ~31
    // 10000 :- ~122
    // 100000 :- ~2962
    // 1000000 :- 90 x

  //  for(i in 0 until 1000){
  //    val node = mason.createNode()
//      if (i == 100000){
//        System.gc()
//      }
  //  }

    Log.d("com.test", "time ${System.currentTimeMillis() - now}")


    binding = ActivityMainBinding.inflate(layoutInflater)
    setContentView(binding.root)


    binding.btnImage.setOnClickListener {
      val intent = Intent(this, ImageActivity::class.java)
      startActivity(intent)
    }

    binding.btnAnimation.setOnClickListener {
      val intent = Intent(this, AnimationActivity::class.java)
      startActivity(intent)
    }


    binding.btnAbsolute.setOnClickListener {
      val intent = Intent(this, AbsoluteActivity::class.java)
      startActivity(intent)
    }

    binding.btnFlex.setOnClickListener {
      val intent = Intent(this, FlexActivity::class.java)
      startActivity(intent)
    }

    binding.btnGrid.setOnClickListener {
      val intent = Intent(this, GridActivity::class.java)
      startActivity(intent)
    }

    binding.btnList.setOnClickListener {
      val intent = Intent(this, ListActivity::class.java)
      startActivity(intent)
    }

    binding.btnScroll.setOnClickListener {
      val intent = Intent(this, ScrollActivity::class.java)
      startActivity(intent)
    }


  }


}
