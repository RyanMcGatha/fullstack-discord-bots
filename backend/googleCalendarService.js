const { google } = require("googleapis");
const dotenv = require("dotenv");
const fs = require("fs");

dotenv.config();

// Path to token.json
const TOKEN_PATH = "token.json";

// Scopes for Google Calendar
const SCOPES = ["https://www.googleapis.com/auth/calendar"];

// OAuth2 client
const oAuth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Get the OAuth URL to authenticate
function getAuthUrl() {
  return oAuth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
}

// Function to store the token
function storeToken(token) {
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token));
  console.log("Token stored to", TOKEN_PATH);
}

// Authenticate the user
async function authenticate(code) {
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);
  storeToken(tokens);
}

// Load the token
function loadToken() {
  try {
    const token = fs.readFileSync(TOKEN_PATH);
    oAuth2Client.setCredentials(JSON.parse(token));
    return true;
  } catch (err) {
    return false;
  }
}

// Check if a valid token exists
function hasValidToken() {
  if (loadToken()) {
    const credentials = oAuth2Client.credentials;
    return credentials && credentials.access_token && credentials.refresh_token;
  }
  return false;
}

// Add an event to the Google Calendar
async function addEventToCalendar(eventDetails) {
  const calendar = google.calendar({ version: "v3", auth: oAuth2Client });
  const event = {
    summary: eventDetails.summary,
    start: { dateTime: eventDetails.start },
    end: { dateTime: eventDetails.end },
  };

  try {
    const res = await calendar.events.insert({
      calendarId: "primary",
      resource: event,
    });
    return `Event created: ${res.data.htmlLink}`;
  } catch (err) {
    console.error("Error creating event:", err);
    throw new Error("Failed to create the event.");
  }
}

module.exports = {
  getAuthUrl,
  authenticate,
  loadToken,
  addEventToCalendar,
  hasValidToken,
};
