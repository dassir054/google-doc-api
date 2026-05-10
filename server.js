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

    const imageUrl = req.body.imageUrl;

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
const placeholderIndex =
  element.textRun.content.indexOf("{{i20}}");

foundIndex =
  element.startIndex + placeholderIndex;
          
        }
      }
    }

    if (!foundIndex) {

      return res.status(404).json({
        error: "Placeholder not found"
      });
    }

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
                index: foundIndex +1
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