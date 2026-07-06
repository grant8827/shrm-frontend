import React from 'react';
import mentalHealthImg from '../components/images/Mental-health.jpg';
import christianCounselingImg from '../components/images/christian-counseling.png';

const About: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-shrm-primary to-shrm-primary-dark text-white py-24 px-4">
        <div className="absolute inset-0 bg-black/10"></div>
        <div className="relative max-w-7xl mx-auto text-center flex flex-col items-center justify-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-shrm-secondary animate-fade-in">
            About Safe Haven Restoration Ministries
          </h1>
          <p className="text-xl md:text-2xl text-gray-100 max-w-3xl mx-auto animate-slide-up">
            Bringing Hope, Healing, and Restoration Through Christ-Centered Care
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-16">
        {/* Mission Section */}
        <section className="w-full mb-20 animate-slide-up">
          <div className="bg-white flex rounded-3xl shadow-xl overflow-hidden mx-auto">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="p-8 md:p-12 flex flex-col items-center md:items-start text-center md:text-left">
                <div className="inline-block px-4 py-2 bg-shrm-secondary/10 rounded-full mb-4">
                  <span className="text-shrm-secondary font-semibold text-sm">OUR MISSION</span>
                </div>
                <h2 className="text-4xl font-bold text-shrm-primary mb-6">
                  Dedicated to Your Healing Journey
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Safe Haven Restoration Ministries is dedicated to providing professional, 
                  compassionate Christian counseling services that integrate faith and psychology.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  We believe in the healing power of Christ and the importance of evidence-based 
                  therapeutic approaches to bring lasting transformation to your life.
                </p>
              </div>
              <div className="h-64 md:h-full">
                <img 
                  src={mentalHealthImg} 
                  alt="Mental Health Support" 
                  className="w-full h-full object-cover"
                />
              </div>
            </div>
          </div>
        </section>

        {/* Vision Section */}
        <section className="mb-20 animate-slide-up">
          <div className="bg-gradient-to-br from-shrm-secondary/5 to-shrm-primary/5 rounded-3xl p-8 md:p-12 border border-shrm-secondary/20">
            <div className="max-w-4xl mx-auto text-center">
              <div className="inline-block px-4 py-2 bg-shrm-primary text-shrm-secondary rounded-full mb-4">
                <span className="font-semibold text-sm">OUR VISION</span>
              </div>
              <h2 className="text-4xl font-bold text-shrm-primary mb-6">
                A Beacon of Hope and Healing
              </h2>
              <p className="text-xl text-gray-700 leading-relaxed">
                To be a beacon of hope and healing in our community, where individuals, couples, 
                and families can find restoration, wholeness, and renewed purpose through 
                Christ-centered counseling.
              </p>
            </div>
          </div>
        </section>

        {/* Core Values Section */}
        <section className="mb-20 animate-fade-in">
          <div className="text-center mb-12 flex flex-col items-center">
            <div className="inline-block px-4 py-2 bg-shrm-secondary/10 rounded-full mb-4">
              <span className="text-shrm-secondary font-semibold text-sm">WHAT GUIDES US</span>
            </div>
            <h2 className="text-4xl font-bold text-shrm-primary mb-4">Our Core Values</h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              These principles guide everything we do and every life we touch
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-shrm-primary to-shrm-primary-dark rounded-xl flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform duration-300">
                💚
              </div>
              <h3 className="text-2xl w-[250px] font-bold text-shrm-primary mb-3">Compassion</h3>
              <p className="text-gray-600 leading-relaxed">
                We approach every client with empathy, understanding, and genuine care.
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-shrm-secondary to-shrm-secondary-dark rounded-xl flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform duration-300">
                ⚖️
              </div>
              <h3 className="text-2xl font-bold text-shrm-primary mb-3">Integrity</h3>
              <p className="text-gray-600 leading-relaxed">
                We maintain the highest ethical standards in all our professional practices.
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-shrm-primary to-shrm-secondary rounded-xl flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform duration-300">
                ✝️
              </div>
              <h3 className="text-2xl font-bold text-shrm-primary mb-3">Faith</h3>
              <p className="text-gray-600 leading-relaxed">
                We integrate Christian principles with proven therapeutic methods.
              </p>
            </div>

            <div className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 border border-gray-100 flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-shrm-secondary to-shrm-primary rounded-xl flex items-center justify-center mb-4 text-3xl group-hover:scale-110 transition-transform duration-300">
                ⭐
              </div>
              <h3 className="text-2xl font-bold text-shrm-primary mb-3">Excellence</h3>
              <p className="text-gray-600 leading-relaxed">
                We strive for the highest quality of care in all our services.
              </p>
            </div>
          </div>
        </section>

        {/* Team Section */}
        <section className="animate-slide-up">
          <div className="bg-white rounded-3xl shadow-xl overflow-hidden">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="h-64 md:h-full order-2 md:order-1">
                <img 
                  src={christianCounselingImg} 
                  alt="Our Professional Team" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-8 md:p-12 order-1 md:order-2">
                <div className="inline-block px-4 py-2 bg-shrm-primary/10 rounded-full mb-4">
                  <span className="text-shrm-primary font-semibold text-sm">OUR TEAM</span>
                </div>
                <h2 className="text-4xl font-bold text-shrm-primary mb-6">
                  Experienced, Faith-Based Professional Counselors
                </h2>
                <p className="text-lg text-gray-700 leading-relaxed mb-4">
                  Our team consists of experienced, faith-based professional counselors who are committed to 
                  both their faith and their profession.
                </p>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Each counselor brings years of experience and specialized training to serve 
                  our diverse community needs with compassion and excellence.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <span className="px-4 py-2 bg-shrm-secondary/10 text-shrm-primary rounded-full text-sm font-medium">
                    Faith-Based Counselors
                  </span>
                  <span className="px-4 py-2 bg-shrm-secondary/10 text-shrm-primary rounded-full text-sm font-medium">
                    Trained Professionals
                  </span>
                  <span className="px-4 py-2 bg-shrm-secondary/10 text-shrm-primary rounded-full text-sm font-medium">
                    Experienced Therapists
                  </span>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default About;