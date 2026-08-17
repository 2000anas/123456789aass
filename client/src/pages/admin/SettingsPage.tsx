import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { handleApiError } from '../../services/api';
import { Button } from '../../components/Button';
import { Field, Input, Select } from '../../components/Field';
import { Card } from '../../components/Card';
import { ConfirmDialog } from '../../components/Modal';
import { Badge, LoadingSpinner } from '../../components/ui';
import { t } from '../../i18n';
import type { Category } from '../../types';

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    companyName: 'Elyptek',
    defaultCurrency: 'USD',
    timezone: 'Asia/Damascus',
  });
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState({ nameAr: '', type: 'OUT' as 'IN' | 'OUT' });
  const [deleting, setDeleting] = useState<Category | null>(null);

  async function load() {
    setLoading(true);
    try {
      const [s, c] = await Promise.all([
        api.get('/settings'),
        api.get('/transactions/meta/categories', { params: { includeInactive: true } }),
      ]);
      setSettings({
        companyName: s.data.data.companyName,
        defaultCurrency: s.data.data.defaultCurrency,
        timezone: s.data.data.timezone,
      });
      setCategories(c.data.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function saveSettings() {
    const companyName = settings.companyName.trim();
    if (!companyName) {
      toast.error('اسم الشركة مطلوب');
      return;
    }
    if (!/^[A-Za-z0-9\s&.\-'()]+$/u.test(companyName)) {
      toast.error('اسم الشركة يجب أن يكون بالإنجليزية فقط');
      return;
    }
    setSaving(true);
    try {
      await api.put('/settings', {
        companyName,
        defaultCurrency: settings.defaultCurrency,
        timezone: settings.timezone,
        displayCurrencies: ['USD', 'SYP'],
      });
      toast.success('تم حفظ الإعدادات');
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  }

  async function addCategory() {
    const nameAr = newCat.nameAr.trim();
    if (!nameAr) {
      toast.error('أدخل اسم التصنيف بالعربية');
      return;
    }
    if (!/^[\u0600-\u06FF\s\d\-_.،]+$/u.test(nameAr)) {
      toast.error('اسم التصنيف يجب أن يكون بالعربية فقط');
      return;
    }
    try {
      await api.post('/transactions/meta/categories', { nameAr, type: newCat.type });
      toast.success('تم إنشاء التصنيف');
      setNewCat({ nameAr: '', type: 'OUT' });
      load();
    } catch (error) {
      handleApiError(error);
    }
  }

  async function confirmDeleteCategory() {
    if (!deleting) return;
    setSaving(true);
    try {
      const { data } = await api.delete(`/transactions/meta/categories/${deleting._id}`);
      toast.success(data.message || 'تم حذف التصنيف');
      setDeleting(null);
      load();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{t('settings')}</h1>
          <p>إعدادات الشركة والعملات والتصنيفات</p>
        </div>
      </div>

      <div className="grid grid-2">
        <Card title="إعدادات الشركة">
          <Field label="اسم الشركة (English only)">
            <Input
              dir="ltr"
              lang="en"
              value={settings.companyName}
              onChange={(e) => setSettings({ ...settings, companyName: e.target.value })}
            />
          </Field>
          <Field label="العملة الافتراضية">
            <Select value={settings.defaultCurrency} onChange={(e) => setSettings({ ...settings, defaultCurrency: e.target.value })}>
              <option value="USD">USD</option>
              <option value="SYP">SYP</option>
            </Select>
          </Field>
          <Field label="المنطقة الزمنية">
            <Input value={settings.timezone} onChange={(e) => setSettings({ ...settings, timezone: e.target.value })} />
          </Field>
          <p style={{ color: 'var(--muted)', fontSize: 13 }}>عرض العملات: USD و SYP معاً</p>
          <Button onClick={saveSettings} disabled={saving}>{saving ? 'جاري الحفظ...' : t('save')}</Button>
        </Card>

        <Card title="تصنيفات المعاملات">
          <div style={{ marginBottom: 16 }}>
            {categories.map((c) => (
              <div className="report-row" key={c._id} style={{ alignItems: 'center' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  {c.nameAr}
                  {!c.isActive ? <Badge tone="inactive">معطّل</Badge> : null}
                  <span style={{ color: 'var(--muted)', fontSize: 13 }}>
                    {c.type === 'IN' ? t('moneyIn') : t('moneyOut')}
                  </span>
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setDeleting(c)}
                  aria-label={`حذف ${c.nameAr}`}
                >
                  <Trash2 size={16} color="var(--danger)" />
                </button>
              </div>
            ))}
          </div>
          <h4 style={{ marginBottom: 8 }}>إضافة تصنيف</h4>
          <Field label="اسم التصنيف (عربي فقط)">
            <Input
              value={newCat.nameAr}
              onChange={(e) => setNewCat({ ...newCat, nameAr: e.target.value })}
              placeholder="مثال: رواتب، إيجار، مبيعات"
            />
          </Field>
          <Field label="النوع">
            <Select value={newCat.type} onChange={(e) => setNewCat({ ...newCat, type: e.target.value as 'IN' | 'OUT' })}>
              <option value="IN">{t('moneyIn')}</option>
              <option value="OUT">{t('moneyOut')}</option>
            </Select>
          </Field>
          <Button variant="secondary" onClick={addCategory}>إضافة تصنيف</Button>
        </Card>
      </div>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="حذف التصنيف"
        message={`هل أنت متأكد من حذف «${deleting?.nameAr || ''}»؟ إذا كان مستخدماً في معاملات سابقة سيتم تعطيله فقط.`}
        confirmLabel="حذف"
        onClose={() => setDeleting(null)}
        onConfirm={confirmDeleteCategory}
        loading={saving}
      />
    </div>
  );
}
