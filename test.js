const ig = require("./src/instagram/extractor");

(async () => {
  try {
    const result = await ig("https://www.instagram.com/p/DYOM_ReAeR-/");
    console.log(result);
  } catch (err) {
    console.error(err);
  }
})();