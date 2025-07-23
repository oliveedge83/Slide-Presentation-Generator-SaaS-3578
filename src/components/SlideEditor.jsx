import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiTrash2, FiMove } = FiIcons;

const SlideEditor = ({ slides, onUpdateSlide, onRemoveSlide, onAddSlide }) => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">Slide Content</h3>
        <button
          onClick={onAddSlide}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
        >
          <SafeIcon icon={FiPlus} className="h-4 w-4 mr-2" />
          Add Slide
        </button>
      </div>

      <div className="space-y-4">
        {slides.map((slide, index) => (
          <motion.div
            key={slide.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-gray-50 rounded-lg p-4 border border-gray-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-2">
                <SafeIcon icon={FiMove} className="h-4 w-4 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">
                  Slide {index + 1}
                </span>
              </div>
              {slides.length > 1 && (
                <button
                  onClick={() => onRemoveSlide(slide.id, index)}
                  className="text-red-500 hover:text-red-700"
                >
                  <SafeIcon icon={FiTrash2} className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slide Title
                </label>
                <input
                  type="text"
                  value={slide.title}
                  onChange={(e) => onUpdateSlide(slide.id, 'title', e.target.value)}
                  placeholder="Enter slide title..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Slide Content (Bullet Points)
                </label>
                <textarea
                  value={slide.content}
                  onChange={(e) => onUpdateSlide(slide.id, 'content', e.target.value)}
                  placeholder="- First bullet point&#10;- Second bullet point&#10;- Third bullet point"
                  rows={6}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Use bullet points starting with "-" for better formatting
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default SlideEditor;