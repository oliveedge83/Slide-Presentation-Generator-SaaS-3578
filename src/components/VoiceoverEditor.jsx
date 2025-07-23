import React from 'react';
import { motion } from 'framer-motion';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiMic, FiClock } = FiIcons;

const VoiceoverEditor = ({ voiceovers, slides, onUpdateVoiceover }) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Voiceover Script</h3>
        <p className="text-sm text-gray-600 mt-1">
          Add voiceover text for each slide with timing information
        </p>
      </div>

      <div className="space-y-4">
        {voiceovers.map((voiceover, index) => {
          const correspondingSlide = slides[index];
          return (
            <motion.div
              key={voiceover.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-gray-50 rounded-lg p-4 border border-gray-200"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiMic} className="h-4 w-4 text-primary-500" />
                  <span className="text-sm font-medium text-gray-700">
                    Slide {voiceover.slideNumber}: {correspondingSlide?.title || 'Untitled'}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <SafeIcon icon={FiClock} className="h-4 w-4 text-gray-400" />
                  <input
                    type="text"
                    value={voiceover.timestamp}
                    onChange={(e) => onUpdateVoiceover(voiceover.id, 'timestamp', e.target.value)}
                    placeholder="00:00"
                    className="w-16 px-2 py-1 text-xs border border-gray-300 rounded"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voiceover Script
                </label>
                <textarea
                  value={voiceover.text}
                  onChange={(e) => onUpdateVoiceover(voiceover.id, 'text', e.target.value)}
                  placeholder="Enter the voiceover script for this slide..."
                  rows={4}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                />
                <p className="mt-1 text-xs text-gray-500">
                  Write the narration text that will accompany this slide
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default VoiceoverEditor;