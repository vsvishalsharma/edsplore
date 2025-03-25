import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Bot, Shield, Clock, Users, Star, ChevronRight } from 'lucide-react';

const features = [
  {
    icon: <Bot className="w-6 h-6" />,
    title: "AI-Powered Assistant",
    description: "24/7 intelligent support for your patients with natural conversations"
  },
  {
    icon: <Shield className="w-6 h-6" />,
    title: "HIPAA Compliant",
    description: "Secure and compliant handling of sensitive patient information"
  },
  {
    icon: <Clock className="w-6 h-6" />,
    title: "Time-Saving",
    description: "Automate routine tasks and focus on what matters most - patient care"
  }
];

const testimonials = [
  {
    name: "Dr. Sarah Johnson",
    role: "Family Physician",
    image: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?auto=format&fit=crop&q=80&w=300&h=300",
    quote: "This AI assistant has transformed how we handle patient inquiries. It's like having an extra team member available 24/7."
  },
  {
    name: "Dr. Michael Chen",
    role: "Pediatrician",
    image: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?auto=format&fit=crop&q=80&w=300&h=300",
    quote: "The efficiency gains are remarkable. Our patients love the instant responses, and our staff can focus on more complex tasks."
  },
  {
    name: "Dr. Emily Williams",
    role: "Cardiologist",
    image: "https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=300&h=300",
    quote: "An invaluable tool for modern healthcare practices. The AI's ability to handle appointments and queries is impressive."
  }
];

export default function HomePage() {
  const [heroRef, heroInView] = useInView({ triggerOnce: true });
  const [featuresRef, featuresInView] = useInView({ triggerOnce: true });
  const [testimonialsRef, testimonialsInView] = useInView({ triggerOnce: true });

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Hero Section */}
      <motion.section
        ref={heroRef}
        initial={{ opacity: 0, y: 20 }}
        animate={heroInView ? { opacity: 1, y: 0 } : {}}
        transition={{ duration: 0.6 }}
        className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center"
      >
        <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
          Transform Your Practice with
          <span className="text-blue-600"> AI Assistant</span>
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Empower your healthcare practice with our intelligent and secure patient communication system.
          Available 24/7, ensuring your patients always receive the attention they deserve.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/login"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Get Started <ChevronRight className="ml-2 w-5 h-5" />
          </Link>
          <a
            href="#features"
            className="inline-flex items-center px-6 py-3 rounded-lg bg-gray-100 text-gray-800 font-medium hover:bg-gray-200 transition-colors"
          >
            Learn More
          </a>
        </div>
        <div className="mt-12">
          <img
            src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=2070"
            alt="Medical professionals using digital technology"
            className="rounded-xl shadow-2xl"
          />
        </div>
      </motion.section>

      {/* Features Section */}
      <section
        id="features"
        ref={featuresRef}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-white"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={featuresInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Features that Empower Your Practice
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={featuresInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="p-6 bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow"
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Testimonials Section */}
      <section
        ref={testimonialsRef}
        className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50"
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="max-w-7xl mx-auto"
        >
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            What Healthcare Professionals Say
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={testimonialsInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                className="bg-white p-6 rounded-xl shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <img
                    src={testimonial.image}
                    alt={testimonial.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                  <div className="ml-4">
                    <h4 className="text-lg font-semibold text-gray-900">
                      {testimonial.name}
                    </h4>
                    <p className="text-sm text-gray-600">{testimonial.role}</p>
                  </div>
                </div>
                <p className="text-gray-600 italic">"{testimonial.quote}"</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>
    </div>
  );
}