import { createClient } from '@/utils/supabase/server'
import { RequestForm } from '@/components/contact/request-form'
import { Mail, Phone, MapPin } from 'lucide-react'

export default async function ContactPage() {
    const supabase = await createClient()
    const { data: kitchens } = await supabase
        .from('kitchens')
        .select('id, name')
        .eq('is_active', true)

    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Have a maintenance issue, a rule violation to report, or just a general question or recommendation?
                        Submit a message below and we&apos;ll get back to you as soon as possible.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Request Form - Takes up 2 columns */}
                    <div className="md:col-span-2">
                        <RequestForm kitchens={kitchens || []} />
                    </div>

                    {/* Contact Info Sidebar */}
                    <div className="space-y-6">
                        {/* Quick Contact */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4">
                                Quick Contact
                            </h3>
                            <div className="space-y-4">
                                <div className="flex items-start gap-3">
                                    <div className="bg-teal-100 rounded-full p-2">
                                        <Phone className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Phone</p>
                                        <a href="tel:+14156994397" className="text-teal-600 hover:underline">
                                            (415) 699-4397
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="bg-teal-100 rounded-full p-2">
                                        <Mail className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Email</p>
                                        <a href="mailto:culinaryblockkitchen@gmail.com" className="text-teal-600 hover:underline break-all">
                                            culinaryblockkitchen@gmail.com
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="bg-teal-100 rounded-full p-2">
                                        <MapPin className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Address</p>
                                        <p className="text-slate-600">
                                            1901 Las Plumas Ave<br />
                                            San Jose 95133
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Emergency */}
                        <div className="bg-red-50 rounded-2xl border border-red-200 p-6">
                            <h3 className="text-lg font-semibold text-red-800 mb-2">
                                Emergency?
                            </h3>
                            <p className="text-red-700 text-sm mb-3">
                                For urgent issues like gas leaks, fire, or flooding, call immediately:
                            </p>
                            <a
                                href="tel:+14156994397"
                                className="inline-flex items-center gap-2 bg-red-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-red-700 transition-colors"
                            >
                                <Phone className="h-4 w-4" />
                                Emergency Line
                            </a>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
