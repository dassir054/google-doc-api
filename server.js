const express = require("express");
const { google } = require("googleapis");

const app = express();

app.use(express.json());

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

    const images = req.body.images;
images.reverse();
    const document = await docs.documents.get({
      documentId: docId,
    });

    const content = document.data.body.content;

    const requests = [];

    for (const imageItem of images) {

      const tag = imageItem.tag;

      const imageUrl = imageItem.imageUrl;

      let foundIndex = null;

      for (const item of content) {

        if (!item.paragraph) continue;

        for (const element of item.paragraph.elements) {

          if (
            element.textRun &&
            element.textRun.content.includes(tag)
          ) {

            const placeholderIndex =
              element.textRun.content.indexOf(tag);

            foundIndex =
              element.startIndex + placeholderIndex;
          }
        }
      }

      if (!foundIndex) continue;

      requests.push({

        insertInlineImage: {
          location: {
            index: foundIndex
          },
          uri: imageUrl,
          objectSize: {
            height: {
              magnitude: 35,
              unit: "PT"
            },
            width: {
              magnitude: 35,
              unit: "PT"
            }
          }
        }
      });

      requests.push({

        deleteContentRange: {
          range: {
            startIndex: foundIndex + 1,
            endIndex: foundIndex + tag.length + 1
          }
        }
      });

    }

    await docs.documents.batchUpdate({
      documentId: docId,
      requestBody: {
        requests
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