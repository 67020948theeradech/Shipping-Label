import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Users, 
  Filter,
  X,
  MapPin,
  Phone,
  FileUp,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Recipient } from '../types';
import { format } from 'date-fns';
import Papa from 'papaparse';
import { useTranslation } from 'react-i18next';

export default function RecipientManagement() {
  const { t } = useTranslation();
  const [recipients, setRecipients] = useState<Recipient[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [recipientToDelete, setRecipientToDelete] = useState<string | null>(null);
  const [editingRecipient, setEditingRecipient] = useState<Recipient | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    province: '',
    district: '',
    postalCode: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'recipients'), orderBy('createdAt', 'desc'));
    const unsub = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Recipient));
      setRecipients(data);
      setLoading(false);
    });
    return unsub;
  }, []);

  const handleOpenModal = (recipient?: Recipient) => {
    if (recipient) {
      setEditingRecipient(recipient);
      setFormData({
        name: recipient.name,
        phone: recipient.phone,
        address: recipient.address,
        province: recipient.province,
        district: recipient.district,
        postalCode: recipient.postalCode
      });
    } else {
      setEditingRecipient(null);
      setFormData({ name: '', phone: '', address: '', province: '', district: '', postalCode: '' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        ...formData,
        createdAt: editingRecipient ? editingRecipient.createdAt : serverTimestamp()
      };

      if (editingRecipient) {
        await updateDoc(doc(db, 'recipients', editingRecipient.id), data);
      } else {
        await addDoc(collection(db, 'recipients'), data);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving recipient:', err);
    }
  };

  const handleDelete = async () => {
    if (!recipientToDelete) return;
    try {
      await deleteDoc(doc(db, 'recipients', recipientToDelete));
      setIsDeleteModalOpen(false);
      setRecipientToDelete(null);
      showNotification('success', t('Success'));
    } catch (err) {
      console.error('Error deleting recipient:', err);
      showNotification('error', t('Error'));
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 3000);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as any[];
        let count = 0;
        try {
          for (const row of data) {
            if (row.name && row.phone && row.address) {
              await addDoc(collection(db, 'recipients'), {
                name: row.name,
                phone: row.phone,
                address: row.address,
                province: row.province || '',
                district: row.district || '',
                postalCode: row.postalCode || '',
                createdAt: serverTimestamp()
              });
              count++;
            }
          }
          showNotification('success', t('Successfully imported recipients', { count }));
        } catch (err) {
          console.error('Error importing recipients:', err);
          showNotification('error', t('Import Error'));
        }
      }
    });
  };

  const filteredRecipients = recipients.filter(r => 
    r.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    r.phone.includes(searchTerm) ||
    r.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
          <h1 className="text-2xl font-bold text-text-main">{t('Recipients')}</h1>
          <p className="text-text-muted">{t('Manage recipients')}</p>
        </div>
        <div className="flex gap-3">
          <label className="flex items-center justify-center gap-2 bg-white text-text-main px-6 py-3 rounded-xl font-semibold hover:bg-accent transition-all cursor-pointer shadow-sm">
            <FileUp className="w-5 h-5 text-primary" />
            <span>{t('Import CSV')}</span>
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
          <button 
            onClick={() => handleOpenModal()}
            className="flex items-center justify-center gap-2 bg-primary text-white px-6 py-3 rounded-xl font-semibold hover:bg-primary/90 transition-all shadow-lg shadow-primary/10"
          >
            <Plus className="w-5 h-5" />
            <span>{t('Add Recipient')}</span>
          </button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl shadow-sm flex flex-col md:flex-row gap-4 border-none">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted" />
          <input 
            type="text" 
            placeholder={t('Search recipients')} 
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

      {/* Recipient Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 text-center text-text-muted">{t('Loading recipients')}</div>
        ) : filteredRecipients.length > 0 ? (
          filteredRecipients.map((recipient) => (
            <div key={recipient.id} className="bg-white p-6 rounded-2xl shadow-sm hover:shadow-md transition-all group relative border-none">
              <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button 
                  onClick={() => handleOpenModal(recipient)}
                  className="p-2 text-text-muted hover:text-primary hover:bg-accent rounded-lg transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    setRecipientToDelete(recipient.id);
                    setIsDeleteModalOpen(true);
                  }}
                  className="p-2 text-text-muted hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center text-primary font-bold">
                  {recipient.name[0].toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-text-main">{recipient.name}</h3>
                  <p className="text-xs text-text-muted">{t('Added')} {recipient.createdAt ? format(recipient.createdAt.toDate(), 'MMM d, yyyy') : '-'}</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3 text-sm text-text-main">
                  <Phone className="w-4 h-4 mt-0.5 text-text-muted" />
                  <span>{recipient.phone}</span>
                </div>
                <div className="flex items-start gap-3 text-sm text-text-main">
                  <MapPin className="w-4 h-4 mt-0.5 text-text-muted" />
                  <div className="flex-1">
                    <p className="line-clamp-2">{recipient.address}</p>
                    <p className="text-xs text-text-muted mt-1">
                      {recipient.district}, {recipient.province} {recipient.postalCode}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-text-muted">{t('No recipients found')}</div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-accent flex items-center justify-between">
              <h2 className="text-xl font-bold text-text-main">{editingRecipient ? t('Edit Recipient') : t('Add New Recipient')}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-text-muted hover:bg-app-bg rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">{t('Full Name')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 bg-app-bg border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-text-main"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">{t('Phone')}</label>
                  <input 
                    required
                    type="tel" 
                    className="w-full px-4 py-2 bg-app-bg border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-text-main"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-text-muted mb-1">{t('Full Address')}</label>
                <textarea 
                  required
                  rows={3}
                  className="w-full px-4 py-2 bg-app-bg border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-text-main"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">{t('Province')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 bg-app-bg border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-text-main"
                    value={formData.province}
                    onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">{t('District')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 bg-app-bg border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-text-main"
                    value={formData.district}
                    onChange={(e) => setFormData({ ...formData, district: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-text-muted mb-1">{t('Postal Code')}</label>
                  <input 
                    required
                    type="text" 
                    className="w-full px-4 py-2 bg-app-bg border-none rounded-xl focus:ring-2 focus:ring-primary/20 outline-none text-text-main"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                  />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 px-6 py-3 bg-app-bg rounded-xl font-semibold text-text-muted hover:bg-accent transition-colors"
                >
                  {t('Cancel')}
                </button>
                <button 
                  type="submit"
                  className="flex-1 px-6 py-3 bg-primary text-white rounded-xl font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/10"
                >
                  {editingRecipient ? t('Update') : t('Save Recipient')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

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
    </div>
  );
}
