import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToken } from '../contexts/TokenContext';
import { v4 as uuidv4 } from 'uuid';
import SafeIcon from '../common/SafeIcon';
import SlideEditor from '../components/SlideEditor';
import VoiceoverEditor from '../components/VoiceoverEditor';
import JsonSlideEditor from '../components/JsonSlideEditor';
import PresentationGenerator from '../components/PresentationGenerator';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiTrash2, FiSave, FiPlay, FiCode, FiEdit3 } = FiIcons;

const CreatePresentation = () => {
  const { user } = useAuth();
  const { hasToken } = useToken();
  const [title, setTitle] = useState('');
  const [inputMode, setInputMode] = useState('manual'); // 'manual' or 'json'
  const [slides, setSlides] = useState([
    { id: uuidv4(), title: '', content: '' }
  ]);
  const [jsonSlides, setJsonSlides] = useState('');
  const [voiceovers, setVoiceovers] = useState([
    { id: uuidv4(), slideNumber: 1, text: '', timestamp: '00:00' }
  ]);
  const [activeTab, setActiveTab] = useState('slides');
  const [isGenerating, setIsGenerating] = useState(false);

  const addSlide = () => {
    const newSlide = { id: uuidv4(), title: '', content: '' };
    setSlides([...slides, newSlide]);
    
    // Also add a corresponding voiceover
    const newVoiceover = { 
      id: uuidv4(), 
      slideNumber: slides.length + 1, 
      text: '', 
      timestamp: '00:00' 
    };
    setVoiceovers([...voiceovers, newVoiceover]);
  };

  const removeSlide = (slideId, slideIndex) => {
    if (slides.length === 1) {
      toast.error('You must have at least one slide');
      return;
    }
    
    setSlides(slides.filter(slide => slide.id !== slideId));
    setVoiceovers(voiceovers.filter(vo => vo.slideNumber !== slideIndex + 1));
    
    // Reorder remaining voiceovers
    const updatedVoiceovers = voiceovers
      .filter(vo => vo.slideNumber !== slideIndex + 1)
      .map(vo => ({
        ...vo,
        slideNumber: vo.slideNumber > slideIndex + 1 ? vo.slideNumber - 1 : vo.slideNumber
      }));
    setVoiceovers(updatedVoiceovers);
  };

  const updateSlide = (slideId, field, value) => {
    setSlides(slides.map(slide => 
      slide.id === slideId ? { ...slide, [field]: value } : slide
    ));
  };

  const updateVoiceover = (voiceoverId, field, value) => {
    setVoiceovers(voiceovers.map(vo => 
      vo.id === voiceoverId ? { ...vo, [field]: value } : vo
    ));
  };

  const parseJsonSlides = () => {
    try {
      const parsedSlides = JSON.parse(jsonSlides);
      
      if (!Array.isArray(parsedSlides)) {
        toast.error('JSON must be an array of slide objects');
        return;
      }

      const processedSlides = parsedSlides.map((slide, index) => {
        if (!slide.slideTitle || !slide.slideText) {
          throw new Error(`Slide ${index + 1} must have 'slideTitle' and 'slideText' properties`);
        }
        return {
          id: uuidv4(),
          title: slide.slideTitle,
          content: slide.slideText
        };
      });

      setSlides(processedSlides);
      
      // Update voiceovers to match slide count
      const newVoiceovers = processedSlides.map((_, index) => ({
        id: uuidv4(),
        slideNumber: index + 1,
        text: '',
        timestamp: '00:00'
      }));
      setVoiceovers(newVoiceovers);
      
      toast.success(`Successfully parsed ${processedSlides.length} slides from JSON`);
      setActiveTab('slides');
      
    } catch (error) {
      console.error('JSON Parse Error:', error);
      toast.error(`Invalid JSON format: ${error.message}`);
    }
  };

  const savePresentation = () => {
    if (!title.trim()) {
      toast.error('Please enter a presentation title');
      return;
    }

    if (slides.some(slide => !slide.title.trim())) {
      toast.error('Please fill in all slide titles');
      return;
    }

    const presentation = {
      id: uuidv4(),
      title: title.trim(),
      slides,
      voiceovers,
      createdAt: new Date().toISOString(),
      userId: user.id,
      inputMode
    };

    const existingPresentations = JSON.parse(localStorage.getItem(`presentations_${user.id}`) || '[]');
    existingPresentations.push(presentation);
    localStorage.setItem(`presentations_${user.id}`, JSON.stringify(existingPresentations));

    toast.success('Presentation saved successfully!');
  };

  const getCurrentSlides = () => {
    return inputMode === 'json' ? slides : slides;
  };

  if (!hasToken) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6 text-center">
          <h2 className="text-lg font-semibold text-yellow-800 mb-2">
            Google API Token Required
          </h2>
          <p className="text-yellow-700 mb-4">
            You need to configure your Google Slides API token before creating presentations.
          </p>
          <a
            href="#/settings"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Go to Token Settings
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Presentation</h1>
        <p className="text-gray-600">
          Design your slides manually or import from JSON format
        </p>
      </div>

      {/* Presentation Title */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <div className="space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
              Presentation Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter your presentation title..."
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            />
          </div>

          {/* Input Mode Toggle */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Input Mode
            </label>
            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  value="manual"
                  checked={inputMode === 'manual'}
                  onChange={(e) => setInputMode(e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">Manual Slide Creation</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  value="json"
                  checked={inputMode === 'json'}
                  onChange={(e) => setInputMode(e.target.value)}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <span className="ml-2 text-sm text-gray-700">JSON Import</span>
              </label>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('slides')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'slides'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <SafeIcon icon={inputMode === 'json' ? FiCode : FiEdit3} className="h-4 w-4 mr-1 inline" />
              {inputMode === 'json' ? 'JSON Input' : 'Slides'} ({slides.length})
            </button>
            <button
              onClick={() => setActiveTab('voiceovers')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'voiceovers'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Voiceovers ({voiceovers.length})
            </button>
            <button
              onClick={() => setActiveTab('generate')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'generate'
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Generate
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'slides' && (
            <>
              {inputMode === 'manual' ? (
                <SlideEditor
                  slides={slides}
                  onUpdateSlide={updateSlide}
                  onRemoveSlide={removeSlide}
                  onAddSlide={addSlide}
                />
              ) : (
                <JsonSlideEditor
                  jsonSlides={jsonSlides}
                  onUpdateJson={setJsonSlides}
                  onParseJson={parseJsonSlides}
                  slides={slides}
                />
              )}
            </>
          )}

          {activeTab === 'voiceovers' && (
            <VoiceoverEditor
              voiceovers={voiceovers}
              slides={slides}
              onUpdateVoiceover={updateVoiceover}
            />
          )}

          {activeTab === 'generate' && (
            <PresentationGenerator
              title={title}
              slides={getCurrentSlides()}
              voiceovers={voiceovers}
              userId={user.id}
            />
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between">
        <button
          onClick={savePresentation}
          disabled={!title.trim() || slides.some(slide => !slide.title.trim())}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SafeIcon icon={FiSave} className="h-4 w-4 mr-2" />
          Save Presentation
        </button>

        <div className="text-sm text-gray-500">
          {slides.length} slides • {voiceovers.filter(vo => vo.text.trim()).length} voiceovers • {inputMode} mode
        </div>
      </div>
    </div>
  );
};

export default CreatePresentation;