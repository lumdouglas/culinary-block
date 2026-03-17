"use server";

import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import AdminPermitNotification from "@/components/emails/AdminPermitNotification";
import UserPermitFeedback from "@/components/emails/UserPermitFeedback";
import { CateringPermitData } from "@/lib/catering-permit";

// We receive sessionData from the wizard. Note that it's loosely typed below to match the frontend shape.
export async function notifyPermitSession(
    sessionData: {
        sessionId: string;
        businessName: string;
        ownerName: string;
        email: string;
        phone: string;
        language?: string;
    },
    permitData: CateringPermitData,
    missingFields: string[],
    totalFieldsCount: number
) {
    try {
        const completedCount = totalFieldsCount - missingFields.length;

        // 1. Set up Nodemailer transporter
        // We reuse the existing GMAIL_USER and GMAIL_APP_PASSWORD from the main application workflow.
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        const fromAddress = `"Culinary Block AI" <${process.env.GMAIL_USER || "culinaryblockkitchen@gmail.com"}>`;

        // 2. Render and send ADMIN Notification
        const adminHtml = await render(
            AdminPermitNotification({
                businessName: sessionData.businessName,
                ownerName: sessionData.ownerName,
                email: sessionData.email,
                phone: sessionData.phone,
                language: sessionData.language || "en",
                completedFieldsCount: completedCount,
                totalFieldsCount: totalFieldsCount,
                missingFields: missingFields,
            })
        );

        const adminMailOptions = {
            from: fromAddress,
            // Send the admin notification to the same configured gmail user
            to: process.env.GMAIL_USER || "culinaryblockkitchen@gmail.com",
            subject: `New AI Permit Session: ${sessionData.businessName}`,
            html: adminHtml,
        };

        await transporter.sendMail(adminMailOptions);

        // 3. Render and send USER Feedback Request
        // Only send if we have a valid email from the intake form
        if (sessionData.email) {
            const userHtml = await render(
                UserPermitFeedback({
                    ownerName: sessionData.ownerName,
                })
            );

            const userMailOptions = {
                from: fromAddress,
                to: sessionData.email,
                replyTo: process.env.GMAIL_USER || "culinaryblockkitchen@gmail.com",
                subject: "How was your Culinary Block AI Assistant experience?",
                html: userHtml,
            };

            await transporter.sendMail(userMailOptions);
        }

        return { success: true };
    } catch (error) {
        console.error("Failed to send AI permit notification emails:", error);
        // We do not want to throw or block the user from downloading the PDF if emails fail
        return { success: false, error: "Email delivery failed" };
    }
}
