import { describe, expect, it } from "bun:test";
import { SamlService } from "./saml.service";

describe("SamlService Enterprise SSO", () => {
  const samlService = new SamlService();

  it("should generate valid SP XML metadata", () => {
    const metadata = samlService.getSpMetadata("http://localhost:3003");
    expect(metadata).toContain("http://localhost:3003/api/auth/saml/metadata");
    expect(metadata).toContain("http://localhost:3003/api/auth/saml/acs");
    expect(metadata).toContain("AssertionConsumerService");
  });

  it("should construct signed SAML AuthnRequest URL", () => {
    const authnUrl = samlService.createAuthnRequestUrl("https://idp.okta.com/sso", "http://localhost:3003/api/auth/saml/metadata");
    expect(authnUrl).toContain("https://idp.okta.com/sso");
    expect(authnUrl).toContain("SAMLRequest=");
  });

  it("should parse SAML Response assertion XML payload", () => {
    const sampleAssertionXml = `
      <saml2p:Response xmlns:saml2p="urn:oasis:names:tc:SAML:2.0:protocol">
        <saml2:Assertion xmlns:saml2="urn:oasis:names:tc:SAML:2.0:assertion">
          <saml2:Subject>
            <saml2:NameID>samluser@company.com</saml2:NameID>
          </saml2:Subject>
        </saml2:Assertion>
      </saml2p:Response>
    `;
    const base64 = Buffer.from(sampleAssertionXml).toString("base64");
    const result = samlService.parseSamlAssertion(base64);

    expect(result.email).toBe("samluser@company.com");
  });
});
