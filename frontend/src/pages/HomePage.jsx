import React from 'react'
import { Link } from 'react-router-dom'
import {
  DumbbellIcon,
  ClockIcon,
  UsersIcon,
  HeartIcon,
  StarIcon,
  ArrowRightIcon,
  CheckCircleIcon,
  XIcon,
} from 'lucide-react'
import Footer from '../components/Footer'

import '../tailwind.css'

const testimonials = [
  {
    quote:
      "SupremeFitness transformed my fitness journey. I've lost 30 pounds and gained so much strength and confidence. The trainers push you to your limits but in the best way possible!",
    name: 'Sarah M.',
    sub: 'Member for 1 year',
    img: 'https://randomuser.me/api/portraits/women/44.jpg',
  },
  {
    quote:
      "I joined to fix my posture and build muscle. In 6 months at SupremeFitness, my back pain is gone and I’ve added 8kg to my squat PR. The community keeps me consistent.",
    name: 'Jason K.',
    sub: 'Member for 6 months',
    img: 'https://randomuser.me/api/portraits/men/32.jpg',
  },
  {
    quote:
      "As a beginner, I was nervous. The coaches at SupremeFitness gave me a clear plan and kept me motivated. I feel stronger every week and finally enjoy working out.",
    name: 'Nethmi P.',
    sub: 'Member for 4 months',
    img: 'https://randomuser.me/api/portraits/women/68.jpg',
  },
  {
    quote:
      "Cut 10% body fat while keeping my strength! The nutrition tips plus structured workouts at SupremeFitness were game changers for me.",
    name: 'Ravindu D.',
    sub: 'Member for 9 months',
    img: 'https://randomuser.me/api/portraits/men/77.jpg',
  },
  {
    quote:
      "I used to skip cardio days. The classes here are actually fun. My stamina skyrocketed, and I ran my first 10K thanks to SupremeFitness.",
    name: 'Amaya L.',
    sub: 'Member for 8 months',
    img: 'https://randomuser.me/api/portraits/women/12.jpg',
  },
  {
    quote:
      "The app + trainers keep me accountable. I’ve put on noticeable muscle and feel more energetic at work. SupremeFitness is worth every cent.",
    name: 'Tharindu S.',
    sub: 'Member for 1.5 years',
    img: 'https://randomuser.me/api/portraits/men/11.jpg',
  },
]

const HomePage = () => {
  return (
    <div className="w-full">
      {/* Hero Section */}
      <section
        className="w-full h-screen flex items-center justify-center bg-black text-white"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.65), rgba(0, 0, 0, 0.7)), url('https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1470&q=80')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundRepeat: 'no-repeat',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
          <div className="text-center">
            <div className="inline-block bg-red-600 text-white text-xs font-bold uppercase px-3 py-1 mb-6 rounded-sm tracking-wider">
              Premium Fitness Center
            </div>
            <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-shadow">
              UNLEASH YOUR <span className="text-red-500">POTENTIAL</span>
            </h1>
            <p className="text-xl md:text-2xl mb-10 max-w-3xl mx-auto font-light">
              Join the elite fitness experience with state-of-the-art equipment
              and expert training
            </p>
            <div className="flex flex-wrap justify-center gap-6">
              <Link
                to="/signin"
                className="px-8 py-4 bg-red-600 text-white text-lg font-bold uppercase rounded-sm hover:bg-red-700 transition-colors tracking-wider shadow-lg transform hover:-translate-y-1 hover:shadow-xl duration-300"
              >
                Start Today
              </Link>
              <Link
                to="/workoutplans"
                className="px-8 py-4 bg-transparent border-2 border-white text-white text-lg font-bold uppercase rounded-sm hover:bg-white hover:text-black transition-colors tracking-wider shadow-lg transform hover:-translate-y-1 hover:shadow-xl duration-300"
              >
                View Plans
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      {/* ... your existing features content can remain here ... */}

      {/* Testimonials Section */}
      <section className="py-24 bg-black text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 uppercase">
              Success <span className="text-red-600">Stories</span>
            </h2>
            <div className="w-24 h-1 bg-red-600 mx-auto mb-6"></div>
            <p className="text-xl text-gray-300 max-w-3xl mx-auto">
              Real results from real members who transformed their bodies and lives
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((t, idx) => (
              <div key={idx} className="bg-gray-900 p-6 rounded-lg relative">
                <div className="text-yellow-500 text-4xl font-serif absolute top-4 left-4 leading-none">
                  "
                </div>

                <div className="flex items-center mb-4 pt-4">
                  {Array(5)
                    .fill()
                    .map((_, i) => (
                      <StarIcon
                        key={i}
                        className="h-5 w-5 text-yellow-500 fill-yellow-500"
                      />
                    ))}
                </div>

                <p className="mb-6 text-gray-300 italic">"{t.quote}"</p>

                <div className="flex items-center">
                  <img
                    src={t.img}
                    alt={t.name}
                    className="h-12 w-12 rounded-full object-cover mr-4 border-2 border-red-500"
                  />
                  <div>
                    <p className="font-semibold">{t.name}</p>
                    <p className="text-sm text-gray-400">{t.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section
        className="py-24 text-white relative"
        style={{
          backgroundImage:
            "linear-gradient(rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.8)), url('https://images.unsplash.com/photo-1593079831268-3381b0db4a77?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1469&q=80')",
          backgroundPosition: 'center',
          backgroundSize: 'cover',
          backgroundAttachment: 'fixed',
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6 uppercase">
            Start Your Fitness Journey <span className="text-red-600">Today</span>
          </h2>
          <p className="text-xl mb-10 max-w-2xl mx-auto text-gray-300">
            Join our community of fitness enthusiasts and transform your body
            with our expert guidance and support
          </p>
          <div className="flex flex-wrap justify-center gap-6">
            <Link
              to="/signin"
              className="px-10 py-4 bg-red-600 text-white text-lg font-bold uppercase rounded-sm hover:bg-red-700 transition-colors tracking-wider shadow-lg"
            >
              Join Now
            </Link>
            <Link
              to="/plans"
              className="px-10 py-4 bg-transparent border-2 border-white text-white text-lg font-bold uppercase rounded-sm hover:bg-white hover:text-black transition-colors tracking-wider shadow-lg"
            >
              Learn More
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}

export default HomePage
