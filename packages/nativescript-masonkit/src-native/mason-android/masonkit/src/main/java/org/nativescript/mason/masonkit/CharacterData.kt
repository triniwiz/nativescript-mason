package org.nativescript.mason.masonkit

interface CharacterData {
  var data: String
  val length: Int
  fun appendData(data: String): CharacterData
  fun insertData(offset: Int, data: String): CharacterData
  fun deleteData(offset: Int, count: Int): CharacterData
  fun replaceData(offset: Int, count: Int, data: String): CharacterData
  fun substringData(offset: Int, count: Int): String
}
