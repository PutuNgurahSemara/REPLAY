package expo.modules.ytdl

import com.yausername.ffmpeg.FFmpeg
import com.yausername.youtubedl_android.YoutubeDL
import com.yausername.youtubedl_android.YoutubeDLRequest
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class YtdlModule : Module() {
  private var ready = false

  private fun context() = requireNotNull(appContext.reactContext) { "React context belum siap" }

  @Synchronized
  private fun ensureInit() {
    if (ready) return
    YoutubeDL.getInstance().init(context())
    FFmpeg.getInstance().init(context())
    ready = true
  }

  override fun definition() = ModuleDefinition {
    Name("Ytdl")
    Events("onProgress")

    // options: [["-f", "bestaudio"], ["-x"], ...]; mengembalikan stdout yt-dlp
    AsyncFunction("run") { url: String, options: List<List<String>>, id: String ->
      ensureInit()
      val req = YoutubeDLRequest(url)
      for (o in options) {
        if (o.size >= 2) req.addOption(o[0], o[1]) else if (o.size == 1) req.addOption(o[0])
      }
      YoutubeDL.getInstance().execute(req, id) { progress, _, line ->
        sendEvent("onProgress", mapOf("id" to id, "progress" to progress.toDouble(), "line" to line))
      }.out
    }

    // menghentikan proses yt-dlp yang berjalan dengan id ini; run() lalu gagal dengan CanceledException
    Function("cancel") { id: String -> YoutubeDL.getInstance().destroyProcessById(id) }

    AsyncFunction("update") {
      ensureInit()
      YoutubeDL.getInstance().updateYoutubeDL(context(), YoutubeDL.UpdateChannel.STABLE)?.name ?: "UNKNOWN"
    }
  }
}
