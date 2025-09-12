import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { ClerkProvider, ClerkLoaded, ClerkLoading, SignIn, SignUp } from "@clerk/clerk-react";
import { SlackLayout } from "@/components/slack-layout";
import { ClerkTest } from "@/components/test/ClerkTest";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Get Clerk publishable key from environment
const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

if (!clerkPublishableKey) {
  throw new Error("Missing Publishable Key");
}

function AppContent() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SlackLayout />} />
        <Route path="/test-clerk" element={<ClerkTest />} />
        <Route path="/sign-in/*" element={<SignIn routing="path" path="/sign-in" />} />
        <Route path="/sign-up/*" element={<SignUp routing="path" path="/sign-up" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider defaultTheme="dark" storageKey="slack-ui-theme">
          <TooltipProvider>
            <ClerkLoading>
              <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
                  <p>Loading...</p>
                </div>
              </div>
            </ClerkLoading>
            <ClerkLoaded>
              <Toaster />
              <Sonner />
              <AppContent />
            </ClerkLoaded>
          </TooltipProvider>
        </ThemeProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

export default App;