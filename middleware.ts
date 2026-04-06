export { default } from "next-auth/middleware";

export const config = {
  matcher: ["/estilista/:path*", "/designer/:path*", "/inspiracao/:path*", "/colecao/:path*", "/avatar/:path*", "/conta/:path*"],
};
