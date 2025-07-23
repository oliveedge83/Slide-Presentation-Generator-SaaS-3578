import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiCode, FiPlay, FiInfo, FiCheck } = FiIcons;

const JsonSlideEditor = ({ jsonSlides, onUpdateJson, onParseJson, slides }) => {
  const sampleJson = `[
  {
    "slideTitle": "The Blueprint Mindset: Setting Course Objectives",
    "slideText": "- Defining Clear, Measurable Objectives\\n- Aligning Learner Goals with Business Targets\\n- Course: Introduction to Engaging Course Design: Setting the Foundation"
  },
  {
    "slideTitle": "Why Course Objectives Matter",
    "slideText": "- Provide clear direction for course design and development\\n- Align learner expectations with course outcomes\\n- Serve as a foundation for assessment and evaluation\\n- Bridge learner needs and business goals for measurable success"
  },
  {
    "slideTitle": "Characteristics of Effective Course Objectives",
    "slideText": "- Specific: Clearly define what learners will achieve\\n- Measurable: Outcomes can be assessed objectively\\n- Achievable: Realistic given learner background and resources\\n- Relevant: Align with learner needs and business strategy\\n- Time-bound: Set within a defined timeframe or course duration"
  }
]`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sampleJson);
  };

  return (
    <div className="space-y-6">
      {/* Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start">
          <SafeIcon icon={FiInfo} className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              JSON Format Instructions
            </h3>
            <p className="text-sm text-blue-700 mb-3">
              Provide slides data as a JSON array. Each slide object must have:
            </p>
            <ul className="text-sm text-blue-700 list-disc list-inside space-y-1 mb-3">
              <li><code className="bg-blue-100 px-1 rounded">slideTitle</code> - The title of the slide</li>
              <li><code className="bg-blue-100 px-1 rounded">slideText</code> - The content/bullet points (use \n for line breaks)</li>
            </ul>
            <button
              onClick={copyToClipboard}
              className="text-xs text-blue-600 hover:text-blue-500 underline"
            >
              Copy sample JSON format
            </button>
          </div>
        </div>
      </div>

      {/* Sample JSON Display */}
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-sm font-medium text-gray-900">Sample JSON Format</h4>
        </div>
        <pre className="text-xs text-gray-600 bg-white p-3 rounded border overflow-x-auto">
          {sampleJson}
        </pre>
      </div>

      {/* JSON Input */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm font-medium text-gray-700">
            JSON Slides Data
          </label>
          {slides.length > 0 && (
            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
              <SafeIcon icon={FiCheck} className="h-3 w-3 mr-1" />
              {slides.length} slides parsed
            </span>
          )}
        </div>
        <textarea
          value={jsonSlides}
          onChange={(e) => onUpdateJson(e.target.value)}
          placeholder="Paste your JSON slides data here..."
          rows={12}
          className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
        />
      </div>

      {/* Parse Button */}
      <div className="flex justify-start">
        <button
          onClick={onParseJson}
          disabled={!jsonSlides.trim()}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SafeIcon icon={FiPlay} className="h-4 w-4 mr-2" />
          Parse JSON & Create Slides
        </button>
      </div>

      {/* Parsed Slides Preview */}
      {slides.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <h3 className="text-lg font-semibold text-gray-900">Parsed Slides Preview</h3>
          <div className="space-y-3">
            {slides.map((slide, index) => (
              <div key={slide.id} className="bg-white border border-gray-200 rounded-lg p-4">
                <h4 className="font-medium text-gray-900 mb-2">
                  Slide {index + 1}: {slide.title}
                </h4>
                <div className="text-sm text-gray-600 whitespace-pre-line">
                  {slide.content}
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default JsonSlideEditor;