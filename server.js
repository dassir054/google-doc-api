const express = require("express");
const fs = require("fs");
const axios = require("axios");
const { google } = require("googleapis");

const app = express();

app.use(express.json());

app.use("/images", express.static("images"));

const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

const token = JSON.parse(process.env.GOOGLE_TOKEN);

const { client_secret, client_id, redirect_uris } =
  credentials.installed;

const auth = new google.auth.OAuth2(
  client_id,
  client_secret,
  redirect_uris[0]
);

auth.setCredentials(token);

const docs = google.docs({
  version: "v1",
  auth,
});

app.post("/replace-images", async (req, res) => {

  try {

    const docId = req.body.docId;

    const imageUrl = req.body.imageUrl;

    const response = await axios({
      url: imageUrl,
      method: "GET",
      responseType: "stream"
    });

    const localFile = "images/test.jpg";

    const writer = fs.createWriteStream(localFile);

    response.data.pipe(writer);

    await new Promise((resolve, reject) => {

      writer.on("finish", resolve);

      writer.on("error", reject);
    });

    const document = await docs.documents.get({
      documentId: docId,
    });

    const content = document.data.body.content;

    let foundIndex = null;

    for (const item of content) {

      if (!item.paragraph) continue;

      for (const element of item.paragraph.elements) {

        if (
          element.textRun &&
          element.textRun.content.includes("{{i17}}")
        ) {

          foundIndex = element.startIndex;
        }
      }
    }

    if (!foundIndex) {

      return res.status(404).json({
        error: "Placeholder not found"
      });
    }
await new Promise(resolve => setTimeout(resolve, 2000));
    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests: [

          {
            replaceAllText: {
              containsText: {
                text: "{{i17}}",
                matchCase: true
              },
              replaceText: ""
            }
          },

          {
            insertInlineImage: {
              location: {
                index: foundIndex
              },
              uri: "https://google-doc-api.onrender.com/images/test.jpg",
              objectSize: {
                height: {
                  magnitude: 20,
                  unit: "PT"
                },
                width: {
                  magnitude: 20,
                  unit: "PT"
                }
              }
            }
          }

        ]
      }
    });

    res.json({
      success: true
    });

  } catch (error) {

    console.log(error);

    res.status(500).json({
      error: error.message
    });
  }
});

app.listen(3000, () => {
  console.log("Server running on port 3000");
});