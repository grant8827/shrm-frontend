import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// Import images
import mentalHealthImg from '../components/images/Mental-health.jpg';
import christianCounselingImg from '../components/images/christian-counseling.png';
import familyCounselingImg from '../components/images/family-counseling.png';
import marriageCounselorImg from '../components/images/marriage-counselor.jpg';
import mentalPersonImg from '../components/images/mental-person.png';
import roadImg from '../components/images/road.png';

const Services: React.FC = () => {
  const [activeService, setActiveService] = useState<number | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);
  const services = [
    {
      id: 1,
      title: "Individual Counseling",
      subtitle: "Personal Healing Journey",
      image: mentalPersonImg,
      icon: "🧠",
      gradientFrom: "from-shrm-primary",
      gradientTo: "to-blue-600",
      hoverGradient: "hover:from-shrm-primary-light hover:to-blue-700",
      description: "Transform your life through personalized, one-on-one therapy sessions designed to address your unique challenges and unlock your potential.",
      features: [
        "Anxiety & Depression Treatment",
        "Trauma & PTSD Recovery", 
        "Grief & Loss Counseling",
        "Addiction Recovery Support",
        "Life Transitions & Growth"
      ],
      duration: "50-minute sessions",
      price: "In Wellness",
      badge: "Most Popular",
      badgeColor: "bg-shrm-secondary text-shrm-primary"
    },
    {
      id: 2,
      title: "Couples Counseling",
      subtitle: "Relationship Renewal",
      image: marriageCounselorImg,
      icon: "❤️",
      gradientFrom: "from-pink-500",
      gradientTo: "to-shrm-secondary",
      hoverGradient: "hover:from-pink-600 hover:to-shrm-secondary-light",
      description: "Rebuild, strengthen, and deepen your relationship through evidence-based couples therapy techniques and faith-centered guidance.",
      features: [
        "Communication Mastery",
        "Conflict Resolution Skills",
        "Intimacy & Connection Building", 
        "Pre-marital Preparation",
        "Infidelity Recovery Program"
      ],
      duration: "75-minute sessions",
      price: "In Love",
      badge: "Recommended",
      badgeColor: "bg-pink-500 text-white"
    },
    {
      id: 3,
      title: "Family Therapy", 
      subtitle: "Restoring Family Bonds",
      image: familyCounselingImg,
      icon: "👨‍👩‍👧‍👦",
      gradientFrom: "from-green-500",
      gradientTo: "to-shrm-primary",
      hoverGradient: "hover:from-green-600 hover:to-shrm-primary-light",
      description: "Heal family dynamics and create lasting harmony through comprehensive family systems therapy and biblical principles.",
      features: [
        "Parent-Child Relationship Repair",
        "Sibling Conflict Resolution",
        "Blended Family Integration",
        "Teen & Adolescent Support", 
        "Family Crisis Management"
      ],
      duration: "90-minute sessions",
      price: "In Restoration",
      badge: "Comprehensive",
      badgeColor: "bg-green-500 text-white"
    },
    {
      id: 4,
      title: "Group Therapy",
      subtitle: "Community Healing", 
      image: christianCounselingImg,
      icon: "🤝",
      gradientFrom: "from-shrm-secondary",
      gradientTo: "to-orange-500",
      hoverGradient: "hover:from-shrm-secondary-light hover:to-orange-600",
      description: "Experience the power of shared healing in supportive group environments where faith and therapy intersect.",
      features: [
        "Specialized Support Groups",
        "Skills-Based Workshops",
        "Recovery & Addiction Circles",
        "Grief & Loss Communities",
        "Gender-Specific Groups"
      ],
      duration: "90-minute sessions",
      price: "In Faith",
      badge: "Community",
      badgeColor: "bg-orange-500 text-white"
    },
    {
      id: 5,
      title: "Crisis Intervention",
      subtitle: "Immediate Support",
      image: mentalHealthImg,
      icon: "🚨", 
      gradientFrom: "from-red-500",
      gradientTo: "to-shrm-primary",
      hoverGradient: "hover:from-red-600 hover:to-shrm-primary-light",
      description: "24/7 emergency mental health support when you need it most, providing immediate stabilization and safety planning.",
      features: [
        "24/7 Crisis Hotline Access",
        "Emergency Session Scheduling", 
        "Safety Planning & Assessment",
        "Resource Coordination",
        "Follow-up Crisis Support"
      ],
      duration: "As needed",
      price: "In Wellness",
      badge: "24/7 Available",
      badgeColor: "bg-red-500 text-white animate-pulse-slow"
    }
  ];

  const stats = [
    { number: "500+", label: "Lives Transformed", icon: "🌟", delay: "100" },
    { number: "15+", label: "Years Experience", icon: "📅", delay: "200" },
    { number: "24/7", label: "Crisis Support", icon: "⏰", delay: "300" },
    { number: "98%", label: "Client Satisfaction", icon: "💝", delay: "400" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-blue-50/30 overflow-x-hidden">
      {/* Ultra-Modern Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        {/* Dynamic Background with Parallax */}
        <div className="absolute inset-0">
          <div 
            className="absolute inset-0 bg-gradient-to-br from-shrm-primary/95 via-shrm-primary/85 to-shrm-secondary/75 backdrop-blur-sm"
            style={{ 
              backgroundImage: `url(${roadImg})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundAttachment: 'fixed'
            }}
          />
          
          {/* Floating Geometric Elements */}
          <div className="absolute top-20 left-10 w-20 h-20 bg-shrm-secondary/20 rounded-full blur-2xl animate-float"></div>
          <div className="absolute top-40 right-20 w-32 h-32 bg-shrm-primary/30 rounded-full blur-3xl animate-float-delayed"></div>
          <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-shrm-secondary/25 rounded-full blur-2xl animate-float-delayed-2"></div>
          <div className="absolute top-1/2 right-10 w-16 h-16 bg-white/10 rounded-full blur-xl animate-pulse-slow"></div>
        </div>

        {/* Hero Content */}
        <div className={`relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center transition-all duration-1000 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'
        }`}>
          
          {/* Badge */}
          <div className="mb-8 animate-slide-down">
            <span className="inline-flex items-center gap-2 px-6 py-3 bg-shrm-secondary/20 backdrop-blur-md rounded-full text-shrm-secondary-light font-semibold text-sm border border-shrm-secondary/30 shadow-lg">
              <span className="w-2 h-2 bg-shrm-secondary rounded-full animate-pulse"></span>
              ✨ Transforming Lives Through Faith & Professional Excellence
            </span>
          </div>
          
          {/* Main Heading */}
          <h1 className="text-5xl md:text-7xl lg:text-8xl xl:text-9xl font-black mb-8 leading-tight animate-fade-in">
            <span className="block bg-gradient-to-r from-white via-shrm-secondary-light to-white bg-clip-text text-transparent bg-size-200 animate-gradient">
              Professional
            </span>
            <span className="block text-shrm-secondary text-4xl md:text-6xl lg:text-7xl xl:text-8xl font-light mt-2">
              Counseling Services
            </span>
          </h1>
          
          {/* Subtitle */}
          <p className="text-xl md:text-2xl lg:text-3xl text-gray-100 max-w-5xl mx-auto mb-12 leading-relaxed animate-slide-up">
            Experience life-changing healing through our innovative integration of 
            <span className="text-shrm-secondary font-bold"> faith-based principles</span> and 
            <span className="text-shrm-secondary font-bold"> evidence-based therapeutic practices</span>
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16 animate-slide-up">
            <Link
              to="/appointment"
              className="group relative overflow-hidden px-12 py-5 bg-gradient-to-r from-shrm-secondary to-shrm-secondary-light hover:from-shrm-secondary-light hover:to-shrm-secondary text-shrm-primary font-bold text-lg rounded-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-2 shadow-2xl hover:shadow-shrm-secondary/30"
            >
              <span className="relative z-10 flex items-center gap-2">
                🚀 Start Your Healing Journey
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </Link>
            
            <button className="group flex items-center gap-4 px-10 py-5 border-2 border-white/40 backdrop-blur-md rounded-2xl text-white font-semibold hover:bg-white/10 hover:border-white/60 transition-all duration-300 transform hover:scale-105">
              <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center group-hover:bg-white/30 transition-colors duration-300">
                <div className="w-0 h-0 border-l-[12px] border-l-white border-y-[8px] border-y-transparent ml-1"></div>
              </div>
              <span>Watch Our Impact Story</span>
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 lg:gap-12">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`text-center group animate-slide-up`}
                style={{ animationDelay: `${stat.delay}ms` }}
              >
                <div className="text-4xl lg:text-5xl mb-3 group-hover:scale-125 transition-transform duration-300">
                  {stat.icon}
                </div>
                <div className="text-3xl md:text-4xl lg:text-5xl font-black text-white group-hover:text-shrm-secondary transition-colors duration-300 mb-1">
                  {stat.number}
                </div>
                <div className="text-gray-300 font-medium text-sm lg:text-base">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce-slow">
          <div className="w-8 h-12 border-2 border-white/60 rounded-full flex justify-center backdrop-blur-sm">
            <div className="w-1.5 h-4 bg-white/80 rounded-full mt-2 animate-pulse"></div>
          </div>
        </div>
      </section>

      {/* Premium Services Showcase */}
      <section className="py-24 lg:py-32 relative bg-gradient-to-b from-white via-gray-50/50 to-white">
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 opacity-40">
          <div 
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 20%, rgba(60, 69, 53, 0.08) 0%, transparent 50%), 
                                radial-gradient(circle at 80% 80%, rgba(250, 200, 0, 0.08) 0%, transparent 50%),
                                radial-gradient(circle at 60% 40%, rgba(60, 69, 53, 0.05) 0%, transparent 50%)`
            }}
          ></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-shrm-primary/10 backdrop-blur-sm rounded-full text-shrm-primary font-semibold text-sm mb-8 border border-shrm-primary/20">
              <span className="w-2 h-2 bg-shrm-primary rounded-full animate-pulse"></span>
              Our Professional Services
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-8 text-shrm-primary">
              Choose Your
              <span className="block bg-gradient-to-r from-shrm-primary via-shrm-secondary to-shrm-primary bg-clip-text text-transparent bg-size-200 animate-gradient">
                Healing Journey
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Each service is meticulously designed to meet you exactly where you are and guide you toward 
              lasting transformation through the perfect blend of faith and professional excellence.
            </p>
          </div>

          {/* Services Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8 lg:gap-10">
            {services.map((service, index) => (
              <div 
                key={service.id}
                className={`group relative bg-white/80 backdrop-blur-sm rounded-3xl overflow-hidden shadow-xl hover:shadow-2xl border border-white/50 transition-all duration-700 transform hover:-translate-y-6 hover:scale-105 cursor-pointer ${
                  activeService === service.id ? 'scale-105 shadow-2xl ring-2 ring-shrm-secondary/50' : ''
                }`}
                onMouseEnter={() => setActiveService(service.id)}
                onMouseLeave={() => setActiveService(null)}
                style={{ animationDelay: `${index * 150}ms` }}
              >
                {/* Service Badge */}
                {service.badge && (
                  <div className="absolute top-4 right-4 z-20">
                    <span className={`px-3 py-1 text-xs font-bold rounded-full ${service.badgeColor} shadow-lg`}>
                      {service.badge}
                    </span>
                  </div>
                )}

                {/* Horizontal Layout: Image and Content Side by Side */}
                <div className="flex flex-col lg:flex-row">
                  {/* Image Section */}
                  <div className="relative lg:w-2/5 h-72 lg:h-auto overflow-hidden flex-shrink-0 bg-gray-200">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110 group-hover:brightness-110"
                      onError={(e) => {
                        console.error(`Failed to load image: ${service.image}`);
                        e.currentTarget.style.display = 'none';
                      }}
                      onLoad={() => {
                        console.log(`Successfully loaded image: ${service.image}`);
                      }}
                    />
                    
                    {/* Dynamic Gradient Overlay */}
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.gradientFrom} ${service.gradientTo} ${service.hoverGradient} opacity-85 group-hover:opacity-75 transition-all duration-500`}></div>
                    
                    {/* Service Icon */}
                    <div className="absolute top-6 left-6 z-10">
                      <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center text-3xl group-hover:scale-125 group-hover:rotate-12 transition-all duration-500 shadow-lg">
                        {service.icon}
                      </div>
                    </div>
                    
                    {/* Title Overlay - Show on mobile/tablet, hidden on large screens */}
                    <div className="absolute bottom-6 left-6 right-6 text-white z-10 lg:hidden">
                      <h3 className="text-2xl font-bold mb-2">
                        {service.title}
                      </h3>
                      <p className="text-white/90 font-medium">
                        {service.subtitle}
                      </p>
                    </div>
                  </div>

                  {/* Content Section */}
                  <div className="p-8 lg:p-10 lg:w-3/5 flex flex-col justify-between">
                    {/* Title - Show on large screens only */}
                    <div className="hidden lg:block mb-6">
                      <h3 className="text-2xl xl:text-3xl font-bold text-shrm-primary mb-2 group-hover:text-shrm-secondary transition-colors duration-300">
                        {service.title}
                      </h3>
                      <p className="text-gray-600 font-medium text-lg">
                        {service.subtitle}
                      </p>
                    </div>

                    <div className="flex-1">
                      <p className="text-gray-700 mb-6 leading-relaxed">
                        {service.description}
                      </p>

                      {/* Feature List */}
                      <ul className="space-y-3 mb-6">
                        {service.features.map((feature, featureIndex) => (
                          <li key={featureIndex} className="flex items-center gap-3">
                            <div className={`w-2.5 h-2.5 rounded-full bg-gradient-to-r ${service.gradientFrom} ${service.gradientTo} flex-shrink-0`}></div>
                            <span className="text-gray-700 text-sm font-medium">{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Service Details */}
                    <div className="flex items-center justify-between py-5 border-t border-gray-200/60 mb-6">
                      <div>
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Session Length</div>
                        <div className="font-bold text-shrm-primary text-lg">{service.duration}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Investment</div>
                        <div className="font-bold text-shrm-secondary text-lg">{service.price}</div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <Link
                      to="/contact"
                      className={`w-full block text-center py-4 px-6 rounded-2xl font-bold text-white transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 shadow-lg hover:shadow-xl bg-gradient-to-r ${service.gradientFrom} ${service.gradientTo} ${service.hoverGradient}`}
                    >
                      Schedule Consultation
                    </Link>
                  </div>
                </div>

                {/* Hover Effect Overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none rounded-3xl"></div>
              </div>
            ))}
          </div>

          {/* Crisis Support Banner */}
         {/*<div className="mt-24 text-center animate-slide-up">
            <div className="inline-flex items-center gap-6 px-10 py-6 bg-gradient-to-r from-red-50 to-orange-50 border-2 border-red-200/50 rounded-3xl shadow-lg hover:shadow-xl transition-shadow duration-300 max-w-2xl mx-auto">
              <span className="text-4xl animate-pulse-slow">🚨</span>
              <div className="text-left">
                <div className="font-bold text-red-800 text-xl mb-1">Crisis Support Available 24/7</div>
                <div className="text-red-600 font-medium">Call (555) 123-HELP for immediate assistance</div>
                <div className="text-red-500 text-sm mt-1">Trained crisis counselors standing by</div>
              </div>
            </div>
          </div>*/}
        </div>
      </section>

      {/* Premium CTA Section */}
      <section className="py-24 lg:py-32 relative overflow-hidden">
        {/* Sophisticated Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-shrm-primary via-shrm-primary-dark to-shrm-primary">
          <div className="absolute inset-0 bg-gradient-to-r from-shrm-secondary/20 via-transparent to-shrm-secondary/10"></div>
          
          {/* Floating Elements */}
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-shrm-secondary/15 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-shrm-secondary/10 rounded-full blur-3xl animate-pulse-slow"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-float"></div>
          
          {/* Grid Pattern */}
          <div className="absolute inset-0 opacity-5">
            <div 
              className="w-full h-full"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.4'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                backgroundSize: '60px 60px'
              }}
            ></div>
          </div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center mb-20 animate-fade-in">
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-shrm-secondary/20 backdrop-blur-md border border-shrm-secondary/30 rounded-full text-shrm-secondary-light font-bold mb-10 shadow-lg">
              <span className="w-3 h-3 bg-shrm-secondary rounded-full animate-pulse"></span>
              Your Transformation Journey Begins Now
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-8xl font-black text-white mb-10 leading-tight">
              Ready to 
              <span className="block bg-gradient-to-r from-shrm-secondary via-shrm-secondary-light to-shrm-secondary bg-clip-text text-transparent bg-size-200 animate-gradient">
                Change Your Life?
              </span>
            </h2>
            
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-200 max-w-5xl mx-auto mb-16 leading-relaxed">
              Take the first courageous step toward healing, restoration, and lasting transformation. 
              Our dedicated team of Experienced professionals is ready to walk alongside you on this sacred journey.
            </p>
          </div>

          {/* Premium Action Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-20">
            {/* Consultation Card */}
            <div className="group relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-10 hover:bg-white/15 hover:border-white/30 transition-all duration-700 transform hover:-translate-y-2 hover:scale-105">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-shrm-secondary rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 group-hover:rotate-6 transition-all duration-500 shadow-xl">
                  📞
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">Schedule Your Consultation</h3>
                  <p className="text-gray-300 text-lg">Begin your personalized healing journey today</p>
                </div>
              </div>
              
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                Connect with one of our compassionate, Experienced therapists for a confidential consultation. 
                Together, we'll explore your unique needs and create a personalized pathway to healing and growth.
              </p>
              
              <Link
                to="/appointment"
                className="group/btn inline-flex items-center justify-center w-full py-5 bg-gradient-to-r from-shrm-secondary to-shrm-secondary-light hover:from-shrm-secondary-light hover:to-shrm-secondary text-shrm-primary font-bold text-lg rounded-2xl transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 shadow-2xl hover:shadow-shrm-secondary/30"
              >
                <span className="mr-2">🌟</span>
                Schedule Consultation
                <div className="ml-2 transition-transform duration-300 group-hover/btn:translate-x-1">→</div>
              </Link>
            </div>

            {/* Crisis Support Card */}
            <div className="group relative bg-white/10 backdrop-blur-xl border border-red-400/30 rounded-3xl p-10 hover:bg-red-500/10 hover:border-red-400/50 transition-all duration-700 transform hover:-translate-y-2 hover:scale-105">
              <div className="flex items-center gap-6 mb-8">
                <div className="w-20 h-20 bg-red-500 rounded-3xl flex items-center justify-center text-3xl group-hover:scale-110 transition-all duration-500 shadow-xl animate-glow">
                  🆘
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white mb-2">24/7 Crisis Support</h3>
                  <p className="text-red-200 text-lg">Immediate help when you need it most</p>
                </div>
              </div>
              
              <p className="text-gray-400 mb-8 text-lg leading-relaxed">
                If you're experiencing a mental health crisis, our trained crisis counselors are available around the clock 
                to provide immediate support, safety planning, and compassionate guidance.
              </p>
              
              <button className="group/btn inline-flex items-center justify-center w-full py-5 border-3 border-red-400 text-red-300 font-bold text-lg rounded-2xl hover:bg-red-500 hover:text-white hover:border-red-500 transition-all duration-500 transform hover:scale-105 hover:-translate-y-1 shadow-xl">
                <span className="mr-2 animate-pulse">🚨</span>
                Call Crisis Line: JA: 119, USA & CA: 911, or the emergency number in your country
              </button>
            </div>
          </div>

          {/* Trust & Credibility Section */}
          <div className="bg-white/8 backdrop-blur-xl border border-white/20 rounded-3xl p-10 lg:p-12 mb-16">
            <div className="text-center mb-12">
              <h3 className="text-3xl lg:text-4xl font-bold text-white mb-4">Why Families Trust SHRM</h3>
              <p className="text-gray-300 text-xl">Serving our community with excellence, compassion, and unwavering faith</p>
            </div>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
              {[
                { icon: "🏆", title: "Experienced", subtitle: "Professional Therapists", color: "text-shrm-secondary" },
                { icon: "✝️", title: "Faith-Based", subtitle: "Christian Counseling", color: "text-blue-400" },
                { icon: "🕒", title: "24/7", subtitle: "Crisis Support", color: "text-red-400" },
                { icon: "💝", title: "98%", subtitle: "Client Satisfaction", color: "text-pink-400" }
              ].map((item, index) => (
                <div key={index} className="text-center group align-center justify-center animate-slide-up">
                  <div className="text-5xl lg:text-6xl mb-4 group-hover:scale-125 group-hover:rotate-12 transition-all duration-500">
                    {item.icon}
                  </div>
                  <div className={`text-3xl lg:text-4xl font-black mb-2 ${item.color} group-hover:scale-110 transition-transform duration-300`}>
                    {item.title}
                  </div>
                  <div className="text-gray-300 font-medium text-sm lg:text-base">
                    {item.subtitle}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Services & Info */}
          <div className="text-center animate-slide-up">
            <p className="text-gray-400 text-xl mb-6">
              We mostly do telehealth counseling • Sliding scale fees available • In Person Counseling options
            </p>
            <div className="flex flex-wrap justify-center gap-8 text-gray-500 font-medium">
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-shrm-secondary rounded-full"></span>
                Safe Secure & Reliable
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-shrm-secondary rounded-full"></span>
                Evening & Weekend Hours
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-shrm-secondary rounded-full"></span>
                Your Wellness is Our Priority
              </span>
              <span className="flex items-center gap-2">
                <span className="w-2 h-2 bg-shrm-secondary rounded-full"></span>
                Family-Friendly Environment
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Services;