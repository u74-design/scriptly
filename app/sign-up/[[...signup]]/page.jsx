import { SignUp } from "@clerk/nextjs";
import { dark } from "@clerk/themes";

export default function Page() {
  return (
    <div className="min-h-screen bg-[#09090b] flex items-center justify-center">
      <SignUp
        routing="path"
        path="/sign-up"
        appearance={{ baseTheme: dark }}
      />
    </div>
  );
}