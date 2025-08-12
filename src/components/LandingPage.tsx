/**
 * Landing Page Component v8.1
 * 
 * Purpose: Main landing page with Meta Pixel CTA tracking.
 * 
 * Changes made:
 * - Added Meta Pixel CTA event tracking
 * - Integrated with form store for event management
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSwipeable } from 'react-swipeable';
import { Trophy, GraduationCap, Users, DollarSign, Award, BarChart3, BookOpen, Briefcase, CheckCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Header } from './Header';
import { useFormStore } from '@/store/formStore';
import { fireCTAClickEvent } from '@/lib/metaPixelEvents';

export default function LandingPage() {
  const navigate = useNavigate();
  const { addTriggeredEvents } = useFormStore();

  const handleScrollToForm = () => {
    // Fire Hero CTA event
    const ctaEvents = fireCTAClickEvent('hero');
    addTriggeredEvents(ctaEvents);
    
    navigate('/application-form');
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-grow pt-16 font-body">
        {/* Hero Section */}
        <section className="min-h-[90vh] bg-gradient-to-br from-gray-50 to-white flex items-center">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="animate-slide-up">
                <div className="flex items-center gap-2 mb-6">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-sm text-gray-600">Trustpilot Score: 4.6</span>
                </div>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary mb-6 font-sans leading-tight" style={{ fontDisplay: 'swap' }}>
                  Eyeing the <span className="underline decoration-accent decoration-4">best universities worldwide</span>?<br />
                  We'll make it happen.
                </h1>
                <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
                  We partner with exceptional Indian students, helping them achieve 7X higher acceptance rates at elite universities.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
                  <div className="text-center">
                    <GraduationCap className="w-10 h-10 text-accent mx-auto mb-2" />
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary/90 font-sans">620+</div>
                      <div className="text-xs text-gray-600">Ivy League Acceptances</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <Trophy className="w-10 h-10 text-accent mx-auto mb-2" />
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary/90 font-sans">100+</div>
                      <div className="text-xs text-gray-600">Admits to top 5 UK Universities</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <DollarSign className="w-10 h-10 text-accent mx-auto mb-2" />
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary/90 font-sans">$4Mn+</div>
                      <div className="text-xs text-gray-600">in Scholarships</div>
                    </div>
                  </div>
                  <div className="text-center">
                    <Award className="w-10 h-10 text-accent mx-auto mb-2" />
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary/90 font-sans">509</div>
                      <div className="text-xs text-gray-600">Top 30 Acceptances in 2024</div>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={handleScrollToForm}
                  className="hero-cta bg-accent text-primary px-8 py-4 rounded-lg text-lg font-semibold hover:bg-accent-light transition-all duration-300 shadow-md hover:shadow-lg"
                  data-cta="hero"
                >
                  Request an Evaluation
                </button>
              </div>
              <div className="relative animate-fade-in hidden md:block">
                <picture>
                  <source srcSet="/heroImage.webp" type="image/webp" />
                  <img
                    src="https://images.unsplash.com/photo-1543269664-56d93c1b41a6?w=800&q=80&fm=webp&fit=crop"
                    alt="Student studying"
                    width={800}
                    height={533}
                    fetchpriority="high"
                    className="rounded-lg shadow-2xl"
                  />
                </picture>
                <div className="absolute inset-0 rounded-lg bg-gradient-to-tr from-primary/20 to-transparent"></div>
              </div>
            </div>
          </div>
        </section>

        {/* Why Leading Families Choose Us */}
        <section id="why-us" className="py-20 bg-primary text-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="section-title !text-white mb-16">Why The Most Ambitious Families Choose Us</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
              <div className="text-center">
                <Users className="w-12 h-12 text-accent mx-auto mb-4" />
                <div className="text-2xl font-bold mb-2">150+</div>
                <div className="text-gray-100">Former Ivy League Admissions Officers as Counsellors</div>
              </div>
              <div className="text-center">
                <DollarSign className="w-12 h-12 text-accent mx-auto mb-4" />
                <div className="text-2xl font-bold mb-2">$4 Mn+</div>
                <div className="text-gray-100">Scholarships Secured</div>
              </div>
              <div className="text-center">
                <Briefcase className="w-12 h-12 text-accent mx-auto mb-4" />
                <div className="text-2xl font-bold mb-2">100%</div>
                <div className="text-gray-100">Guaranteed Research & Internship Placements</div>
              </div>
              <div className="text-center">
                <Award className="w-12 h-12 text-accent mx-auto mb-4" />
                <div className="text-2xl font-bold mb-2">99%</div>
                <div className="text-gray-100">Family Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* Proven Success Rates */}
        <section id="success-rates" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="section-title">Your Odds of Admission, Multiplied By 5X</h2>
            <p className="section-subtitle max-w-4xl mx-auto">Here's a comparison of the university selection rates of other students vs our students</p>
            
            <div className="mt-12">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {[
                  { name: 'Harvard', uni: '3 out of 100', our: '15 out of 100', multiplier: '4.3X' },
                  { name: 'MIT', uni: '4 out of 100', our: '21 out of 100', multiplier: '5.4X' },
                  { name: 'University of Chicago', uni: '5 out of 100', our: '28 out of 100', multiplier: '5.1X' },
                  { name: 'University of Pennsylvania', uni: '8 out of 100', our: '24 out of 100', multiplier: '3X' },
                ].map((school) => (
                  <div key={school.name} className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="font-bold text-lg mb-4">{school.name}</div>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">Other Students</span>
                          <span className="font-semibold">{school.uni}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-gray-400" style={{ width: `${parseInt(school.uni) * 3}%` }}></div>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-gray-600">Our Students</span>
                          <span className="font-semibold text-primary">{school.our}</span>
                        </div>
                        <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden">
                            <div className="h-full bg-accent" style={{ width: `${parseInt(school.our) * 3}%` }}></div>
                        </div>
                      </div>
                      <div className="mt-4 text-center">
                        <span className="inline-block bg-primary/10 text-primary px-4 py-2 rounded-full text-sm font-semibold">
                          {school.multiplier} Higher Success Rate
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* The Beacon House Blueprint */}
        <section id="process" className="py-20 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="section-title">The Beacon House Blueprint</h2>
            <p className="section-subtitle max-w-4xl mx-auto">Our methodology transforms exceptional students into global leaders</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              <div className="bg-white rounded-2xl p-10 shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] group">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:animate-bounce">
                  <BookOpen className="w-8 h-8 text-[#FFB800]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0a2342] mb-4">Insider Expertise</h3>
                <p className="text-gray-600 mb-6">Work directly with Former Admissions Officers who used to make admissions decisions at the top schools. Your application, guided by their insights.</p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#FFB800] mr-2 animate-fadeIn" />
                    150+ Former Admissions Officers from Ivy League and Top 5 UK Univs
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#FFB800] mr-2 animate-fadeIn delay-100" />
                    Personalised Application Strategy
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#FFB800] mr-2 animate-fadeIn delay-200" />
                    Benefit from Insider Insights & Experience
                  </li>
                </ul>
              </div>
              
              <div className="bg-white rounded-2xl p-10 shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] group">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:animate-bounce">
                  <Briefcase className="w-8 h-8 text-[#FFB800]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0a2342] mb-4">Exclusive Access</h3>
                <p className="text-gray-600 mb-6">Secure opportunities that less than 1% of applicants can access. Build a profile that stands out globally.</p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#FFB800] mr-2 animate-fadeIn" />
                    Do Research with US University faculty & Publish Your Work
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#FFB800] mr-2 animate-fadeIn delay-100" />
                    Silicon Valley Startup Internships
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#FFB800] mr-2 animate-fadeIn delay-200" />
                    Ivy League Writing Programs
                  </li>
                </ul>
              </div>
              
              <div className="bg-white rounded-2xl p-10 shadow-md hover:shadow-xl transition-all duration-300 hover:translate-y-[-4px] group">
                <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center mb-6 group-hover:animate-bounce">
                  <BarChart3 className="w-8 h-8 text-[#FFB800]" />
                </div>
                <h3 className="text-2xl font-bold text-[#0a2342] mb-4">Exceptional Outcomes</h3>
                <p className="text-gray-600 mb-6">Join a select group where extraordinary success is the norm, not the exception.</p>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#FFB800] mr-2 animate-fadeIn" />
                    97% Top-30 University Rate
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#FFB800] mr-2 animate-fadeIn delay-100" />
                    620+ Ivy League Acceptances
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-[#FFB800] mr-2 animate-fadeIn delay-200" />
                    ₹33+ Crore in Scholarships
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* What We Do */}
        <section id="services" className="py-20 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="section-title">What We Do</h2>
            <p className="section-subtitle">
              No matter your dream, we make it a reality. Our expert team of former admissions officers and graduate coaches will help you stand out and get admitted to a top university.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
              {[
                {
                  title: 'Academic Counseling',
                  description: 'Tailored advice to choose the right courses & help you excel academically.',
                  icon: GraduationCap
                },
                {
                  title: 'Test Preparation',
                  description: 'Expert coaching for standardized tests like the SAT, ACT, and others',
                  icon: BookOpen
                },
                {
                  title: 'Candidacy Building',
                  description: 'Strategies & execution to build a strong profile that stands out to admissions committees.',
                  icon: Trophy
                },
                {
                  title: 'Application Counseling',
                  description: 'Step-by-step guidance through the application process, including essay writing.',
                  icon: BarChart3
                },
                {
                  title: 'Interview Coaching',
                  description: 'Preparation and practice to ace university interviews.',
                  icon: Users
                }
              ].map((service, index) => (
                <div 
                  key={service.title}
                  className={cn(
                    "bg-white rounded-xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1",
                    "flex flex-col",
                    index === 4 && "md:col-span-2 lg:col-span-1 md:flex-row lg:flex-col md:items-center lg:items-start gap-6"
                  )}
                >
                  <div className="mb-6 md:mb-0">
                    <div className="w-14 h-14 bg-accent/10 rounded-xl flex items-center justify-center">
                      <service.icon className="w-8 h-8 text-accent" />
                    </div>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-primary mb-3">{service.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="relative py-24 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <picture>
              <source srcSet="/lastCTAsectionBG.webp" type="image/webp" />
              <img
                src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1200&q=80&fm=webp&fit=crop"
                alt="University Campus"
                width={1200}
                height={800}
                loading="lazy"
                className="w-full h-full object-cover brightness-[0.2]"
              />
            </picture>
          </div>
          <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 font-sans">
              Begin Your Journey to Excellence
            </h2>
            <p className="text-xl text-gray-200 mb-12 max-w-3xl mx-auto">
              Join a select group of students who consistently achieve exceptional outcomes.
            </p>
            <button 
              onClick={handleScrollToForm}
              className="bg-accent text-primary px-8 py-4 rounded-lg text-xl font-semibold hover:bg-accent-light transition-all duration-300 shadow-xl hover:shadow-2xl"
              data-cta="footer"
            >
              Request an Evaluation
            </button>
          </div>
        </section>
      </main>
      
      <footer className="bg-primary text-white py-6 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm">
            © {new Date().getFullYear()} Beacon House. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}