import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import api, { handleApiError } from '../../services/api';
import { Button } from '../../components/Button';
import { Field } from '../../components/Field';
import { PasswordInput } from '../../components/PasswordInput';
import { Card, StatCard } from '../../components/Card';
import { ConfirmDialog } from '../../components/Modal';
import { Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { t, weekDayLabels, statusLabels } from '../../i18n';
import type { Attendance, Employee } from '../../types';
import { formatDate, formatMinutes, formatMoney, formatTime } from '../../utils/format';

export default function EmployeeDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [employee, setEmployee] = useState<Employee | null>(null);
  const [attendance, setAttendance] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [newPassword, setNewPassword] = useState('');

  async function load() {
    if (!id) return;
    setLoading(true);
    try {
      const [empRes, attRes] = await Promise.all([
        api.get(`/employees/${id}`),
        api.get('/attendance', { params: { employeeId: id, limit: 30 } }),
      ]);
      setEmployee(empRes.data.data);
      setAttendance(attRes.data.data.items);
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [id]);

  async function confirmDelete() {
    if (!employee) return;
    setSaving(true);
    try {
      await api.delete(`/employees/${employee._id}`);
      toast.success('تم حذف الموظف بنجاح');
      navigate('/employees');
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  }

  async function resetPassword() {
    if (!employee || !newPassword.trim()) {
      toast.error('أدخل كلمة مرور جديدة');
      return;
    }
    if (newPassword.trim().length < 6) {
      toast.error('كلمة المرور يجب أن تكون 6 أحرف على الأقل');
      return;
    }

    const email = typeof employee.userId === 'object' ? employee.userId?.email || '' : '';
    setSaving(true);
    try {
      await api.put(`/employees/${employee._id}`, {
        fullName: employee.fullName,
        email,
        password: newPassword.trim(),
        phone: employee.phone || '',
        position: employee.position,
        monthlySalary: employee.monthlySalary,
        salaryCurrency: employee.salaryCurrency,
        workingDays: employee.workingDays,
        dailyWorkingHours: employee.dailyWorkingHours,
        expectedStartTime: employee.expectedStartTime,
        expectedEndTime: employee.expectedEndTime,
        weeklyDayOff: employee.weeklyDayOff,
        employmentStartDate: formatDate(employee.employmentStartDate),
        isActive: employee.isActive,
      });
      toast.success('تم تحديث كلمة المرور بنجاح');
      setNewPassword('');
    } catch (error) {
      handleApiError(error);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!employee) return <EmptyState title="الموظف غير موجود" />;

  const email = typeof employee.userId === 'object' ? employee.userId?.email : '—';

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{employee.fullName}</h1>
          <p>{employee.position} · {email}</p>
        </div>
        <div className="page-header-actions">
          <Link className="btn btn-outline" to="/employees">رجوع</Link>
          <Link className="btn btn-primary" to={`/salaries?employeeId=${employee._id}`}>حساب الراتب</Link>
          <Button variant="danger" onClick={() => setDeleting(true)}>حذف الموظف</Button>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard label={t('monthlySalary')} value={formatMoney(employee.monthlySalary, employee.salaryCurrency)} />
        <StatCard label={t('dailyHours')} value={`${employee.dailyWorkingHours} ساعات`} />
        <StatCard label={t('expectedStart')} value={employee.expectedStartTime} />
        <StatCard label={t('dayOff')} value={weekDayLabels[employee.weeklyDayOff]} />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Card title="بيانات الموظف">
          <div className="report-row"><span>الهاتف</span><span>{employee.phone || '—'}</span></div>
          <div className="report-row"><span>تاريخ التعيين</span><span>{formatDate(employee.employmentStartDate)}</span></div>
          <div className="report-row"><span>الحالة</span><Badge tone={employee.isActive ? 'active' : 'inactive'}>{employee.isActive ? t('active') : t('inactive')}</Badge></div>
          <div className="report-row"><span>أوقات العمل</span><span>{employee.expectedStartTime} — {employee.expectedEndTime}</span></div>
        </Card>
        <Card title="كلمة المرور">
          <p style={{ color: 'var(--muted)', fontSize: 13, lineHeight: 1.7, marginTop: 0 }}>
            كلمة المرور الحالية مشفّرة ولا يمكن عرضها. عيّن كلمة مرور جديدة ثم استخدم زر العين لإظهارها قبل الحفظ.
          </p>
          <Field label="كلمة مرور جديدة">
            <PasswordInput
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="أدخل كلمة مرور جديدة"
              autoComplete="new-password"
            />
          </Field>
          <Button onClick={resetPassword} disabled={saving || !newPassword.trim()}>
            {saving ? 'جاري الحفظ...' : 'تحديث كلمة المرور'}
          </Button>
        </Card>
      </div>

      <Card title={t('workingDays')} style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {employee.workingDays.map((d) => (
            <Badge key={d} tone="neutral">{weekDayLabels[d]}</Badge>
          ))}
        </div>
      </Card>

      <Card title="سجل الحضور الأخير">
        {attendance.length === 0 ? (
          <EmptyState title={t('noAttendance')} />
        ) : (
          <>
            <div className="table-wrap desktop-only" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>{t('checkIn')}</th>
                    <th>{t('checkOut')}</th>
                    <th>{t('workedHours')}</th>
                    <th>{t('lateMinutes')}</th>
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {attendance.map((row) => (
                    <tr key={row._id}>
                      <td>{row.date}</td>
                      <td>{formatTime(row.checkIn)}</td>
                      <td>{formatTime(row.checkOut)}</td>
                      <td>{formatMinutes(row.workedMinutes)}</td>
                      <td>{row.lateMinutes}</td>
                      <td><Badge tone={row.status as never}>{statusLabels[row.status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards">
              {attendance.map((row) => (
                <div className="mobile-card" key={row._id}>
                  <strong>{row.date}</strong>
                  <div className="row"><span>الحضور</span><span>{formatTime(row.checkIn)}</span></div>
                  <div className="row"><span>الانصراف</span><span>{formatTime(row.checkOut)}</span></div>
                  <div className="row"><span>التأخير</span><span>{row.lateMinutes} د</span></div>
                  <div className="row"><span>الحالة</span><span>{statusLabels[row.status]}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <ConfirmDialog
        open={deleting}
        title="حذف الموظف"
        message={`هل أنت متأكد من حذف «${employee.fullName}»؟ سيتم حذف حسابه وسجلات حضوره، ولا يمكن التراجع.`}
        confirmLabel="حذف"
        onClose={() => setDeleting(false)}
        onConfirm={confirmDelete}
        loading={saving}
      />
    </div>
  );
}
