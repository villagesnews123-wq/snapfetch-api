const cookieFile = url.includes("instagram")
  ? "./cookies/instagram.txt"
  : url.includes("facebook")
  ? "./cookies/facebook.txt"
  : "./cookies/youtube.txt";

const metadata = await youtubedl(url, {
  dumpSingleJson: true,
  noWarnings: true,
  noCheckCertificates: true,
  preferFreeFormats: true,
  cookies: cookieFile,
  addHeader: [
    "User-Agent: Mozilla/5.0"
  ],
  extractorRetries: 5,
  format: "bestvideo+bestaudio/best"
});

const formats = metadata.formats || [];

const bestVideo =
  formats
    .filter(f => f.ext === "mp4" && f.url)
    .sort((a, b) => (b.height || 0) - (a.height || 0))[0] ||
  formats.find(f => f.url);

if (!bestVideo) {
  return res.status(404).json({
    success: false,
    error: "No downloadable media found"
  });
}

return res.json({
  success: true,

  platform: metadata.extractor || null,

  title: metadata.title || null,

  description: metadata.description || "",

  tags: metadata.tags || [],

  thumbnail: metadata.thumbnail || null,

  thumbnail_hd:
    metadata.thumbnail ||
    (metadata.thumbnails?.length
      ? metadata.thumbnails[
          metadata.thumbnails.length - 1
        ].url
      : null),

  thumbnails: metadata.thumbnails || [],

  display_resources:
    metadata.display_resources || [],

  duration: metadata.duration || null,

  formats:
    formats.map(f => ({
      format_id: f.format_id,
      ext: f.ext,
      quality: f.height || f.format_note || null,
      width: f.width || null,
      height: f.height || null,
      filesize: f.filesize || null,
      url: f.url,
      has_audio: f.acodec !== "none"
    })),

  items:
    metadata.entries?.map(item => ({
      type:
        item.ext === "jpg"
          ? "image"
          : "video",

      url: item.url,

      thumbnail:
        item.thumbnail || null
    })) || [],

  download: bestVideo.url
});

  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      error: err.message
    });
  }
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});