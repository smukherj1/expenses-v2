import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/client/auth";

export default function SocialLogin() {
  return (
    <>
      <div className="after:border-border relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-t">
        <span className="bg-card text-muted-foreground relative z-10 px-2">
          Or continue with
        </span>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={async () => {
            await authClient.signIn.social({
              provider: "microsoft",
            });
          }}
        >
          <svg
            width="512px"
            height="512px"
            viewBox="0 0 512 512"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path fill="#f25022" d="M31.87,30.58H244.7V243.39H31.87Z" />
            <path fill="#7fba00" d="M266.89,30.58H479.7V243.39H266.89Z" />
            <path fill="#00a4ef" d="M31.87,265.61H244.7v212.8H31.87Z" />
            <path fill="#ffb900" d="M266.89,265.61H479.7v212.8H266.89Z" />
          </svg>
          <span className="sr-only">Login with Microsoft</span>
        </Button>
        <Button
          variant="outline"
          type="button"
          className="w-full"
          onClick={async () => {
            await authClient.signIn.social({
              provider: "google",
            });
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
            <path
              d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
              fill="currentColor"
            />
          </svg>
          <span className="sr-only">Login with Google</span>
        </Button>
      </div>
    </>
  );
}
