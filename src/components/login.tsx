import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { toast } from 'sonner'
import { useMutation } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { authClient } from '@/lib/client/auth'

async function signIn() {
  const response = await authClient.signIn.oauth2({
    providerId: "keycloak-suvanjanlabs",
    callbackURL: "/",

  });
  if (response.error !== null) {
    toast.error(`Login failed: ${response.error}`)
    return;
  }
}

export type Props = {
}

export default function Login() {
  const signinMutator = useMutation({ mutationFn: signIn })
  return (
    <div className={'flex flex-col gap-6 max-w-md mx-auto mt-8'}>
      <Card className="overflow-hidden p-0">
        <CardContent className="p-0">
          <form
            className="p-6 md:p-8"
            onSubmit={(e) => {
              e.preventDefault()
              signinMutator.mutate()
            }}
          >
            <div className="flex flex-col gap-6">
              <div className="flex flex-col items-center text-center">
                <h1 className="text-2xl font-bold">Welcome back</h1>
                <p className="text-muted-foreground text-balance">
                  Login to your account
                </p>
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={signinMutator.isPending}
              >
                {signinMutator.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  'Login'
                )}
              </Button>
              <div className="text-center text-sm">
                Don&apos;t have an account?{' '}
                <a href="https://keycloak.suvanjanlabs.com/realms/homelab/account" className="underline underline-offset-4">
                  Sign up
                </a>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
      <div className="text-muted-foreground *:[a]:hover:text-primary text-center text-xs text-balance *:[a]:underline *:[a]:underline-offset-4">
        By clicking continue, you agree to our <a href="#">Terms of Service</a>{' '}
        and <a href="#">Privacy Policy</a>.
      </div>
    </div>
  )
}
