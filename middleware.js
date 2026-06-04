import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isProtected = createRouteMatcher([
  "/dashboard/history(.*)",
  "/dashboard/saved(.*)",
  "/dashboard/channel(.*)",
]);

export default clerkMiddleware(async (auth, req) => {  // ✅ add async
  if (isProtected(req)) {
    await auth.protect();  // ✅ auth.protect() not auth().protect()
  }
});

export const config = {
  matcher: [
    "/((?!_next|.*\\..*).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};