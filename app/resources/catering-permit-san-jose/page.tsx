import { Metadata } from 'next'
import Link from 'next/link'
import { CheckCircle, Info, ArrowRight, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

export const metadata: Metadata = {
  title: 'How to Get a Catering Permit in San Jose (Santa Clara County) | Guide',
  description: 'A complete step-by-step guide to obtaining your catering permit in San Jose from the Santa Clara County Department of Environmental Health. Learn the requirements, commissary kitchen rules, and application process.',
}

export default function CateringPermitGuide() {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <section className="bg-slate-900 text-white pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <p className="text-teal-400 font-bold tracking-[0.2em] uppercase mb-4 text-sm">
            Regulatory Guide
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
            How to Obtain a Catering Permit in San Jose (Santa Clara County)
          </h1>
          <p className="text-xl text-slate-300 font-light max-w-2xl mx-auto">
            Everything you need to know about the Department of Environmental Health (DEH) requirements, the application process, and finding an approved commissary kitchen.
          </p>
        </div>
      </section>

      {/* Main Content Article */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-3xl prose prose-slate prose-lg lg:prose-xl">
          
          <p className="lead text-xl text-slate-600 mb-8">
            Starting a catering business in San Jose means navigating the Santa Clara County Department of Environmental Health (DEH) regulations. The process ensures that all food served to the public is prepared safely. This guide covers the essential steps to get your catering operation licensed and legal.
          </p>

          <div className="bg-teal-50 border-l-4 border-teal-500 p-6 rounded-r-lg mb-12">
            <div className="flex items-start gap-4">
              <Info className="w-6 h-6 text-teal-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-bold text-slate-900 m-0 mb-2">The Golden Rule: You Need a Commissary</h3>
                <p className="text-slate-700 m-0">
                  You <strong>cannot</strong> cater from a home kitchen unless you are operating strictly under a Cottage Food Operation (CFO) permit, which severely limits what types of food you can make (only non-potentially hazardous foods like bread and dry goods). For standard catering (meat, dairy, hot meals), you are legally required to operate out of an approved commercial kitchen facility.
                </p>
              </div>
            </div>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">Step 1: Obtain a Food Safety Manager Certificate</h2>
          <p className="text-slate-600 mb-6">
            Before applying for a catering permit, at least one owner or employee must possess a valid Food Safety Manager Certificate. This involves taking an ANSI-accredited exam (like ServSafe). Once certified, the certificate is valid for five years.
          </p>

          <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">Step 2: Secure an Approved Commissary Kitchen</h2>
          <p className="text-slate-600 mb-6">
            The DEH requires caterers to prepare and store all food, equipment, and supplies at an approved commercial facility. You will need the owner of the facility to sign a specific <strong>Commissary Agreement Form</strong> to include in your application packet.
          </p>
          
          {/* Internal Callout to Culinary Block */}
          <div className="bg-slate-50 border border-slate-200 p-8 rounded-xl my-8 text-center shadow-sm">
            <h3 className="text-2xl font-bold text-slate-900 mb-3 mt-0">Looking for an Approved Kitchen?</h3>
            <p className="text-slate-600 mb-6">
              Culinary Block is an 8,000 sq ft, fully DEH-compliant shared commercial kitchen in San Jose. We sign Commissary Agreements for our tenants immediately upon approval.
            </p>
            <Link href="/apply">
              <Button className="bg-teal-600 hover:bg-teal-500 text-white border-none w-full sm:w-auto">
                Apply for Space at Culinary Block
              </Button>
            </Link>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">Step 3: Complete the Application Packet</h2>
          <p className="text-slate-600 mb-4">
            You must submit a comprehensive application packet to the Santa Clara County DEH. This typically includes:
          </p>
          <ul className="list-none space-y-3 pl-0 mb-8">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0" />
              <span className="text-slate-700"><strong>Application for Health Permit</strong> (Form DEH-10)</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0" />
              <span className="text-slate-700"><strong>Standard Operating Procedures (SOPs)</strong>: How you will transport food, maintain temperatures, and clean equipment.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0" />
              <span className="text-slate-700"><strong>Proposed Menu</strong>: A complete list of items you intend to prepare and serve.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0" />
              <span className="text-slate-700"><strong>Commissary Agreement Form</strong> signed by the kitchen owner.</span>
            </li>
            <li className="flex items-start gap-3">
              <CheckCircle className="w-6 h-6 text-teal-500 flex-shrink-0" />
              <span className="text-slate-700"><strong>Food Safety Manager Certificate</strong> copy.</span>
            </li>
          </ul>

          <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-8 rounded-xl my-8 shadow-lg text-white">
            <h3 className="text-2xl font-bold text-white mb-3 mt-0 flex items-center gap-2">
              <FileText className="w-6 h-6 text-teal-400" />
              Overwhelmed by the Paperwork?
            </h3>
            <p className="text-slate-300 mb-6">
              Skip the confusion. We built an AI Permit Assistant trained specifically on Santa Clara County Health Department requirements. It guides you step-by-step and instantly handles translations.
            </p>
            <Link href="/apply/catering-permit">
              <Button className="bg-teal-500 hover:bg-teal-400 text-white font-semibold border-none w-full sm:w-auto">
                Use the Free AI Permit Assistant
              </Button>
            </Link>
          </div>

          <h2 className="text-3xl font-bold text-slate-900 mt-12 mb-6">Step 4: Pay Fees and Schedule Inspection</h2>
          <p className="text-slate-600 mb-6">
            After submitting your packet, you will need to pay the annual health permit fee. The DEH will review your Standard Operating Procedures and may request an initial inspection of your vehicles and equipment at your commissary to ensure you can safely transport food at required temperatures.
          </p>

          <div className="border-t border-slate-200 mt-16 pt-12">
            <h3 className="text-2xl font-bold text-slate-900 mb-6">Ready to check off Step 2?</h3>
            <p className="text-slate-600 mb-8">
              Securing a licensed kitchen is the hardest part of the process. Culinary Block provides premium Revent ovens, walk-in coolers, and 24/7 flexible booking for San Jose caterers.
            </p>
            <div className="flex gap-4">
              <Link href="/apply">
                <Button size="lg" className="bg-slate-900 hover:bg-slate-800 text-white px-8">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          </div>

        </div>
      </section>

      <Footer />
    </div>
  )
}
