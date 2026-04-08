import { Toaster } from "sonner";
import { RouterProvider } from "react-router-dom";
import { router } from "@/app/router";
import { useAuthInit } from "@/hooks/useAuthInit";
import { Spinner } from "@/components/ui/spinner";

export default function AppProviders() {
  const { initialized } = useAuthInit();

  if (!initialized) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Spinner></Spinner>
      </div>
    );
  }

  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="top-right" richColors />
    </>
  );
}
