package org.nativescript.mason.masondemo

import android.content.Intent
import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import org.nativescript.mason.masondemo.databinding.ActivityMainBinding
import org.nativescript.mason.masonkit.*

class MainActivity : AppCompatActivity() {
  private lateinit var binding: ActivityMainBinding
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
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
