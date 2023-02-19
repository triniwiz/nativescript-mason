package org.nativescript.mason.masondemo

import androidx.appcompat.app.AppCompatActivity
import android.os.Bundle
import android.util.Log
import org.nativescript.mason.masondemo.databinding.ActivityFlexBinding
import org.nativescript.mason.masonkit.Dimension
import org.nativescript.mason.masonkit.NodeHelper

class FlexActivity : AppCompatActivity() {
  private lateinit var binding: ActivityFlexBinding
  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    binding = ActivityFlexBinding.inflate(layoutInflater)
    setContentView(binding.root)

//    mason:mason_width="300dp"
//    mason:mason_minWidth="10dp"

    val flexBtnNode = binding.flexRoot.nodeForView(binding.btn)

    flexBtnNode.configure {
      NodeHelper.setSizeWidth(flexBtnNode, Dimension.Points(1100f))
    }

    flexBtnNode.configure {
      NodeHelper.setMinSizeWidth(flexBtnNode, Dimension.Points(300f))
    }

    flexBtnNode.configure {
      NodeHelper.setMaxSizeWidth(flexBtnNode, Dimension.Points(1200f))
    }

  }
}
