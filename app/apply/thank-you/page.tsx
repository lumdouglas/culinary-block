import { SiteNav } from "@/components/site-nav";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ThankYouPage() {
    return (
        <div className="min-h-screen bg-slate-50">
            <SiteNav />

            <div className="max-w-2xl mx-auto py-20 px-6 text-center">
                <div className="bg-white rounded-2xl shadow-lg p-12">
                    <div className="flex justify-center mb-6">
                        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                            <CheckCircle className="w-12 h-12 text-green-600" />
                        </div>
                    </div>

                    <h1 className="text-4xl font-bold mb-4">Thank You!</h1>
                    <p className="text-xl text-slate-600 mb-2">
                        Your application has been submitted successfully.
                    </p>
                    <p className="text-slate-500 mb-8">
                        We'll review your application and get back to you within 2-3 business days.
                    </p>

                    <div className="space-y-4">
                        <p className="text-sm text-slate-500">
                            You'll receive an email at the address you provided once your application has been reviewed.
                        </p>

                        <Link href="/">
                            <Button className="bg-emerald-600 hover:bg-emerald-700" size="lg">
                                Return to Homepage
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
