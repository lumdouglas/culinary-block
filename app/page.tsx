'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Calendar, Clock, CheckCircle, Shield, MapPin, Phone, Mail, ChefHat, Thermometer, Building, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'

const heroImages = [
  { src: '/kitchen-hood.jpg', alt: 'Spacious prep area with walk-in coolers' },
  { src: '/kitchen-main.jpg', alt: 'Professional Revent rack ovens' },
  { src: '/kitchen-ovens.jpg', alt: 'Commercial cooking stations with hoods' }
]

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

export default function Home() {
  const [currentSlide, setCurrentSlide] = useState(0)

  // Auto-advance slideshow
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroImages.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroImages.length)
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroImages.length) % heroImages.length)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section with Image Carousel */}
      <section className="relative h-screen min-h-[600px] max-h-[900px] overflow-hidden">
        {/* Background Images */}
        {heroImages.map((image, index) => (
          <div
            key={index}
            className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
          >
            <Image
              src={image.src}
              alt={image.alt}
              fill
              className="object-cover"
              priority={index === 0}
            />
            {/* Dark overlay for text readability - Strengthened */}
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/70 to-slate-900/30" />
          </div>
        ))}

        {/* Hero Content */}
        <div className="relative z-10 h-full container mx-auto px-4 flex items-center">
          <div className="max-w-2xl">
            <p className="text-slate-300 font-semibold tracking-[0.2em] uppercase mb-4 text-sm">
              Commercial Kitchen Rental
            </p>
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight text-white">
              <span className="text-teal-400">Your Kitchen,</span>
              <br />
              <span className="text-white">Your Vision</span>
            </h1>
            <p className="text-xl text-slate-300 mb-10 leading-relaxed">
              Professional-grade equipment, flexible scheduling, and the space
              you need to grow your food business. From bakers to caterers,
              we're here to support your culinary dreams.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/apply">
                <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-8 font-semibold shadow-lg hover:shadow-xl transition-all">
                  BOOK A TOUR TODAY
                </Button>
              </Link>
              <a href="sms:4084599459">
                <Button size="lg" variant="outline" className="text-lg px-8 bg-white/5 backdrop-blur border-white/40 text-white hover:bg-white/15 font-semibold">
                  <span className="mr-2">💬</span>
                  Text Us
                </Button>
              </a>
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="flex gap-2">
            {heroImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentSlide(index)}
                className={`w-3 h-3 rounded-full transition-all ${index === currentSlide
                  ? 'bg-white w-8'
                  : 'bg-white/50 hover:bg-white/70'
                  }`}
              />
            ))}
          </div>
          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-white/20 hover:bg-white/30 text-white backdrop-blur transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Amenities Showcase */}
      <section className="py-24 bg-gradient-to-b from-slate-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-slate-500 font-semibold tracking-[0.15em] uppercase mb-3 text-sm">
              World-Class Facilities
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800">
              Everything You Need to Succeed
            </h2>
          </div>

          <div className="space-y-24 max-w-6xl mx-auto">
            {amenities.map((amenity, index) => (
              <div
                key={index}
                className={`flex flex-col ${index % 2 === 0 ? 'lg:flex-row' : 'lg:flex-row-reverse'
                  } gap-12 items-center`}
              >
                {/* Image */}
                <div className="w-full lg:w-1/2">
                  <div className="relative aspect-[4/3] rounded-2xl overflow-hidden shadow-2xl">
                    <Image
                      src={amenity.image}
                      alt={amenity.title}
                      fill
                      className="object-cover hover:scale-105 transition-transform duration-500"
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
                        <CheckCircle className="w-4 h-4 text-slate-500" />
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

      {/* Additional Features Grid */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <p className="text-slate-500 font-semibold tracking-[0.15em] uppercase mb-3 text-sm">
              Why Choose Culinary Block
            </p>
            <h2 className="text-4xl md:text-5xl font-bold text-slate-800">
              Built for Food Entrepreneurs
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-slate-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
                <Clock className="w-7 h-7 text-teal-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Flexible Scheduling</h3>
              <p className="text-slate-600">
                Book the hours you need - early mornings, late nights, or weekends.
                Our online scheduling makes it easy.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-cyan-100 rounded-xl flex items-center justify-center mb-6">
                <Building className="w-7 h-7 text-cyan-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Walk-In Cold Storage</h3>
              <p className="text-slate-600">
                Commercial freezers and refrigerators with dedicated space
                for your ingredients and finished products.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-violet-100 rounded-xl flex items-center justify-center mb-6">
                <Shield className="w-7 h-7 text-violet-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Health Certified</h3>
              <p className="text-slate-600">
                Fully licensed commercial kitchen that meets all health
                department requirements for food production.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-amber-100 rounded-xl flex items-center justify-center mb-6">
                <ChefHat className="w-7 h-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Prep Stations</h3>
              <p className="text-slate-600">
                Stainless steel tables, cutting boards, and prep sinks
                organized for efficient food preparation.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-rose-100 rounded-xl flex items-center justify-center mb-6">
                <Thermometer className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Locking Roll-Up Door</h3>
              <p className="text-slate-600">
                Secure locking roll-up door for easy deliveries
                and vehicle access.
              </p>
            </div>

            <div className="bg-slate-50 rounded-xl p-8 hover:shadow-lg transition-shadow">
              <div className="w-14 h-14 bg-emerald-100 rounded-xl flex items-center justify-center mb-6">
                <Calendar className="w-7 h-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-3">Online Booking</h3>
              <p className="text-slate-600">
                View availability and book your kitchen time instantly
                through our scheduling system.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-700 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 !text-white">
            Ready to Get Started?
          </h2>
          <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
            Schedule a tour to see our 8,000 sq ft facility in person. We'll show you around
            and discuss how Culinary Block can support your food business.
          </p>
          <div className="flex justify-center">
            <Link href="/apply">
              <Button size="lg" className="bg-white text-slate-900 hover:bg-slate-100 text-lg px-10 font-semibold">
                APPLY NOW
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <h4 className="text-teal-400 font-bold text-lg mb-4">Culinary Block</h4>
              <p className="text-sm leading-relaxed">
                8,000 sq ft professional commercial kitchen space for food entrepreneurs,
                caterers, bakers, and culinary creatives.
              </p>
            </div>
            <div>
              <h4 className="text-teal-400 font-bold text-lg mb-4">Contact</h4>
              <div className="space-y-2 text-sm">
                <p className="flex items-center gap-2">
                  <Phone className="w-4 h-4" />
                  <a href="sms:4084599459" className="hover:text-white">Text: 408.459.9459</a>
                </p>
                <p className="flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  <a href="mailto:info@culinaryblock.com" className="hover:text-white">info@culinaryblock.com</a>
                </p>
              </div>
            </div>
            <div>
              <h4 className="text-teal-400 font-bold text-lg mb-4">Hours</h4>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-white font-medium">Kitchen Access</p>
                  <p className="text-slate-300">24/7 for tenants</p>
                </div>
                <div>
                  <p className="text-white font-medium">Tours Available</p>
                  <p className="text-slate-300">M-F 11am - 4pm</p>
                </div>
              </div>
            </div>
            <div>
              <h4 className="text-teal-400 font-bold text-lg mb-4">Location</h4>
              <div className="rounded-lg overflow-hidden mb-3">
                <iframe
                  src="https://maps.google.com/maps?q=1901%20Las%20Plumas%20Ave%2C%20San%20Jose%2C%20CA%2095133&t=&z=13&ie=UTF8&iwloc=&output=embed"
                  width="100%"
                  height="120"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                  className="grayscale hover:grayscale-0 transition-all"
                ></iframe>
              </div>
              <a
                href="https://maps.google.com/?q=1901+Las+Plumas+Ave,+San+Jose,+CA+95133"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white hover:text-slate-200 font-medium"
              >
                <MapPin className="w-4 h-4" />
                Get Directions
              </a>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-sm">
            © {new Date().getFullYear()} Culinary Block. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  )
}
