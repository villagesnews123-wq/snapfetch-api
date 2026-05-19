const express = require("express");
const { YoutubeTranscript } = require("youtube-transcript");

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

    const transcript =
      await YoutubeTranscript.fetchTranscript(url);

    const text = transcript
      .map(item => item.text)
      .join(" ");

    return res.json({
      success: true,
      transcript: text
    });

  } catch (err) {

    console.error(err);

    return res.status(500).json({
      success: false,
      error:
        err.message ||
        "Transcript fetch failed"
    });
  }
});

module.exports = router;