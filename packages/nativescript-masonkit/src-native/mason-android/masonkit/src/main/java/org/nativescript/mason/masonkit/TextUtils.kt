package org.nativescript.mason.masonkit

import android.icu.text.Transliterator
import android.os.Build
import androidx.annotation.RequiresApi

object TextUtils {

  private val dakutenMap: Map<Char, Char> = mapOf(
    'カ' to 'ガ',
    'キ' to 'ギ',
    'ク' to 'グ',
    'ケ' to 'ゲ',
    'コ' to 'ゴ',
    'サ' to 'ザ',
    'シ' to 'ジ',
    'ス' to 'ズ',
    'セ' to 'ゼ',
    'ソ' to 'ゾ',
    'タ' to 'ダ',
    'チ' to 'ヂ',
    'ツ' to 'ヅ',
    'テ' to 'デ',
    'ト' to 'ド',
    'ハ' to 'バ',
    'ヒ' to 'ビ',
    'フ' to 'ブ',
    'ヘ' to 'ベ',
    'ホ' to 'ボ',
    'ウ' to 'ヴ'
  )

  private val handakutenMap: Map<Char, Char> = mapOf(
    'ハ' to 'パ', 'ヒ' to 'ピ', 'フ' to 'プ', 'ヘ' to 'ペ', 'ホ' to 'ポ'
  )
  private val halfwidthToFullwidthMap: Map<Char, Char> = mapOf(
    'ｦ' to 'ヲ',
    'ｧ' to 'ァ',
    'ｨ' to 'ィ',
    'ｩ' to 'ゥ',
    'ｪ' to 'ェ',
    'ｫ' to 'ォ',
    'ｬ' to 'ャ',
    'ｭ' to 'ュ',
    'ｮ' to 'ョ',
    'ｯ' to 'ッ',
    'ｰ' to 'ー',
    'ｱ' to 'ア',
    'ｲ' to 'イ',
    'ｳ' to 'ウ',
    'ｴ' to 'エ',
    'ｵ' to 'オ',
    'ｶ' to 'カ',
    'ｷ' to 'キ',
    'ｸ' to 'ク',
    'ｹ' to 'ケ',
    'ｺ' to 'コ',
    'ｻ' to 'サ',
    'ｼ' to 'シ',
    'ｽ' to 'ス',
    'ｾ' to 'セ',
    'ｿ' to 'ソ',
    'ﾀ' to 'タ',
    'ﾁ' to 'チ',
    'ﾂ' to 'ツ',
    'ﾃ' to 'テ',
    'ﾄ' to 'ト',
    'ﾅ' to 'ナ',
    'ﾆ' to 'ニ',
    'ﾇ' to 'ヌ',
    'ﾈ' to 'ネ',
    'ﾉ' to 'ノ',
    'ﾊ' to 'ハ',
    'ﾋ' to 'ヒ',
    'ﾌ' to 'フ',
    'ﾍ' to 'ヘ',
    'ﾎ' to 'ホ',
    'ﾏ' to 'マ',
    'ﾐ' to 'ミ',
    'ﾑ' to 'ム',
    'ﾒ' to 'メ',
    'ﾓ' to 'モ',
    'ﾔ' to 'ヤ',
    'ﾕ' to 'ユ',
    'ﾖ' to 'ヨ',
    'ﾗ' to 'ラ',
    'ﾘ' to 'リ',
    'ﾙ' to 'ル',
    'ﾚ' to 'レ',
    'ﾛ' to 'ロ',
    'ﾜ' to 'ワ',
    'ﾝ' to 'ン'
  )

  internal fun fullWidthTransformed(string: String): String {
    val result = StringBuilder(string.length)
    for (char in string) {
      val code = char.code
      if (code in 0x21..0x7E) {
        result.append((code + 0xFEE0).toChar())
      } else {
        result.append(char)
      }
    }
    return result.toString()
  }

  @RequiresApi(Build.VERSION_CODES.Q)
  internal fun fullWidthKana(string: String): String {
    val transliterator = Transliterator.getInstance("Halfwidth-Fullwidth")
    return transliterator.transliterate(string)
  }

  internal fun fullWidthKanaCompat(string: String): String {
    val builder = StringBuilder(string.length)
    var lastFullwidthKanaIndex = -1

    for (char in string) {
      when (char) {
        in 'ｦ'..'ﾝ' -> {
          // Halfwidth Kana
          val fullwidth = halfwidthToFullwidthMap[char] ?: char
          builder.append(fullwidth)
          lastFullwidthKanaIndex = builder.length - 1
        }

        'ﾞ' -> {
          if (lastFullwidthKanaIndex != -1) {
            val base = builder[lastFullwidthKanaIndex]
            val combined = dakutenMap[base] ?: base
            builder.setCharAt(lastFullwidthKanaIndex, combined)
          } else {
            builder.append('゛')
          }
          lastFullwidthKanaIndex = -1
        }

        'ﾟ' -> {
          if (lastFullwidthKanaIndex != -1) {
            val base = builder[lastFullwidthKanaIndex]
            val combined = handakutenMap[base] ?: base
            builder.setCharAt(lastFullwidthKanaIndex, combined)
          } else {
            builder.append('゜')
          }
          lastFullwidthKanaIndex = -1
        }

        in '\u0021'..'\u007E' -> {
          // Fullwidth ASCII
          val fullwidth = (char.code + 0xFEE0).toChar()
          builder.append(fullwidth)
          lastFullwidthKanaIndex = -1
        }

        else -> {
          builder.append(char)
          lastFullwidthKanaIndex = -1
        }
      }
    }
    return builder.toString()
  }

  internal fun balancedText(input: String): String {
    // todo
    return input
  }
}
