import React from 'react';
import { NavLink } from 'react-router-dom';
import SafeIcon from '../common/SafeIcon';
import * as FiIcons from 'react-icons/fi';

const { FiHome, FiPlus, FiClock, FiSettings } = FiIcons;

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: FiHome },
  { name: 'Create Presentation', href: '/create', icon: FiPlus },
  { name: 'History', href: '/history', icon: FiClock },
  { name: 'Token Settings', href: '/settings', icon: FiSettings },
];

const Sidebar = () => {
  return (
    <div className="flex flex-col w-64 bg-white shadow-lg">
      <div className="flex items-center justify-center h-16 px-4 bg-primary-600">
        <h1 className="text-lg font-bold text-white">Slides SaaS</h1>
      </div>
      
      <nav className="mt-8 flex-1">
        <div className="px-4 space-y-2">
          {navigation.map((item) => (
            <NavLink
              key={item.name}
              to={item.href}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                  isActive
                    ? 'bg-primary-100 text-primary-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                }`
              }
            >
              <SafeIcon
                icon={item.icon}
                className="mr-3 h-5 w-5 flex-shrink-0"
              />
              {item.name}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;