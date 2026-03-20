import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { 
  Printer, 
  Package, 
  Users, 
  TrendingUp, 
  Clock,
  CheckCircle2,
  ListOrdered
} from 'lucide-react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { ShippingLabel } from '../types';
import { format } from 'date-fns';

export default function Dashboard() {
  const { t } = useTranslation();
  const [stats, setStats] = useState({
    totalLabels: 0,
    pendingLabels: 0,
    printedLabels: 0,
    totalProducts: 0,
    totalRecipients: 0
  });
  const [recentLabels, setRecentLabels] = useState<ShippingLabel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const labelsUnsub = onSnapshot(collection(db, 'labels'), (snapshot) => {
      const labels = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingLabel));
      setStats(prev => ({
        ...prev,
        totalLabels: labels.length,
        pendingLabels: labels.filter(l => l.status === 'pending').length,
        printedLabels: labels.filter(l => l.status === 'printed').length
      }));
      
      const sorted = [...labels].sort((a, b) => (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0));
      setRecentLabels(sorted.slice(0, 5));
      setLoading(false);
    });

    const productsUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      setStats(prev => ({ ...prev, totalProducts: snapshot.size }));
    });

    const recipientsUnsub = onSnapshot(collection(db, 'recipients'), (snapshot) => {
      setStats(prev => ({ ...prev, totalRecipients: snapshot.size }));
    });

    return () => {
      labelsUnsub();
      productsUnsub();
      recipientsUnsub();
    };
  }, []);

  const statCards = [
    { label: t('Total Labels'), value: stats.totalLabels, icon: ListOrdered, color: 'bg-blue-50 text-blue-600' },
    { label: t('Pending Print'), value: stats.pendingLabels, icon: Clock, color: 'bg-amber-50 text-amber-600' },
    { label: t('Printed'), value: stats.printedLabels, icon: CheckCircle2, color: 'bg-emerald-50 text-emerald-600' },
    { label: t('Total Products'), value: stats.totalProducts, icon: Package, color: 'bg-indigo-50 text-indigo-600' },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">{t('Dashboard')}</h1>
        <p className="text-slate-500">{t('Label Generator')}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl ${stat.color}`}>
                <stat.icon className="w-6 h-6" />
              </div>
              <TrendingUp className="w-4 h-4 text-slate-300" />
            </div>
            <p className="text-slate-500 text-sm font-medium">{stat.label}</p>
            <h3 className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between">
            <h2 className="text-lg font-bold text-slate-900">{t('Recent Labels')}</h2>
          </div>
          <div className="divide-y divide-slate-100">
            {recentLabels.length > 0 ? (
              recentLabels.map((label) => (
                <div key={label.id} className="p-6 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 rounded-lg ${label.status === 'printed' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                      <Printer className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{t('Label')} #{label.id.slice(-6).toUpperCase()}</p>
                      <p className="text-sm text-slate-500">{label.size} mm · {format(label.createdAt?.toDate() || new Date(), 'MMM d, HH:mm')}</p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    label.status === 'printed' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                  }`}>
                    {label.status === 'printed' ? t('Printed') : t('Pending')}
                  </span>
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-500">
                {t('No data found')}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-2xl p-6 text-white shadow-lg shadow-indigo-200">
            <h3 className="text-lg font-bold mb-2">{t('System Messages')}</h3>
            <p className="text-indigo-100 text-sm mb-4">{t('Label Generator')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
