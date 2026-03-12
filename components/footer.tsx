import { MapPin, Phone, Mail } from 'lucide-react'
import Link from 'next/link'

export function Footer() {
  return (
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
            <h4 className="text-teal-400 font-bold text-lg mb-4">Explore</h4>
            <div className="space-y-2 text-sm">
              <p>
                <Link href="/" className="hover:text-white transition-colors">Home</Link>
              </p>
              <p>
                <Link href="/resources/catering-permit-san-jose" className="hover:text-white transition-colors">
                  Catering Permit Guide
                </Link>
              </p>
              <p>
                <Link href="/partnerships" className="hover:text-white transition-colors">
                  Partnerships & Programs
                </Link>
              </p>
              <p>
                <Link href="/locations/commercial-kitchen-san-jose" className="hover:text-white transition-colors">
                  San Jose Rentals
                </Link>
              </p>
              <p>
                <Link href="/locations/ghost-kitchen-bay-area" className="hover:text-white transition-colors">
                  Bay Area Ghost Kitchens
                </Link>
              </p>
            </div>
          </div>
          <div>
            <h4 className="text-teal-400 font-bold text-lg mb-4">Contact & Hours</h4>
            <div className="space-y-3 text-sm">
              <p className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                <a href="sms:4084599459" className="hover:text-white transition-colors">Text: 408.459.9459</a>
              </p>
              <p className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                <a href="mailto:info@culinaryblock.com" className="hover:text-white transition-colors">info@culinaryblock.com</a>
              </p>
              <div className="pt-2">
                <p className="text-white font-medium">Kitchen Access</p>
                <p className="text-slate-300">24/7 for tenants</p>
              </div>
              <div className="pt-1">
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
              className="inline-flex items-center gap-2 text-sm text-white hover:text-slate-200 font-medium transition-colors"
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
  )
}
