const express = require("express");
const youtubedl = require("youtube-dl-exec");
const path = require("path");

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

    // YouTube cookies file
    const COOKIE_FILE = path.resolve(
      process.cwd(),
      "cookies/youtube.txt"
    );

    console.log(
      "[Transcript] Using cookies:",
      COOKIE_FILE
    );

    // Fetch video + subtitles
    const info = await youtubedl(url, {

      dumpSingleJson: true,

      skipDownload: true,

      writeAutoSub: true,

      writeSub: true,

      subLang: "en",

      subFormat: "json3",

      noWarnings: true,

      cookies: COOKIE_FILE,

      addHeader: [
        "User-Agent: Mozilla/5.0"
      ]

    });

    // Captions
    const subtitles =
      info.automatic_captions ||
      info.subtitles;

    if (!subtitles) {
      return res.status(404).json({
        success: false,
        error: "No transcript available"
      });
    }

    // English subtitles
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

    // Return subtitle URL
    return res.json({
      success: true,

      title: info.title || "",

      transcriptUrl: english[0].url

    });

  } catch (err) {

    console.error(
      "[Transcript ERROR]",
      err
    );

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