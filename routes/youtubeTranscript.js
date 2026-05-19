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
      subFormat: "json3",
      noWarnings: true
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

    return res.json({
      success: true,
      transcriptUrl: english[0].url
    });

  } catch (err) {

    console.error(err);

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