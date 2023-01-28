package org.nativescript.mason.masondemo

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import org.nativescript.mason.masondemo.databinding.ActivityFlexBinding

class FlexActivity : AppCompatActivity() {
  private lateinit var binding: ActivityFlexBinding
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ActivityFlexBinding.inflate(layoutInflater)
    setContentView(binding.root)

  }
}
