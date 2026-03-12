import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, CheckCircle, Shield, MapPin, Phone, Mail, ChefHat, Thermometer, Building } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Footer } from '@/components/footer'

// SEO Data Dictionary
const locationData: Record<string, { title: string, description: string, h1: string, heroSubtext: string }> = {
  'commercial-kitchen-san-jose': {
    title: 'Commercial Kitchen Rental in San Jose | Culinary Block',
    description: 'Looking for a commercial kitchen to rent in San Jose? Culinary Block offers an 8,000 sq ft fully licensed facility for caterers, bakers, and food businesses.',
    h1: 'Commercial Kitchen Space in San Jose',
    heroSubtext: 'Professional-grade equipment, flexible scheduling, and the San Jose facility you need to grow your food business. Fully Health Department certified.'
  },
  'ghost-kitchen-bay-area': {
    title: 'Ghost Kitchen Rental Bay Area | Culinary Block',
    description: 'Start your delivery-only restaurant with our Bay Area ghost kitchens. Fully equipped, low overhead, and 24/7 access at Culinary Block.',
    h1: 'Premium Ghost Kitchens in the Bay Area',
    heroSubtext: 'Launch your delivery brand faster. Our 8,000 sq ft facility gives ghost kitchens the premium Revent ovens and hood space needed to scale.'
  }
}

// Generate Dynamic Metadata for SEO
export async function generateMetadata(props: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const params = await props.params;
  const data = locationData[params.slug]
  
  if (!data) {
    return {
      title: 'Commercial Kitchen Rental | Culinary Block'
    }
  }

  return {
    title: data.title,
    description: data.description,
    openGraph: {
      title: data.title,
      description: data.description,
      type: 'website'
    }
  }
}

const amenities = [
  {
    title: 'Professional Rack Ovens',
    description: 'European Revent rack ovens for consistent, high-volume baking with programmable controls.',
    image: '/kitchen-main.jpg',
    highlights: ['Temperature precision', 'High capacity', 'Energy efficient']
  },
  {
    title: 'Commercial Cooking Stations',
    description: 'Full-size ranges, griddles, and fryers under powerful hood ventilation systems.',
    image: '/kitchen-ovens.jpg',
    highlights: ['Gas ranges', 'Flat-top griddles', 'Deep fryers']
  },
  {
    title: 'Spacious Prep Areas',
    description: '8,000 sq ft facility with stainless steel prep tables, commercial sinks, and walk-in coolers.',
    image: '/kitchen-hood.jpg',
    highlights: ['Walk-in coolers', 'Multiple prep stations', 'Commercial sinks']
  }
]

export default async function LocationPage(props: { params: Promise<{ slug: string }> }) {
  const params = await props.params;
  const data = locationData[params.slug] || locationData['commercial-kitchen-san-jose']

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[80vh] min-h-[600px] overflow-hidden">
        <div className="absolute inset-0">
          <Image
            src="/kitchen-main.jpg"
            alt="Commercial Kitchen Setup"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-900/40" />
        </div>

        {/* Hero Content */}
        <div className="relative z-10 h-full container mx-auto px-4 flex items-center">
          <div className="max-w-2xl mt-16 animate-in slide-in-from-bottom-8 duration-700">
            <p className="text-teal-400 font-bold tracking-[0.2em] uppercase mb-4 text-sm">
              Bay Area Kitchen Rental
            </p>
            <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight text-white">
              {data.h1}
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed font-light">
              {data.heroSubtext}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/apply">
                <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-white text-lg px-8 font-semibold shadow-lg hover:shadow-xl transition-all border-none">
                  BOOK A TOUR
                </Button>
              </Link>
              <a href="sms:4084599459">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/5 backdrop-blur border-white/20 text-white hover:bg-white/10 font-semibold">
                  Text Us: 408-459-9459
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Amenities Showcase */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800">
              Everything You Need to Succeed
            </h2>
          </div>

          <div className="space-y-24 max-w-6xl mx-auto">
            {amenities.map((amenity, index) => (
              <div
                key={index}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'} gap-12 items-center`}
              >
                {/* Image */}
                <div className="w-full lg:w-1/2">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-xl">
                    <Image
                      src={amenity.image}
                      alt={amenity.title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </div>

                {/* Content */}
                <div className="w-full lg:w-1/2 space-y-6">
                  <h3 className="text-3xl font-bold text-slate-800">
                    {amenity.title}
                  </h3>
                  <p className="text-lg text-slate-600 leading-relaxed">
                    {amenity.description}
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {amenity.highlights.map((highlight, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 text-slate-700 rounded-full text-sm font-medium"
                      >
                        <CheckCircle className="w-4 h-4 text-teal-600" />
                        {highlight}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Grid Features */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-slate-800">
              Built for Food Entrepreneurs
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-6 h-6 text-teal-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Flexible Scheduling</h3>
              <p className="text-slate-600">
                Book the hours you need via our online software. No rigid monthly block requirements.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <Building className="w-6 h-6 text-teal-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Walk-In Cold Storage</h3>
              <p className="text-slate-600">
                Commercial freezers and refrigerators with dedicated space for your ingredients.
              </p>
            </div>

            <div className="bg-slate-50 border border-slate-100 rounded-2xl p-8 hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-6 h-6 text-teal-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Health Certified</h3>
              <p className="text-slate-600">
                Fully licensed commercial kitchen that meets Santa Clara County health requirements.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-slate-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6 text-white">
            Ready to Tour the Kitchen?
          </h2>
          <div className="bg-slate-800 p-6 rounded-xl border border-slate-700 max-w-2xl mx-auto mb-10 text-left relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-teal-500"></div>
            <p className="text-slate-300 text-sm md:text-base leading-relaxed">
              <strong className="text-white block mb-1">Please Note:</strong>
              We are currently at or close to capacity and maintaining a waitlist. 
              Our minimum requirement is $1,000/month, covering your first 20 hours at $50/hr.
            </p>
          </div>
          <Link href="/apply">
            <Button size="lg" className="bg-teal-500 hover:bg-teal-400 text-white text-lg px-10 font-semibold">
              APPLY NOW
            </Button>
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  )
}
