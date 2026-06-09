import React from 'react'
import { Link } from 'react-router-dom'
import {
  FacebookIcon,
  InstagramIcon,
  TwitterIcon,
  YoutubeIcon,
  MapPinIcon,
  PhoneIcon,
  MailIcon,
  ClockIcon,
} from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          <div>
            <Link
              to="/"
              className="font-extrabold text-2xl text-red-500 hover:text-red-400 transition-colors tracking-wider"
            >
              SUPREME<span className="text-white">FITNESS</span>
            </Link>
            <p className="mt-4 text-gray-400">
              Transforming bodies and minds with premium fitness experiences and
              expert training.
            </p>
            <div className="mt-6 flex space-x-4">
              <a
                href="#"
                className="bg-gray-800 p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <FacebookIcon className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-gray-800 p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <InstagramIcon className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-gray-800 p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <TwitterIcon className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="bg-gray-800 p-2 rounded-full hover:bg-red-600 transition-colors"
              >
                <YoutubeIcon className="h-5 w-5" />
              </a>
            </div>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase">Quick Links</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  Home
                </Link>
              </li>
              <li>
                <Link
                  to="/about"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to="/plans"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  Membership Plans
                </Link>
              </li>
              <li>
                <Link
                  to="/equipments"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  Equipment
                </Link>
              </li>
              <li>
                <Link
                  to="/feedbacks"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  Testimonials
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="text-gray-400 hover:text-red-500 transition-colors"
                >
                  Contact Us
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase">Working Hours</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <ClockIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Weekdays</p>
                  <p className="text-gray-400">5:00 AM - 11:00 PM</p>
                </div>
              </li>
              <li className="flex items-start">
                <ClockIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Saturday</p>
                  <p className="text-gray-400">6:00 AM - 10:00 PM</p>
                </div>
              </li>
              <li className="flex items-start">
                <ClockIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-medium">Sunday</p>
                  <p className="text-gray-400">7:00 AM - 8:00 PM</p>
                </div>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="font-bold text-lg mb-4 uppercase">Contact Info</h3>
            <ul className="space-y-3">
              <li className="flex items-start">
                <MapPinIcon className="h-5 w-5 text-red-500 mr-2 mt-0.5 flex-shrink-0" />
                <span className="text-gray-400">
                  123 Fitness Street, Gym City, 10001
                </span>
              </li>
              <li className="flex items-center">
                <PhoneIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-gray-400">(555) 123-4567</span>
              </li>
              <li className="flex items-center">
                <MailIcon className="h-5 w-5 text-red-500 mr-2 flex-shrink-0" />
                <span className="text-gray-400">info@powergym.com</span>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-gray-800 mt-12 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            &copy; {new Date().getFullYear()} PowerGym. All rights reserved.
          </p>
          <div className="mt-4 md:mt-0">
            <ul className="flex space-x-6">
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-red-500 text-sm"
                >
                  Privacy Policy
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-red-500 text-sm"
                >
                  Terms of Service
                </a>
              </li>
              <li>
                <a
                  href="#"
                  className="text-gray-500 hover:text-red-500 text-sm"
                >
                  Cookie Policy
                </a>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer
