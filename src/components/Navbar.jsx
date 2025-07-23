import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useToken } from '../contexts/TokenContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiUser, FiLogOut, FiKey } = FiIcons;

const Navbar = () => {
  const { user, logout } = useAuth();
  const { hasToken } = useToken();

  return (
    <nav className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-semibold text-gray-900">
              Google Slides Generator
            </h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              {hasToken ? (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  <SafeIcon icon={FiKey} className="w-3 h-3 mr-1" />
                  Token Active
                </span>
              ) : (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  <SafeIcon icon={FiKey} className="w-3 h-3 mr-1" />
                  No Token
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <SafeIcon icon={FiUser} className="w-5 h-5 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">{user?.name}</span>
            </div>
            
            <button
              onClick={logout}
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-gray-500 hover:text-gray-700 focus:outline-none transition-colors"
            >
              <SafeIcon icon={FiLogOut} className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;