import { SignIn } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <SignIn
        routing="path"
        path="/sign-in"
        appearance={{ baseTheme: dark }}
      />
    </div>
  );
}