import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface SizeGuideProps {
  onBack: () => void;
}

const SizeGuide: React.FC<SizeGuideProps> = ({ onBack }) => {
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
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Size Guide</h1>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Women's Clothing Size Chart</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-red-100">
                    <th className="border border-gray-300 px-4 py-2">Size</th>
                    <th className="border border-gray-300 px-4 py-2">Bust (inches)</th>
                    <th className="border border-gray-300 px-4 py-2">Waist (inches)</th>
                    <th className="border border-gray-300 px-4 py-2">Hips (inches)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-semibold">XS</td>
                    <td className="border border-gray-300 px-4 py-2">30-32</td>
                    <td className="border border-gray-300 px-4 py-2">24-26</td>
                    <td className="border border-gray-300 px-4 py-2">32-34</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-semibold">S</td>
                    <td className="border border-gray-300 px-4 py-2">32-34</td>
                    <td className="border border-gray-300 px-4 py-2">26-28</td>
                    <td className="border border-gray-300 px-4 py-2">34-36</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-semibold">M</td>
                    <td className="border border-gray-300 px-4 py-2">34-36</td>
                    <td className="border border-gray-300 px-4 py-2">28-30</td>
                    <td className="border border-gray-300 px-4 py-2">36-38</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-semibold">L</td>
                    <td className="border border-gray-300 px-4 py-2">36-38</td>
                    <td className="border border-gray-300 px-4 py-2">30-32</td>
                    <td className="border border-gray-300 px-4 py-2">38-40</td>
                  </tr>
                  <tr>
                    <td className="border border-gray-300 px-4 py-2 font-semibold">XL</td>
                    <td className="border border-gray-300 px-4 py-2">38-40</td>
                    <td className="border border-gray-300 px-4 py-2">32-34</td>
                    <td className="border border-gray-300 px-4 py-2">40-42</td>
                  </tr>
                  <tr className="bg-gray-50">
                    <td className="border border-gray-300 px-4 py-2 font-semibold">XXL</td>
                    <td className="border border-gray-300 px-4 py-2">40-42</td>
                    <td className="border border-gray-300 px-4 py-2">34-36</td>
                    <td className="border border-gray-300 px-4 py-2">42-44</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">How to Measure</h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Bust</h3>
                <p className="text-gray-600">Measure around the fullest part of your bust, keeping the tape parallel to the floor.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Waist</h3>
                <p className="text-gray-600">Measure around your natural waistline, keeping the tape comfortably loose.</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold mb-2">Hips</h3>
                <p className="text-gray-600">Measure around the fullest part of your hips, approximately 8 inches below your waist.</p>
              </div>
            </div>
          </div>

          <div className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">Saree Measurements</h2>
            <div className="bg-red-50 border border-red-200 rounded-lg p-6">
              <p className="text-gray-700">
                <strong>Standard Saree Length:</strong> 5.5 to 6 meters (Free Size)
              </p>
              <p className="text-gray-700 mt-2">
                <strong>Blouse Piece:</strong> 0.8 meters (Can be stitched as per your size)
              </p>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <h3 className="font-semibold text-lg mb-2">Need Help?</h3>
            <p className="text-gray-600">
              If you're between sizes or need assistance with sizing, please contact our customer support team. We're here to help you find the perfect fit!
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SizeGuide;
