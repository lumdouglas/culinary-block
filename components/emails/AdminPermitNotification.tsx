import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface AdminPermitNotificationProps {
  businessName?: string;
  ownerName?: string;
  email?: string;
  phone?: string;
  language?: string;
  completedFieldsCount?: number;
  totalFieldsCount?: number;
  missingFields?: string[];
}

export const AdminPermitNotification = ({
  businessName = "Unknown Business",
  ownerName = "Unknown Owner",
  email = "No Email Provided",
  phone = "No Phone Provided",
  language = "en",
  completedFieldsCount = 0,
  totalFieldsCount = 0,
  missingFields = [],
}: AdminPermitNotificationProps) => (
  <Html>
    <Head />
    <Preview>New Culinary Block AI Permit Session: {businessName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New AI Permit Session Completed</Heading>
        <Text style={text}>
          A prospective tenant has just finished using the AI Permit Assistant on the website.
        </Text>
        
        <Section style={dataSection}>
          <Text style={subheading}>Applicant Info</Text>
          <Text style={boldText}>Business Name: <span style={plainText}>{businessName}</span></Text>
          <Text style={boldText}>Owner Name: <span style={plainText}>{ownerName}</span></Text>
          <Text style={boldText}>Email: <span style={plainText}>{email}</span></Text>
          <Text style={boldText}>Phone: <span style={plainText}>{phone}</span></Text>
          <Text style={boldText}>Chat Language: <span style={plainText}>{language.toUpperCase()}</span></Text>
        </Section>
        
        <Hr style={hr} />
        
        <Section style={dataSection}>
          <Text style={subheading}>Application Progress</Text>
          <Text style={text}>
            They completed <strong>{completedFieldsCount} out of {totalFieldsCount}</strong> key fields required for the permit application PDF.
          </Text>
          
          {missingFields.length > 0 && (
            <>
              <Text style={{ ...text, color: "#9ca3af" }}>Still missing:</Text>
              <ul>
                {missingFields.map((field) => (
                  <li key={field} style={listItem}>{field}</li>
                ))}
              </ul>
            </>
          )}
        </Section>

        <Hr style={hr} />

        <Text style={footer}>
          Culinary Block Automated System
        </Text>
      </Container>
    </Body>
  </Html>
);

export default AdminPermitNotification;

const main = {
  backgroundColor: "#f9fafb",
  fontFamily: "HelveticaNeue,Helvetica,Arial,sans-serif",
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e5e7eb",
  borderRadius: "8px",
  boxShadow: "0 1px 3px 0 rgba(0, 0, 0, 0.1)",
  margin: "0 auto",
  padding: "40px",
  maxWidth: "600px",
};

const h1 = {
  color: "#111827",
  fontSize: "24px",
  fontWeight: "700",
  margin: "0 0 20px",
  textAlign: "center" as const,
};

const subheading = {
  color: "#1f2937",
  fontSize: "18px",
  fontWeight: "600",
  margin: "0 0 12px",
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const boldText = {
  color: "#374151",
  fontSize: "14px",
  fontWeight: "600",
  margin: "0 0 8px",
};

const plainText = {
  fontWeight: "400",
};

const listItem = {
  color: "#6b7280",
  fontSize: "14px",
  lineHeight: "20px",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const dataSection = {
  backgroundColor: "#f3f4f6",
  padding: "16px",
  borderRadius: "6px",
  marginBottom: "16px",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "16px",
  textAlign: "center" as const,
  marginTop: "24px",
};
