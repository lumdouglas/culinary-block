import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { GraduationCap, ArrowRight, Building, Award, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'Culinary Block Partnerships & Incubator Programs',
  description: 'Graduating from a culinary incubator? Culinary Block partners with local food health departments and non-profits to provide commercial kitchen space for your food business.',
}

export default function PartnershipsPage() {
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Hero Header */}
      <section className="bg-slate-900 text-white pt-32 pb-24 px-4 overflow-hidden relative">
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-teal-900 via-slate-900 to-slate-900"></div>
        <div className="container mx-auto max-w-5xl relative z-10 text-center">
          <Badge className="bg-teal-500/20 text-teal-300 hover:bg-teal-500/30 mb-6 py-1.5 px-4 text-sm font-medium border-teal-500/30">
            For Incubators & Non-Profits
          </Badge>
          <h1 className="text-5xl md:text-7xl font-bold mb-8 leading-tight">
            The Graduation Package
          </h1>
          <p className="text-xl md:text-2xl text-slate-300 font-light max-w-3xl mx-auto leading-relaxed mb-10">
            A seamless transition from culinary incubator to full-scale commercial production. We partner with local programs to guarantee approved kitchen space for your graduates.
          </p>
          <div className="flex gap-4 justify-center">
            <Link href="mailto:info@culinaryblock.com?subject=Partnership Inquiry">
              <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-white px-8 text-lg font-semibold border-none">
                Become a Partner
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* The Problem / Solution */}
      <section className="py-24 px-4 bg-white">
        <div className="container mx-auto max-w-6xl">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <h2 className="text-4xl font-bold text-slate-900 mb-6">The Post-Incubator Chute</h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Food entrepreneurs work incredibly hard to obtain their licensing, perfect their recipes, and graduate from esteemed culinary incubators. Yet, the biggest hurdle remains: <strong>finding a reliable, licensed commercial kitchen to legally operate from.</strong>
              </p>
              <p className="text-lg text-slate-600 leading-relaxed mb-8">
                Culinary Block connects that missing link. We provide a state-of-the-art 8,000 sq ft facility designed specifically to help food businesses scale without the crippling overhead of their own lease.
              </p>
              
              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">Fully Santa Clara County Health Department Compliant</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">Cold storage and premium Revent rack ovens</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0 mt-0.5" />
                  <span className="text-slate-700 font-medium">Flexible hourly booking—no rigid monthly time blocks</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="aspect-square rounded-2xl overflow-hidden shadow-2xl relative z-10">
                <Image src="/kitchen-hood.jpg" alt="Culinary Block Kitchen" fill className="object-cover" />
              </div>
              {/* Decorative elements */}
              <div className="absolute -bottom-8 -left-8 w-64 h-64 bg-teal-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 border-none"></div>
              <div className="absolute -top-8 -right-8 w-64 h-64 bg-cyan-100 rounded-full mix-blend-multiply filter blur-3xl opacity-70 border-none"></div>
            </div>
          </div>
        </div>
      </section>

      {/* The Graduation Package Details */}
      <section className="py-24 px-4 bg-slate-50 border-t border-slate-200">
        <div className="container mx-auto max-w-5xl text-center">
          <GraduationCap className="w-16 h-16 text-teal-600 mx-auto mb-6" />
          <h2 className="text-4xl font-bold text-slate-900 mb-12">What the Package Includes</h2>
          
          <div className="grid md:grid-cols-3 gap-8 text-left">
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-6">
                <Award className="w-6 h-6 text-teal-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Waived Minimums</h3>
              <p className="text-slate-600 leading-relaxed">
                Graduates from our partner programs receive their first 30 days with the standard $1,000 monthly minimum completely waived. You only pay for the exact hours you book.
              </p>
            </div>
            
            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-cyan-100 rounded-lg flex items-center justify-center mb-6">
                <Building className="w-6 h-6 text-cyan-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Guaranteed Placement</h3>
              <p className="text-slate-600 leading-relaxed">
                While Culinary Block often maintains a 2-6 month waitlist, graduates from Official Partner Programs get priority placement to ensure their business doesn't stall.
              </p>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100">
              <div className="w-12 h-12 bg-sky-100 rounded-lg flex items-center justify-center mb-6">
                <ArrowRight className="w-6 h-6 text-sky-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Dedicated Onboarding</h3>
              <p className="text-slate-600 leading-relaxed">
                We provide a comprehensive facility walkthrough, Kiosk training, and direct assistance with finalizing Health Department paperwork.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-4 bg-slate-900 text-center">
        <div className="container mx-auto max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">Are you an Incubator or Non-Profit?</h2>
          <p className="text-xl text-slate-300 mb-10">
            Let's give your graduates the commercial space they need to thrive. Reach out to set up an Official Partnership today.
          </p>
          <Link href="mailto:info@culinaryblock.com?subject=Partnership Inquiry">
            <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 font-bold px-10 border-none">
              Contact Our Team
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}

function Badge({ children, className }: { children: React.ReactNode, className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 ${className}`}>
      {children}
    </span>
  )
}
