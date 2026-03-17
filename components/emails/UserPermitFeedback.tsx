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

interface UserPermitFeedbackProps {
  ownerName?: string;
}

export const UserPermitFeedback = ({
  ownerName = "Applicant",
}: UserPermitFeedbackProps) => (
  <Html>
    <Head />
    <Preview>Feedback Request: Culinary Block AI Permit Assistant</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Thank you for using Culinary Block&apos;s AI Permit Assistant!</Heading>
        <Text style={text}>
          Hi {ownerName},
        </Text>
        <Text style={text}>
          We hope the AI assistant was helpful in assembling your Santa Clara County catering permit application.
        </Text>
        
        <Section style={calloutSection}>
          <Text style={calloutText}>
            We are constantly looking to improve this tool to help local food businesses like yours navigate health guidelines.
          </Text>
          <Text style={calloutPrompt}>
            <strong>Could you reply to this email to let us know how your experience was?</strong> Was it easy to use? Did you encounter any issues? We&apos;d love to hear your feedback!
          </Text>
        </Section>
        
        <Hr style={hr} />
        
        <Text style={text}>
          If you have any further questions about renting a commercial kitchen space, securing your permit, or scheduling a tour, don&apos;t hesitate to reach out.
        </Text>

        <Text style={text}>
          Best,<br/>
          The Culinary Block Team
        </Text>

        <Hr style={hr} />

        <Text style={footer}>
          Culinary Block<br />
          1901 Las Plumas Ave, San Jose, CA 95133<br />
          culinaryblockkitchen@gmail.com
        </Text>
      </Container>
    </Body>
  </Html>
);

export default UserPermitFeedback;

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
};

const text = {
  color: "#4b5563",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const calloutSection = {
  backgroundColor: "#ecfdf5",
  borderLeft: "4px solid #10b981",
  padding: "16px 20px",
  borderRadius: "0 6px 6px 0",
  margin: "24px 0",
};

const calloutText = {
  color: "#065f46",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 8px",
};

const calloutPrompt = {
  color: "#064e3b",
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0",
};

const hr = {
  borderColor: "#e5e7eb",
  margin: "24px 0",
};

const footer = {
  color: "#9ca3af",
  fontSize: "12px",
  lineHeight: "18px",
  marginTop: "24px",
};
