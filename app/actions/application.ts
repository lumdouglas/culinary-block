"use server";

import { createClient } from "@/utils/supabase/server";
import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import ApplicationReceived from "@/components/emails/ApplicationReceived";

export async function submitApplication(values: any) {
    try {
        const supabase = await createClient();

        // 1. Insert into Supabase
        const { error: dbError } = await supabase.from("applications").insert([values]);
        if (dbError) {
            console.error("Database insert error:", dbError);
            return { error: "Failed to save application to database." };
        }

        // 2. Set up Nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.GMAIL_USER,
                pass: process.env.GMAIL_APP_PASSWORD, // Must be an App Password, not the regular Gmail password
            },
        });

        // 3. Render the email template to HTML
        const emailHtml = await render(
            ApplicationReceived({
                companyName: values.company_name,
                applicantName: values.contact_first_name,
            })
        );

        // 4. Read the Rental Agreement PDF from the public folder
        let applicationAttachments = [];
        try {
            const pdfPath = path.join(process.cwd(), "public", "rental-agreement.pdf");
            if (fs.existsSync(pdfPath)) {
                applicationAttachments.push({
                    filename: "Culinary-Block-Rental-Agreement.pdf",
                    path: pdfPath,
                });
            } else {
                console.warn("Rental agreement PDF not found at:", pdfPath);
            }
        } catch (fsError) {
            console.error("Error reading PDF:", fsError);
        }

        // 5. Send the email
        const mailOptions = {
            from: `"Culinary Block" <${process.env.GMAIL_USER || "culinaryblockkitchen@gmail.com"}>`,
            to: values.email,
            subject: "Application Received - Culinary Block Prep Kitchen",
            html: emailHtml,
            attachments: applicationAttachments,
        };

        await transporter.sendMail(mailOptions);

        return { success: true };
    } catch (error) {
        console.error("Application submission error:", error);
        // We return success even if email fails, because the DB insert succeeded
        // But in a real app, we might want to flag this for manual review
        return { success: true, emailError: "Application saved, but failed to send confirmation email." };
    }
}
