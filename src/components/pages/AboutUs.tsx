import React from 'react';
import { ArrowLeft, Heart, Users, Award, ShoppingBag } from 'lucide-react';

interface AboutUsProps {
  onBack: () => void;
}

const AboutUs: React.FC<AboutUsProps> = ({ onBack }) => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">About Us</h1>

          <div className="prose max-w-none">
            <p className="text-gray-600 mb-6">
              Welcome to our fashion destination, where style meets quality. We are dedicated to bringing you the latest trends in women's fashion, from traditional ethnic wear to contemporary western styles.
            </p>

            <div className="grid md:grid-cols-2 gap-6 my-8">
              <div className="flex items-start space-x-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Our Mission</h3>
                  <p className="text-gray-600">To empower women through fashion by providing high-quality, stylish clothing that makes them feel confident and beautiful.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Users className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Our Community</h3>
                  <p className="text-gray-600">We serve thousands of happy customers across India, building a community of fashion-forward women.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <Award className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Quality Promise</h3>
                  <p className="text-gray-600">Every product is carefully selected and quality-checked to ensure you receive only the best.</p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="bg-red-100 p-3 rounded-lg">
                  <ShoppingBag className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-2">Wide Selection</h3>
                  <p className="text-gray-600">From sarees to party dresses, we offer a diverse range of styles for every occasion.</p>
                </div>
              </div>
            </div>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Our Story</h2>
            <p className="text-gray-600 mb-4">
              Founded with a passion for fashion and a commitment to quality, we started our journey to make premium clothing accessible to everyone. What began as a small collection has grown into a comprehensive fashion destination.
            </p>
            <p className="text-gray-600 mb-4">
              We believe that every woman deserves to look and feel her best, which is why we carefully curate our collection to include the latest trends, timeless classics, and everything in between.
            </p>

            <h2 className="text-2xl font-bold text-gray-900 mt-8 mb-4">Why Choose Us?</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-600 mb-6">
              <li>Authentic products with quality guarantee</li>
              <li>Competitive prices with regular discounts and offers</li>
              <li>Fast and reliable shipping across India</li>
              <li>Easy returns and exchanges</li>
              <li>Secure payment options</li>
              <li>Dedicated customer support</li>
            </ul>

            <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
              <h3 className="font-semibold text-lg mb-2">Get in Touch</h3>
              <p className="text-gray-600">
                Have questions or suggestions? We'd love to hear from you! Our customer support team is always ready to help you with any queries.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AboutUs;
