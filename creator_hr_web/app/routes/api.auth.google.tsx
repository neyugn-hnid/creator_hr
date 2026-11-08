import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { google } from "googleapis";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_LOGIN_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

export async function loader({ request }: LoaderFunctionArgs) {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    return redirect("/login?error=missing_google_credentials");
  }

  const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "online",
    prompt: "select_account",
    scope: [
      "https://www.googleapis.com/auth/userinfo.email",
      "https://www.googleapis.com/auth/userinfo.profile",
    ],
  });

  return redirect(authUrl);
}

export default function Route() {
  return null;
}
