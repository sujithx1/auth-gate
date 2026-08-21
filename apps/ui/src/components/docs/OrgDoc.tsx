export function OrgDoc() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-foreground">Multi-Tenancy Organizations & RBAC</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Manage multi-tenant workspace partitions, email invitations, member roles, and granular permission enforcement.
        </p>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">1. Create Workspace Organization</h3>
        <p className="text-xs text-muted-foreground">
          Establish a new workspace entity. The creator automatically becomes the workspace <code className="text-primary font-mono">ADMIN</code>:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block whitespace-pre">
{`POST /api/orgs
Body: { "name": "Acme Corp", "slug": "acme" }`}
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">2. Invite Member to Workspace</h3>
        <p className="text-xs text-muted-foreground">
          Generate an invitation token for a target email address with a workspace role (<code className="text-primary font-mono">ADMIN</code> or <code className="text-primary font-mono">MEMBER</code>):
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block whitespace-pre">
{`POST /api/orgs/:orgId/invite
Body: { "email": "colleague@acme.com", "role": "MEMBER" }`}
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">3. Accept Workspace Invitation</h3>
        <p className="text-xs text-muted-foreground">
          Join an organization using the unique invitation token:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block whitespace-pre">
{`POST /api/orgs/invitations/:token/accept`}
          </code>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="text-base font-semibold">4. Role-Based Access Control (RBAC)</h3>
        <p className="text-xs text-muted-foreground">
          Query resolved permissions for a user across roles:
        </p>
        <div className="p-3 bg-muted rounded-lg border border-border">
          <code className="text-xs font-mono select-all text-primary block whitespace-pre">
{`GET /api/rbac/users/:userId/permissions`}
          </code>
        </div>
      </div>
    </div>
  );
}
