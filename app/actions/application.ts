"use server";

import { createClient } from "@/utils/supabase/server";
import { render } from "@react-email/render";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import { headers } from "next/headers";
import ApplicationReceived from "@/components/emails/ApplicationReceived";

// Best-effort in-memory rate limit — resets per server instance/deploy, so it
// is a speed bump against casual bots, not a substitute for the RLS/honeypot checks below.
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX_SUBMISSIONS = 3;
const submissionsByIp = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
    const now = Date.now();
    const timestamps = (submissionsByIp.get(ip) ?? []).filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
    timestamps.push(now);
    submissionsByIp.set(ip, timestamps);
    return timestamps.length > RATE_LIMIT_MAX_SUBMISSIONS;
}

type SubmitMeta = {
    honeypot?: string;
    elapsedMs?: number;
};

export async function submitApplication(values: any, meta?: SubmitMeta) {
    // Honeypot: this field is hidden from real users via CSS, so only bots that
    // blindly fill every input end up populating it. Pretend success so bots
    // don't learn to leave it blank.
    if (meta?.honeypot) {
        return { success: true };
    }

    // Timing check: a multi-field form filled and submitted in under ~2.5s is
    // almost certainly scripted, not a human reading the labels.
    if (typeof meta?.elapsedMs === "number" && meta.elapsedMs < 2500) {
        return { success: true };
    }

    const headerList = await headers();
    const ip = headerList.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (isRateLimited(ip)) {
        return { error: "Too many applications submitted recently. Please try again later." };
    }

    const supabase = await createClient();

    // 1. Reject duplicate pending applications from the same email
    const { data: existing } = await supabase
        .from("applications")
        .select("id")
        .eq("email", values.email)
        .eq("status", "pending")
        .limit(1)
        .maybeSingle();

    if (existing) {
        return { error: "An application from this email is already under review. We'll be in touch soon!" };
    }

    // 2. Insert into Supabase
    const { error: dbError } = await supabase.from("applications").insert([values]);
    if (dbError) {
        console.error("Database insert error:", dbError);
        return { error: "Failed to save application to database." };
    }

    // 3. Send confirmation email (separate try/catch so DB success is preserved)
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
