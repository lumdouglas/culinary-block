import { RequestForm } from '@/components/contact/request-form'
import { Mail, Phone, MapPin, Clock } from 'lucide-react'

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
            <div className="max-w-6xl mx-auto px-4 py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-slate-900 mb-4">Contact Us</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Have a maintenance issue or need to report a rule violation?
                        Submit a request below and we'll get back to you as soon as possible.
                    </p>
                </div>

                <div className="grid md:grid-cols-3 gap-8">
                    {/* Request Form - Takes up 2 columns */}
                    <div className="md:col-span-2">
                        <RequestForm />
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
                                        <a href="tel:+1234567890" className="text-teal-600 hover:underline">
                                            (123) 456-7890
                                        </a>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <div className="bg-teal-100 rounded-full p-2">
                                        <Mail className="h-5 w-5 text-teal-600" />
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-900">Email</p>
                                        <a href="mailto:info@culinaryblock.com" className="text-teal-600 hover:underline">
                                            info@culinaryblock.com
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
                                            123 Kitchen Street<br />
                                            Suite 100<br />
                                            Cityville, ST 12345
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Hours */}
                        <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                                <Clock className="h-5 w-5 text-teal-600" />
                                Kitchen Hours
                            </h3>
                            <div className="space-y-2 text-slate-600">
                                <div className="flex justify-between">
                                    <span>Monday - Friday</span>
                                    <span className="font-medium">6am - 10pm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Saturday</span>
                                    <span className="font-medium">7am - 9pm</span>
                                </div>
                                <div className="flex justify-between">
                                    <span>Sunday</span>
                                    <span className="font-medium">8am - 6pm</span>
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
                                href="tel:+1234567890"
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
