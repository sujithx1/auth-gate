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
}
