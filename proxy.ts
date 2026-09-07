import { auth } from "@/auth";
import { NextResponse } from "next/server";

export default auth((request) => {
  if (request.auth) return NextResponse.next();
  return NextResponse.redirect(new URL("/admin", request.url));
});

export const config = {
  matcher: ["/admin/bulk-upload/:path*"],
};
