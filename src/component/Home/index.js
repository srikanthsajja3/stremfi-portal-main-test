import { Link } from "react-router-dom";
import { useState } from "react";
import { ASSET_BASE_URL } from "../../config/env";
import "./index.css";

const Home = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState(null);

  // Contact form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });
  const [formStatus, setFormStatus] = useState({
    submitted: false,
    error: false,
    message: "",
  });

  const features = [
    {
      title: "Entertainment",
      desc: "Watch premium TV channels, movies and exclusive content anytime, anywhere.",
      img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=600&q=80",
    },
    {
      title: "OTT Integration",
      desc: "Access multiple OTT platforms seamlessly through our unified ecosystem.",
      img: "https://www.contus.com/blog/wp-content/uploads/2022/03/banner-image-41.4-01.png",
    },
    {
      title: "Smart Devices",
      desc: "Supported on Android TV, Mobile, LG webOS, Samsung TV and Fire TV Stick.",
      img: "https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=600&q=80",
    },
    {
      title: "High Performance",
      desc: "Lightning-fast streaming with optimized playback and buffer-free experience.",
      img: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600&q=80",
    },
    {
      title: "Enterprise Security",
      desc: "Bank-grade encryption, secure authentication, and comprehensive device management.",
      img: "https://images.unsplash.com/photo-1563986768609-322da13575f3?w=600&q=80",
    },
    {
      title: "Operator Dashboard",
      desc: "Comprehensive management suite for operators and cable providers to manage customers.",
      img: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&q=80",
    },
  ];

  const plans = [
    {
      name: "Basic",
      price: "₹199",
      period: "/month",
      features: ["200+ Live TV Channels", "HD Quality"],
      popular: false,
    },
    {
      name: "Premium",
      price: "₹399",
      period: "/month",
      features: ["250+ Live TV Channels", "Full HD", "OTT Apps Included"],
      popular: true,
    },
    {
      name: "Family",
      price: "₹699",
      period: "/month",
      features: ["300+ Live TV Channels", "4K HDR Quality", "Maximum OTT Platforms", "Kids Profile"],
      popular: false,
    },
  ];

  const faqs = [
    {
      q: "What is StremFi?",
      a: "StremFi is a next-generation connectivity and entertainment platform, offering premium Internet, Pioneer IPTV, and comprehensive operator management solutions.",
    },
    {
      q: "Which devices are supported?",
      a: "StremFi supports Android TV, iOS & Android Mobile, LG webOS, Samsung Tizen TV, Amazon Fire TV Stick, and web browsers.",
    },
    {
      q: "Can operators and cable providers partner with StremFi?",
      a: "Absolutely. StremFi offers a comprehensive operator dashboard that enables cable providers to manage customers, subscriptions, and content delivery efficiently.",
    },
    {
      q: "How secure is my account?",
      a: "We implement bank-grade 256-bit encryption, two-factor authentication, and device-level security to ensure your account and data remain completely protected.",
    },
  ];

  const devices = [
    { name: "Android TV", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSFJpxZ6DIlV_B19L5VmED9ZNkHAkiwmkI5_g&s" },
    { name: "Mobile", img: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&q=80" },
  ];

  const devices2 = [
    { name: "Fire TV", img: "https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400&q=80" },
    { name: "LG webOS", img: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTh8LVrlnzhImS7l5ldbnvQlD3C7J1pNtphCw&s" },
    { name: "Samsung TV", img: "https://images.unsplash.com/photo-1461151304267-38535e780c79?w=400&q=80" },
  ];

  const educationFeatures = [
    "Student Admission Management",
    "Attendance Tracking",
    "Fee Collection & Reports",
    "Exam & Result Management",
    "Parent & Teacher Portal",
    "Transport Management",
    "Library Management",
    "SMS & WhatsApp Notifications",
  ];

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Basic validation
    if (!formData.name || !formData.email || !formData.message) {
      setFormStatus({
        submitted: false,
        error: true,
        message: "Please fill in all required fields.",
      });
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setFormStatus({
        submitted: false,
        error: true,
        message: "Please enter a valid email address.",
      });
      return;
    }

    // Simulate form submission (replace with actual API call)
    setTimeout(() => {
      setFormStatus({
        submitted: true,
        error: false,
        message: "Thank you for contacting us! We'll get back to you within 24 hours.",
      });
      
      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    }, 1000);
  };

  return (
    <div className="vrplay-home-page">

      {/* ── NAVBAR ───────────────────────────────────────── */}
      <header className={`vrplay-navbar ${isMenuOpen ? "vrplay-menu-open" : ""}`}>
        <div className="vrplay-navbar-container">
          <a href="#hero" className="vrplay-logo-wrapper">
            <img src="/stremfi-logo.png" alt="StremFi Logo" className="vrplay-logo-img" />
          </a>

          <nav className="vrplay-nav-links">
            <a href="#features" className="vrplay-nav-link">Features</a>
            <a href="#plans" className="vrplay-nav-link">Plans</a>
            <a href="#operator" className="vrplay-nav-link">Operators</a>
            <a href="#education" className="vrplay-nav-link">Education ERP</a>
            <a href="#faq" className="vrplay-nav-link">FAQ</a>
            <a href="#contact" className="vrplay-nav-link">Contact</a>
            <a href="https://vrplay.in/privacy-policy.html" className="vrplay-nav-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
            <a href="https://vrplay.in/terms-and-conditions.html" className="vrplay-nav-link" target="_blank" rel="noopener noreferrer">Terms of Service</a>
          </nav>

          <div className="vrplay-desktop-cta">
            <Link to="/login" className="vrplay-login-btn">Login</Link>
          </div>

          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="vrplay-mobile-menu-btn"
            aria-label="Toggle menu"
          >
            <span className={`vrplay-hamburger ${isMenuOpen ? "vrplay-active" : ""}`}>
              <span></span><span></span><span></span>
            </span>
          </button>
        </div>

        <div className={`vrplay-mobile-menu ${isMenuOpen ? "vrplay-open" : ""}`}>
          <a href="#features" className="vrplay-mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Features</a>
          <a href="#plans" className="vrplay-mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Plans</a>
          <a href="#operator" className="vrplay-mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Operators</a>
          <a href="#education" className="vrplay-mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Education ERP</a>
          <a href="#faq" className="vrplay-mobile-nav-link" onClick={() => setIsMenuOpen(false)}>FAQ</a>
          <a href="#contact" className="vrplay-mobile-nav-link" onClick={() => setIsMenuOpen(false)}>Contact</a>
          <a href="https://vrplay.in/privacy-policy.html" className="vrplay-mobile-nav-link" target="_blank" rel="noopener noreferrer">Privacy Policy</a>
          <a href="https://vrplay.in/terms-and-conditions.html" className="vrplay-mobile-nav-link" target="_blank" rel="noopener noreferrer">Terms of Service</a>
          <Link to="/login" className="vrplay-mobile-login-btn" onClick={() => setIsMenuOpen(false)}>
            Login to StremFi
          </Link>
        </div>
      </header>

      {/* ── HERO ─────────────────────────────────────────── */}
      <section className="vrplay-hero"  id="hero">
        {/* background image */}
        <div className="vrplay-hero-bg">
          <img
            src="https://www.vplayed.com/blog/wp-content/uploads/2022/05/banner-image-47-02.png"
            alt="Cinema background"
            className="vrplay-hero-bg-img"
          />
          <div className="vrplay-hero-bg-gradient"></div>
        </div>

        <div className="vrplay-hero-content">
          <div className="vrplay-hero-inner">
            <div className="vrplay-hero-badge">
              <span className="vrplay-badge-dot"></span>
              <span className="vrplay-badge-text">TV · OTT · WiFi · Phone</span>
            </div>

            <h1 className="vrplay-hero-title">
              Premium{" "}
              <span className="vrplay-text-gradient">Entertainment</span>
              <br className="vrplay-hero-br" />
              Smart Connectivity.
              <br className="vrplay-hero-br" />
              One Platform.
            </h1>

            <p className="vrplay-hero-description">
              Experience the future of connectivity and entertainment with StremFi — premium content,
              seamless streaming, and powerful operator tools all in one place.
            </p>

            <div className="vrplay-hero-buttons">
              <Link to="/login" className="vrplay-btn-primary">
                Get Started <span className="vrplay-btn-arrow">→</span>
              </Link>
              <a href="#plans" className="vrplay-btn-secondary">View Plans</a>
            </div>

            <div className="vrplay-hero-stats">
              <div className="vrplay-stat-item">
                <div className="vrplay-stat-value">10K+</div>
                <div className="vrplay-stat-label">Active Users</div>
              </div>
              <div className="vrplay-stat-divider"></div>
              <div className="vrplay-stat-item">
                <div className="vrplay-stat-value">200+</div>
                <div className="vrplay-stat-label">TV Channels</div>
              </div>
              <div className="vrplay-stat-divider"></div>
              <div className="vrplay-stat-item">
                <div className="vrplay-stat-value">99.9%</div>
                <div className="vrplay-stat-label">Uptime</div>
              </div>
            </div>
          </div>
        </div>

        {/* hero scroll cue */}
        <div className="vrplay-hero-scroll-cue">
          <span></span>
        </div>
      </section>

      {/* ── ABOUT ────────────────────────────────────────── */}
      <section className="vrplay-about-section">
        <div className="vrplay-container vrplay-about-inner">
          <div className="vrplay-about-text">
            <span className="vrplay-section-eyebrow">Who We Are</span>
            <h2 className="vrplay-section-title">
              About <span className="vrplay-text-gradient">StremFi</span>
            </h2>
            <p className="vrplay-about-desc">
              SD Technologies is a technology-driven company providing innovative digital
              solutions across multiple industries. Through StremFi, we deliver premium
              IPTV, OTT integration, smart connectivity, and operator management
              solutions. In addition, we offer a comprehensive School Management
              Software platform that helps educational institutions streamline
              admissions, attendance, fee management, examinations, communication,
              and administration from a single dashboard.
            </p>
            <Link to="/login" className="vrplay-btn-primary vrplay-about-cta">
              Explore Platform <span className="vrplay-btn-arrow">→</span>
            </Link>
          </div>
          <div className="vrplay-about-image-grid">
            <img
              src="https://images.unsplash.com/photo-1522869635100-9f4c5e86aa37?w=700&q=80"
              alt="Streaming setup"
              className="vrplay-about-img vrplay-about-img-main"
            />
            <img
              src={`${ASSET_BASE_URL}/vrtv.png`}
              alt="Smart TV"
              className="vrplay-about-img vrplay-about-img-accent"
            />
          </div>
        </div>
      </section>

      {/* ── FEATURES ─────────────────────────────────────── */}
      <section id="features" className="vrplay-section vrplay-features-section">
        <div className="vrplay-container">
          <div className="vrplay-section-header">
            <span className="vrplay-section-eyebrow">What We Offer</span>
            <h2 className="vrplay-section-title">Powerful Features</h2>
            <p className="vrplay-section-subtitle">Everything you need for an exceptional entertainment experience</p>
          </div>

          <div className="vrplay-features-grid">
            {features.map((feature, index) => (
              <div key={index} className="vrplay-feature-card">
                <div className="vrplay-feature-card-img-wrap">
                  <img src={feature.img} alt={feature.title} className="vrplay-feature-card-img" />
                  <div className="vrplay-feature-card-img-overlay"></div>
                </div>
                <div className="vrplay-feature-card-body">
                  <h3 className="vrplay-feature-title">{feature.title}</h3>
                  <p className="vrplay-feature-desc">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PLANS ────────────────────────────────────────── */}
      <section id="plans" className="vrplay-section vrplay-plans-section">
        <div className="vrplay-plans-bg">
          <img
            src="https://images.unsplash.com/photo-1440404653325-ab127d49abc1?w=1800&q=80"
            alt="Plans background"
            className="vrplay-plans-bg-img"
          />
          <div className="vrplay-plans-bg-overlay"></div>
        </div>
        <div className="vrplay-container">
          <div className="vrplay-section-header">
            <span className="vrplay-section-eyebrow vrplay-light">Pricing</span>
            <h2 className="vrplay-section-title vrplay-light">Choose Your Plan</h2>
            <p className="vrplay-section-subtitle vrplay-light">Flexible pricing for every entertainment need</p>
          </div>

          <div className="vrplay-plans-grid">
            {plans.map((plan, index) => (
              <div key={index} className={`vrplay-plan-card ${plan.popular ? "vrplay-popular" : ""}`}>
                {plan.popular && <div className="vrplay-plan-badge">Most Popular</div>}
                <h3 className="vrplay-plan-name">{plan.name}</h3>
                <div className="vrplay-plan-price">
                  <span className="vrplay-plan-price-value">{plan.price}</span>
                  <span className="vrplay-plan-price-period">{plan.period}</span>
                </div>
                <ul className="vrplay-plan-features">
                  {plan.features.map((f, i) => (
                    <li key={i} className="vrplay-plan-feature-item">
                      <span className="vrplay-plan-feature-icon">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <button className={`vrplay-plan-btn ${plan.popular ? "vrplay-btn-gradient" : "vrplay-btn-outline"}`}>
                  Get Started
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── OPERATOR ─────────────────────────────────────── */}
      <section id="operator" className="vrplay-section vrplay-operator-section">
        <div className="vrplay-container vrplay-operator-inner">
          <div className="vrplay-operator-text">
            <span className="vrplay-section-eyebrow">For Business</span>
            <h2 className="vrplay-section-title"><span className="vrplay-text-gradient">Become a StremFi Operator</span></h2>
            <p className="vrplay-operator-desc">
              Join our growing network of operators and cable providers. Get access to
              powerful management tools, real-time analytics, and dedicated support to
              grow your business.
            </p>
            <div className="vrplay-operator-perks">
              {["Real-time Analytics", "Customer Management", "Flexible Billing", "Dedicated Support"].map((p, i) => (
                <div key={i} className="vrplay-operator-perk">
                  <span className="vrplay-perk-check">✓</span> {p}
                </div>
              ))}
            </div>
            <div className="vrplay-operator-buttons">
              <button className="vrplay-btn-primary">Partner With Us <span className="vrplay-btn-arrow">→</span></button>
              <button className="vrplay-btn-secondary-dark">Learn More</button>
            </div>
          </div>
          <div className="vrplay-operator-visual">
            <img
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=800&q=80"
              alt="Operator dashboard"
              className="vrplay-operator-img"
            />
            <div className="vrplay-operator-img-card vrplay-op-card-1">
              <span className="vrplay-op-card-icon">📊</span>
              <div>
                <div className="vrplay-op-card-val">2,410</div>
                <div className="vrplay-op-card-lbl">Subscribers</div>
              </div>
            </div>
            <div className="vrplay-operator-img-card vrplay-op-card-2">
              <span className="vrplay-op-card-icon">⬆️</span>
              <div>
                <div className="vrplay-op-card-val">+18%</div>
                <div className="vrplay-op-card-lbl">Growth</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── EDUCATION SOFTWARE ───────────────────────── */}
      <section id="education" className="vrplay-section vrplay-education-section">
        <div className="vrplay-container vrplay-education-inner">
          
          <div className="vrplay-education-visual">
            <img
              src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=900&q=80"
              alt="School Management Software"
              className="vrplay-education-img"
            />
          </div>

          <div className="vrplay-education-content">
            <span className="vrplay-section-eyebrow">
              Educational Solutions
            </span>

            <h2 className="vrplay-section-title">
              Smart <span className="vrplay-text-gradient">
                School Management Software
              </span>
            </h2>

            <p className="vrplay-education-desc">
              SD Technologies provides a complete School & Educational Management
              System designed for schools, colleges, and educational institutions.
              Manage admissions, attendance, fees, examinations, transport,
              communication, and reporting from a single platform.
            </p>

            <div className="vrplay-education-features">
              {educationFeatures.map((feature, index) => (
                <div key={index} className="vrplay-education-feature">
                  <span className="vrplay-perk-check">✓</span>
                  {feature}
                </div>
              ))}
            </div>

            <div className="vrplay-operator-buttons">
              <a href="#contact" className="vrplay-btn-primary">
                Request Demo
                <span className="vrplay-btn-arrow">→</span>
              </a>

              <a href="https://childinfo.in" target="_blank" rel="noopener noreferrer" className="vrplay-btn-secondary-dark">
                Learn More
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* ── DEVICES ──────────────────────────────────────── */}
      <section className="vrplay-section vrplay-devices-section">
        <div className="vrplay-container">
          <div className="vrplay-section-header">
            <span className="vrplay-section-eyebrow">Compatibility</span>
            <h2 className="vrplay-section-title">Supported Devices</h2>
            <p className="vrplay-section-subtitle">Stream on any device, anywhere</p>
          </div>

          {/* Available Devices */}
          <div className="vrplay-devices-grid">
            {devices.map((d, i) => (
              <div key={i} className="vrplay-device-card">
                <div className="vrplay-device-img-wrap">
                  <img src={d.img} alt={d.name} className="vrplay-device-img" />
                  <div className="vrplay-device-img-overlay"></div>
                </div>
                <div className="vrplay-device-info">
                  <span className="vrplay-device-name">{d.name}</span>
                  <span className="vrplay-device-status vrplay-available">Available</span>
                </div>
              </div>
            ))}
          </div>

          {/* Coming Soon Devices */}
          <div className="vrplay-coming-soon-section">
            <h3 className="vrplay-coming-soon-heading">
              <span className="vrplay-coming-soon-icon">🚀</span>
              Coming Soon
            </h3>
            <div className="vrplay-devices-grid vrplay-devices-grid-coming-soon">
              {devices2.map((d, i) => (
                <div key={i} className="vrplay-device-card vrplay-device-card-coming">
                  <div className="vrplay-device-img-wrap">
                    <img src={d.img} alt={d.name} className="vrplay-device-img" />
                    <div className="vrplay-device-img-overlay vrplay-coming-overlay"></div>
                    <div className="vrplay-coming-soon-badge">Coming Soon</div>
                  </div>
                  <div className="vrplay-device-info">
                    <span className="vrplay-device-name">{d.name}</span>
                    <span className="vrplay-device-status vrplay-coming">Coming Soon</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section id="faq" className="vrplay-section vrplay-faq-section">
        <div className="vrplay-container vrplay-faq-container">
          <div className="vrplay-section-header">
            <span className="vrplay-section-eyebrow">Got Questions?</span>
            <h2 className="vrplay-section-title">Frequently Asked Questions</h2>
            <p className="vrplay-section-subtitle">Everything you need to know about StremFi</p>
          </div>

          <div className="vrplay-faq-list">
            {faqs.map((faq, index) => (
              <div key={index} className={`vrplay-faq-item ${activeFaq === index ? "vrplay-active" : ""}`}>
                <button onClick={() => toggleFaq(index)} className="vrplay-faq-question">
                  <span className="vrplay-faq-question-text">{faq.q}</span>
                  <span className={`vrplay-faq-arrow ${activeFaq === index ? "vrplay-rotated" : ""}`}>▼</span>
                </button>
                <div className="vrplay-faq-answer">
                  <div className="vrplay-faq-answer-content">
                    <p>{faq.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="vrplay-section vrplay-cta-wrapper">
        <div className="vrplay-container">
          <div className="vrplay-cta-section">
            <div className="vrplay-cta-bg-img-wrap">
              <img
                src="https://images.unsplash.com/photo-1677442136019-21780ecad995?w=1400&q=80"
                alt="CTA background"
                className="vrplay-cta-bg-img"
              />
              <div className="vrplay-cta-overlay"></div>
            </div>
            <div className="vrplay-cta-inner">
              <h2 className="vrplay-cta-title">Ready to Experience<br />Premium Entertainment?</h2>
              <p className="vrplay-cta-description">
                Join thousands of satisfied users and transform the way you stream.
                Start your journey with StremFi today — no credit card required.
              </p>
              <Link to="/login" className="vrplay-cta-btn">
                Get Started Free <span className="vrplay-btn-arrow">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

       {/* ── CONTACT US ─────────────────────────────────── */}
      <section id="contact" className="vrplay-section vrplay-contact-section">
        <div className="vrplay-container">
          <div className="vrplay-section-header">
            <span className="vrplay-section-eyebrow">Get In Touch</span>
            <h2 className="vrplay-section-title">Contact Us</h2>
            <p className="vrplay-section-subtitle">
              Have questions? We'd love to hear from you. Send us a message and we'll respond promptly.
            </p>
          </div>

          <div className="vrplay-contact-grid">
            {/* Contact Information */}
            <div className="vrplay-contact-info">
              <div className="vrplay-contact-info-card">
                <div className="vrplay-contact-icon-wrapper">
                  <span className="vrplay-contact-icon">📧</span>
                </div>
                <div className="vrplay-contact-details">
                  <h3 className="vrplay-contact-info-title">Email Us</h3>
                  <p className="vrplay-contact-info-text">support@stremfi.in</p>
                </div>
              </div>

              <div className="vrplay-contact-info-card">
                <div className="vrplay-contact-icon-wrapper">
                  <span className="vrplay-contact-icon">📞</span>
                </div>
                <div className="vrplay-contact-details">
                  <h3 className="vrplay-contact-info-title">Call Us</h3>
                  <p className="vrplay-contact-info-text">+91 91 25 25 35 35</p>
                  <p className="vrplay-contact-info-subtext">Mon-Sat, 10AM to 5PM IST</p>
                </div>
              </div>

              <div className="vrplay-contact-info-card">
                <div className="vrplay-contact-icon-wrapper">
                  <span className="vrplay-contact-icon">📍</span>
                </div>
                <div className="vrplay-contact-details">
                  <h3 className="vrplay-contact-info-title">Visit Us</h3>
                  <p className="vrplay-contact-info-text">
                    SD Technologies
                  </p>
                </div>
              </div>

              <div className="vrplay-contact-social">
                <h3 className="vrplay-contact-info-title">Follow Us</h3>
                <div className="vrplay-social-links">
                  <a href="#" className="vrplay-social-link" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
                    <svg className="vrplay-social-svg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                  </a>
                  
                  <a href="#" className="vrplay-social-link" aria-label="Twitter" target="_blank" rel="noopener noreferrer">
                    <svg className="vrplay-social-svg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                    </svg>
                  </a>
                  
                  <a href="#" className="vrplay-social-link" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
                    <svg className="vrplay-social-svg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                    </svg>
                  </a>
                  
                  <a href="#" className="vrplay-social-link" aria-label="LinkedIn" target="_blank" rel="noopener noreferrer">
                    <svg className="vrplay-social-svg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                  </a>
                  
                  <a href="#" className="vrplay-social-link" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
                    <svg className="vrplay-social-svg" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                    </svg>
                  </a>
                </div>
              </div>
            </div> 

            {/* Contact Form */}
            <div className="vrplay-contact-form-wrapper">
              {formStatus.submitted ? (
                <div className="vrplay-form-success">
                  <div className="vrplay-success-icon">✅</div>
                  <h3 className="vrplay-success-title">Message Sent!</h3>
                  <p className="vrplay-success-message">{formStatus.message}</p>
                  <button
                    onClick={() => setFormStatus({ submitted: false, error: false, message: "" })}
                    className="vrplay-btn-primary"
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="vrplay-contact-form">
                  <div className="vrplay-form-row">
                    <div className="vrplay-form-group">
                      <label htmlFor="name" className="vrplay-form-label">
                        Full Name <span className="vrplay-required">*</span>
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="A Manikanta"
                        className="vrplay-form-input"
                        required
                      />
                    </div>
                    <div className="vrplay-form-group">
                      <label htmlFor="email" className="vrplay-form-label">
                        Email Address <span className="vrplay-required">*</span>
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="manikanta789@gmail.com"
                        className="vrplay-form-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="vrplay-form-row">
                    <div className="vrplay-form-group">
                      <label htmlFor="phone" className="vrplay-form-label">
                        Phone Number
                      </label>
                      <input
                        type="tel"
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="+91 98765 43210"
                        className="vrplay-form-input"
                      />
                    </div>
                    <div className="vrplay-form-group">
                      <label htmlFor="subject" className="vrplay-form-label">
                        Subject
                      </label>
                      <select
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        className="vrplay-form-input vrplay-form-select"
                      >
                        <option value="">Select a topic</option>
                        <option value="educationerp">Education ERP</option>
                        <option value="general">General Inquiry</option>
                        <option value="support">Technical Support</option>
                        <option value="billing">Billing Question</option>
                        <option value="partnership">Partnership Opportunity</option>
                        <option value="feedback">Feedback</option>
                      </select>
                    </div>
                  </div>

                  <div className="vrplay-form-group vrplay-form-group-full">
                    <label htmlFor="message" className="vrplay-form-label">
                      Message <span className="vrplay-required">*</span>
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell us how we can help you..."
                      className="vrplay-form-input vrplay-form-textarea"
                      rows="5"
                      required
                    />
                  </div>

                  {formStatus.error && (
                    <div className="vrplay-form-error">
                      <span className="vrplay-error-icon">⚠️</span>
                      {formStatus.message}
                    </div>
                  )}

                  <button type="submit" className="vrplay-btn-primary vrplay-submit-btn">
                    Send Message <span className="vrplay-btn-arrow">→</span>
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────── */}
      <footer className="vrplay-footer">
        <div className="vrplay-container-footer vrplay-footer-container">
          <div className="vrplay-footer-brand">
            <a href="#hero" className="vrplay-footer-logo">
              <span className="vrplay-footer-logo-text">StremFi</span>
            </a>
            <p className="vrplay-footer-tagline">TV · OTT · WiFi · Phone</p>
            <br />
            <p className="vrplay-footer-address"># Pedda Avutapalli Unguturu Mandal Krishna District Vijayawada Andhra Pradesh India 521286</p>
          </div>

          <div className="vrplay-footer-links-group">
            <span className="vrplay-footer-links-heading">Platform</span>
            <a href="#features" className="vrplay-footer-link">Features</a>
            <a href="#plans" className="vrplay-footer-link">Pricing</a>
            <a href="#operator" className="vrplay-footer-link">Operators</a>
            <a href="https://childinfo.in" target="_blank" rel="noopener noreferrer" className="vrplay-footer-link">Education</a>
          </div>

          <div className="vrplay-footer-links-group">
            <span className="vrplay-footer-links-heading">Support</span>
            <a href="#faq" className="vrplay-footer-link">FAQ</a>
            <a href="https://vrplay.in/privacy-policy.html" target="_blank" rel="noopener noreferrer" className="vrplay-footer-link">Privacy Policy</a>
            <a href="https://vrplay.in/terms-and-conditions.html" target="_blank" rel="noopener noreferrer" className="vrplay-footer-link">Terms & Conditions</a>
          </div>
        </div>
        {/* ── APP DOWNLOAD ────────────────────────────────────── */}

        <div className="vrplay-app-buttons">
          <a 
            href="https://play.google.com/store/apps/details?id=in.vrplay.tv" 
            className="vrplay-store-btn vrplay-play-store-btn"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Download on Google Play Store"
          >
            <svg className="vrplay-store-icon" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="M3.609 1.814L13.792 12 3.61 22.186a.996.996 0 01-.61-.92V2.734a1 1 0 01.609-.92zm10.89 10.893l2.302 2.302-10.937 6.333 8.635-8.635zm3.199-3.199l2.807 1.626a1 1 0 010 1.732l-2.807 1.626L15.206 12l2.492-2.492zM5.864 2.658L16.8 8.99l-2.302 2.302-8.634-8.634z"/>
            </svg>
            <div className="vrplay-store-text">
              <span className="vrplay-store-label">GET IT ON</span>
              <span className="vrplay-store-name">Google Play</span>
            </div>
          </a>
        </div>
      
        <div className="vrplay-footer-bottom">
          <p>© 2026 StremFi. All Rights Reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;