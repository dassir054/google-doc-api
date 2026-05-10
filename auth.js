const fs = require("fs");
const readline = require("readline");
const { google } = require("googleapis");

const SCOPES = [
  "https://www.googleapis.com/auth/documents",
  "https://www.googleapis.com/auth/drive"
];

const TOKEN_PATH = "token.json";

function authorize() {

  const content = fs.readFileSync("credentials.json");

  const credentials = JSON.parse(content);

  const { client_secret, client_id, redirect_uris } =
    credentials.installed;

  const oAuth2Client = new google.auth.OAuth2(
    client_id,
    client_secret,
    redirect_uris[0]
  );

  if (fs.existsSync(TOKEN_PATH)) {

    const token = fs.readFileSync(TOKEN_PATH);

    oAuth2Client.setCredentials(JSON.parse(token));

    return oAuth2Client;
  }

  getNewToken(oAuth2Client);
}

function getNewToken(oAuth2Client) {

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });

  console.log("Authorize this app by visiting this url:");
  console.log(authUrl);

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question("Enter the code from that page here: ", (code) => {

    rl.close();

    oAuth2Client.getToken(code, (err, token) => {

      if (err) return console.error("Error retrieving access token", err);

      oAuth2Client.setCredentials(token);

      fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));

      console.log("Token stored to", TOKEN_PATH);
    });
  });
}

authorize();