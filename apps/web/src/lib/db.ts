// Re-export the prisma client from the workspace db package. Existing
// imports (`@/lib/db`) continue to work; new code can import from
// `@town/db` directly.
export { prisma } from "@town/db";
