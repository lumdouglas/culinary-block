"use server";

import { createClient } from "@/utils/supabase/server";
import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import ApplicationReceived from "@/components/emails/ApplicationReceived";

export async function submitApplication(values: any) {
    const supabase = await createClient();

    // 1. Insert into Supabase
    const { error: dbError } = await supabase.from("applications").insert([values]);
    if (dbError) {
        console.error("Database insert error:", dbError);
        return { error: "Failed to save application to database." };
    }

    // 2. Send confirmation email (separate try/catch so DB success is preserved)
    let emailError: string | null = null;
    try {
        if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
            throw new Error("Missing GMAIL_USER or GMAIL_APP_PASSWORD environment variables");
        }

        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD,
            },
        });

        const emailHtml = await render(
            ApplicationReceived({
                companyName: values.company_name,
                applicantName: values.contact_first_name,
            })
        );

        const attachments: { filename: string; path: string }[] = [];
        const pdfPath = path.join(process.cwd(), "public", "rental-agreement.pdf");
        if (fs.existsSync(pdfPath)) {
            attachments.push({
                filename: "Culinary-Block-Rental-Agreement.pdf",
                path: pdfPath,
            });
        } else {
            console.warn("Rental agreement PDF not found at:", pdfPath);
        }

        await transporter.sendMail({
            from: `"Culinary Block" <${process.env.GMAIL_USER}>`,
            to: values.email,
            subject: "Application Received - Culinary Block Prep Kitchen",
            html: emailHtml,
            attachments,
        });
    } catch (error) {
        console.error("Email sending failed:", error);
        emailError = "Application saved, but we couldn't send the confirmation email. Our team has been notified.";
    }

    if (emailError) {
        return { success: true, emailError };
    }
    return { success: true };
}
