import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useToken } from '../contexts/TokenContext';
import SafeIcon from '../common/SafeIcon';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';

const { FiPlay, FiDownload, FiExternalLink, FiCode, FiCopy, FiAlertCircle, FiSettings, FiRefreshCw } = FiIcons;

const PresentationGenerator = ({ title, slides, voiceovers, userId }) => {
  const { token, validateToken, isTokenExpiringSoon, tokenTimeRemaining } = useToken();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPresentation, setGeneratedPresentation] = useState(null);
  const [showJsonOutput, setShowJsonOutput] = useState(false);
  const [generationError, setGenerationError] = useState(null);
  const [templateId, setTemplateId] = useState('1Ggmb8DZM02xwKqNL4Yht7-ysoLHNgWc0Q0VySeYfxSE');
  const [showTemplateSettings, setShowTemplateSettings] = useState(false);

  const generateBatchRequest = (presentationId) => {
    const requests = [];

    // First, find and replace the title placeholder on the first slide
    requests.push({
      "replaceAllText": {
        "containsText": {
          "text": "{{PRESENTATION_TITLE}}",
          "matchCase": false
        },
        "replaceText": title
      }
    });

    // Then replace content placeholders for each slide
    slides.forEach((slide, index) => {
      // Replace slide title placeholder
      requests.push({
        "replaceAllText": {
          "containsText": {
            "text": "{{slide_title}}",
            "matchCase": false
          },
          "replaceText": slide.title
        }
      });

      // Replace slide content placeholder
      requests.push({
        "replaceAllText": {
          "containsText": {
            "text": "{{slide_content}}",
            "matchCase": false
          },
          "replaceText": slide.content
        }
      });
    });

    return { requests };
  };

  const copyPresentationFromTemplate = async (templateId, newTitle) => {
    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${templateId}/copy`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newTitle,
          parents: [] // This will place it in the root folder
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        
        if (response.status === 401) {
          throw new Error('Your Google API token has expired. Please refresh it in Token Settings.');
        }
        
        if (response.status === 403) {
          throw new Error('Access denied. Please check if the template is shared with your Google account.');
        }
        
        if (response.status === 404) {
          throw new Error('Template not found. Please check the template ID.');
        }
        
        throw new Error(
          `Failed to copy template (${response.status}): ${
            errorData?.error?.message || response.statusText
          }`
        );
      }

      const copiedFile = await response.json();
      return copiedFile.id;
    } catch (error) {
      console.error('Error copying template:', error);
      throw error;
    }
  };

  const generatePresentation = async () => {
    if (!title.trim()) {
      toast.error('Please enter a presentation title');
      return;
    }

    if (slides.some(slide => !slide.title.trim())) {
      toast.error('Please fill in all slide titles');
      return;
    }

    if (!templateId.trim()) {
      toast.error('Please enter a template ID');
      return;
    }

    // Validate token before proceeding
    const isTokenValid = await validateToken();
    if (!isTokenValid) {
      toast.error('Your Google API token is invalid or expired. Please refresh it in Token Settings.');
      return;
    }

    setIsGenerating(true);
    setGenerationError(null);

    try {
      // Step 1: Copy the template presentation
      toast.loading('Copying template presentation...', { id: 'copy-template' });
      const presentationId = await copyPresentationFromTemplate(templateId, title);
      toast.dismiss('copy-template');

      // Step 2: Replace placeholders with actual content
      toast.loading('Updating slide content...', { id: 'update-content' });
      const batchRequest = generateBatchRequest(presentationId);
      
      const updateResponse = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(batchRequest)
      });

      if (!updateResponse.ok) {
        const errorData = await updateResponse.json().catch(() => null);
        
        if (updateResponse.status === 401) {
          throw new Error('Your Google API token has expired during generation. Please refresh it in Token Settings.');
        }
        
        throw new Error(
          `Failed to update slides (${updateResponse.status}): ${
            errorData?.error?.message || updateResponse.statusText
          }`
        );
      }

      toast.dismiss('update-content');

      // Step 3: Add additional slides if needed (beyond template slides)
      const templateSlideCount = 5; // Adjust based on your template
      if (slides.length > templateSlideCount - 1) { // -1 for title slide
        toast.loading('Adding additional slides...', { id: 'add-slides' });
        
        const additionalSlides = slides.slice(templateSlideCount - 1);
        const additionalSlideRequests = additionalSlides.flatMap((slide, index) => {
          const slideId = `additional_slide_${index}`;
          const titleId = `additional_title_${index}`;
          const bodyId = `additional_body_${index}`;

          return [
            {
              "createSlide": {
                "objectId": slideId,
                "slideLayoutReference": { "predefinedLayout": "TITLE_AND_BODY" },
                "placeholderIdMappings": [
                  { "layoutPlaceholder": { "type": "TITLE" }, "objectId": titleId },
                  { "layoutPlaceholder": { "type": "BODY" }, "objectId": bodyId }
                ]
              }
            },
            {
              "insertText": {
                "objectId": titleId,
                "text": slide.title
              }
            },
            {
              "insertText": {
                "objectId": bodyId,
                "text": slide.content
              }
            }
          ];
        });

        if (additionalSlideRequests.length > 0) {
          const additionalResponse = await fetch(`https://slides.googleapis.com/v1/presentations/${presentationId}:batchUpdate`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ requests: additionalSlideRequests })
          });

          if (!additionalResponse.ok) {
            const errorData = await additionalResponse.json().catch(() => null);
            console.warn('Failed to add additional slides:', errorData?.error?.message);
          }
        }

        toast.dismiss('add-slides');
      }

      // Save to local storage
      const presentation = {
        id: presentationId,
        title,
        slides,
        voiceovers,
        presentationId,
        templateId,
        createdAt: new Date().toISOString(),
        userId,
        googleSlidesUrl: `https://docs.google.com/presentation/d/${presentationId}`,
        editUrl: `https://docs.google.com/presentation/d/${presentationId}/edit`,
        exportUrls: {
          pdf: `https://docs.google.com/presentation/d/${presentationId}/export/pdf`,
          pptx: `https://docs.google.com/presentation/d/${presentationId}/export/pptx`,
          jpeg: `https://docs.google.com/presentation/d/${presentationId}/export/jpeg`,
          png: `https://docs.google.com/presentation/d/${presentationId}/export/png`,
          svg: `https://docs.google.com/presentation/d/${presentationId}/export/svg`,
          txt: `https://docs.google.com/presentation/d/${presentationId}/export/txt`
        }
      };

      const existingPresentations = JSON.parse(localStorage.getItem(`presentations_${userId}`) || '[]');
      existingPresentations.push(presentation);
      localStorage.setItem(`presentations_${userId}`, JSON.stringify(existingPresentations));

      setGeneratedPresentation(presentation);
      toast.success('Presentation created successfully with template styling!');

    } catch (error) {
      console.error('Error generating presentation:', error);
      setGenerationError(error.message);
      toast.error('Failed to generate presentation: ' + error.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyJsonToClipboard = () => {
    const jsonData = JSON.stringify(generateBatchRequest('PRESENTATION_ID'), null, 2);
    navigator.clipboard.writeText(jsonData);
    toast.success('JSON copied to clipboard!');
  };

  const downloadFormats = [
    { name: 'PDF', format: 'pdf', description: 'Portable Document Format' },
    { name: 'PowerPoint', format: 'pptx', description: 'Microsoft PowerPoint' },
    { name: 'JPEG Images', format: 'jpeg', description: 'Image format (each slide)' },
    { name: 'PNG Images', format: 'png', description: 'Image format (each slide)' },
    { name: 'SVG Images', format: 'svg', description: 'Vector graphics' },
    { name: 'Plain Text', format: 'txt', description: 'Text-only content' }
  ];

  const downloadPresentation = (format) => {
    if (!generatedPresentation?.presentationId) {
      toast.error('No presentation to download');
      return;
    }

    const downloadUrl = generatedPresentation.exportUrls[format];
    if (!downloadUrl) {
      toast.error('Download URL not available');
      return;
    }

    // Create a temporary link and click it to trigger download
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.target = '_blank';
    link.download = `${generatedPresentation.title}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Downloading ${generatedPresentation.title} as ${format.toUpperCase()}...`);
  };

  // Template placeholder constants
  const TEMPLATE_PLACEHOLDERS = {
    PRESENTATION_TITLE: '{{PRESENTATION_TITLE}}',
    SLIDE_TITLE: '{{slide_title}}',
    SLIDE_CONTENT: '{{slide_content}}'
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900">Generate Presentation</h3>
        <p className="text-sm text-gray-600 mt-1">
          Create your Google Slides presentation using a master template with consistent theming
        </p>
      </div>

      {/* Token Warning */}
      {isTokenExpiringSoon && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <SafeIcon icon={FiAlertCircle} className="h-5 w-5 text-yellow-400 mr-3" />
            <div className="flex-1">
              <h3 className="text-sm font-medium text-yellow-800">
                Token Expiring Soon
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your Google API token will expire in {tokenTimeRemaining} minutes. 
                <a href="#/settings" className="font-medium underline ml-1">
                  Refresh it now
                </a>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Template Settings */}
      <div className="bg-white rounded-lg border border-gray-200 p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-gray-900">Template Settings</h4>
          <button
            onClick={() => setShowTemplateSettings(!showTemplateSettings)}
            className="text-sm text-primary-600 hover:text-primary-500"
          >
            <SafeIcon icon={FiSettings} className="h-4 w-4 inline mr-1" />
            {showTemplateSettings ? 'Hide' : 'Configure'}
          </button>
        </div>
        
        {showTemplateSettings && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="space-y-3"
          >
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Master Template ID
              </label>
              <input
                type="text"
                value={templateId}
                onChange={(e) => setTemplateId(e.target.value)}
                placeholder="Enter Google Slides template ID..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <p className="mt-1 text-xs text-gray-500">
                The template should contain placeholders: {TEMPLATE_PLACEHOLDERS.PRESENTATION_TITLE}, {TEMPLATE_PLACEHOLDERS.SLIDE_TITLE}, {TEMPLATE_PLACEHOLDERS.SLIDE_CONTENT}
              </p>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-blue-800 mb-2">Template Requirements:</h5>
              <ul className="text-xs text-blue-700 space-y-1">
                <li>• Title slide with <code className="bg-blue-100 px-1 rounded">{TEMPLATE_PLACEHOLDERS.PRESENTATION_TITLE}</code> placeholder</li>
                <li>• Content slides with <code className="bg-blue-100 px-1 rounded">{TEMPLATE_PLACEHOLDERS.SLIDE_TITLE}</code> and <code className="bg-blue-100 px-1 rounded">{TEMPLATE_PLACEHOLDERS.SLIDE_CONTENT}</code> placeholders</li>
                <li>• Template must be accessible with your Google account</li>
              </ul>
            </div>
          </motion.div>
        )}
        
        <div className="mt-3 text-sm text-gray-600">
          <strong>Current Template:</strong> {templateId || 'Not set'}
        </div>
      </div>

      {/* Generation Summary */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="font-medium text-gray-900 mb-2">Presentation Summary</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p><strong>Title:</strong> {title || 'Untitled Presentation'}</p>
          <p><strong>Slides:</strong> {slides.length}</p>
          <p><strong>Voiceovers:</strong> {voiceovers.filter(vo => vo.text.trim()).length}</p>
          <p><strong>Template:</strong> {templateId ? 'Custom Template' : 'Default'}</p>
        </div>
      </div>

      {/* Generate Button */}
      <div className="flex items-center space-x-4">
        <button
          onClick={generatePresentation}
          disabled={isGenerating || !title.trim() || slides.some(slide => !slide.title.trim()) || !templateId.trim()}
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <SafeIcon icon={isGenerating ? FiRefreshCw : FiPlay} className={`h-5 w-5 mr-2 ${isGenerating ? 'animate-spin' : ''}`} />
          {isGenerating ? 'Generating...' : 'Generate from Template'}
        </button>

        <button
          onClick={() => setShowJsonOutput(!showJsonOutput)}
          className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
        >
          <SafeIcon icon={FiCode} className="h-4 w-4 mr-2" />
          {showJsonOutput ? 'Hide' : 'Show'} API Calls
        </button>
      </div>

      {/* Error Display */}
      {generationError && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-50 border border-red-200 rounded-lg p-4"
        >
          <div className="flex items-start">
            <SafeIcon icon={FiAlertCircle} className="h-5 w-5 text-red-500 mt-0.5 mr-3 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Generation Failed
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{generationError}</p>
              </div>
              <div className="mt-3 flex space-x-3">
                <button
                  onClick={() => setGenerationError(null)}
                  className="text-sm text-red-600 hover:text-red-500 underline"
                >
                  Dismiss
                </button>
                {generationError.includes('token') && (
                  <a
                    href="#/settings"
                    className="text-sm text-red-600 hover:text-red-500 underline"
                  >
                    Go to Token Settings
                  </a>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* JSON Output */}
      {showJsonOutput && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-gray-900 rounded-lg p-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-white">Template Replacement API Calls</h4>
            <button
              onClick={copyJsonToClipboard}
              className="inline-flex items-center px-2 py-1 text-xs text-gray-300 hover:text-white"
            >
              <SafeIcon icon={FiCopy} className="h-3 w-3 mr-1" />
              Copy
            </button>
          </div>
          <pre className="text-xs text-gray-300 overflow-x-auto">
            {JSON.stringify(generateBatchRequest('PRESENTATION_ID'), null, 2)}
          </pre>
        </motion.div>
      )}

      {/* Success State */}
      {generatedPresentation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-green-50 border border-green-200 rounded-lg p-6"
        >
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <SafeIcon icon={FiPlay} className="h-5 w-5 text-green-500" />
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-sm font-medium text-green-800">
                Presentation Created Successfully!
              </h3>
              <div className="mt-2 text-sm text-green-700">
                <p>Your presentation "{generatedPresentation.title}" has been created from template with consistent theming.</p>
                <p className="mt-1">
                  <strong>Presentation ID:</strong> {generatedPresentation.presentationId}
                </p>
                <p className="mt-1">
                  <strong>Template Used:</strong> {generatedPresentation.templateId}
                </p>
              </div>

              <div className="mt-4 space-y-4">
                {/* View and Edit Links */}
                <div className="flex flex-wrap gap-2">
                  <a
                    href={generatedPresentation.editUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <SafeIcon icon={FiExternalLink} className="h-4 w-4 mr-2" />
                    Edit in Google Slides
                  </a>
                  <a
                    href={generatedPresentation.googleSlidesUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center px-3 py-2 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50"
                  >
                    <SafeIcon icon={FiExternalLink} className="h-4 w-4 mr-2" />
                    View Presentation
                  </a>
                </div>

                {/* Download Options */}
                <div>
                  <h4 className="text-sm font-medium text-green-800 mb-3">Download Options</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {downloadFormats.map((format) => (
                      <button
                        key={format.format}
                        onClick={() => downloadPresentation(format.format)}
                        className="inline-flex items-start px-3 py-3 border border-green-300 text-sm font-medium rounded-md text-green-700 bg-white hover:bg-green-50 text-left"
                      >
                        <SafeIcon icon={FiDownload} className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                        <div>
                          <div className="font-medium">{format.name}</div>
                          <div className="text-xs text-green-600">{format.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {/* Voiceover Summary */}
      {voiceovers.some(vo => vo.text.trim()) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Voiceover Script</h4>
          <div className="space-y-2 text-sm">
            {voiceovers.filter(vo => vo.text.trim()).map((vo) => (
              <div key={vo.id} className="flex">
                <span className="font-medium text-blue-700 mr-2">[{vo.timestamp}]</span>
                <span className="text-blue-600">Slide {vo.slideNumber}: {vo.text.substring(0, 100)}...</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationGenerator;