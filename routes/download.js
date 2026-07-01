const express = require("express");
const router = express.Router();

const downloadMedia = require("../services/downloader");

router.post("/", async (req, res) => {

  try {

    const { url } = req.body;

    if (!url) {

      return res.status(400).json({
        success: false,
        error: "URL is required"
      });

    }

    const result = await downloadMedia(url);

    return res.json(result);

  } catch (err) {

    console.error(err);

    return res.status(500).json({

      success: false,

      error:
        err.message || "Download failed"

    });

  }

});

module.exports = router;