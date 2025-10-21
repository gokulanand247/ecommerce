import React, { useState } from 'react';
import { ArrowLeft, ChevronDown, ChevronUp } from 'lucide-react';

interface FAQProps {
  onBack: () => void;
}

interface FAQItem {
  question: string;
  answer: string;
  category: string;
}

const FAQ: React.FC<FAQProps> = ({ onBack }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FAQItem[] = [
    {
      category: 'Orders',
      question: 'How do I place an order?',
      answer: 'Browse our products, add items to cart, proceed to checkout, fill in your shipping details, and complete the payment. You will receive an order confirmation email.'
    },
    {
      category: 'Orders',
      question: 'Can I modify or cancel my order?',
      answer: 'Orders can be modified or cancelled within 2 hours of placement. Please contact customer support immediately with your order number.'
    },
    {
      category: 'Orders',
      question: 'How can I track my order?',
      answer: 'Once your order is shipped, you will receive a tracking number via email and SMS. You can also track your order in the "My Orders" section of your account.'
    },
    {
      category: 'Shipping',
      question: 'What are the shipping charges?',
      answer: 'Shipping is free for orders above ₹999. For orders below ₹999, shipping charges apply: ₹99 for orders below ₹499, and ₹49 for orders between ₹499-₹998.'
    },
    {
      category: 'Shipping',
      question: 'How long does delivery take?',
      answer: 'Delivery typically takes 3-5 business days for metro cities and 5-7 business days for other locations. Remote areas may take 7-10 business days.'
    },
    {
      category: 'Shipping',
      question: 'Do you ship internationally?',
      answer: 'Currently, we only ship within India. We are working on expanding our shipping to international locations soon.'
    },
    {
      category: 'Returns',
      question: 'What is your return policy?',
      answer: 'We accept returns within 7 days of delivery. Products must be unused, unwashed, and in original packaging with tags intact.'
    },
    {
      category: 'Returns',
      question: 'How do I return a product?',
      answer: 'Go to "My Orders", select the order, click on "Return", choose the reason, and schedule a pickup. Our courier partner will collect the product from your address.'
    },
    {
      category: 'Returns',
      question: 'When will I receive my refund?',
      answer: 'Refunds are processed within 7-10 business days after we receive and verify the returned product. The amount will be credited to your original payment method.'
    },
    {
      category: 'Payment',
      question: 'What payment methods do you accept?',
      answer: 'We accept credit/debit cards, UPI, net banking, and various digital wallets through our secure payment gateway.'
    },
    {
      category: 'Payment',
      question: 'Is it safe to use my card on your website?',
      answer: 'Yes, we use industry-standard encryption and secure payment gateways. We do not store your card details on our servers.'
    },
    {
      category: 'Payment',
      question: 'Do you offer Cash on Delivery (COD)?',
      answer: 'COD is currently not available. We accept all major online payment methods for a seamless checkout experience.'
    },
    {
      category: 'Account',
      question: 'How do I create an account?',
      answer: 'Click on "Login/Register" in the header, fill in your details including name, email, and password, and submit. You will be logged in immediately.'
    },
    {
      category: 'Account',
      question: 'I forgot my password. What should I do?',
      answer: 'Click on "Forgot Password" on the login page, enter your registered email, and follow the instructions in the password reset email.'
    },
    {
      category: 'Products',
      question: 'How do I know which size to order?',
      answer: 'Please refer to our Size Guide page for detailed measurements. If you are between sizes, we recommend ordering the larger size.'
    },
    {
      category: 'Products',
      question: 'Are the product colors accurate?',
      answer: 'We try our best to display accurate colors. However, actual colors may vary slightly due to screen settings and lighting conditions.'
    },
    {
      category: 'Products',
      question: 'How do I know if a product is in stock?',
      answer: 'If a product is available for purchase on the website, it is in stock. Out of stock items are clearly marked and cannot be added to cart.'
    }
  ];

  const categories = Array.from(new Set(faqs.map(faq => faq.category)));

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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Frequently Asked Questions</h1>

          {categories.map((category) => (
            <div key={category} className="mb-8">
              <h2 className="text-2xl font-semibold mb-4 text-red-600">{category}</h2>
              <div className="space-y-3">
                {faqs
                  .filter(faq => faq.category === category)
                  .map((faq, index) => {
                    const globalIndex = faqs.indexOf(faq);
                    const isOpen = openIndex === globalIndex;

                    return (
                      <div
                        key={globalIndex}
                        className="border border-gray-200 rounded-lg overflow-hidden"
                      >
                        <button
                          onClick={() => setOpenIndex(isOpen ? null : globalIndex)}
                          className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <span className="font-medium text-gray-900">{faq.question}</span>
                          {isOpen ? (
                            <ChevronUp className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-gray-500 flex-shrink-0 ml-2" />
                          )}
                        </button>
                        {isOpen && (
                          <div className="px-4 pb-4 text-gray-600 bg-gray-50">
                            {faq.answer}
                          </div>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>
          ))}

          <div className="bg-red-50 border border-red-200 rounded-lg p-6 mt-8">
            <h3 className="font-semibold text-lg mb-2">Still Have Questions?</h3>
            <p className="text-gray-600">
              If you couldn't find the answer you were looking for, please feel free to contact our customer support team. We're here to help!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
