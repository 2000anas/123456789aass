import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Eye, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api, { handleApiError } from '../../services/api';
import { Button } from '../../components/Button';
import { Field, Input, Select } from '../../components/Field';
import { PasswordInput } from '../../components/PasswordInput';
import { Card } from '../../components/Card';
import { ConfirmDialog, Modal } from '../../components/Modal';
import { Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { t, weekDayLabels } from '../../i18n';
import type { Employee, WeekDay } from '../../types';
import { formatDate, formatMoney, todayInputValue } from '../../utils/format';

const DAYS: WeekDay[] = ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday'];

const schema = z.object({
  fullName: z.string().min(1),
  email: z.string().email(),
  password: z.string().optional(),
  phone: z.string().optional(),
  position: z.string().min(1),
  monthlySalary: z.coerce.number().min(0),
  salaryCurrency: z.enum(['USD', 'SYP']),
  workingDays: z.array(z.string()).min(1),
  dailyWorkingHours: z.coerce.number().min(1).max(24),
  expectedStartTime: z.string(),
  expectedEndTime: z.string(),
  weeklyDayOff: z.string(),
  employmentStartDate: z.string(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

export default function EmployeesPage() {
  const [items, setItems] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Employee | null>(null);
  const [deleting, setDeleting] = useState<Employee | null>(null);
  const [saving, setSaving] = useState(false);

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      salaryCurrency: 'USD',
      workingDays: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      dailyWorkingHours: 8,
      expectedStartTime: '09:00',
      expectedEndTime: '17:00',
      weeklyDayOff: 'friday',
      employmentStartDate: todayInputValue(),
      isActive: true,
    },
  });

  const workingDays = watch('workingDays') || [];

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/employees', { params: { search: search || undefined } });
      setItems(data.data);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  function openCreate() {
    setEditing(null);
    reset({
      fullName: '',
      email: '',
      password: '',
      phone: '',
      position: '',
      monthlySalary: 0,
      salaryCurrency: 'USD',
      workingDays: ['saturday', 'sunday', 'monday', 'tuesday', 'wednesday', 'thursday'],
      dailyWorkingHours: 8,
      expectedStartTime: '09:00',
      expectedEndTime: '17:00',
      weeklyDayOff: 'friday',
      employmentStartDate: todayInputValue(),
      isActive: true,
    });
    setModalOpen(true);
  }

  function openEdit(emp: Employee) {
    setEditing(emp);
    const email = typeof emp.userId === 'object' ? emp.userId?.email || '' : '';
    reset({
      fullName: emp.fullName,
      email,
      password: '',
      phone: emp.phone || '',
      position: emp.position,
      monthlySalary: emp.monthlySalary,
      salaryCurrency: emp.salaryCurrency,
      workingDays: emp.workingDays,
      dailyWorkingHours: emp.dailyWorkingHours,
      expectedStartTime: emp.expectedStartTime,
      expectedEndTime: emp.expectedEndTime,
      weeklyDayOff: emp.weeklyDayOff,
      employmentStartDate: formatDate(emp.employmentStartDate),
      isActive: emp.isActive,
    });
    setModalOpen(true);
  }

  function toggleDay(day: WeekDay) {
    const next = workingDays.includes(day)
      ? workingDays.filter((d) => d !== day)
      : [...workingDays, day];
    setValue('workingDays', next, { shouldValidate: true });
  }

  async function onSubmit(values: FormValues) {
    if (!editing && !values.password) {
      toast.error('كلمة المرور مطلوبة للموظف الجديد');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...values, password: values.password || undefined };
      if (editing) {
        await api.put(`/employees/${editing._id}`, payload);
        toast.success('تم تحديث بيانات الموظف بنجاح');
      } else {
        await api.post('/employees', payload);
        toast.success('تمت إضافة الموظف بنجاح');
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
      await api.delete(`/employees/${deleting._id}`);
      toast.success('تم حذف الموظف بنجاح');
      setDeleting(null);
      load();
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{t('employees')}</h1>
          <p>إدارة ملفات الموظفين والجداول والرواتب</p>
        </div>
        <Button onClick={openCreate}><Plus size={16} />{t('addEmployee')}</Button>
      </div>

      <Card>
        <div className="filters">
          <Input placeholder={t('search')} value={search} onChange={(e) => setSearch(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && load()} />
          <Button variant="outline" onClick={load}>{t('filter')}</Button>
        </div>

        {loading ? <LoadingSpinner /> : items.length === 0 ? (
          <EmptyState title="لا موظفون" description={t('noEmployees')} action={<Button onClick={openCreate}>{t('addEmployee')}</Button>} />
        ) : (
          <>
            <div className="table-wrap desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('fullName')}</th>
                    <th>{t('position')}</th>
                    <th>{t('phone')}</th>
                    <th>{t('monthlySalary')}</th>
                    <th>{t('workingDays')}</th>
                    <th>الحالة</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((emp) => (
                    <tr key={emp._id}>
                      <td>{emp.fullName}</td>
                      <td>{emp.position}</td>
                      <td>{emp.phone || '—'}</td>
                      <td className="mono">{formatMoney(emp.monthlySalary, emp.salaryCurrency)}</td>
                      <td>{emp.workingDays.length} أيام</td>
                      <td><Badge tone={emp.isActive ? 'active' : 'inactive'}>{emp.isActive ? t('active') : t('inactive')}</Badge></td>
                      <td style={{ display: 'flex', gap: 4 }}>
                        <Link className="btn btn-ghost btn-sm" to={`/employees/${emp._id}`}><Eye size={16} /></Link>
                        <button className="btn btn-outline btn-sm" onClick={() => openEdit(emp)}>تعديل</button>
                        <button className="btn btn-ghost btn-sm" onClick={() => setDeleting(emp)} aria-label="حذف">
                          <Trash2 size={16} color="var(--danger)" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards">
              {items.map((emp) => (
                <div className="mobile-card" key={emp._id}>
                  <strong>{emp.fullName}</strong>
                  <div className="row"><span>المنصب</span><span>{emp.position}</span></div>
                  <div className="row"><span>الراتب</span><span>{formatMoney(emp.monthlySalary, emp.salaryCurrency)}</span></div>
                  <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                    <Link className="btn btn-outline btn-sm" to={`/employees/${emp._id}`}>عرض</Link>
                    <Button size="sm" variant="secondary" onClick={() => openEdit(emp)}>تعديل</Button>
                    <Button size="sm" variant="danger" onClick={() => setDeleting(emp)}>حذف</Button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Modal open={modalOpen} title={editing ? 'تعديل موظف' : t('addEmployee')} onClose={() => setModalOpen(false)} wide>
        <form className="modal-form" onSubmit={handleSubmit(onSubmit)}>
          <div className="modal-form-body">
            <div className="grid grid-2">
              <Field label={t('fullName')} error={errors.fullName?.message}><Input {...register('fullName')} /></Field>
              <Field label={t('email')} error={errors.email?.message}><Input type="email" {...register('email')} /></Field>
            </div>
            <div className="grid grid-2">
              <Field label={editing ? 'كلمة مرور جديدة (اختياري)' : t('password')} error={errors.password?.message}>
                <PasswordInput
                  {...register('password')}
                  placeholder={editing ? 'اتركه فارغاً للإبقاء على الحالية' : ''}
                  autoComplete="new-password"
                />
                {editing ? (
                  <span className="field-hint">
                    لا يمكن استرجاع كلمة المرور الحالية لأنها مشفّرة. يمكنك تعيين كلمة مرور جديدة وإظهارها بزر العين.
                  </span>
                ) : (
                  <span className="field-hint">
                    استخدم زر العين لإظهار أو إخفاء كلمة المرور أثناء الإدخال.
                  </span>
                )}
              </Field>
              <Field label={t('phone')}><Input {...register('phone')} /></Field>
            </div>
            <div className="grid grid-2">
              <Field label={t('position')} error={errors.position?.message}><Input {...register('position')} /></Field>
              <Field label={t('employmentStart')}><Input type="date" {...register('employmentStartDate')} /></Field>
            </div>
            <div className="grid grid-2">
              <Field label={t('monthlySalary')}><Input type="number" step="any" {...register('monthlySalary')} /></Field>
              <Field label={t('currency')}>
                <Select {...register('salaryCurrency')}><option value="USD">USD</option><option value="SYP">SYP</option></Select>
              </Field>
            </div>
            <div className="grid grid-2">
              <Field label={t('dailyHours')}><Input type="number" step="0.5" {...register('dailyWorkingHours')} /></Field>
              <Field label={t('dayOff')}>
                <Select {...register('weeklyDayOff')}>
                  {DAYS.map((d) => <option key={d} value={d}>{weekDayLabels[d]}</option>)}
                </Select>
              </Field>
            </div>
            <div className="grid grid-2">
              <Field label={t('expectedStart')}><Input type="time" {...register('expectedStartTime')} /></Field>
              <Field label={t('expectedEnd')}><Input type="time" {...register('expectedEndTime')} /></Field>
            </div>
            <Field label={t('workingDays')} error={errors.workingDays?.message as string}>
              <div className="day-picker">
                {DAYS.map((day) => (
                  <button
                    key={day}
                    type="button"
                    className={`btn btn-sm ${workingDays.includes(day) ? 'btn-primary' : 'btn-outline'}`}
                    onClick={() => toggleDay(day)}
                  >
                    {weekDayLabels[day]}
                  </button>
                ))}
              </div>
            </Field>
            <label className="form-check">
              <input type="checkbox" {...register('isActive')} />
              {t('active')}
            </label>
          </div>
          <div className="modal-actions">
            <Button type="submit" disabled={saving}>{saving ? 'جاري الحفظ...' : t('save')}</Button>
            <Button type="button" variant="outline" onClick={() => setModalOpen(false)}>إلغاء</Button>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={Boolean(deleting)}
        title="حذف الموظف"
        message={`هل أنت متأكد من حذف «${deleting?.fullName || ''}»؟ سيتم حذف حسابه وسجلات حضوره، ولا يمكن التراجع.`}
        confirmLabel="حذف"
        onClose={() => setDeleting(null)}
        onConfirm={confirmDelete}
        loading={saving}
      />
    </div>
  );
}
