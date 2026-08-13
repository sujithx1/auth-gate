import { CodeBlock } from "./CodeBlock";

export function SocialDoc() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Social Sign-In Redirections</h2>
        <p className="text-sm text-muted-foreground">
          Federated authentication that allows users to sign in using their existing accounts from identity providers like Google and GitHub.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">When is this helpful?</h3>
        <p className="text-sm text-muted-foreground">
          Crucial for consumer applications to reduce onboarding friction. Users are much more likely to sign up if they can do so with a single click without remembering a new password.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">Solving the problem</h3>
        <p className="text-sm text-muted-foreground">
          Implementing OAuth 2.0 flows manually requires managing authorization codes, state parameters for CSRF protection, token exchange requests, and mapping various provider profile schemas to your own database.
        </p>
      </div>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground">How this SDK does it</h3>
        <p className="text-sm text-muted-foreground">
          AuthGate acts as an OAuth 2.0 client to these providers. By simply redirecting the user to the AuthGate provider endpoint, AuthGate automatically handles the entire authorization code grant, exchanges the token, fetches the user profile, creates the user record if it doesn't exist, and establishes an active session.
        </p>
      </div>

      <CodeBlock code={`// Redirect browser to trigger social consent redirects
auth.socialLogin("google");
auth.socialLogin("github");`} />
    </div>
  );
}
