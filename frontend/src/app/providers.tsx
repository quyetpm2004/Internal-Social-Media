import { Toaster } from "sonner";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";

export default function AppProviders() {
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-left" richColors />
    </>
  );
}
