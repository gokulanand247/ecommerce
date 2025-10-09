import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface TermsConditionsProps {
  onBack: () => void;
}

const TermsConditions: React.FC<TermsConditionsProps> = ({ onBack }) => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-4xl">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="h-5 w-5 mr-2" />
          Back to Home
        </button>

        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Terms and Conditions</h1>
          <p className="text-gray-500 mb-6">Last Updated: October 2025</p>

          <div className="prose max-w-none space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-3">Acceptance of Terms</h2>
              <p className="text-gray-600">
                By accessing and using this website, you accept and agree to be bound by the terms and conditions outlined below. If you do not agree to these terms, please do not use our website.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Use of Website</h2>
              <p className="text-gray-600 mb-3">You agree to use this website only for lawful purposes and in a way that does not:</p>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Violate any applicable laws or regulations</li>
                <li>Infringe on the rights of others</li>
                <li>Harass, abuse, or harm another person</li>
                <li>Transmit any harmful or malicious code</li>
                <li>Attempt to gain unauthorized access to our systems</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Account Registration</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>You must provide accurate and complete information</li>
                <li>You are responsible for maintaining account confidentiality</li>
                <li>You are responsible for all activities under your account</li>
                <li>Notify us immediately of any unauthorized access</li>
                <li>We reserve the right to suspend or terminate accounts</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Orders and Payment</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Order Acceptance</h3>
                  <p className="text-gray-600">
                    All orders are subject to acceptance and product availability. We reserve the right to refuse or cancel any order.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Pricing</h3>
                  <p className="text-gray-600">
                    Prices are subject to change without notice. We strive to display accurate pricing but errors may occur.
                  </p>
                </div>
                <div>
                  <h3 className="text-lg font-semibold mb-2">Payment</h3>
                  <p className="text-gray-600">
                    Payment must be received before order processing. We accept various payment methods as displayed at checkout.
                  </p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Returns and Refunds</h2>
              <ul className="list-disc list-inside text-gray-600 space-y-2">
                <li>Returns accepted within 7 days of delivery</li>
                <li>Products must be unused and in original packaging</li>
                <li>Refunds processed within 7-10 business days</li>
                <li>Shipping charges are non-refundable</li>
                <li>Sale items may have different return policies</li>
              </ul>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Intellectual Property</h2>
              <p className="text-gray-600">
                All content on this website, including text, graphics, logos, images, and software, is our property or our licensors' property and is protected by copyright and trademark laws. You may not reproduce, distribute, or use any content without our written permission.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Product Information</h2>
              <p className="text-gray-600">
                We strive to provide accurate product descriptions and images. However, we do not warrant that product descriptions, colors, or other content is accurate, complete, or error-free. Actual products may vary slightly from images.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Limitation of Liability</h2>
              <p className="text-gray-600">
                We shall not be liable for any indirect, incidental, special, consequential, or punitive damages resulting from your use of or inability to use our website or products. Our total liability shall not exceed the amount paid for the product.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Shipping and Delivery</h2>
              <p className="text-gray-600">
                Delivery times are estimates and not guaranteed. We are not responsible for delays caused by courier services, natural disasters, or other events beyond our control.
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Governing Law</h2>
              <p className="text-gray-600">
                These terms and conditions are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of the courts in [Your City].
              </p>
            </section>

            <section>
              <h2 className="text-2xl font-semibold mb-3">Changes to Terms</h2>
              <p className="text-gray-600">
                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting. Your continued use of the website constitutes acceptance of modified terms.
              </p>
            </section>

            <section className="bg-pink-50 border border-pink-200 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-3">Contact Information</h2>
              <p className="text-gray-600">
                If you have any questions about these Terms and Conditions, please contact our customer support team.
              </p>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
