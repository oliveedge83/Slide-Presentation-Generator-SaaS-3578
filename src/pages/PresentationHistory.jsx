import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import SafeIcon from '../common/SafeIcon';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';

const { FiCalendar, FiExternalLink, FiTrash2, FiFileText, FiMic, FiDownload, FiCode, FiEdit3, FiCopy } = FiIcons;

const PresentationHistory = () => {
  const { user } = useAuth();
  const [presentations, setPresentations] = useState([]);
  const [selectedPresentation, setSelectedPresentation] = useState(null);

  useEffect(() => {
    const userPresentations = JSON.parse(localStorage.getItem(`presentations_${user.id}`) || '[]');
    setPresentations(userPresentations.reverse()); // Show newest first
  }, [user]);

  const deletePresentation = (presentationId) => {
    if (window.confirm('Are you sure you want to delete this presentation?')) {
      const updatedPresentations = presentations.filter(p => p.id !== presentationId);
      setPresentations(updatedPresentations);
      localStorage.setItem(`presentations_${user.id}`, JSON.stringify(updatedPresentations.reverse()));
      setSelectedPresentation(null);
      toast.success('Presentation deleted successfully');
    }
  };

  const copyTemplateId = (templateId) => {
    navigator.clipboard.writeText(templateId);
    toast.success('Template ID copied to clipboard!');
  };

  const downloadFormats = [
    { name: 'PDF', format: 'pdf', description: 'Best for sharing and printing' },
    { name: 'PowerPoint', format: 'pptx', description: 'Edit in Microsoft PowerPoint' },
    { name: 'JPEG', format: 'jpeg', description: 'Images of each slide' },
    { name: 'PNG', format: 'png', description: 'High-quality images' },
    { name: 'SVG', format: 'svg', description: 'Scalable vector graphics' },
    { name: 'Text', format: 'txt', description: 'Plain text content' }
  ];

  const downloadPresentation = (presentationId, format) => {
    if (!presentationId) {
      toast.error('Presentation ID not available');
      return;
    }

    const downloadUrl = `https://docs.google.com/presentation/d/${presentationId}/export/${format}`;
    
    // Create a temporary link and click it
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = `${selectedPresentation?.title || 'presentation'}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloading as ${format.toUpperCase()}...`);
  };

  const convertToPdfAndDownload = (presentationId, title) => {
    if (!presentationId) {
      toast.error('Presentation ID not available');
      return;
    }

    const pdfUrl = `https://docs.google.com/presentation/d/${presentationId}/export/pdf`;
    
    // Create a temporary link for PDF download
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.target = '_blank';
    link.download = `${title || 'presentation'}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('Converting to PDF and downloading...');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Presentation History</h1>
        <p className="text-gray-600">
          View, download, and manage your created presentations
        </p>
      </div>

      {presentations.length === 0 ? (
        <div className="text-center py-12">
          <SafeIcon icon={FiFileText} className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No presentations yet</h3>
          <p className="text-gray-600 mb-4">
            Create your first presentation to see it here
          </p>
          <a
            href="#/create"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700"
          >
            Create Presentation
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Presentations List */}
          <div className="lg:col-span-1 space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">
              All Presentations ({presentations.length})
            </h2>
            <div className="space-y-3">
              {presentations.map((presentation, index) => (
                <motion.div
                  key={presentation.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => setSelectedPresentation(presentation)}
                  className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                    selectedPresentation?.id === presentation.id
                      ? 'border-primary-300 bg-primary-50'
                      : 'border-gray-200 bg-white hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-gray-900 flex-1 pr-2">
                      {presentation.title}
                    </h3>
                    <SafeIcon 
                      icon={presentation.inputMode === 'json' ? FiCode : FiEdit3} 
                      className="h-4 w-4 text-gray-400 flex-shrink-0" 
                    />
                  </div>
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <SafeIcon icon={FiCalendar} className="h-4 w-4 mr-1" />
                    {new Date(presentation.createdAt).toLocaleDateString()}
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-600">
                    <span>{presentation.slides.length} slides</span>
                    <span>{presentation.voiceovers?.filter(vo => vo.text.trim()).length || 0} voiceovers</span>
                  </div>
                  {presentation.presentationId && (
                    <div className="mt-2 flex items-center space-x-2">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Generated
                      </span>
                      {presentation.templateId && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Template
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Presentation Details */}
          <div className="lg:col-span-2">
            {selectedPresentation ? (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-white rounded-lg shadow p-6"
              >
                <div className="flex items-start justify-between mb-6">
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-2">
                      {selectedPresentation.title}
                    </h2>
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <SafeIcon icon={FiCalendar} className="h-4 w-4 mr-1" />
                        Created {new Date(selectedPresentation.createdAt).toLocaleDateString()}
                      </div>
                      <div className="flex items-center">
                        <SafeIcon icon={selectedPresentation.inputMode === 'json' ? FiCode : FiEdit3} className="h-4 w-4 mr-1" />
                        {selectedPresentation.inputMode === 'json' ? 'JSON Input' : 'Manual Input'}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {selectedPresentation.presentationId && (
                      <>
                        <a
                          href={selectedPresentation.editUrl || `https://docs.google.com/presentation/d/${selectedPresentation.presentationId}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                        >
                          <SafeIcon icon={FiExternalLink} className="h-4 w-4 mr-2" />
                          Edit
                        </a>
                        <button
                          onClick={() => convertToPdfAndDownload(selectedPresentation.presentationId, selectedPresentation.title)}
                          className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-green-50 hover:bg-green-100"
                        >
                          <SafeIcon icon={FiDownload} className="h-4 w-4 mr-2" />
                          PDF
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => deletePresentation(selectedPresentation.id)}
                      className="inline-flex items-center px-3 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-white hover:bg-red-50"
                    >
                      <SafeIcon icon={FiTrash2} className="h-4 w-4 mr-2" />
                      Delete
                    </button>
                  </div>
                </div>

                {/* Template Information */}
                {selectedPresentation.templateId && (
                  <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                    <h3 className="text-sm font-medium text-blue-800 mb-3">Template Information</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">Template ID:</span>
                        <div className="flex items-center space-x-2">
                          <code className="text-xs bg-blue-100 px-2 py-1 rounded">
                            {selectedPresentation.templateId}
                          </code>
                          <button
                            onClick={() => copyTemplateId(selectedPresentation.templateId)}
                            className="text-blue-600 hover:text-blue-500"
                          >
                            <SafeIcon icon={FiCopy} className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-blue-700">View Template:</span>
                        <a
                          href={`https://docs.google.com/presentation/d/${selectedPresentation.templateId}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-500 underline"
                        >
                          Open Template
                        </a>
                      </div>
                    </div>
                  </div>
                )}

                {/* Google Slides Links */}
                {selectedPresentation.presentationId && (
                  <div className="mb-6 p-4 bg-green-50 rounded-lg">
                    <h3 className="text-sm font-medium text-green-800 mb-3">Google Slides Links</h3>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Edit Presentation:</span>
                        <a
                          href={selectedPresentation.editUrl || `https://docs.google.com/presentation/d/${selectedPresentation.presentationId}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:text-green-500 underline"
                        >
                          Open in Google Slides
                        </a>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-green-700">Presentation ID:</span>
                        <code className="text-xs bg-green-100 px-2 py-1 rounded">
                          {selectedPresentation.presentationId}
                        </code>
                      </div>
                    </div>
                  </div>
                )}

                {/* Download Options */}
                {selectedPresentation.presentationId && (
                  <div className="mb-6">
                    <h3 className="text-sm font-medium text-gray-900 mb-3">Download Options</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {downloadFormats.map((format) => (
                        <button
                          key={format.format}
                          onClick={() => downloadPresentation(selectedPresentation.presentationId, format.format)}
                          className="inline-flex items-start px-4 py-3 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 text-left"
                        >
                          <SafeIcon icon={FiDownload} className="h-4 w-4 mr-3 mt-0.5 flex-shrink-0" />
                          <div>
                            <div className="font-medium">{format.name}</div>
                            <div className="text-xs text-gray-500">{format.description}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Slides */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
                    Slides ({selectedPresentation.slides.length})
                  </h3>
                  <div className="space-y-3">
                    {selectedPresentation.slides.map((slide, index) => (
                      <div key={slide.id} className="border border-gray-200 rounded-lg p-4">
                        <h4 className="font-medium text-gray-900 mb-2">
                          Slide {index + 1}: {slide.title}
                        </h4>
                        <div className="text-sm text-gray-600 whitespace-pre-line">
                          {slide.content}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Voiceovers */}
                {selectedPresentation.voiceovers?.some(vo => vo.text.trim()) && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">
                      <SafeIcon icon={FiMic} className="h-5 w-5 inline mr-2" />
                      Voiceover Script
                    </h3>
                    <div className="space-y-3">
                      {selectedPresentation.voiceovers
                        .filter(vo => vo.text.trim())
                        .map((voiceover) => (
                          <div key={voiceover.id} className="border border-gray-200 rounded-lg p-4">
                            <div className="flex items-center justify-between mb-2">
                              <h4 className="font-medium text-gray-900">
                                Slide {voiceover.slideNumber}
                              </h4>
                              <span className="text-sm text-gray-500">
                                {voiceover.timestamp}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">
                              {voiceover.text}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                )}
              </motion.div>
            ) : (
              <div className="bg-gray-50 rounded-lg p-8 text-center">
                <SafeIcon icon={FiFileText} className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Select a presentation
                </h3>
                <p className="text-gray-600">
                  Choose a presentation from the list to view its details and download options
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationHistory;