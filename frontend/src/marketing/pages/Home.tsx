import React from 'react';
import { Link } from 'react-router-dom';

// Image imports
import roadImg from '../components/images/road.png';
import mentalPersonImg from '../components/images/mental-person.png';
import marriageImg from '../components/images/marriage-counselor.jpg';
import familyImg from '../components/images/family-counseling.png';
import groupImg from '../components/images/christian-counseling.png';
import mentalHealthImg from '../components/images/Mental-health.jpg';

const Home: React.FC = () => {
  const services = [
    { title: 'Individual Counseling', description: 'Personal one-on-one sessions to address anxiety, depression, trauma, and personal growth.', img: mentalPersonImg, link: '/services#individual' },
    { title: 'Couples Counseling', description: 'Strengthen relationships through improved communication and conflict resolution.', img: marriageImg, link: '/services#couples' },
    { title: 'Family Therapy', description: 'Help families heal and restore healthy dynamics and relationships.', img: familyImg, link: '/services#family' },
    { title: 'Christian Counseling', description: 'Connect with others facing similar challenges in a supportive group environment.', img: groupImg, link: '/services#group' },
  ];

  const features = [
    { icon: '❤️', title: 'Faith-Based Approach', description: 'Our methods are rooted in Christian principles, offering guidance that aligns with your spiritual values.' },
    { icon: '👥', title: 'Licensed Professionals', description: 'Our team consists of experienced and certified counselors dedicated to your well-being.' },
    { icon: '🛡️', title: 'Confidential & Safe', description: 'We provide a secure and non-judgmental space for you to share and heal openly.' },
  ];

  const testimonials = [
    { quote: "Safe Haven was truly a blessing. Their guidance helped me navigate a difficult season with grace and strength.", author: "J. Doe, Individual Counseling" },
    { quote: "The couples counseling transformed our marriage. We learned to communicate and love each other in a whole new way.", author: "M. & S. Smith, Couples Counseling" },
    { quote: "I felt so alone, but the group sessions showed me I wasn't. Finding community here was a gift.", author: "A. Williams, Group Session" },
  ];

  const gettingStartedSteps = [
    { icon: '📞', number: '1', title: 'Initial Contact', description: 'Reach out to us via phone or our contact form for a free, confidential consultation.' },
    { icon: '📅', number: '2', title: 'Book Your Session', description: "We'll match you with the right counselor and schedule your first appointment at a convenient time." },
    { icon: '✓', number: '3', title: 'Begin Your Journey', description: 'Start your path toward healing and restoration in a supportive, faith-centered environment.' },
  ];

  return (
    <div className="bg-neutral-50 text-neutral-800">
      {/* Hero Section */}
      <section
        className="relative bg-cover bg-center text-white py-24 md:py-32"
        style={{ backgroundImage: `url(${roadImg})` }}
      >
        <div className="absolute inset-0 bg-shrm-primary bg-opacity-30"></div>
        <div className="relative container mx-auto px-6 text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-bold font-display text-shrm-secondary mb-4" style={{ textShadow: '2px 2px 8px rgba(0,0,0,0.6)' }}>
            Hope, Healing, and Restoration
          </h1>
          <p className="text-lg md:text-xl text-neutral-100 max-w-3xl mx-auto mb-8">
            Providing compassionate, professional, and faith-based counseling to help you navigate life's challenges.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link to="/request-appointment" className="bg-shrm-secondary text-shrm-primary font-bold py-3 px-8 rounded-full hover:bg-yellow-300 transition-transform transform hover:scale-105 shadow-lg">
             Get Started Today
            </Link>
            <Link to="/about" className="bg-transparent border-2 border-white text-white font-bold py-3 px-8 rounded-full hover:bg-white hover:text-shrm-primary transition-all shadow-lg">
              Learn More
            </Link>
          </div>
        </div>
      </section>

      {/* Introduction Section */}
      <section className="py-16 md:py-15 bg-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-shrm-primary mb-4 font-display">Your Safe Haven for Growth and Healing</h2>
          <p className="max-w-3xl mx-auto text-neutral-600 text-lg">
            At Safe Haven Restoration Ministries, we integrate proven psychological principles with timeless biblical wisdom. We believe true healing encompasses mind, body, and spirit, and we are here to walk alongside you on your journey to wholeness.
          </p>
        </div>
      </section>

      {/* Family Counseling Section with Image */}
      <section className="py-10 md:py-10 bg-neutral-100">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-1 md:order-1">
              <h2 className="text-3xl md:text-4xl font-bold text-shrm-primary mb-6 font-display">
                Family Counseling: Restoring Harmony and Connection
              </h2>
              <p className="text-neutral-600 text-lg mb-4">
                Family is the foundation of our lives, but even the strongest families face challenges. Whether you're dealing with 
                communication breakdowns, parenting struggles, blended family dynamics, or multigenerational conflicts, our family 
                counseling services provide a safe space for healing and restoration.
              </p>
              
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-shrm-secondary">👨‍👩‍👧‍👦</span>
                  <p className="text-neutral-700">Improve communication and resolve conflicts peacefully</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-shrm-secondary">💞</span>
                  <p className="text-neutral-700">Strengthen emotional bonds and rebuild trust</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-shrm-secondary">🏠</span>
                  <p className="text-neutral-700">Create a healthier, more harmonious home environment</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-shrm-secondary">🌱</span>
                  <p className="text-neutral-700">Develop effective parenting strategies and family routines</p>
                </div>
              </div>
              <Link 
                to="/services#family" 
                className="inline-block bg-shrm-primary text-white font-bold py-3 px-8 rounded-full hover:bg-shrm-primary-dark transition-transform transform hover:scale-105 shadow-lg"
              >
                Learn More About Family Therapy
              </Link>
            </div>
            <div className="order-2 md:order-2">
              <img 
                src={familyImg} 
                alt="Family Counseling - Restoring Relationships" 
                className="w-full rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us Section */}
      <section className="py-16 md:py-15 bg-neutral-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-shrm-primary font-display">Why Choose SHRM?</h2>
            <p className="text-neutral-600 mt-2 text-lg">A partner you can trust on your spiritual and mental wellness journey.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white p-8 rounded-xl shadow-soft text-center transform hover:-translate-y-2 transition-transform duration-300">
                <div className="text-6xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-bold text-shrm-primary mb-2">{feature.title}</h3>
                <p className="text-neutral-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Overview */}
      <section className="py-16 md:py-15 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-shrm-primary font-display">Our Counseling Services</h2>
            <p className="text-neutral-600 mt-2 text-lg">Specialized support for every stage of life.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {services.map((service, index) => (
              <div key={index} className="bg-white rounded-xl shadow-soft overflow-hidden group transform hover:-translate-y-2 transition-transform duration-300">
                <img src={service.img} alt={service.title} className="w-full h-48 object-cover" />
                <div className="p-6">
                  <h3 className="text-xl font-bold text-shrm-primary mb-2">{service.title}</h3>
                  <p className="text-neutral-600 mb-4">{service.description}</p>
                  <Link to={service.link} className="font-semibold text-shrm-primary hover:text-shrm-secondary transition-colors">
                    Learn More &rarr;
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 md:py-15 bg-shrm-primary text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-shrm-secondary">Words from Our Community</h2>
            <p className="text-neutral-300 mt-2 text-lg">Discover how we've made a difference in the lives of others.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-shrm-primary-light p-8 rounded-xl shadow-lg border border-shrm-primary-dark">
                <p className="text-neutral-200 italic mb-4">"{testimonial.quote}"</p>
                <p className="font-bold text-shrm-secondary text-right">- {testimonial.author}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Getting Started Section */}
      <section className="py-16 md:py-15 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-shrm-primary font-display">Ready to Begin Your Journey?</h2>
            <p className="text-neutral-600 mt-2 text-lg">Taking the first step is simple. Here's how it works.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 text-center">
            {gettingStartedSteps.map((step, index) => (
              <div key={index} className="p-6">
                <div className="text-5xl mb-4">{step.icon}</div>
                <h3 className="text-xl font-bold text-shrm-primary mb-2">{step.title}</h3>
                <p className="text-neutral-600">{step.description}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-12">
            <Link to="/contact" className="bg-shrm-primary text-white font-bold py-3 px-8 rounded-full hover:bg-shrm-primary-dark transition-transform transform hover:scale-105 shadow-lg">
              Contact Us Today
            </Link>
          </div>
        </div>
      </section>

      {/* Mental Health Awareness Section with Image */}
      <section className="py-16 md:py-10 bg-neutral-100">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="order-2 md:order-1">
              <img 
                src={mentalHealthImg} 
                alt="Mental Health and Wellness" 
                className="w-full rounded-2xl shadow-2xl transform hover:scale-105 transition-transform duration-300"
              />
            </div>
            <div className="order-1 md:order-2">
              <h2 className="text-3xl md:text-4xl font-bold text-shrm-primary mb-6 font-display">
                Understanding Mental Health & Spiritual Wellness
              </h2>
              <p className="text-neutral-600 text-lg mb-4">
                Mental health is not just the absence of mental illness—it's a state of well-being where you realize your abilities, 
                cope with normal life stresses, work productively, and contribute to your community.
              </p>
              <p className="text-neutral-600 text-lg mb-4">
                At SHRM, we recognize that mental health and spiritual health are deeply interconnected. Our approach addresses both 
                aspects, helping you find balance, peace, and purpose in your life through faith-informed therapeutic practices.
              </p>
              <div className="space-y-3 mb-6">
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-shrm-secondary">✓</span>
                  <p className="text-neutral-700">Evidence-based therapeutic techniques combined with biblical wisdom</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-shrm-secondary">✓</span>
                  <p className="text-neutral-700">Compassionate care that honors your faith journey</p>
                </div>
                <div className="flex items-start gap-3">
                  <span className="text-2xl text-shrm-secondary">✓</span>
                  <p className="text-neutral-700">Holistic healing for mind, body, and spirit</p>
                </div>
              </div>
              <Link 
                to="/about" 
                className="inline-block bg-shrm-primary text-white font-bold py-3 px-8 rounded-full hover:bg-shrm-primary-dark transition-transform transform hover:scale-105 shadow-lg"
              >
                Discover Our Approach
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Common Issues We Address */}
      <section className="py-16 md:py-15 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-shrm-primary font-display">Common Challenges We Help With</h2>
            <p className="text-neutral-600 mt-2 text-lg max-w-3xl mx-auto">
              Life presents many challenges. You don't have to face them alone. Our experienced counselors are here to help.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-neutral-50 p-6 rounded-xl border-l-4 border-shrm-secondary hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-shrm-primary mb-2">😔 Anxiety & Depression</h3>
              <p className="text-neutral-600 text-sm">
                Find relief from overwhelming worry, panic attacks, persistent sadness, and loss of interest in life.
              </p>
            </div>
            <div className="bg-neutral-50 p-6 rounded-xl border-l-4 border-shrm-secondary hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-shrm-primary mb-2">💔 Relationship Issues</h3>
              <p className="text-neutral-600 text-sm">
                Rebuild trust, improve communication, resolve conflicts, and strengthen your marriage or partnership.
              </p>
            </div>
            <div className="bg-neutral-50 p-6 rounded-xl border-l-4 border-shrm-secondary hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-shrm-primary mb-2">🌪️ Trauma & PTSD</h3>
              <p className="text-neutral-600 text-sm">
                Process past traumas, overcome PTSD symptoms, and develop healthy coping mechanisms for healing.
              </p>
            </div>
            <div className="bg-neutral-50 p-6 rounded-xl border-l-4 border-shrm-secondary hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-shrm-primary mb-2">⚖️ Life Transitions</h3>
              <p className="text-neutral-600 text-sm">
                Navigate major life changes like job loss, divorce, grief, relocation, or identity struggles with grace.
              </p>
            </div>
            <div className="bg-neutral-50 p-6 rounded-xl border-l-4 border-shrm-secondary hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-shrm-primary mb-2">👨‍👩‍👧 Family Conflict</h3>
              <p className="text-neutral-600 text-sm">
                Restore harmony, improve parent-child relationships, and create healthier family dynamics.
              </p>
            </div>
            <div className="bg-neutral-50 p-6 rounded-xl border-l-4 border-shrm-secondary hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-shrm-primary mb-2">🍷 Addiction & Recovery</h3>
              <p className="text-neutral-600 text-sm">
                Break free from substance abuse, behavioral addictions, and find lasting recovery through faith.
              </p>
            </div>
            <div className="bg-neutral-50 p-6 rounded-xl border-l-4 border-shrm-secondary hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-shrm-primary mb-2">😰 Stress Management</h3>
              <p className="text-neutral-600 text-sm">
                Learn effective strategies to manage workplace stress, burnout, and overwhelming responsibilities.
              </p>
            </div>
            <div className="bg-neutral-50 p-6 rounded-xl border-l-4 border-shrm-secondary hover:shadow-lg transition-shadow">
              <h3 className="text-lg font-bold text-shrm-primary mb-2">🙏 Faith & Spiritual Struggles</h3>
              <p className="text-neutral-600 text-sm">
                Explore doubts, spiritual crises, and find deeper meaning and connection with your faith.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-16 md:py-10 bg-shrm-primary text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold font-display text-shrm-secondary mb-4">Making a Difference, One Life at a Time</h2>
            <p className="text-neutral-200 text-lg max-w-2xl mx-auto">
              Our commitment to excellence and compassionate care has helped countless individuals and families find hope and healing.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-8 text-center">
            <div className="bg-shrm-primary-light p-8 rounded-xl border border-shrm-primary-dark">
              <div className="text-5xl font-bold text-shrm-secondary mb-2">500+</div>
              <p className="text-neutral-200 text-lg">Lives Transformed</p>
            </div>
            <div className="bg-shrm-primary-light p-8 rounded-xl border border-shrm-primary-dark">
              <div className="text-5xl font-bold text-shrm-secondary mb-2">15+</div>
              <p className="text-neutral-200 text-lg">Years of Experience</p>
            </div>
            <div className="bg-shrm-primary-light p-8 rounded-xl border border-shrm-primary-dark">
              <div className="text-5xl font-bold text-shrm-secondary mb-2">98%</div>
              <p className="text-neutral-200 text-lg">Client Satisfaction</p>
            </div>
            <div className="bg-shrm-primary-light p-8 rounded-xl border border-shrm-primary-dark">
              <div className="text-5xl font-bold text-shrm-secondary mb-2">24/7</div>
              <p className="text-neutral-200 text-lg">Crisis Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* What to Expect Section */}
      <section className="py-16 md:py-24 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-shrm-primary font-display">What to Expect in Your First Session</h2>
            <p className="text-neutral-600 mt-2 text-lg">
              We understand that starting counseling can feel intimidating. Here's what your first visit will look like.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex gap-4 items-start bg-neutral-50 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <div className="flex-shrink-0 w-14 h-14 bg-shrm-secondary text-shrm-primary rounded-full flex items-center justify-center font-bold text-2xl">
                1
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-shrm-primary mb-2">Welcome & Paperwork</h3>
                <p className="text-neutral-600">
                  You'll complete intake forms covering your medical history, current concerns, and counseling goals. 
                  We'll ensure you feel comfortable and answer any questions you have.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start bg-neutral-50 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <div className="flex-shrink-0 w-14 h-14 bg-shrm-secondary text-shrm-primary rounded-full flex items-center justify-center font-bold text-2xl">
                2
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-shrm-primary mb-2">Getting to Know You</h3>
                <p className="text-neutral-600">
                  Your counselor will ask about what brought you in, your background, relationships, and what you hope 
                  to achieve through counseling. This is a judgment-free conversation.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start bg-neutral-50 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <div className="flex-shrink-0 w-14 h-14 bg-shrm-secondary text-shrm-primary rounded-full flex items-center justify-center font-bold text-2xl">
                3
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-shrm-primary mb-2">Creating Your Treatment Plan</h3>
                <p className="text-neutral-600">
                  Together, you'll develop a personalized plan outlining your goals, the approaches we'll use, 
                  and the frequency of sessions. You're in control of your healing journey.
                </p>
              </div>
            </div>
            <div className="flex gap-4 items-start bg-neutral-50 p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow">
              <div className="flex-shrink-0 w-14 h-14 bg-shrm-secondary text-shrm-primary rounded-full flex items-center justify-center font-bold text-2xl">
                4
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold text-shrm-primary mb-2">Next Steps & Scheduling</h3>
                <p className="text-neutral-600">
                  Before you leave, we'll schedule your next appointment and provide any resources or homework 
                  to help you start making positive changes right away.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 md:py-24 bg-neutral-100">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-shrm-primary font-display">Frequently Asked Questions</h2>
            <p className="text-neutral-600 mt-2 text-lg">Get answers to common questions about our counseling services.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border-t-4 border-shrm-secondary">
              <h3 className="text-lg font-bold text-shrm-primary mb-3 flex items-center gap-2">
                <span className="text-2xl">💰</span>
                Do you accept insurance?
              </h3>
              <p className="text-neutral-600">
                No! We Do not accept insurance at this time. We offer a wide range of plans. We also offer flexible payment options and sliding scale fees
                based on your needs. Contact us for more information.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border-t-4 border-shrm-secondary">
              <h3 className="text-lg font-bold text-shrm-primary mb-3 flex items-center gap-2">
                <span className="text-2xl">⏰</span>
                How long are sessions?
              </h3>
              <p className="text-neutral-600">
                Individual sessions typically last 45-60 minutes. Couples and family sessions may run 50-90 minutes. 
                The frequency of sessions depends on your needs and goals.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border-t-4 border-shrm-secondary">
              <h3 className="text-lg font-bold text-shrm-primary mb-3 flex items-center gap-2">
                <span className="text-2xl">🤐</span>
                Is counseling confidential?
              </h3>
              <p className="text-neutral-600">
                Absolutely. Everything you share is strictly confidential, with rare exceptions required by law (such as 
                imminent danger to self or others). Your privacy and trust are paramount to us.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border-t-4 border-shrm-secondary">
              <h3 className="text-lg font-bold text-shrm-primary mb-3 flex items-center gap-2">
                <span className="text-2xl">💻</span>
                Do you offer online counseling?
              </h3>
              <p className="text-neutral-600">
                Yes! We offer secure telehealth sessions via video call for those who prefer online counseling or 
                cannot visit our office in person. It's convenient, private, and just as effective.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border-t-4 border-shrm-secondary">
              <h3 className="text-lg font-bold text-shrm-primary mb-3 flex items-center gap-2">
                <span className="text-2xl">📖</span>
                Do I need to be Christian?
              </h3>
              <p className="text-neutral-600">
                Not at all! While our approach is informed by Christian values, we welcome clients of all faiths and 
                backgrounds. We respect your beliefs and tailor our approach to what feels right for you.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-md hover:shadow-xl transition-shadow border-t-4 border-shrm-secondary">
              <h3 className="text-lg font-bold text-shrm-primary mb-3 flex items-center gap-2">
                <span className="text-2xl">⏳</span>
                How long does counseling take?
              </h3>
              <p className="text-neutral-600">
                It varies by individual and the issues being addressed. Some see improvement in 8-12 sessions, while 
                others benefit from longer-term support. You and your counselor will regularly assess progress together.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="py-16 md:py-15 bg-gradient-to-br from-shrm-primary to-shrm-primary-dark text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-5xl font-bold font-display text-shrm-secondary mb-6">
            Your Journey to Healing Starts Today
          </h2>
          <p className="text-lg md:text-xl text-neutral-100 max-w-3xl mx-auto mb-8">
            Don't wait to get the support you deserve. Whether you're struggling with anxiety, relationship issues, 
            or simply need someone to talk to, we're here to help you find hope and restoration.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            <Link 
              to="/request-appointment" 
              className="bg-shrm-secondary text-shrm-primary font-bold py-4 px-10 rounded-full hover:bg-yellow-300 transition-transform transform hover:scale-105 shadow-2xl text-lg"
            >
              Schedule Your Consultation
            </Link>
            <a 
              href="tel:555-123-4567" 
              className="bg-transparent border-2 border-shrm-secondary text-shrm-secondary font-bold py-4 px-10 rounded-full hover:bg-shrm-secondary hover:text-shrm-primary transition-all shadow-2xl text-lg"
            >
              📞 Call Us Now
            </a>
          </div>
          <p className="text-neutral-200 mt-6 text-sm">
            💬 SHRM helping you get back to your best self  • All Sessions Confidential • Flexible Payment Options
          </p>
        </div>
      </section>

    </div>
  );
};

export default Home;