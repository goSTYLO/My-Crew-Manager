import React, { useState } from "react";
import Sidebar from "../../components/sidebarLayout"; // <-- import Sidebar
import { 
    Settings, User, Bell, Shield, Palette, Users, Save, Eye, EyeOff,Menu, Search, X
} from 'lucide-react';
import TopNavbar from "../../components/topbarLayouot";

const ProjectSettings = () => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
    const [activeTab, setActiveTab] = useState('general');
    const [showPassword, setShowPassword] = useState(false);

    const [settings, setSettings] = useState({
        // General Settings
        projectName: 'MyCrewManager',
        description: 'Project management and team collaboration platform',
        timezone: 'Asia/Manila',
        dateFormat: 'MM/DD/YYYY',
        workingHours: {
            start: '09:00',
            end: '17:00'
        },
        
        // Account Settings
        username: 'john.wayne',
        email: 'john.wayne@mycrewmanager.com',
        firstName: 'John',
        lastName: 'Wayne',
        password: '',
        
        // Notification Settings
        emailNotifications: true,
        pushNotifications: true,
        taskReminders: true,
        projectUpdates: true,
        weeklyReports: false,
        
        // Privacy & Security
        twoFactorAuth: false,
        sessionTimeout: '30',
        publicProfile: false,
        
        // Theme Settings
        theme: 'light',
        primaryColor: '#10B981',
        sidebarCollapsed: false,
        
        // Team Settings
        defaultRole: 'member',
        autoAssignTasks: true,
        allowGuestAccess: false
    });

    const handleInputChange = (category: string | null, field: string, value: string | boolean) => {
        if (category === 'workingHours') {
            setSettings(prev => ({
                ...prev,
                workingHours: {
                    ...prev.workingHours,
                    [field]: value
                }
            }));
        } else {
            setSettings(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const handleSave = () => {
        alert('Settings saved successfully!');
    };

    const tabs = [
        { id: 'general', label: 'General', icon: Settings },
        { id: 'account', label: 'Account', icon: User },
        { id: 'notifications', label: 'Notifications', icon: Bell },
        { id: 'security', label: 'Security', icon: Shield },
        { id: 'appearance', label: 'Appearance', icon: Palette },
        { id: 'team', label: 'Team', icon: Users }
    ];

    const renderTabContent = () => {
        switch (activeTab) {
            case 'general':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Project Name</label>
                            <input
                                type="text"
                                value={settings.projectName}
                                onChange={(e) => handleInputChange(null, 'projectName', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                            <textarea
                                value={settings.description}
                                onChange={(e) => handleInputChange(null, 'description', e.target.value)}
                                rows="3"
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                                <select
                                    value={settings.timezone}
                                    onChange={(e) => handleInputChange(null, 'timezone', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="Asia/Manila">Asia/Manila (GMT+8)</option>
                                    <option value="America/New_York">America/New_York (GMT-5)</option>
                                    <option value="Europe/London">Europe/London (GMT+0)</option>
                                    <option value="Asia/Tokyo">Asia/Tokyo (GMT+9)</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Date Format</label>
                                <select
                                    value={settings.dateFormat}
                                    onChange={(e) => handleInputChange(null, 'dateFormat', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                >
                                    <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                                    <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                                    <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Working Hours</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">Start Time</label>
                                    <input
                                        type="time"
                                        value={settings.workingHours.start}
                                        onChange={(e) => handleInputChange('workingHours', 'start', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-500 mb-1">End Time</label>
                                    <input
                                        type="time"
                                        value={settings.workingHours.end}
                                        onChange={(e) => handleInputChange('workingHours', 'end', e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                );

            case 'account':
                return (
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">First Name</label>
                                <input
                                    type="text"
                                    value={settings.firstName}
                                    onChange={(e) => handleInputChange(null, 'firstName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                                <input
                                    type="text"
                                    value={settings.lastName}
                                    onChange={(e) => handleInputChange(null, 'lastName', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                            <input
                                type="text"
                                value={settings.username}
                                onChange={(e) => handleInputChange(null, 'username', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={settings.email}
                                onChange={(e) => handleInputChange(null, 'email', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={settings.password}
                                    onChange={(e) => handleInputChange(null, 'password', e.target.value)}
                                    placeholder="Leave blank to keep current password"
                                    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4 text-gray-400" />
                                    ) : (
                                        <Eye className="h-4 w-4 text-gray-400" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                );

            case 'notifications':
                return (
                    <div className="space-y-6">
                        {[
                            { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive notifications via email' },
                            { key: 'pushNotifications', label: 'Push Notifications', desc: 'Receive browser push notifications' },
                            { key: 'taskReminders', label: 'Task Reminders', desc: 'Get reminded about upcoming deadlines' },
                            { key: 'projectUpdates', label: 'Project Updates', desc: 'Notifications when projects are updated' },
                            { key: 'weeklyReports', label: 'Weekly Reports', desc: 'Receive weekly performance reports' }
                        ].map((item) => (
                            <div key={item.key} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                <div>
                                    <div className="font-medium text-gray-900">{item.label}</div>
                                    <div className="text-sm text-gray-500">{item.desc}</div>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={typeof settings[item.key as keyof typeof settings] === 'boolean' ? settings[item.key as keyof typeof settings] as boolean : false}
                                        onChange={(e) => handleInputChange(null, item.key, e.target.checked)}
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                </label>
                            </div>
                        ))}
                    </div>
                );

            case 'security':
                return (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Two-Factor Authentication</div>
                                <div className="text-sm text-gray-500">Add an extra layer of security to your account</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.twoFactorAuth}
                                    onChange={(e) => handleInputChange(null, 'twoFactorAuth', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Session Timeout (minutes)</label>
                            <select
                                value={settings.sessionTimeout}
                                onChange={(e) => handleInputChange(null, 'sessionTimeout', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="15">15 minutes</option>
                                <option value="30">30 minutes</option>
                                <option value="60">1 hour</option>
                                <option value="120">2 hours</option>
                                <option value="480">8 hours</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Public Profile</div>
                                <div className="text-sm text-gray-500">Make your profile visible to other team members</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.publicProfile}
                                    onChange={(e) => handleInputChange(null, 'publicProfile', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                );

            case 'appearance':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Theme</label>
                            <div className="grid grid-cols-3 gap-3">
                                {['light', 'dark', 'auto'].map((theme) => (
                                    <label key={theme} className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="theme"
                                            value={theme}
                                            checked={settings.theme === theme}
                                            onChange={(e) => handleInputChange(null, 'theme', e.target.value)}
                                            className="sr-only peer"
                                        />
                                        <div className="p-3 border-2 border-gray-200 rounded-lg peer-checked:border-blue-500 peer-checked:bg-blue-50 text-center capitalize">
                                            {theme}
                                        </div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Primary Color</label>
                            <div className="grid grid-cols-6 gap-3">
                                {['#10B981', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444', '#6B7280'].map((color) => (
                                    <label key={color} className="cursor-pointer">
                                        <input
                                            type="radio"
                                            name="primaryColor"
                                            value={color}
                                            checked={settings.primaryColor === color}
                                            onChange={(e) => handleInputChange(null, 'primaryColor', e.target.value)}
                                            className="sr-only peer"
                                        />
                                        <div 
                                            className="w-12 h-12 rounded-lg border-2 border-gray-200 peer-checked:border-gray-800"
                                            style={{ backgroundColor: color }}
                                        ></div>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Collapsed Sidebar</div>
                                <div className="text-sm text-gray-500">Keep sidebar collapsed by default</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.sidebarCollapsed}
                                    onChange={(e) => handleInputChange(null, 'sidebarCollapsed', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                );

            case 'team':
                return (
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Default Role for New Members</label>
                            <select
                                value={settings.defaultRole}
                                onChange={(e) => handleInputChange(null, 'defaultRole', e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="viewer">Viewer</option>
                                <option value="member">Member</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                            </select>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Auto-assign Tasks</div>
                                <div className="text-sm text-gray-500">Automatically assign tasks based on workload</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.autoAssignTasks}
                                    onChange={(e) => handleInputChange(null, 'autoAssignTasks', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                            <div>
                                <div className="font-medium text-gray-900">Allow Guest Access</div>
                                <div className="text-sm text-gray-500">Let guests view public projects without signing up</div>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={settings.allowGuestAccess}
                                    onChange={(e) => handleInputChange(null, 'allowGuestAccess', e.target.checked)}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>
                    </div>
                );

            default:
                return null;
        }
    };

    return (
        <div className="flex h-screen bg-gray-50">
            {/* ✅ Reusable Sidebar */}
      <     Sidebar
                sidebarOpen={sidebarOpen}
                setSidebarOpen={setSidebarOpen}
            />

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* ✅ Shared Navbar */}
                <TopNavbar onMenuClick={() => setSidebarOpen(true)} />

                {/* Main Content Area */}
                <main className="flex-1 p-6 overflow-auto">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex flex-col lg:flex-row gap-8">
                            {/* Settings Sidebar */}
                            <div className="lg:w-1/4">
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                                    <nav className="space-y-1 p-2">
                                        {tabs.map((tab) => {
                                            const Icon = tab.icon;
                                            return (
                                                <button
                                                    key={tab.id}
                                                    onClick={() => setActiveTab(tab.id)}
                                                    className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg text-left transition-colors ${
                                                        activeTab === tab.id
                                                            ? 'bg-blue-100 text-blue-700'
                                                            : 'text-gray-600 hover:bg-gray-100'
                                                    }`}
                                                >
                                                    <Icon className="w-5 h-5" />
                                                    <span>{tab.label}</span>
                                                </button>
                                            );
                                        })}
                                    </nav>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="lg:w-3/4">

                            {/* Save Button aligned right */}
                            <div className="flex justify-end mb-4">
                                <button
                                onClick={handleSave}
                                className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
                                >
                                <Save className="w-4 h-4" />
                                <span className="hidden sm:inline">Save Changes</span>
                                </button>
                            </div>

                            
                                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                                    <div className="mb-6">
                                        <h2 className="text-xl font-semibold text-gray-900 capitalize">
                                            {tabs.find(tab => tab.id === activeTab)?.label} Settings
                                        </h2>
                                        <p className="text-sm text-gray-500 mt-1">
                                            Manage your {tabs.find(tab => tab.id === activeTab)?.label.toLowerCase()} preferences and configuration.
                                        </p>
                                    </div>
                                    
                                    {renderTabContent()}
                                </div>
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default ProjectSettings;