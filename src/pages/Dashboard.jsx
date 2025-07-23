import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../contexts/AuthContext';
import { useToken } from '../contexts/TokenContext';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiPlus, FiClock, FiSettings, FiFileText, FiKey, FiTrendingUp } = FiIcons;

const Dashboard = () => {
  const { user } = useAuth();
  const { hasToken } = useToken();
  const [stats, setStats] = useState({
    totalPresentations: 0,
    recentPresentations: []
  });

  useEffect(() => {
    const presentations = JSON.parse(localStorage.getItem(`presentations_${user.id}`) || '[]');
    setStats({
      totalPresentations: presentations.length,
      recentPresentations: presentations.slice(-3).reverse()
    });
  }, [user]);

  const quickActions = [
    {
      name: 'Create Presentation',
      description: 'Generate a new Google Slides presentation',
      href: '/create',
      icon: FiPlus,
      color: 'bg-blue-500',
      disabled: !hasToken
    },
    {
      name: 'View History',
      description: 'Browse your presentation history',
      href: '/history',
      icon: FiClock,
      color: 'bg-green-500',
      disabled: false
    },
    {
      name: 'Token Settings',
      description: 'Manage your Google API token',
      href: '/settings',
      icon: FiSettings,
      color: 'bg-purple-500',
      disabled: false
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welcome back, {user?.name}!
          </h1>
          <p className="text-gray-600">
            Manage your Google Slides presentations with ease
          </p>
        </div>
      </div>

      {/* Token Status Alert */}
      {!hasToken && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-yellow-50 border border-yellow-200 rounded-lg p-4"
        >
          <div className="flex items-center">
            <SafeIcon icon={FiKey} className="h-5 w-5 text-yellow-400 mr-3" />
            <div>
              <h3 className="text-sm font-medium text-yellow-800">
                Google API Token Required
              </h3>
              <p className="text-sm text-yellow-700 mt-1">
                You need to add your Google Slides API token to create presentations.{' '}
                <Link to="/settings" className="font-medium underline">
                  Add token now
                </Link>
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <SafeIcon icon={FiFileText} className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {stats.totalPresentations}
              </h3>
              <p className="text-sm text-gray-600">Total Presentations</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <SafeIcon icon={hasToken ? FiKey : FiKey} className={`h-6 w-6 ${hasToken ? 'text-green-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {hasToken ? 'Active' : 'Not Set'}
              </h3>
              <p className="text-sm text-gray-600">API Token Status</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-lg shadow p-6"
        >
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <SafeIcon icon={FiTrendingUp} className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {stats.recentPresentations.length}
              </h3>
              <p className="text-sm text-gray-600">Recent Activity</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickActions.map((action, index) => (
            <motion.div
              key={action.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * (index + 1) }}
            >
              <Link
                to={action.href}
                className={`block p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow ${
                  action.disabled ? 'opacity-50 cursor-not-allowed' : ''
                }`}
                onClick={(e) => action.disabled && e.preventDefault()}
              >
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg ${action.color}`}>
                    <SafeIcon icon={action.icon} className="h-6 w-6 text-white" />
                  </div>
                  <div className="ml-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {action.name}
                    </h3>
                    <p className="text-sm text-gray-600">{action.description}</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Recent Presentations */}
      {stats.recentPresentations.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Presentations</h2>
          <div className="bg-white rounded-lg shadow">
            <div className="divide-y divide-gray-200">
              {stats.recentPresentations.map((presentation, index) => (
                <motion.div
                  key={presentation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="p-4 hover:bg-gray-50"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">
                        {presentation.title}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {presentation.slides.length} slides • Created {new Date(presentation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      {presentation.presentationId && (
                        <a
                          href={`https://docs.google.com/presentation/d/${presentation.presentationId}/edit`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-500 text-sm font-medium"
                        >
                          View in Google Slides
                        </a>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;