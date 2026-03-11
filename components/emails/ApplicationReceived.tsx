import {
    Body,
    Container,
    Head,
    Heading,
    Html,
    Link,
    Preview,
    Text,
    Section,
    Hr,
} from "@react-email/components";
import * as React from "react";

interface ApplicationReceivedProps {
    companyName: string;
    applicantName: string;
}

export const ApplicationReceived = ({
    companyName,
    applicantName,
}: ApplicationReceivedProps) => {
    return (
        <Html>
            <Head />
            <Preview>Thank you for applying to Culinary Block!</Preview>
            <Body style={main}>
                <Container style={container}>
                    <Heading style={h1}>Thank you for applying!</Heading>

                    <Text style={text}>Hi {applicantName},</Text>

                    <Text style={text}>
                        We've successfully received your application for {companyName} to join Culinary Block.
                    </Text>

                    <Section style={alertBox}>
                        <Text style={alertText}>
                            <strong>Please Note:</strong> We are currently operating at or near capacity and are maintaining a waitlist for when space opens up (typically a 2-6 month wait).
                        </Text>
                    </Section>

                    <Text style={text}>
                        While you wait to hear back from our team regarding your application and the current waitlist status, we've attached our <strong>Rental Agreement</strong> to this email so you can review our terms, conditions, and full pricing structure in advance.
                    </Text>

                    <Hr style={hr} />

                    <Text style={text}>
                        If you have any immediate questions, feel free to reply directly to this email or shoot us a text at (408) 459-9459.
                    </Text>

                    <Text style={footer}>
                        Best regards,<br />
                        The Culinary Block Team<br />
                        <Link href="https://culinaryblock.com" style={link}>culinaryblock.com</Link>
                    </Text>
                </Container>
            </Body>
        </Html>
    );
};

export default ApplicationReceived;

// Styles
const main = {
    backgroundColor: "#f6f9fc",
    fontFamily:
        '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
    backgroundColor: "#ffffff",
    margin: "0 auto",
    padding: "20px 0 48px",
    marginBottom: "64px",
    borderRadius: "8px",
    border: "1px solid #eaeaea",
    maxWidth: "600px",
};

const h1 = {
    color: "#333",
    fontSize: "24px",
    fontWeight: "bold",
    padding: "0 48px",
    margin: "30px 0",
};

const text = {
    color: "#333",
    fontSize: "16px",
    lineHeight: "26px",
    padding: "0 48px",
};

const alertBox = {
    backgroundColor: "#fffbeb",
    borderLeft: "4px solid #f59e0b",
    padding: "16px 24px",
    margin: "24px 48px",
    borderRadius: "4px",
};

const alertText = {
    color: "#92400e",
    fontSize: "15px",
    lineHeight: "24px",
    margin: "0",
};

const hr = {
    borderColor: "#e6ebf1",
    margin: "32px 0",
};

const link = {
    color: "#047857",
    textDecoration: "underline",
};

const footer = {
    color: "#8898aa",
    fontSize: "14px",
    lineHeight: "24px",
    padding: "0 48px",
};
