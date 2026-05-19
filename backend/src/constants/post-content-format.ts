/** Khớp enum PostContentFormat trong Prisma schema */
export const PostContentFormat = {
  PLAIN: "PLAIN",
  HTML: "HTML",
} as const;

export type PostContentFormat =
  (typeof PostContentFormat)[keyof typeof PostContentFormat];
