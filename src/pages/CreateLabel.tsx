import React, { useState, useEffect, useRef } from 'react';
import { 
  Printer, 
  Search, 
  Plus, 
  Trash2, 
  Package, 
  Users, 
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  Eye
} from 'lucide-react';
import { collection, addDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Product, Recipient, LabelSize, ShippingLabel } from '../types';
import { useTranslation } from 'react-i18next';
import jsPDF from 'jspdf';

export default function CreateLabel() {
  const { t } = useTranslation();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedRecipient, setSelectedRecipient] = useState<Recipient | null>(null);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [labelSize, setLabelSize] = useState<LabelSize>('100x150');
  const [senderInfo, setSenderInfo] = useState({
    name: 'My Shop',
    phone: '081-234-5678',
    address: '123 Main St, Bangkok, 10110'
  });
  const [totalPrice, setTotalPrice] = useState<number>(0);
  const [isCOD, setIsCOD] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  useEffect(() => {
    const recipientsUnsub = onSnapshot(query(collection(db, 'recipients'), orderBy('name')), (snapshot) => {
      setRecipients(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipient)));
    });

    const productsUnsub = onSnapshot(query(collection(db, 'products'), orderBy('name')), (snapshot) => {
      setProducts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    });

    return () => {
      recipientsUnsub();
      productsUnsub();
    };
  }, []);

  const handleAddProduct = (product: Product) => {
    if (!selectedProducts.find(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, product]);
    }
  };

  const handleRemoveProduct = (id: string) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== id));
  };

  const handleCreateLabel = async () => {
    if (!selectedRecipient) return;

    try {
      const labelData = {
        recipientId: selectedRecipient.id,
        productIds: selectedProducts.map(p => p.id),
        size: labelSize,
        status: 'pending',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'labels'), labelData);
      
      // Reset
      setSelectedRecipient(null);
      setSelectedProducts([]);
      showNotification('success', t('Success'));
    } catch (err) {
      console.error('Error creating label:', err);
      showNotification('error', t('Error'));
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const filteredRecipients = recipients.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.phone.includes(searchTerm)
  );

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearchTerm.toLowerCase()) || 
    p.sku.toLowerCase().includes(productSearchTerm.toLowerCase())
  );

  const handleDirectPrint = () => {
    window.print();
  };

  const generatePDF = () => {
    if (!selectedRecipient) return;

    const [width, height] = labelSize === '100x75' ? [100, 75] : [100, 150];
    const doc = new jsPDF({
      orientation: width > height ? 'l' : 'p',
      unit: 'mm',
      format: [width, height]
    });

    // Simple styling for PDF
    doc.setFontSize(10);
    doc.text('SENDER', 10, 10);
    doc.setFontSize(12);
    doc.text(senderInfo.name, 10, 16);
    doc.setFontSize(10);
    doc.text(senderInfo.address, 10, 22);
    doc.text(senderInfo.phone, 10, 28);

    doc.line(5, 32, width - 5, 32);

    doc.setFontSize(10);
    doc.text('RECIPIENT', 10, 40);
    doc.setFontSize(16);
    doc.text(selectedRecipient.name, 10, 48);
    doc.setFontSize(12);
    doc.text(selectedRecipient.address, 10, 56);
    doc.text(`${selectedRecipient.district}, ${selectedRecipient.province} ${selectedRecipient.postalCode}`, 10, 64);
    doc.setFontSize(14);
    doc.text(selectedRecipient.phone, 10, 72);

    doc.line(5, 78, width - 5, 78);

    doc.setFontSize(10);
    doc.text('CONTENTS', 10, 86);
    selectedProducts.forEach((p, i) => {
      doc.text(`- ${p.name} (${p.sku})`, 10, 94 + (i * 6));
    });

    const footerY = height - 20;
    doc.line(5, footerY - 5, width - 5, footerY - 5);
    doc.setFontSize(10);
    doc.text(isCOD ? 'COD' : 'TOTAL', 10, footerY);
    doc.setFontSize(18);
    doc.text(`฿${totalPrice.toLocaleString()}`, 10, footerY + 10);

    doc.rect(width - 40, footerY, 30, 15);
    doc.setFontSize(8);
    doc.text('BARCODE', width - 25, footerY + 8, { align: 'center' });

    doc.save(`label-${selectedRecipient.name}.pdf`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 z-[100] flex items-center gap-2 px-6 py-3 rounded-xl shadow-lg animate-in slide-in-from-right duration-300 ${notification.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
          {notification.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
          <span className="font-semibold">{notification.message}</span>
        </div>
      )}

      <div className="flex items-center justify-between no-print">
        <div>
          <h1 className="text-2xl font-bold text-text-main">{t('Create Label')}</h1>
          <p className="text-text-muted">{t('Select products')}</p>
        </div>
        <div className="flex bg-white border-none p-1 rounded-xl shadow-sm">
          <button 
            onClick={() => setLabelSize('100x75')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${labelSize === '100x75' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-accent'}`}
          >
            100x75 mm
          </button>
          <button 
            onClick={() => setLabelSize('100x150')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${labelSize === '100x150' ? 'bg-primary text-white shadow-md' : 'text-text-muted hover:bg-accent'}`}
          >
            100x150 mm
          </button>
        </div>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 px-4 lg:mx-0 lg:px-0">
        <div className="flex lg:grid lg:grid-cols-4 gap-6 min-w-[1200px] lg:min-w-0">
          {/* Step 1: Sender & Settings */}
          <div className="w-[300px] lg:w-auto shrink-0 space-y-4 no-print">
            <div className="flex items-center gap-2 text-text-main font-bold">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">1</div>
              <h2>{t('Sender Info')}</h2>
            </div>
            <div className="bg-white rounded-2xl p-4 shadow-sm space-y-3">
              <div>
                <label className="text-xs text-text-muted font-bold block mb-1 uppercase">{t('Name')}</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-app-bg border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  value={senderInfo.name}
                  onChange={(e) => setSenderInfo({...senderInfo, name: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs text-text-muted font-bold block mb-1 uppercase">{t('Phone')}</label>
                <input 
                  type="text" 
                  className="w-full px-3 py-2 bg-app-bg border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                  value={senderInfo.phone}
                  onChange={(e) => setSenderInfo({...senderInfo, phone: e.target.value})}
                />
              </div>
              <div>
                <label className="text-xs text-text-muted font-bold block mb-1 uppercase">{t('Address')}</label>
                <textarea 
                  className="w-full px-3 py-2 bg-app-bg border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none h-20 resize-none"
                  value={senderInfo.address}
                  onChange={(e) => setSenderInfo({...senderInfo, address: e.target.value})}
                />
              </div>
              <div className="pt-2 border-t border-accent">
                <label className="text-xs text-text-muted font-bold block mb-2 uppercase">{t('Payment')}</label>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-text-main">COD</span>
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-accent text-primary focus:ring-primary/20"
                    checked={isCOD}
                    onChange={(e) => setIsCOD(e.target.checked)}
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted text-sm">฿</span>
                  <input 
                    type="number" 
                    placeholder={t('Total Price')} 
                    className="w-full pl-8 pr-4 py-2 bg-app-bg border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    value={totalPrice || ''}
                    onChange={(e) => setTotalPrice(Number(e.target.value))}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Step 2: Select Recipient */}
          <div className="w-[300px] lg:w-auto shrink-0 space-y-4 no-print">
            <div className="flex items-center gap-2 text-text-main font-bold">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">2</div>
              <h2>{t('Select Recipient')}</h2>
            </div>
            <div className="bg-white rounded-2xl border-none shadow-sm overflow-hidden flex flex-col h-[500px]">
              <div className="p-4 border-b border-accent">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder={t('Search recipients')} 
                    className="w-full pl-9 pr-4 py-2 bg-app-bg border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-accent custom-scrollbar">
                {filteredRecipients.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => setSelectedRecipient(r)}
                    className={`w-full p-4 text-left hover:bg-accent transition-colors flex items-center justify-between group ${selectedRecipient?.id === r.id ? 'bg-accent/50 border-l-4 border-primary' : ''}`}
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-text-main truncate">{r.name}</p>
                      <p className="text-xs text-text-muted truncate">{r.phone} · {r.province}</p>
                    </div>
                    {selectedRecipient?.id === r.id && <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 3: Select Products */}
          <div className="w-[300px] lg:w-auto shrink-0 space-y-4 no-print">
            <div className="flex items-center gap-2 text-text-main font-bold">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">3</div>
              <h2>{t('Add Products')}</h2>
            </div>
            <div className="bg-white rounded-2xl border-none shadow-sm overflow-hidden flex flex-col h-[500px]">
              <div className="p-4 border-b border-accent">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted" />
                  <input 
                    type="text" 
                    placeholder={t('Search products')} 
                    className="w-full pl-9 pr-4 py-2 bg-app-bg border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    value={productSearchTerm}
                    onChange={(e) => setProductSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto divide-y divide-accent custom-scrollbar">
                {filteredProducts.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => handleAddProduct(p)}
                    className="w-full p-4 text-left hover:bg-accent transition-colors flex items-center justify-between group"
                  >
                    <div className="min-w-0">
                      <p className="font-bold text-text-main truncate">{p.name}</p>
                      <p className="text-xs text-text-muted truncate">SKU: {p.sku}</p>
                    </div>
                    <Plus className="w-5 h-5 text-text-muted group-hover:text-primary shrink-0 transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Step 4: Preview & Create */}
          <div className="w-[300px] lg:w-auto shrink-0 space-y-4 print:w-full print:m-0">
            <div className="flex items-center gap-2 text-text-main font-bold no-print">
              <div className="w-6 h-6 bg-primary text-white rounded-full flex items-center justify-center text-xs">4</div>
              <h2>{t('Label Preview')}</h2>
            </div>
            <div className="bg-white rounded-2xl border-none shadow-sm p-6 flex flex-col h-auto lg:h-[500px] print:p-0 print:shadow-none print:h-auto print:block print:w-full overflow-hidden">
              {selectedRecipient ? (
                <div className="flex-1 flex flex-col min-h-0 print:block print:w-full">
                  <div className="flex-1 overflow-y-auto custom-scrollbar pr-1 -mr-1 print:overflow-visible print:p-0 print:m-0">
                    <div className={`print-label-page border-2 border-dashed border-accent rounded-xl p-6 bg-app-bg flex flex-col print:border-2 print:border-gray-300 print:p-8 print:bg-white print:block print:w-full print:rounded-none ${labelSize === '100x75' ? 'aspect-[4/3]' : 'aspect-[2/3]'} print:aspect-auto origin-top transition-transform duration-200 w-full`} style={{ transform: 'scale(0.98)' }}>
                      {/* Sender Section */}
                      <div className="pb-4 border-b border-gray-200 shrink-0">
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">{t('SENDER')}</p>
                        <p className="font-bold text-text-main text-sm">{senderInfo.name}</p>
                        <p className="text-xs text-text-main leading-tight">{senderInfo.address}</p>
                        <p className="text-xs font-bold text-text-main mt-1">{senderInfo.phone}</p>
                      </div>

                      {/* Recipient Section */}
                      <div className="py-6 border-b border-gray-200 shrink-0">
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">{t('RECIPIENT')}</p>
                        <p className="font-bold text-text-main text-2xl mb-2">{selectedRecipient.name}</p>
                        <p className="text-base text-text-main leading-relaxed">{selectedRecipient.address}</p>
                        <div className="mt-2 space-y-1">
                          <p className="text-xl font-bold text-text-main">
                            {selectedRecipient.district}, {selectedRecipient.province}
                          </p>
                          <p className="text-3xl font-bold text-text-main tracking-wider">
                            {selectedRecipient.postalCode}
                          </p>
                        </div>
                        <p className="text-2xl font-bold text-text-main mt-3">{selectedRecipient.phone}</p>
                      </div>
                      
                      {/* Items Section */}
                      <div className="py-6 flex-1 min-h-0 flex flex-col">
                        <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-3 shrink-0">{t('CONTENTS')} ({selectedProducts.length})</p>
                        <div className="space-y-2 overflow-y-auto custom-scrollbar pr-2 flex-1 print:overflow-visible print:pr-0">
                          {selectedProducts.map(p => (
                            <div key={p.id} className="flex items-center justify-between text-sm text-text-main group">
                              <span className="truncate flex-1">- {p.name}</span>
                              <button onClick={() => handleRemoveProduct(p.id)} className="text-red-400 opacity-0 group-hover:opacity-100 no-print">
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          {selectedProducts.length === 0 && <p className="text-sm italic text-text-muted">{t('No products added')}</p>}
                        </div>
                      </div>

                      {/* Total / COD Section */}
                      <div className="mt-auto pt-6 border-t border-gray-200 flex items-end justify-between shrink-0">
                        <div>
                          <p className="text-[10px] text-text-muted font-bold uppercase tracking-widest mb-1">{isCOD ? 'COD (ยอดเก็บเงินปลายทาง)' : t('TOTAL')}</p>
                          <p className="text-4xl font-bold text-text-main">฿{totalPrice.toLocaleString()}</p>
                        </div>
                        <div className="text-right">
                          <div className="w-32 h-16 border border-gray-300 rounded flex items-center justify-center text-[10px] text-text-muted font-mono text-center mb-1">BARCODE</div>
                          <p className="text-[8px] text-text-muted font-mono uppercase tracking-tighter">#{selectedRecipient.id.slice(-8).toUpperCase()}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 space-y-3 no-print shrink-0">
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={generatePDF}
                        className="bg-white border-2 border-primary text-primary py-3 rounded-xl font-bold hover:bg-accent transition-all flex items-center justify-center gap-2"
                      >
                        <span>📥</span>
                        <span className="text-xs">{t('Download PDF')}</span>
                      </button>
                      <button
                        onClick={handleDirectPrint}
                        className="bg-primary text-white py-3 rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10 flex items-center justify-center gap-2"
                      >
                        <span>🖨️</span>
                        <span className="text-xs">{t('Print Direct')}</span>
                      </button>
                    </div>
                    <button
                      onClick={handleCreateLabel}
                      className="w-full bg-accent text-primary py-4 rounded-xl font-bold hover:bg-accent/80 transition-all flex items-center justify-center gap-2"
                    >
                      <Plus className="w-5 h-5" />
                      <span>{t('Create & Print Label')}</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 border-2 border-dashed border-accent rounded-xl no-print">
                  <div className="w-16 h-16 bg-app-bg rounded-full flex items-center justify-center text-text-muted mb-4">
                    <Eye className="w-8 h-8" />
                  </div>
                  <p className="text-text-muted font-medium">{t('Select a recipient to see the label preview')}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
