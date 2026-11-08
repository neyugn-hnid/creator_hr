import { type RouteConfig, index, route, layout } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  route("logout", "routes/logout.tsx"),

  layout("routes/_app.tsx", [
    index("routes/_app._index.tsx"),
    route("employees", "routes/_app.employees.tsx"),
    route("attendance", "routes/_app.attendance.tsx"),
    route("payroll", "routes/_app.payroll.tsx"),
    route("leaves", "routes/_app.leaves.tsx"),
    route("youtube", "routes/_app.youtube.tsx"),
    route("youtube-revenue", "routes/_app.youtube-revenue.tsx"),
    route("reports", "routes/_app.reports.tsx"),
    route("notifications", "routes/_app.notifications.tsx"),
    route("activity-logs", "routes/_app.activity-logs.tsx"),
    route("profile", "routes/_app.profile.tsx"),
    route("settings", "routes/_app.settings.tsx"),
  ]),

  // Google Login OAuth Endpoints
  route("api/auth/google", "routes/api.auth.google.tsx"),
  route("api/auth/google/callback", "routes/api.auth.google.callback.tsx"),

  // YouTube OAuth & Sync API Endpoints
  route("api/youtube/auth", "routes/api.youtube.auth.tsx"),
  route("api/youtube/callback", "routes/api.youtube.callback.tsx"),
  route("api/youtube/sync", "routes/api.youtube.sync.tsx"),

  // WebSocket Broadcast
  route("api/ws/broadcast", "routes/api.ws.broadcast.tsx"),

  // Mobile REST API Endpoints
  route("api/mobile/login", "routes/api.mobile.login.tsx"),
  route("api/mobile/me", "routes/api.mobile.me.tsx"),
  route("api/mobile/attendance", "routes/api.mobile.attendance.tsx"),
  route("api/mobile/payroll", "routes/api.mobile.payroll.tsx"),
  route("api/mobile/leaves", "routes/api.mobile.leaves.tsx"),
  route("api/mobile/youtube", "routes/api.mobile.youtube.tsx"),
  route("api/mobile/notifications", "routes/api.mobile.notifications.tsx"),
  route("api/mobile/register", "routes/api.mobile.register.tsx"),
] satisfies RouteConfig;
