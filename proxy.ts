/**
 * Next.js 16 proxy — keeps Auth.js session alive by updating session expiry on each request.
 * See: https://authjs.dev/getting-started/installation?framework=nextjs
 */
export { auth as proxy } from "@/auth";
