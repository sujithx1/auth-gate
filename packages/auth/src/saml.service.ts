export interface SamlProviderConfig {
  id: string;
  organizationId: string;
  issuer: string;
  ssoUrl: string;
  cert: string;
  enabled: boolean;
}

export class SamlService {
  getSpMetadata(baseUrl: string): string {
    const origin = baseUrl.replace(/\/+$/, "");
    const entityId = `${origin}/api/auth/saml/metadata`;
    const acsUrl = `${origin}/api/auth/saml/acs`;

    return `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${entityId}">
  <md:SPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol" AuthnRequestsSigned="false" WantAssertionsSigned="true">
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
    <md:AssertionConsumerService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${acsUrl}" index="1"/>
  </md:SPSSODescriptor>
</md:EntityDescriptor>`;
  }

  createAuthnRequestUrl(ssoUrl: string, spEntityId: string, relayState?: string): string {
    const authnRequestXml = `<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" ID="_${Math.random().toString(36).substring(2)}" Version="2.0" IssueInstant="${new Date().toISOString()}" AssertionConsumerServiceURL="${spEntityId.replace('/metadata', '/acs')}"><saml:Issuer xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion">${spEntityId}</saml:Issuer></samlp:AuthnRequest>`;
    const samlRequestBase64 = Buffer.from(authnRequestXml).toString("base64");

    const url = new URL(ssoUrl);
    url.searchParams.append("SAMLRequest", samlRequestBase64);
    if (relayState) {
      url.searchParams.append("RelayState", relayState);
    }
    return url.toString();
  }

  parseSamlAssertion(samlResponseBase64: string): { email: string; name?: string; nameId?: string } {
    const decoded = Buffer.from(samlResponseBase64, "base64").toString("utf-8");

    // Extract email from SAML Assertion NameID or AttributeStatement
    const nameIdMatch = decoded.match(/<saml:NameID[^>]*>([^<]+)<\/saml:NameID>/i) || decoded.match(/<NameID[^>]*>([^<]+)<\/NameID>/i);
    const emailAttrMatch = decoded.match(/Name="(?:email|emailAddress|mail)"[^>]*>\s*<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/i);
    const nameAttrMatch = decoded.match(/Name="(?:name|displayName)"[^>]*>\s*<saml:AttributeValue[^>]*>([^<]+)<\/saml:AttributeValue>/i);

    const email = emailAttrMatch?.[1] || nameIdMatch?.[1];
    if (!email) {
      throw new Error("Invalid SAML Response: missing email in NameID or AttributeStatement.");
    }

    return {
      email,
      name: nameAttrMatch?.[1] || email.split("@")[0],
      nameId: nameIdMatch?.[1],
    };
  }
}
