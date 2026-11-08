import type { LoaderFunctionArgs } from "react-router";
import { redirect } from "react-router";
import { google } from "googleapis";
import { prisma } from "~/lib/db";
import { createUserSession } from "~/lib/session.server";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID || "";
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || "";
const REDIRECT_URI = process.env.GOOGLE_LOGIN_REDIRECT_URI || "http://localhost:3000/api/auth/google/callback";

export async function loader({ request }: LoaderFunctionArgs) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error || !code) {
    return redirect("/login?error=google_oauth_denied");
  }

  try {
    const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email?.toLowerCase().trim();
    const name = userInfo.data.name || "Người dùng Google";
    const avatar = userInfo.data.picture || null;

    if (!email) {
      return redirect("/login?error=no_email_from_google");
    }

    // Upsert or find user by email
    let user = await prisma.user.findFirst({
      where: { email, isDeleted: false },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name,
          email,
          avatar,
          password: "123456",
          role: "EMPLOYEE",
          department: "Sáng Tạo Nội Dung",
          position: "Biên Tập Viên",
        },
      });
    } else if (avatar && !user.avatar) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar },
      });
    }

    await prisma.activityLog.create({
      data: {
        actorId: user.id,
        actorName: user.name,
        action: "THÊM",
        module: "Hệ thống",
        description: `Đăng nhập Google thành công với tài khoản ${user.email}`,
      },
    });

    return createUserSession(user.id, "/");
  } catch (err: any) {
    console.error("Google OAuth Login error:", err);
    return redirect("/login?error=google_oauth_failed");
  }
}

export default function Route() {
  return null;
}
