import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Settings as SettingsIcon, 
  User, 
  Printer, 
  Bell, 
  Shield, 
  Moon,
  Sun,
  ChevronRight,
  CheckCircle2
} from 'lucide-react';

export default function Settings() {
  const { t } = useTranslation();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [defaultSize, setDefaultSize] = useState('100x150');
  const [notifications, setNotifications] = useState(true);

  const sections = [
    {
      title: t('General Settings'),
      items: [
        { 
          icon: Printer, 
          label: t('Default Label Size'), 
          value: defaultSize,
          action: () => setDefaultSize(prev => prev === '100x150' ? '100x75' : '100x150')
        },
        { 
          icon: Moon, 
          label: t('Dark Mode'), 
          value: isDarkMode ? t('On') : t('Off'),
          action: () => setIsDarkMode(!isDarkMode)
        },
        { 
          icon: Bell, 
          label: t('Push Notifications'), 
          value: notifications ? t('Enabled') : t('Disabled'),
          action: () => setNotifications(!notifications)
        },
      ]
    },
    {
      title: t('Account & Security'),
      items: [
        { icon: User, label: t('Profile Information'), value: t('Admin User'), action: null },
        { icon: Shield, label: t('Role'), value: t('Administrator'), action: null },
      ]
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('Settings')}</h1>
        <p className="text-slate-500">{t('Settings Description')}</p>
      </div>

      <div className="space-y-6">
        {sections.map((section, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100">
              <h2 className="text-lg font-bold text-slate-900">{section.title}</h2>
            </div>
            <div className="divide-y divide-slate-100">
              {section.items.map((item, j) => (
                <button
                  key={j}
                  onClick={item.action || undefined}
                  disabled={!item.action}
                  className={`w-full p-6 flex items-center justify-between transition-colors ${item.action ? 'hover:bg-slate-50' : 'cursor-default'}`}
                >
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-50 rounded-lg text-slate-500">
                      <item.icon className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium text-slate-900">{item.label}</p>
                      <p className="text-sm text-slate-500">{item.value}</p>
                    </div>
                  </div>
                  {item.action && <ChevronRight className="w-5 h-5 text-slate-300" />}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6 flex items-start gap-4">
        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-bold text-indigo-900">{t('Settings Saved')}</h3>
          <p className="text-indigo-700 text-sm mt-1">{t('Settings Saved Description')}</p>
        </div>
      </div>
    </div>
  );
}
