import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { 
  LayoutDashboard, 
  Printer, 
  Users, 
  Package, 
  ListOrdered, 
  Settings, 
  Menu,
  PlusCircle,
  Languages
} from 'lucide-react';

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { t, i18n } = useTranslation();

  const navItems = [
    { icon: LayoutDashboard, label: t('Dashboard'), path: '/' },
    { icon: PlusCircle, label: t('Create Label'), path: '/create-label' },
    { icon: Printer, label: t('Print Queue'), path: '/print-queue' },
    { icon: Users, label: t('Recipients'), path: '/recipients' },
    { icon: Package, label: t('Products'), path: '/products' },
    { icon: ListOrdered, label: t('Shipping Labels'), path: '/labels' },
    { icon: Settings, label: t('Settings'), path: '/settings' },
  ];

  const toggleLanguage = () => {
    const newLang = i18n.language === 'th' ? 'en' : 'th';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="min-h-screen bg-app-bg flex font-sans">
      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden no-print"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-100 transform transition-transform duration-300 ease-in-out no-print
        lg:relative lg:translate-x-0
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="h-full flex flex-col">
          <div className="p-6 border-b border-slate-50">
            <h1 className="text-xl font-bold text-primary flex items-center gap-2">
              <Printer className="w-6 h-6" />
              <span>ShipLabel</span>
            </h1>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) => `
                  flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                  ${isActive 
                    ? 'bg-accent text-primary font-medium' 
                    : 'text-text-muted hover:bg-slate-50 hover:text-text-main'}
                `}
                onClick={() => setIsSidebarOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-slate-100 flex items-center justify-between px-4 lg:px-8 shrink-0 no-print">
          <button 
            className="p-2 text-text-muted lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 ml-auto">
            <button 
              onClick={toggleLanguage}
              className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-text-muted hover:bg-slate-50 rounded-lg transition-colors border border-slate-100"
            >
              <Languages className="w-4 h-4" />
              <span>{i18n.language === 'th' ? 'English' : 'ภาษาไทย'}</span>
            </button>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-text-main">{t('Admin User')}</p>
              <p className="text-xs text-text-muted">{t('Public Access')}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center text-primary font-bold">
              A
            </div>
          </div>
        </header>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto p-4 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
