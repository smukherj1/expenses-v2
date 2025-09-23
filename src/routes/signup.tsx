import * as React from "react";
import SocialLogin from "@/components/social-login";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, createFileRoute, useRouter } from "@tanstack/react-router";
import { toast } from "sonner";
import { authClient, ensureNotAuth } from "@/lib/client/auth";
import { useMutation } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/signup")({
  component: Signup,
});

async function signupEmail({
  email,
  password,
  confirmPassword,
  onSuccess,
}: {
  email: string;
  password: string;
  confirmPassword: string;
  onSuccess: () => void;
}) {
  if (password !== confirmPassword) {
    toast.error("Passwords do not match.");
    return;
  }
  await authClient.signUp.email(
    { email, password, name: email },
    {
      onSuccess,
      onError: (ctx) => {
        toast.error(`Sign up failed: ${ctx.error.message}`);
      },
    }
  );
}

function Signup() {
  const router = useRouter();
  const redirectHome = () => router.navigate({ to: "/" });

  ensureNotAuth();

  const [email, setEmail] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [confirmPassword, setConfirmPassword] = React.useState<string>("");
  const signupMutator = useMutation({ mutationFn: signupEmail });
  return (
    <div className="flex flex-col gap-6 max-w-md mx-auto mt-8">
      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <form
            className="p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault();
              signupMutator.mutate({
                email,
                password,
                confirmPassword,
                onSuccess: redirectHome,
              });
            }}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Create an account</h1>
                <p className="text-muted-foreground text-balance">
                  Enter your email below to create your account
                </p>
              </div>
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirm-password">Confirm Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={signupMutator.isPending}
              >
                {signupMutator.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  "Sign Up"
                )}
              </Button>
              <SocialLogin />
              <div className="text-center text-sm">
                Already have an account?{" "}
                <Link to="/login" className="underline underline-offset-4">
                  Login
                </Link>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{" "}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  );
}
