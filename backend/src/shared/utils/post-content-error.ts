export class PostContentError extends Error {
  constructor(
    message: string,
    public code: "CONTENT_EMPTY" | "INVALID_FORMAT",
  ) {
    super(message);
    this.name = "PostContentError";
  }
}
