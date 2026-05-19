const express = require("express");
const youtubedl = require("youtube-dl-exec");

const router = express.Router();

router.post("/", async (req, res) => {

  try {

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: "YouTube URL required"
      });
    }

    const info = await youtubedl(url, {
      dumpSingleJson: true,
      skipDownload: true,
      writeAutoSub: true,
      writeSub: true,
      subLang: "en",
      noWarnings: true,
      cookies: "./cookies/youtube.txt",
      addHeader: [
        "User-Agent: Mozilla/5.0"
      ]
    });

    const subtitles =
      info.automatic_captions ||
      info.subtitles;

    if (!subtitles) {
      return res.status(404).json({
        success: false,
        error: "No transcript available"
      });
    }

    const english =
      subtitles.en ||
      subtitles["en-US"] ||
      subtitles["en-GB"];

    if (!english || !english.length) {
      return res.status(404).json({
        success: false,
        error: "English transcript unavailable"
      });
    }

    const transcriptUrl =
      english.find(x => x.ext === "json3")?.url ||
      english.find(x => x.ext === "vtt")?.url ||
      english[0]?.url;

    return res.json({
      success: true,
      transcriptUrl
    });

  } catch (err) {

    console.error("[Transcript ERROR]", err);

    return res.status(500).json({
      success: false,
      error:
        err.stderr ||
        err.message ||
        "Transcript fetch failed"
    });

  }

});

module.exports = router;