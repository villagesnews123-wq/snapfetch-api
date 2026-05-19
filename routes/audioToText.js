const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");

const router = express.Router();

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY
});

const upload = multer({
  dest: "uploads/"
});

router.post(
  "/",
  upload.single("audio"),
  async (req, res) => {

    try {

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: "Audio file required"
        });
      }

      const filePath = path.resolve(req.file.path);

      const transcription =
        await groq.audio.transcriptions.create({

          file: fs.createReadStream(filePath),

          model: "whisper-large-v3-turbo",

          response_format: "verbose_json",

          language: "en",

          temperature: 0
        });

      // delete uploaded file
      fs.unlinkSync(filePath);

      return res.json({
        success: true,
        text: transcription.text
      });

    } catch (err) {

      console.error(
        "[Audio Transcription ERROR]",
        err
      );

      return res.status(500).json({
        success: false,
        error:
          err.message ||
          "Audio transcription failed"
      });

    }

  }
);

module.exports = router;