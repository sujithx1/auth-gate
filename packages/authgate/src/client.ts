import { AuthGateError } from "@authgate/shared";

export interface AuthGateClientOptions {
  baseUrl: string;
  credentials?: RequestCredentials;
}

export class AuthGateClient {
  private readonly baseUrl: string;
  private readonly credentials?: RequestCredentials;

  constructor(options: AuthGateClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, "");
    this.credentials = options.credentials || "include";
  }

  private async request<T>(path: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const headers = new Headers(options.headers);
    if (!headers.has("Content-Type") && options.body) {
      headers.set("Content-Type", "application/json");
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: this.credentials,
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok || data.success === false) {
      const err = data.error || {};
      throw new AuthGateError(
        err.code || "API_ERROR",
        err.message || "An error occurred during the request.",
        response.status,
        err.details
      );
    }

    return data;
  }

  /**
   * Log in user.
   */
  async login(email: string, password: string) {
    return this.request<{ success: boolean; data: { user: any } }>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Register a new user.
   */
  async register(email: string, password: string) {
    return this.request<{ success: boolean; data: { user: any; verificationToken: string } }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  /**
   * Log out currently authenticated session.
   */
  async logout() {
    return this.request<{ success: boolean }>("/api/auth/logout", {
      method: "POST",
    });
  }

  /**
   * Fetch currently authenticated user context profile.
   */
  async me() {
    return this.request<{ success: boolean; data: { user: any } }>("/api/auth/me", {
      method: "GET",
    });
  }

  /**
   * Complete email verification.
   */
  async verifyEmail(token: string) {
    return this.request<{ success: boolean; data: { user: any } }>("/api/auth/verify-email", {
      method: "POST",
      body: JSON.stringify({ token }),
    });
  }

  /**
   * Request password recovery link.
   */
  async forgotPassword(email: string) {
    return this.request<{ success: boolean; data: { resetToken?: string } }>("/api/auth/forgot-password", {
      method: "POST",
      body: JSON.stringify({ email }),
    });
  }

  /**
   * Complete password recovery update.
   */
  async resetPassword(token: string, newPassword: string) {
    return this.request<{ success: boolean }>("/api/auth/reset-password", {
      method: "POST",
      body: JSON.stringify({ token, newPassword }),
    });
  }

  /**
   * List organizations user belongs to.
   */
  async getOrganizations() {
    return this.request<{ success: boolean; data: { orgs: any[] } }>("/api/orgs", {
      method: "GET",
    });
  }

  /**
   * Create a new organization workspace.
   */
  async createOrganization(name: string, slug: string) {
    return this.request<{ success: boolean; data: { org: any } }>("/api/orgs", {
      method: "POST",
      body: JSON.stringify({ name, slug }),
    });
  }

  /**
   * Invite member to organization.
   */
  async inviteMember(orgId: string, email: string, role: string = "MEMBER") {
    return this.request<{ success: boolean; data: { invitation: any } }>(`/api/orgs/${orgId}/invite`, {
      method: "POST",
      body: JSON.stringify({ email, role }),
    });
  }

  /**
   * Accept organization workspace invitation.
   */
  async acceptInvitation(token: string) {
    return this.request<{ success: boolean }>(`/api/orgs/invitations/${token}/accept`, {
      method: "POST",
    });
  }

  /**
   * Initiate social login flow by redirecting the browser.
   * Note: This method only works in browser environments.
   */
  socialLogin(provider: "google" | "github") {
    if (typeof window !== "undefined") {
      window.location.href = `${this.baseUrl}/api/auth/social/${provider}`;
    } else {
      throw new Error("socialLogin() can only be called in a browser environment.");
    }
  }

  /**
   * Request authenticator registration for 2FA.
   */
  async enableTwoFactor() {
    return this.request<{ success: boolean; data: { secret: string; uri: string } }>("/api/auth/2fa/enable", {
      method: "POST",
    });
  }

  /**
   * Validate passcode to confirm and activate 2FA, or to verify during login.
   */
  async verifyTwoFactor(code: string) {
    return this.request<{ success: boolean; data: { backupCodes?: string[]; user?: any } }>("/api/auth/2fa/verify", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  /**
   * Disable 2FA for the current user.
   */
  async disableTwoFactor(code: string) {
    return this.request<{ success: boolean }>("/api/auth/2fa/disable", {
      method: "POST",
      body: JSON.stringify({ code }),
    });
  }

  /**
   * Generate an OTP code for a user.
   */
  async generateOtp(options: { identifier: string; length?: number; expiresSeconds?: number }) {
    return this.request<{ success: boolean; data: { code: string } }>("/api/auth/otp/generate", {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  /**
   * Verify an OTP code.
   */
  async verifyOtp(options: { identifier: string; code: string }) {
    return this.request<{ success: boolean; data: { user: any } }>("/api/auth/otp/verify", {
      method: "POST",
      body: JSON.stringify(options),
    });
  }

  /**
   * Fetch OIDC Discovery document.
   */
  async getOidcDiscovery() {
    const res = await fetch(`${this.baseUrl}/.well-known/openid-configuration`);
    return res.json();
  }

  /**
   * Fetch JWKS public key set.
   */
  async getJwks() {
    const res = await fetch(`${this.baseUrl}/.well-known/jwks.json`);
    return res.json();
  }

  /**
   * Build OAuth / OIDC Authorization URL.
   */
  createAuthorizationUrl(options: {
    clientId: string;
    redirectUri: string;
    scope?: string;
    state?: string;
    codeChallenge: string;
    codeChallengeMethod?: "plain" | "S256";
  }): string {
    const url = new URL(`${this.baseUrl}/api/oauth/authorize`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", options.clientId);
    url.searchParams.set("redirect_uri", options.redirectUri);
    url.searchParams.set("code_challenge", options.codeChallenge);
    url.searchParams.set("code_challenge_method", options.codeChallengeMethod || "S256");
    if (options.scope) url.searchParams.set("scope", options.scope);
    if (options.state) url.searchParams.set("state", options.state);
    return url.toString();
  }

  /**
   * Exchange Code for Tokens (Access Token, Refresh Token, ID Token).
   */
  async exchangeCodeForToken(options: {
    clientId: string;
    clientSecret?: string;
    code: string;
    codeVerifier: string;
  }) {
    return this.request<{
      access_token: string;
      token_type: string;
      expires_in: number;
      refresh_token?: string;
      id_token?: string;
      scope?: string;
    }>("/api/oauth/token", {
      method: "POST",
      body: JSON.stringify({
        grant_type: "authorization_code",
        client_id: options.clientId,
        client_secret: options.clientSecret,
        code: options.code,
        code_verifier: options.codeVerifier,
      }),
    });
  }

  /**
   * Fetch standard OIDC UserInfo profile claims.
   */
  async getUserInfo(accessToken: string) {
    const response = await fetch(`${this.baseUrl}/api/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return response.json();
  }
}
