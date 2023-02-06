package org.nativescript.mason.masondemo

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import org.nativescript.mason.masondemo.databinding.ActivityAbsoluteBinding
import org.nativescript.mason.masondemo.databinding.ActivityFlexBinding
import org.nativescript.mason.masonkit.Display
import org.nativescript.mason.masonkit.Position

class AbsoluteActivity : AppCompatActivity() {
  private lateinit var binding: ActivityAbsoluteBinding
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ActivityAbsoluteBinding.inflate(layoutInflater)
    setContentView(binding.root)
  }
}
