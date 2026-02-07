import React, { useState, useEffect } from 'react';
import { Routes, Route, Link, useLocation, Navigate, useNavigate } from 'react-router-dom';
import { secureRequest } from '../secureRequest.js';

function CustomerServicePage({ API_BASE }) {
  const [contactForm, setContactForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { id: 'contact', label: 'Contact Us', icon: '📞' },
    { id: 'returns', label: 'Returns', icon: '↩️' },
    { id: 'shipping', label: 'Shipping', icon: '🚚' },
    { id: 'terms', label: 'Terms', icon: '📜' },
    { id: 'privacy', label: 'Privacy', icon: '🛡️' },
    { id: 'faq', label: 'FAQ', icon: '❓' },
  ];

  useEffect(() => {
    const currentTab = location.pathname.split('/').pop();
    const activeTabInfo = tabs.find(t => t.id === currentTab);
    if (activeTabInfo) {
      document.title = `${activeTabInfo.label} - SamriddhiShop`;
    }
    return () => { document.title = 'SamriddhiShop'; };
  }, [location]);

  const faqs = [
    { q: 'How do I track my order?', a: 'You can track your order by visiting the "My Orders" section in your profile or using the tracking link sent to your email.' },
    { q: 'What payment methods do you accept?', a: 'We accept Cash on Delivery (COD). Credit/Debit cards and UPI payments are also available.' },
    { q: 'How long does delivery take?', a: 'Standard delivery takes 7-10 business days. Express delivery options are available for faster shipping.' },
    { q: 'Can I cancel my order?', a: 'Yes, you can cancel your order before it is shipped. Contact our support team for assistance.' },
    { q: 'What is your return policy?', a: 'You can return items within 24 hours after delivery. Items must be unused and in original packaging.' }
  ];

  const validateForm = () => {
    const newErrors = {};
    if (!contactForm.name.trim()) newErrors.name = 'Name is required.';
    if (!contactForm.email.trim()) newErrors.email = 'Email is required.';
    else if (!/\S+@\S+\.\S+/.test(contactForm.email)) newErrors.email = 'Email is invalid.';
    if (!contactForm.subject.trim()) newErrors.subject = 'Subject is required.';
    if (!contactForm.message.trim()) newErrors.message = 'Message is required.';
    else if (contactForm.message.trim().length < 10) newErrors.message = 'Message must be at least 10 characters long.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let sanitizedValue = value;
    // Sanitize inputs to prevent XSS by removing characters like < and >
    if (name === 'name' || name === 'email' || name === 'subject' || name === 'message') {
      sanitizedValue = value.replace(/[<>]/g, '');
    }
    setContactForm({ ...contactForm, [name]: sanitizedValue });
    if (errors[name]) setErrors({ ...errors, [name]: null });
  };

  const handleContactSubmit = async () => {
    if (!validateForm()) return;
    setLoading(true);
    try {
      const response = await secureRequest(`${API_BASE}/api/contact`, {
        method: 'POST',
        body: JSON.stringify(contactForm)
      });
      if (response.ok) {
        alert('Message sent successfully! We\'ll get back to you soon.');
        setContactForm({ name: '', email: '', subject: '', message: '' });
        setErrors({});
      } else {
        alert('Failed to send message. Please try again.');
      }
    } catch (error) {
      alert('Failed to send message. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="py-4 lg:py-8">
      <div className="w-full mx-0">
        <button
          onClick={() => navigate(-1)}
          className="mb-4 flex w-full items-center justify-center space-x-2 rounded-lg bg-white p-3 text-lg font-bold text-gray-800 shadow-md transition-colors hover:bg-gray-50 lg:hidden"
        >
          <span>&larr;</span>
          <span>Support & All Policy</span>
        </button>
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="bg-gradient-to-r from-gray-50 to-blue-50 border-b">
            <nav className="flex overflow-x-auto">
              {tabs.map(tab => (
                <Link
                  key={tab.id}
                  to={`/support/${tab.id}`}
                  aria-label={tab.label}
                  className={`flex flex-col items-center justify-center space-y-0.5 px-3 py-2 font-medium whitespace-nowrap transition-all flex-grow 
                    ${location.pathname.endsWith(tab.id) ? 'border-b-3 border-blue-600 text-blue-600 bg-white shadow-sm' : 'text-gray-600 hover:text-gray-800 hover:bg-white/50'}
                  `}
                >
                  <span className="text-sm">{tab.icon}</span>
                  <span className="text-xs">{tab.label}</span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="p-8">
            <Routes>
              <Route path="contact" element={
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2"><span>📝</span><span className="font-bold">Send us a Message</span></h2>
                    <div className="space-y-4">
                      <div><input type="text" name="name" placeholder="Your Name" value={contactForm.name} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl ${errors.name ? 'border-red-500' : 'border-gray-300'}`} />{errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}</div>
                      <div><input type="email" name="email" placeholder="Your Email" value={contactForm.email} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl ${errors.email ? 'border-red-500' : 'border-gray-300'}`} />{errors.email && <p className="text-red-500 text-sm mt-1">{errors.email}</p>}</div>
                      <div><input type="text" name="subject" placeholder="Subject" value={contactForm.subject} onChange={handleInputChange} className={`w-full px-4 py-3 border rounded-xl ${errors.subject ? 'border-red-500' : 'border-gray-300'}`} />{errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject}</p>}</div>
                      <div><textarea name="message" placeholder="Your Message" value={contactForm.message} onChange={handleInputChange} rows="4" className={`w-full px-4 py-3 border rounded-xl ${errors.message ? 'border-red-500' : 'border-gray-300'}`} />{errors.message && <p className="text-red-500 text-sm mt-1">{errors.message}</p>}</div>
                      <button onClick={handleContactSubmit} disabled={loading} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-xl font-semibold disabled:opacity-50">{loading ? 'Sending...' : 'Send Message'}</button>
                    </div>
                  </div>
                  <div className="space-y-6">
                    <h2 className="text-2xl font-bold text-gray-800 mb-6">Get in Touch</h2>
                    <div className="space-y-4">
                      <div className="flex items-center space-x-4 p-4 bg-green-50 rounded-xl"><div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center"><span className="text-xl">📧</span></div><div><p className="font-semibold text-green-800">Email Support</p><p className="text-green-600">support@samriddhishop.in</p></div></div>
                      <div className="flex items-center space-x-4 p-4 bg-blue-50 rounded-xl"><div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center"><span className="text-xl">📱</span></div><div><p className="font-semibold text-blue-800">Phone Support</p><p className="text-blue-600">+91 9580889615</p></div></div>
                      <div className="flex items-center space-x-4 p-4 bg-purple-50 rounded-xl"><div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center"><span className="text-xl">🕒</span></div><div><p className="font-semibold text-purple-800">Business Hours</p><p className="text-purple-600">Mon-Sat: 9AM-6PM</p></div></div>
                    </div>
                  </div>
                </div>
              } />
              <Route path="faq" element={
                <div className="space-y-6">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6 flex items-center space-x-2"><span>❓</span><span className="font-bold">Frequently Asked Questions</span></h2>
                  <div className="space-y-4">{faqs.map((faq, index) => (<div key={index} className="bg-gray-50 p-6 rounded-xl"><h3 className="font-bold text-gray-800 mb-2">{faq.q}</h3><p className="text-gray-600">{faq.a}</p></div>))}</div>
                </div>
              } />
              <Route path="returns" element={
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Return Policy</h2>
                  <p>Last updated: March 1, 2026</p><br></br>
                  <p>Thank you for shopping with YashAgency (“we”, “our”, “us”). We aim to ensure a smooth and transparent shopping experience for every customer. This Return & Refund Policy applies to all purchases made on yashagency.in</p>

                  <h3 className="font-bold">1. Eligibility for Refunds</h3>
                  <p>We accept refund requests under the following conditions:</p>
                  <ul>
                    <li>The refund request is submitted within 24 hours after delivery.</li>
                    <li>The product is unused, undamaged, and in its original packaging.</li>
                    <li>Proof of purchase (order ID/invoice) is provided.</li>
                    <li>Refunds are available for both prepaid and Cash on Delivery (COD) orders.</li>
                  </ul>

                  <h3 className="font-bold">2. How to Request a Refund</h3>
                  <p>To request a refund, go to <Link to="/support/contact" className="text-blue-600 hover:underline">Contact Us</Link>, In the message you will need to provide your Order ID, the reason for the refund, Our team will review your request and contact you. If Refund is approved then you have to share the bank account details with us for COD orders only.</p>
                  <ul>
                    <li>Go to My Orders → Track Order on our website.</li>
                    <li>Scroll the page and go to Refund Information.</li>
                    <li>Click on Enter Bank Account Details and fill the details in message box <b>(Bank Name, Account Holder Name, Account Number, IFSC Code, and UPI ID (Optional):)</b> and click on <b>Sumbit Details</b>.</li>
                    <li>Payment will be credit with in 5-7 business days.</li>
                    <li><b>When payment is sent from us then we will share payment information with you on your communication email.</b></li>
                  </ul>
                  <h3 className="font-bold">3. Refund Process</h3>
                  <h4 className="font-semibold">🔹 For Online (Prepaid) Orders</h4>
                  <p>If you paid using Razorpay, the refund will be credited back to the original payment source (card, UPI, wallet, etc.). Processing time is typically 5–7 business days.</p>
                  <h4 className="font-semibold">🔹 For Cash on Delivery (COD) Orders</h4>
                  <p>Refunds are processed via bank transfer to the account details you provide. Processing time is 5–7 business days after approval. Please ensure your bank details are accurate.</p>

                  <h3 className="font-bold">4. Non-Refundable Situations</h3>
                  <p>Refunds will not be provided if:</p>
                  <ul>
                    <li>The request is made after 24 hours of delivery.</li>
                    <li>The product is used, damaged, or missing original packaging.</li>
                    <li>Incorrect or incomplete bank details are shared for COD refunds.</li>
                  </ul>

                  <h3 className="font-bold">5. Order Cancellation</h3>
                  <p>You can cancel your order before it is shipped for a full refund. Once shipped, it cannot be canceled but may be eligible for a refund under this policy.</p>

                  <h3 className="font-bold">6. Contact for Refund Queries</h3>
                  <p>If you have any questions regarding refunds, please contact us:</p>
                  <p>📧 yashagency25@gmail.com</p>
                  <p>📞 +91 7249122916</p>
                </div>
              } />
              <Route path="shipping" element={
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">🚚 Shipping & Delivery Policy</h2>
                  <p>Last updated: March 1, 2026</p><br></br>
                  <p>Thank you for shopping with YashAgency (“we”, “our”, “us”). This Shipping & Delivery Policy explains how we process and deliver orders placed on yashagency.in.</p>

                  <h3 className="font-bold">1. Delivery Coverage</h3>
                  <p>We currently deliver orders only within the districts of state of Pune, Maharashtra, India. If your delivery address is outside Pune district, you will not be able to place an order on our website & app.</p>

                  <h3 className="font-bold">2. Delivery Time</h3>
                  <p>Orders are usually delivered within 1 to 2 business days from the date of order confirmation. Delivery time may vary based on product availability, delivery location, and other factors like weather. We will notify you by email when your order has been shipped.</p>

                  <h3 className="font-bold">3. Shipping Charges</h3>
                  <p>Free delivery may be offered on selected products or during promotional periods. Any applicable shipping or handling fees will be displayed at checkout before you confirm your order.</p>

                  <h3 className="font-bold">4. Order Tracking</h3>
                  <p>Once your order is shipped, you can track its status by visiting <Link to="/orders" className="text-blue-600 hover:underline">My Orders</Link> on our website. You will also receive an update via email with tracking details.</p>

                  <h3 className="font-bold">5. Delivery Attempts</h3>
                  <p>Our delivery partner will attempt delivery up to two times. If you are unavailable, you may be contacted to reschedule. If delivery cannot be completed, the order may be returned to us, and a refund will be processed as per our <Link to="/support/returns" className="text-blue-600 hover:underline">Return & Refund Policy</Link>.</p>

                  <h3 className="font-bold">6. Delays or Exceptions</h3>
                  <p>Delivery may be delayed due to natural calamities, transport disruptions, or incorrect address details. In such cases, our support team will contact you.</p>

                  <h3 className="font-bold">7. Contact for Delivery Issues</h3>
                  <p>If your order has not arrived within the expected time, please contact us with your Order ID and registered mobile number for faster assistance:</p>
                  <ul>
                    <li>📧 yashagency25@gmail.com</li>
                    <li>📞 +91 7249122916</li>
                  </ul>

                  <h3 className="font-bold">8. Policy Updates</h3>
                  <p>We may update this Shipping & Delivery Policy from time to time. Any changes will be reflected on this page with the updated date.</p>
                </div>
              } />
              <Route path="terms" element={
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Terms of Service</h2>
                  <p>Last updated: March 1, 2026</p><br></br>
                  <p>Welcome to YashAgency (“we”, “our”, “us”). These Terms & Conditions (“Terms”) govern your use of our website yashagency.in (“Website”) and the purchase of products or services offered on it. By accessing or using our Website, you agree to these Terms. If you do not agree, please do not use our Website.</p>

                  <h3 className="font-bold">1. General</h3>
                  <p>By placing an order, you confirm that you are at least 18 years old & you have shop("dukaan")  or accessing the site under the supervision of a parent or legal guardian. We reserve the right to modify or update these Terms at any time without prior notice. The updated version will be posted on this page.</p>

                  <h3 className="font-bold">2. Account and Registration</h3>
                  <ul>
                    <li>You may be required to create an account to make purchases or you can contact us our salesman & we create your account for you.</li>
                    <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
                    <li>You agree to provide accurate, current, and complete information.</li>
                    <li>We reserve the right to suspend or terminate your account if we suspect any fraudulent activity or violation of these Terms.</li>
                    <li>We do not store your personal & address details on our servers it is by third party("MongoDB").</li>
                  </ul>

                  <h3 className="font-bold">3. Products and Pricing</h3>
                  <ul>
                    <li>All prices listed on our Website are in Indian Rupees (INR).</li>
                    <li>We make every effort to display accurate product information, but errors in pricing or descriptions may occur.</li>
                    <li>In case of an incorrect price, we reserve the right to cancel or modify the order after notifying you.</li>
                  </ul>

                  <h3 className="font-bold">4. Orders and Payments</h3>
                  <ul>
                    <li>Orders are confirmed only after successful payment through our secure payment gateway Razorpay.</li>
                    <li>We do not store your credit/debit card or bank details on our servers.</li>
                    <li>You agree to provide valid payment information and authorize us (and Razorpay) to charge the total amount of your purchase.</li>
                  </ul>

                  <h3 className="font-bold">5. Shipping and Delivery</h3>
                  <ul>
                    <li>We strive to deliver products within the estimated delivery time mentioned on the Website.</li>
                    <li>Delivery timelines may vary due to logistics or unforeseen circumstances.</li>
                    <li>Ownership of the products passes to you upon successful delivery.</li>
                  </ul>

                  <h3 className="font-bold">6. Returns, Refunds, and Cancellations</h3>
                  <p>We follow a transparent <Link to="/support/returns" className="text-blue-600 hover:underline">Return and Refund Policy</Link>. Refunds will be processed to the original payment method. Cancellations are accepted only before the order is shipped.</p>

                  <h3 className="font-bold">7. Intellectual Property</h3>
                  <p>All content on this Website (including text, images, logos, and designs) is the property of yashagency.in or its licensors. You may not copy, reproduce, or use our content without written permission.</p>

                  <h3 className="font-bold">8. Limitation of Liability</h3>
                  <p>Our total liability for any claim shall not exceed the amount paid by you for the specific product in question.</p>

                  <h3 className="font-bold">9. Governing Law and Jurisdiction</h3>
                  <p>These Terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in Pune, Maharashtra, India.</p>

                  <h3 className="font-bold">10. Contact Us</h3>
                  <p>If you have any questions about these Terms, please contact us at: 📧 yashagency25@gmail.com</p>
                </div>
              } />
              <Route path="privacy" element={
                <div className="prose max-w-none">
                  <h2 className="text-2xl font-bold text-gray-800 mb-6">Privacy Policy</h2>
                  <p>Last updated: March 1, 2026</p>
                  <br></br>
                  <h3 className="font-bold">1. Introduction</h3>
                  <p>Welcome to YashAgency (“we”, “our”, “us”). We operate the eCommerce website yashagency.in, where we sell products and services online.</p>
                  <p>Your privacy is important to us. This Privacy Policy explains how we collect, use, store, and protect your personal data in accordance with the Digital Personal Data Protection Act, 2023 (DPDP Act) and other applicable laws in India.</p>

                  <h3 className="font-bold">2. Information We Collect</h3>
                  <p>We collect the following personal information when you register, place an order, or interact with our website:</p>
                  <ul>
                    <li>Full name</li>
                    <li>Email address</li>
                    <li>Mobile number</li>
                    <li>Shipping and billing address</li>
                    <li>Payment details (processed securely via Razorpay)</li>
                  </ul>
                  <p>We do not store your credit/debit card details on our servers. All payment information is handled securely by Razorpay, which complies with PCI-DSS standards.</p>

                  <h3 className="font-bold">3. How We Use Your Information</h3>
                  <p>We use your personal data for the following purposes:</p>
                  <ul>
                    <li>To process and deliver your orders</li>
                    <li>To contact you about your purchases or customer support</li>
                    <li>To send order updates, invoices, and confirmations</li>
                    <li>To improve our website, products, and services</li>
                    <li>To comply with legal and regulatory obligations</li>
                  </ul>
                  <p>We will never sell or rent your personal information to third parties.</p>

                  <h3 className="font-bold">4. Sharing of Information</h3>
                  <p>We may share your data only with trusted third parties for business purposes, including:</p>
                  <ul>
                    <li>Razorpay (for payment processing)</li>
                    <li>Delivery partners (for order fulfillment)</li>
                    <li>Service providers (for hosting, analytics, or email communication)</li>
                  </ul>
                  <p>All third parties are bound by confidentiality and data protection agreements.</p>

                  <h3 className="font-bold">5. Data Storage and Security</h3>
                  <p>Your information is securely stored in MongoDB Atlas (cloud database), which provides encryption at rest and in transit, access control, and regular security updates. We also take reasonable technical and organizational measures to prevent unauthorized access, alteration, or destruction of your personal data.</p>

                  <h3 className="font-bold">6. Your Rights</h3>
                  <p>As per the DPDP Act, you have the right to access, correct, or request deletion of your personal data, and withdraw consent for data processing. To exercise these rights, contact us at support@samriddhishop.in.</p>

                  <h3 className="font-bold">7. Cookies and Tracking</h3>
                  <p>Our website may use cookies to enhance your browsing experience, analyze traffic, and remember your preferences. You can control cookie settings in your browser.</p>

                  <h3 className="font-bold">8. Data Retention</h3>
                  <p>We retain your information only for as long as necessary to fulfill the purposes mentioned above or to comply with legal requirements. Once no longer needed, your data will be securely deleted.</p>

                  <h3 className="font-bold">9. Updates to This Policy</h3>
                  <p>We may update this Privacy Policy from time to time. Any changes will be posted on this page with the updated date.</p>

                  <h2 className="font-bold">10. Contact Us</h2>
                  <p>If you have questions or concerns about this Privacy Policy, please contact us at: 📧 yashagency25@gmail.com</p>
                </div>
              } />
              <Route index element={<Navigate to="contact" replace />} />
            </Routes>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CustomerServicePage;