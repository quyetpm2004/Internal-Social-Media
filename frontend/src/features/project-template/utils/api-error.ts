import type { AxiosError } from "axios";
import { toast } from "sonner";

type FieldMessage = { field?: string; message?: string };

type ZodFlatten = {
  formErrors?: string[];
  fieldErrors?: Record<string, string[] | undefined>;
};

type ErrorBody = {
  message?: string;
  errors?: FieldMessage[] | ZodFlatten;
};

export function getApiErrorMessages(error: unknown): string[] {
  const data = (error as AxiosError<ErrorBody>).response?.data;
  if (!data) return ["Unexpected error"];

  if (Array.isArray(data.errors)) {
    const messages = data.errors
      .map((item) => item.message?.trim())
      .filter((message): message is string => Boolean(message));
    if (messages.length > 0) return messages;
  } else if (data.errors && typeof data.errors === "object") {
    const flattened = data.errors;
    const fieldMessages = Object.values(flattened.fieldErrors ?? {})
      .flatMap((messages) => messages ?? [])
      .map((message) => message.trim())
      .filter(Boolean);
    const formMessages = (flattened.formErrors ?? [])
      .map((message) => message.trim())
      .filter(Boolean);
    const messages = [...fieldMessages, ...formMessages];
    if (messages.length > 0) return messages;
  }

  return [data.message || "Unexpected error"];
}

export function toastApiError(error: unknown) {
  toast.error(getApiErrorMessages(error).join(". "));
}
