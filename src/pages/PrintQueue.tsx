import React, { useState, useEffect } from 'react';
import { 
  Printer, 
  Trash2, 
  CheckCircle2, 
  Clock, 
  Search,
  Filter,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  X,
  FileText,
  AlertCircle
} from 'lucide-react';
import { collection, query, onSnapshot, orderBy, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { ShippingLabel, Recipient, Product } from '../types';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';

export default function PrintQueue() {
  const { t } = useTranslation();
  const [labels, setLabels] = useState<ShippingLabel[]>([]);
  const [recipients, setRecipients] = useState<Record<string, Recipient>>({});
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLabels, setSelectedLabels] = useState<string[]>([]);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [labelToDelete, setLabelToDelete] = useState<string | null>(null);

  useEffect(() => {
    const labelsUnsub = onSnapshot(query(collection(db, 'labels'), orderBy('createdAt', 'desc')), (snapshot) => {
      setLabels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ShippingLabel)));
      setLoading(false);
    });

    const recipientsUnsub = onSnapshot(collection(db, 'recipients'), (snapshot) => {
      const data: Record<string, Recipient> = {};
      snapshot.docs.forEach(doc => { data[doc.id] = { id: doc.id, ...doc.data() } as Recipient; });
      setRecipients(data);
    });

    const productsUnsub = onSnapshot(collection(db, 'products'), (snapshot) => {
      const data: Record<string, Product> = {};
      snapshot.docs.forEach(doc => { data[doc.id] = { id: doc.id, ...doc.data() } as Product; });
      setProducts(data);
    });

    return () => {
      labelsUnsub();
      recipientsUnsub();
      productsUnsub();
    };
  }, []);

  const handleToggleSelect = (id: string) => {
    setSelectedLabels(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedLabels.length === filteredLabels.length) {
      setSelectedLabels([]);
    } else {
      setSelectedLabels(filteredLabels.map(l => l.id));
    }
  };

  const handleMarkAsPrinted = async (id: string) => {
    try {
      await updateDoc(doc(db, 'labels', id), {
        status: 'printed',
        printedAt: serverTimestamp()
      });
    } catch (err) {
      console.error('Error updating label status:', err);
      showNotification('error', t('Error'));
    }
  };

  const handleDelete = async () => {
    if (!labelToDelete) return;
    try {
      await deleteDoc(doc(db, 'labels', labelToDelete));
      setIsDeleteModalOpen(false);
      setLabelToDelete(null);
      showNotification('success', t('Success'));
    } catch (err) {
      console.error('Error deleting label:', err);
      showNotification('error', t('Error'));
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const generatePDF = (label: ShippingLabel) => {
    const recipient = recipients[label.recipientId];
    if (!recipient) return null;

    const labelProducts = label.productIds?.map(pid => products[pid]).filter(Boolean) || [];
    const [width, height] = label.size === '100x75' ? [100, 75] : [100, 150];
    
    const doc = new jsPDF({
      orientation: width > height ? 'l' : 'p',
      unit: 'mm',
      format: [width, height]
    });

    // Simple styling for PDF
    doc.setFontSize(10);
    doc.text('SENDER', 10, 10);
    doc.setFontSize(12);
    doc.text('My Shop', 10, 16);
    doc.setFontSize(10);
    doc.text('123 Main St, Bangkok, 10110', 10, 22);
    doc.text('081-234-5678', 10, 28);

    doc.line(5, 32, width - 5, 32);

    doc.setFontSize(10);
    doc.text('RECIPIENT', 10, 40);
    doc.setFontSize(16);
    doc.text(recipient.name, 10, 48);
    doc.setFontSize(12);
    doc.text(recipient.address, 10, 56);
    doc.text(`${recipient.district}, ${recipient.province} ${recipient.postalCode}`, 10, 64);
    doc.setFontSize(14);
    doc.text(recipient.phone, 10, 72);

    doc.line(5, 78, width - 5, 78);

    doc.setFontSize(10);
    doc.text('CONTENTS', 10, 86);
    labelProducts.forEach((p, i) => {
      doc.text(`- ${p.name} (${p.sku})`, 10, 94 + (i * 6));
    });

    const footerY = height - 20;
    doc.line(5, footerY - 5, width - 5, footerY - 5);
    doc.setFontSize(10);
    doc.text('TOTAL', 10, footerY);
    doc.setFontSize(18);
    doc.text('฿0', 10, footerY + 10);

    doc.rect(width - 40, footerY, 30, 15);
    doc.setFontSize(8);
    doc.text('BARCODE', width - 25, footerY + 8, { align: 'center' });

    return doc;
  };

  const handlePrintSelected = async () => {
    if (selectedLabels.length === 0) return;
    
    // In a real app, we might want to mark them as printed after the print dialog closes
    // but window.print() is synchronous in terms of opening the dialog, not finishing the print.
    // For now, we'll just open the print dialog.
    window.print();
    
    // Optionally mark as printed (this is tricky because we don't know if they actually printed)
    for (const id of selectedLabels) {
      await handleMarkAsPrinted(id);
    }
  };

  const filteredLabels = labels.filter(l => {
    const recipient = recipients[l.recipientId];
    return recipient?.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           l.id.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-right duration-300 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">{t('Print Queue')}</h1>
          <p className="text-text-muted">{t('Print Queue Description')}</p>
        </div>
        <div className="flex gap-3">
          {selectedLabels.length > 0 && (
            <button 
              onClick={handlePrintSelected}
              className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
            >
              <Printer className="w-5 h-5" />
              <span>{t('Print')} ({selectedLabels.length})</span>
            </button>
          )}
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 border-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder={t('Search')} 
            className="w-full pl-10 pr-4 py-2 bg-app-bg border-none rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-text-main"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button className="flex items-center justify-center gap-2 px-4 py-2 bg-app-bg rounded-xl text-text-muted hover:bg-accent transition-colors">
          <Filter className="w-4 h-4" />
          <span>{t('Filters')}</span>
        </button>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl shadow-sm overflow-hidden border-none">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-app-bg border-b border-accent">
                <th className="px-6 py-4 w-10">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-accent text-primary focus:ring-primary/20"
                    checked={selectedLabels.length === filteredLabels.length && filteredLabels.length > 0}
                    onChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('Recipient')}</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('Size')}</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('Status')}</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">{t('Date')}</th>
                <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">{t('Actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-accent">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">{t('Loading queue...')}</td>
                </tr>
              ) : filteredLabels.length > 0 ? (
                filteredLabels.map((label) => {
                  const recipient = recipients[label.recipientId];
                  return (
                    <tr key={label.id} className="hover:bg-accent/30 transition-colors group">
                      <td className="px-6 py-4">
                        <input 
                          type="checkbox" 
                          className="w-4 h-4 rounded border-accent text-primary focus:ring-primary/20"
                          checked={selectedLabels.includes(label.id)}
                          onChange={() => handleToggleSelect(label.id)}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-app-bg rounded-lg flex items-center justify-center text-text-muted">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-text-main">{recipient?.name || t('No data found')}</p>
                            <p className="text-xs text-text-muted">ID: #{label.id.slice(-6).toUpperCase()}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-text-main">{label.size} mm</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {label.status === 'printed' ? (
                            <div className="flex items-center gap-1.5 text-emerald-600 text-xs font-bold uppercase tracking-wider">
                              <CheckCircle2 className="w-4 h-4" />
                              <span>{t('Printed')}</span>
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5 text-amber-600 text-xs font-bold uppercase tracking-wider">
                              <Clock className="w-4 h-4" />
                              <span>{t('Pending')}</span>
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-text-muted">
                        {label.createdAt ? format(label.createdAt.toDate(), 'MMM d, HH:mm') : '-'}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button 
                            onClick={() => {
                              const doc = generatePDF(label);
                              if (doc) doc.save(`label-${label.id.slice(-6)}.pdf`);
                              handleMarkAsPrinted(label.id);
                            }}
                            className="p-2 text-text-muted hover:text-primary hover:bg-accent rounded-lg transition-colors"
                            title={t('Download PDF')}
                          >
                            <FileText className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setSelectedLabels([label.id]);
                              setTimeout(() => {
                                window.print();
                                handleMarkAsPrinted(label.id);
                              }, 100);
                            }}
                            className="p-2 text-text-muted hover:text-primary hover:bg-accent rounded-lg transition-colors"
                            title={t('Print')}
                          >
                            <Printer className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => {
                              setLabelToDelete(label.id);
                              setIsDeleteModalOpen(true);
                            }}
                            className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title={t('Delete')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-text-muted">{t('No labels in queue')}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl p-6 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center gap-4 mb-4 text-red-600">
              <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center">
                <Trash2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold">{t('Confirm Delete')}</h2>
            </div>
            <p className="text-text-muted mb-6">{t('Are you sure?')}</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setIsDeleteModalOpen(false)}
                className="flex-1 px-6 py-3 bg-app-bg rounded-xl font-semibold text-text-muted hover:bg-accent transition-colors"
              >
                {t('Cancel')}
              </button>
              <button 
                onClick={handleDelete}
                className="flex-1 px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors shadow-lg shadow-red-100"
              >
                {t('Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Print View (Hidden on screen) */}
      <div className="hidden print:block print-container">
        {selectedLabels.map(id => {
          const label = labels.find(l => l.id === id);
          const recipient = recipients[label?.recipientId || ''];
          const labelProducts = label?.productIds?.map(pid => products[pid]).filter(Boolean) || [];
          
          if (!label || !recipient) return null;

          return (
            <div key={id} className="print-label-page mb-8 last:mb-0 break-after-page">
              <div className={`border-2 border-gray-300 p-8 bg-white w-full rounded-none ${label.size === '100x75' ? 'aspect-[4/3]' : 'aspect-[2/3]'} print:aspect-auto`}>
                {/* Sender Section */}
                <div className="pb-4 border-b border-gray-200">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('SENDER')}</p>
                  <p className="font-bold text-black text-sm">My Shop</p>
                  <p className="text-xs text-black leading-tight">123 Main St, Bangkok, 10110</p>
                  <p className="text-xs font-bold text-black mt-1">081-234-5678</p>
                </div>

                {/* Recipient Section */}
                <div className="py-6 border-b border-gray-200">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('RECIPIENT')}</p>
                  <p className="font-bold text-black text-2xl mb-2">{recipient.name}</p>
                  <p className="text-base text-black leading-relaxed">{recipient.address}</p>
                  <div className="mt-2 space-y-1">
                    <p className="text-xl font-bold text-black">
                      {recipient.district}, {recipient.province}
                    </p>
                    <p className="text-3xl font-bold text-black tracking-wider">
                      {recipient.postalCode}
                    </p>
                  </div>
                  <p className="text-2xl font-bold text-black mt-3">{recipient.phone}</p>
                </div>
                
                {/* Items Section */}
                <div className="py-6 flex-1">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-3">{t('CONTENTS')} ({labelProducts.length})</p>
                  <div className="space-y-2">
                    {labelProducts.map(p => (
                      <div key={p.id} className="text-sm text-black">
                        - {p.name} ({p.sku})
                      </div>
                    ))}
                  </div>
                </div>

                {/* Total / COD Section */}
                <div className="mt-auto pt-6 border-t border-gray-200 flex items-end justify-between">
                  <div>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">{t('TOTAL')}</p>
                    <p className="text-4xl font-bold text-black">฿0</p>
                  </div>
                  <div className="text-right">
                    <div className="w-32 h-16 border border-gray-300 rounded flex items-center justify-center text-[10px] text-gray-500 font-mono text-center mb-1">BARCODE</div>
                    <p className="text-[8px] text-gray-500 font-mono uppercase tracking-tighter">#{label.id.slice(-8).toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
