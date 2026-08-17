import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { handleApiError } from '../../services/api';
import { Button } from '../../components/Button';
import { Field, Input, Select, Textarea } from '../../components/Field';
import { Card } from '../../components/Card';
import { ConfirmDialog, Modal } from '../../components/Modal';
import { Badge, EmptyState, LoadingSpinner, Pagination } from '../../components/ui';
import { t } from '../../i18n';
import type { Category, Currency, Transaction, TransactionType } from '../../types';
import { categoryName, formatDate, formatMoney, todayInputValue } from '../../utils/format';

const schema = z.object({
  type: z.enum(['IN', 'OUT']),
  amount: z.coerce.number().positive('المبلغ مطلوب'),
  currency: z.enum(['USD', 'SYP']),
  category: z.string().min(1, 'التصنيف مطلوب'),
  description: z.string().min(1, 'الوصف مطلوب'),
  date: z.string().min(1),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

export default function TransactionsPage() {
  const [items, setItems] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [type, setType] = useState('');
  const [currency, setCurrency] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Transaction | null>(null);
  const [deleting, setDeleting] = useState<Transaction | null>(null);
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: 'IN',
      currency: 'USD',
      date: todayInputValue(),
      amount: 0,
      category: '',
      description: '',
      notes: '',
    },
  });

  const watchType = watch('type');

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/transactions', {
        params: {
          page,
          limit: 15,
          search: search || undefined,
          type: type || undefined,
          currency: currency || undefined,
          category: category || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
          includeRunningBalance: true,
        },
      });
      setItems(data.data.items);
      setPages(data.data.pagination.pages);
      setTotal(data.data.pagination.total);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    api.get('/transactions/meta/categories').then((res) => setCategories(res.data.data));
  }, []);

  useEffect(() => {
    load();
  }, [page, type, currency, category, startDate, endDate]);

  function openCreate() {
    setEditing(null);
    reset({
      type: 'IN',
      currency: 'USD',
      date: todayInputValue(),
      amount: undefined as never,
      category: '',
      description: '',
      notes: '',
    });
    setModalOpen(true);
  }

  function openEdit(tx: Transaction) {
    setEditing(tx);
    reset({
      type: tx.type,
      amount: tx.amount,
      currency: tx.currency,
      category: typeof tx.category === 'string' ? tx.category : tx.category._id,
      description: tx.description,
      date: formatDate(tx.date),
      notes: tx.notes || '',
    });
    setModalOpen(true);
  }

  async function onSubmit(values: FormValues) {
    setSaving(true);
    try {
      if (editing) {
        await api.put(`/transactions/${editing._id}`, values);
        toast.success('تم تحديث العملية بنجاح');
      } else {
        await api.post('/transactions', values);
        toast.success('تمت إضافة العملية بنجاح');
      }
      setModalOpen(false);
      load();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  }

  async function confirmDelete() {
    if (!deleting) return;
    setSaving(true);
    try {
      await api.delete(`/transactions/${deleting._id}`);
      toast.success('تم حذف العملية بنجاح');
      setDeleting(null);
      load();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  }

  const filteredCategories = categories.filter((c) => c.type === (watchType as TransactionType));

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{t('transactions')}</h1>
          <p>تتبع الدفعات المستلمة والمدفوعة والرصيد لكل عملة</p>
        </div>
        <Button onClick={openCreate}>
          <Plus size={16} />
          {t('addTransaction')}
        </Button>
      </div>

      <Card>
        <div className="filters">
          <Input
            placeholder={t('search')}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (setPage(1), load())}
          />
          <Select value={type} onChange={(e) => { setType(e.target.value); setPage(1); }}>
            <option value="">{t('all')} الأنواع</option>
            <option value="IN">{t('moneyIn')}</option>
            <option value="OUT">{t('moneyOut')}</option>
          </Select>
          <Select value={currency} onChange={(e) => { setCurrency(e.target.value); setPage(1); }}>
            <option value="">{t('all')} العملات</option>
            <option value="USD">USD</option>
            <option value="SYP">SYP</option>
          </Select>
          <Select value={category} onChange={(e) => { setCategory(e.target.value); setPage(1); }}>
            <option value="">{t('all')} التصنيفات</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.nameAr}</option>
            ))}
          </Select>
          <Input type="date" value={startDate} onChange={(e) => { setStartDate(e.target.value); setPage(1); }} />
          <Input type="date" value={endDate} onChange={(e) => { setEndDate(e.target.value); setPage(1); }} />
          <Button variant="outline" onClick={() => { setPage(1); load(); }}>{t('filter')}</Button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyState title="لا معاملات" description={t('noTransactions')} action={<Button onClick={openCreate}>{t('addTransaction')}</Button>} />
        ) : (
          <>
            <div className="table-wrap desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>{t('type')}</th>
                    <th>{t('category')}</th>
                    <th>{t('description')}</th>
                    <th>{t('amount')}</th>
                    <th>{t('balanceAfter')}</th>
                    <th>{t('createdBy')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((tx) => (
                    <tr key={tx._id}>
                      <td>{formatDate(tx.date)}</td>
                      <td><Badge tone={tx.type === 'IN' ? 'in' : 'out'}>{tx.type === 'IN' ? t('moneyIn') : t('moneyOut')}</Badge></td>
                      <td>{categoryName(tx.category as never)}</td>
                      <td>{tx.description}</td>
                      <td className={tx.type === 'IN' ? 'amount-in' : 'amount-out'}>
                        {tx.type === 'IN' ? '+' : '-'}{formatMoney(tx.amount, tx.currency)}
                      </td>
                      <td className="mono">{tx.balanceAfter != null ? formatMoney(tx.balanceAfter, tx.currency) : '—'}</td>
                      <td>{typeof tx.createdBy === 'object' ? tx.createdBy?.name : '—'}</td>
                      <td>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(tx)}><Pencil size={16} /></button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleting(tx)}><Trash2 size={16} /></button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards">
              {items.map((tx) => (
                <div className="mobile-card" key={tx._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <Badge tone={tx.type === 'IN' ? 'in' : 'out'}>{tx.type === 'IN' ? t('moneyIn') : t('moneyOut')}</Badge>
                    <strong className={tx.type === 'IN' ? 'amount-in' : 'amount-out'}>{formatMoney(tx.amount, tx.currency)}</strong>
                  </div>
                  <div className="row"><span>التاريخ</span><span>{formatDate(tx.date)}</span></div>
                  <div className="row"><span>التصنيف</span><span>{categoryName(tx.category as never)}</span></div>
                  <div className="row"><span>الوصف</span><span>{tx.description}</span></div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                    <Button size="sm" variant="outline" onClick={() => openEdit(tx)}>تعديل</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleting(tx)}>حذف</Button>
                  </div>
                </div>
              ))}
            </div>
            <Pagination page={page} pages={pages} total={total} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={modalOpen} title={editing ? 'تعديل معاملة' : t('addTransaction')} onClose={() => setModalOpen(false)} wide>
        <form className="modal-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-form-body">
            <div className="grid grid-2">
              <Field label={t('type')} error={errors.type?.message}>
                <Select {...register('type')} onChange={(e) => { setValue('type', e.target.value as TransactionType); setValue('category', ''); }}>
                  <option value="IN">{t('moneyIn')}</option>
                  <option value="OUT">{t('moneyOut')}</option>
                </Select>
              </Field>
              <Field label={t('currency')} error={errors.currency?.message}>
                <Select {...register('currency')}>
                  <option value="USD">USD</option>
                  <option value="SYP">SYP</option>
                </Select>
              </Field>
            </div>
            <div className="grid grid-2">
              <Field label={t('amount')} error={errors.amount?.message}>
                <Input type="number" step="any" {...register('amount')} />
              </Field>
              <Field label={t('date')} error={errors.date?.message}>
                <Input type="date" {...register('date')} />
              </Field>
            </div>
            <Field label={t('category')} error={errors.category?.message}>
              <Select {...register('category')}>
                <option value="">اختر التصنيف</option>
                {filteredCategories.map((c) => (
                  <option key={c._id} value={c._id}>{c.nameAr}</option>
                ))}
              </Select>
            </Field>
            <Field label={t('description')} error={errors.description?.message}>
              <Input {...register('description')} />
            </Field>
            <Field label={t('notes')}>
              <Textarea {...register('notes')} />
            </Field>
          </div>
          <div className="modal-actions">
            <Button type="submit" disabled={saving}>{saving ? 'جاري الحفظ...' : t('save')}</Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={t('confirmDelete')}
        message={`${t('cannotUndo')}\n${deleting?.description || ''}`}
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={saving}
      />
    </div>
  );
}
