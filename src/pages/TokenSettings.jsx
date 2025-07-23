import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useToken } from '../contexts/TokenContext';
import SafeIcon from '../common/SafeIcon';
import toast from 'react-hot-toast';
import * as FiIcons from 'react-icons/fi';

const { FiKey, FiTrash2, FiSave, FiExternalLink, FiInfo, FiClock, FiAlertTriangle, FiCheckCircle } = FiIcons;

const TokenSettings = () => {
  const { 
    token, 
    saveToken, 
    clearToken, 
    hasToken, 
    validateToken, 
    tokenExpiry, 
    isTokenExpiringSoon, 
    tokenTimeRemaining 
  } = useToken();
  
  const [newToken, setNewToken] = useState(token || '');
  const [showToken, setShowToken] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [tokenStatus, setTokenStatus] = useState(null);

  useEffect(() => {
    if (hasToken) {
      checkTokenStatus();
    }
  }, [hasToken]);

  const checkTokenStatus = async () => {
    if (!hasToken) return;
    
    setIsValidating(true);
    try {
      const isValid = await validateToken();
      setTokenStatus(isValid ? 'valid' : 'invalid');
    } catch (error) {
      setTokenStatus('invalid');
    } finally {
      setIsValidating(false);
    }
  };

  const handleSaveToken = async () => {
    if (!newToken.trim()) {
      toast.error('Please enter a valid token');
      return;
    }

    setIsValidating(true);
    
    try {
      // Test the token before saving
      const response = await fetch('https://www.googleapis.com/oauth2/v1/tokeninfo?access_token=' + newToken.trim());
      
      if (!response.ok) {
        toast.error('Invalid token. Please check your token and try again.');
        setIsValidating(false);
        return;
      }
      
      const tokenInfo = await response.json();
      
      // Check if token has required scopes
      if (!tokenInfo.scope || !tokenInfo.scope.includes('presentations')) {
        toast.error('Token does not have required Google Slides permissions. Please ensure you select the correct scope.');
        setIsValidating(false);
        return;
      }
      
      saveToken(newToken.trim());
      setTokenStatus('valid');
      toast.success('Token saved and validated successfully!');
      
    } catch (error) {
      console.error('Token validation error:', error);
      toast.error('Failed to validate token. Please try again.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleClearToken = () => {
    if (window.confirm('Are you sure you want to clear your API token? You will not be able to create presentations without it.')) {
      clearToken();
      setNewToken('');
      setTokenStatus(null);
      toast.success('Token cleared successfully');
    }
  };

  const getTokenStatusColor = () => {
    if (isValidating) return 'text-yellow-600';
    if (tokenStatus === 'valid') return 'text-green-600';
    if (tokenStatus === 'invalid') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTokenStatusIcon = () => {
    if (isValidating) return FiClock;
    if (tokenStatus === 'valid') return FiCheckCircle;
    if (tokenStatus === 'invalid') return FiAlertTriangle;
    return FiKey;
  };

  const formatTokenExpiry = () => {
    if (!tokenExpiry) return 'Unknown';
    return tokenExpiry.toLocaleString();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google API Token Settings</h1>
        <p className="text-gray-600">
          Manage your Google Slides API authentication token
        </p>
      </div>

      {/* Token Status Alert */}
      {hasToken && isTokenExpiringSoon && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <SafeIcon icon={FiAlertTriangle} className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Token Expiring Soon
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                Your token will expire in {tokenTimeRemaining} minutes. Please refresh it to continue using the service.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Instructions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-blue-50 border border-blue-200 rounded-lg p-6"
      >
        <div className="flex items-start">
          <SafeIcon icon={FiInfo} className="h-5 w-5 text-blue-500 mt-0.5 mr-3 flex-shrink-0" />
          <div>
            <h3 className="text-sm font-medium text-blue-800 mb-2">
              How to get your Google API Token
            </h3>
            <ol className="text-sm text-blue-700 space-y-2 list-decimal list-inside">
              <li>Go to the <a href="https://developers.google.com/oauthplayground/" target="_blank" rel="noopener noreferrer" className="underline font-medium">Google OAuth 2.0 Playground</a></li>
              <li>In Step 1, select "Google Slides API v1" and check the scope: <code className="bg-blue-100 px-1 rounded">https://www.googleapis.com/auth/presentations</code></li>
              <li>Also check: <code className="bg-blue-100 px-1 rounded">https://www.googleapis.com/auth/drive.file</code> (for template copying)</li>
              <li>Click "Authorize APIs" and sign in with your Google account</li>
              <li>In Step 2, click "Exchange authorization code for tokens"</li>
              <li>Copy the "Access token" and paste it below</li>
            </ol>
            <div className="mt-3 p-3 bg-blue-100 rounded-lg">
              <p className="text-sm text-blue-800 font-medium">Important:</p>
              <p className="text-sm text-blue-700">
                Access tokens expire after 1 hour. You'll need to refresh your token periodically.
              </p>
            </div>
            <div className="mt-3">
              <a
                href="https://developers.google.com/oauthplayground/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500"
              >
                Open OAuth Playground
                <SafeIcon icon={FiExternalLink} className="ml-1 h-4 w-4" />
              </a>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Token Management Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-white rounded-lg shadow p-6"
      >
        <div className="flex items-center mb-4">
          <SafeIcon icon={FiKey} className="h-5 w-5 text-gray-500 mr-2" />
          <h2 className="text-lg font-semibold text-gray-900">API Token</h2>
          {hasToken && (
            <div className="ml-auto flex items-center space-x-2">
              <SafeIcon 
                icon={getTokenStatusIcon()} 
                className={`h-4 w-4 ${getTokenStatusColor()}`} 
              />
              <span className={`text-sm font-medium ${getTokenStatusColor()}`}>
                {isValidating ? 'Validating...' : tokenStatus === 'valid' ? 'Valid' : tokenStatus === 'invalid' ? 'Invalid' : 'Unknown'}
              </span>
            </div>
          )}
        </div>

        {/* Token Status Details */}
        {hasToken && tokenExpiry && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="font-medium text-gray-700">Status:</span>
                <span className={`ml-2 ${getTokenStatusColor()}`}>
                  {tokenStatus === 'valid' ? 'Active' : tokenStatus === 'invalid' ? 'Expired/Invalid' : 'Unknown'}
                </span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Expires:</span>
                <span className="ml-2 text-gray-600">{formatTokenExpiry()}</span>
              </div>
              <div>
                <span className="font-medium text-gray-700">Time Remaining:</span>
                <span className={`ml-2 ${isTokenExpiringSoon ? 'text-yellow-600' : 'text-gray-600'}`}>
                  {tokenTimeRemaining !== null ? `${tokenTimeRemaining} minutes` : 'Unknown'}
                </span>
              </div>
              <div>
                <button
                  onClick={checkTokenStatus}
                  disabled={isValidating}
                  className="text-sm text-primary-600 hover:text-primary-500 underline disabled:opacity-50"
                >
                  {isValidating ? 'Checking...' : 'Check Status'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-2">
              Google Slides API Token
            </label>
            <div className="relative">
              <input
                id="token"
                type={showToken ? 'text' : 'password'}
                value={newToken}
                onChange={(e) => setNewToken(e.target.value)}
                placeholder="Paste your Google API access token here..."
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              />
              <button
                type="button"
                onClick={() => setShowToken(!showToken)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm text-gray-500 hover:text-gray-700"
              >
                {showToken ? 'Hide' : 'Show'}
              </button>
            </div>
          </div>

          <div className="flex space-x-3">
            <button
              onClick={handleSaveToken}
              disabled={!newToken.trim() || isValidating}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <SafeIcon icon={isValidating ? FiClock : FiSave} className="h-4 w-4 mr-2" />
              {isValidating ? 'Validating...' : 'Save & Validate Token'}
            </button>

            {hasToken && (
              <button
                onClick={handleClearToken}
                className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
              >
                <SafeIcon icon={FiTrash2} className="h-4 w-4 mr-2" />
                Clear Token
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Security Notice */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
      >
        <div className="flex">
          <SafeIcon icon={FiInfo} className="h-5 w-5 text-yellow-400 mr-3 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-yellow-800">
              Security & Token Management
            </h3>
            <div className="text-sm text-yellow-700 mt-1 space-y-1">
              <p>• Your API token is stored locally in your browser and never sent to our servers</p>
              <p>• Tokens automatically expire after 1 hour for security</p>
              <p>• You'll receive warnings when your token is about to expire</p>
              <p>• The token is automatically cleared when you log out</p>
              <p>• For best security, refresh your token regularly</p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default TokenSettings;