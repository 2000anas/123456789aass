import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { handleApiError } from '../../services/api';
import { Button } from '../../components/Button';
import { Field, Input, Select } from '../../components/Field';
import { Card } from '../../components/Card';
import { Modal } from '../../components/Modal';
import { Badge, EmptyState, LoadingSpinner, Pagination } from '../../components/ui';
import { t, statusLabels } from '../../i18n';
import type { Attendance, Employee } from '../../types';
import { formatMinutes, formatTime } from '../../utils/format';

export default function AttendancePage() {
  const [items, setItems] = useState<Attendance[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [employeeId, setEmployeeId] = useState('');
  const [status, setStatus] = useState('');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [editing, setEditing] = useState<Attendance | null>(null);
  const [form, setForm] = useState({ checkIn: '', checkOut: '', status: 'present', lateMinutes: 0, notes: '' });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const { data } = await api.get('/attendance', {
        params: {
          page,
          limit: 20,
          employeeId: employeeId || undefined,
          status: status || undefined,
          year: year || undefined,
          month: month || undefined,
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
    api.get('/employees', { params: { active: 'true' } }).then((res) => setEmployees(res.data.data));
  }, []);

  useEffect(() => {
    load();
  }, [page, employeeId, status, year, month]);

  function openEdit(row: Attendance) {
    setEditing(row);
    setForm({
      checkIn: row.checkIn ? new Date(row.checkIn).toISOString().slice(0, 16) : '',
      checkOut: row.checkOut ? new Date(row.checkOut).toISOString().slice(0, 16) : '',
      status: row.status,
      lateMinutes: row.lateMinutes || 0,
      notes: row.notes || '',
    });
  }

  async function saveEdit() {
    if (!editing) return;
    setSaving(true);
    try {
      await api.put(`/attendance/${editing._id}`, {
        checkIn: form.checkIn || null,
        checkOut: form.checkOut || null,
        status: form.status,
        lateMinutes: Number(form.lateMinutes),
        notes: form.notes,
      });
      toast.success('تم تحديث سجل الحضور');
      setEditing(null);
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
          <h1>{t('attendance')}</h1>
          <p>مراجعة وتصحيح سجلات الحضور والانصراف</p>
        </div>
      </div>

      <Card>
        <div className="filters">
          <Select value={employeeId} onChange={(e) => { setEmployeeId(e.target.value); setPage(1); }}>
            <option value="">{t('all')} الموظفين</option>
            {employees.map((e) => <option key={e._id} value={e._id}>{e.fullName}</option>)}
          </Select>
          <Select value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}>
            <option value="">{t('all')} الحالات</option>
            <option value="present">{t('present')}</option>
            <option value="late">{t('late')}</option>
            <option value="absent">{t('absent')}</option>
            <option value="incomplete">{t('incomplete')}</option>
          </Select>
          <Select value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }}>
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={String(i + 1)}>شهر {i + 1}</option>
            ))}
          </Select>
          <Input type="number" value={year} onChange={(e) => { setYear(e.target.value); setPage(1); }} />
        </div>

        {loading ? <LoadingSpinner /> : items.length === 0 ? (
          <EmptyState title={t('noAttendance')} />
        ) : (
          <>
            <div className="table-wrap desktop-only">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('employee')}</th>
                    <th>{t('date')}</th>
                    <th>{t('checkIn')}</th>
                    <th>{t('checkOut')}</th>
                    <th>{t('expectedStart')}</th>
                    <th>{t('expectedEnd')}</th>
                    <th>{t('workedHours')}</th>
                    <th>{t('lateMinutes')}</th>
                    <th>{t('status')}</th>
                    <th>{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((row) => {
                    const emp = typeof row.employeeId === 'object' ? row.employeeId : null;
                    return (
                      <tr key={row._id}>
                        <td>{emp?.fullName || '—'}</td>
                        <td>{row.date}</td>
                        <td>{formatTime(row.checkIn)}</td>
                        <td>{formatTime(row.checkOut)}</td>
                        <td>{emp?.expectedStartTime || '—'}</td>
                        <td>{emp?.expectedEndTime || '—'}</td>
                        <td>{formatMinutes(row.workedMinutes)}</td>
                        <td>{row.lateMinutes}</td>
                        <td><Badge tone={row.status as never}>{statusLabels[row.status]}</Badge></td>
                        <td><button className="btn btn-outline btn-sm" onClick={() => openEdit(row)}>تصحيح</button></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards">
              {items.map((row) => {
                const emp = typeof row.employeeId === 'object' ? row.employeeId : null;
                return (
                  <div className="mobile-card" key={row._id}>
                    <strong>{emp?.fullName}</strong>
                    <div className="row"><span>التاريخ</span><span>{row.date}</span></div>
                    <div className="row"><span>الحضور</span><span>{formatTime(row.checkIn)}</span></div>
                    <div className="row"><span>الانصراف</span><span>{formatTime(row.checkOut)}</span></div>
                    <div className="row"><span>الحالة</span><span>{statusLabels[row.status]}</span></div>
                    <Button size="sm" variant="outline" onClick={() => openEdit(row)} style={{ marginTop: 8 }}>تصحيح</Button>
                  </div>
                );
              })}
            </div>
            <Pagination page={page} pages={pages} total={total} onChange={setPage} />
          </>
        )}
      </Card>

      <Modal open={Boolean(editing)} title="تصحيح الحضور" onClose={() => setEditing(null)}>
        <div className="modal-form">
          <div className="modal-form-body">
            <Field label="وقت الحضور">
              <Input type="datetime-local" value={form.checkIn} onChange={(e) => setForm({ ...form, checkIn: e.target.value })} />
            </Field>
            <Field label="وقت الانصراف">
              <Input type="datetime-local" value={form.checkOut} onChange={(e) => setForm({ ...form, checkOut: e.target.value })} />
            </Field>
            <Field label={t('status')}>
              <Select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="present">{t('present')}</option>
                <option value="late">{t('late')}</option>
                <option value="absent">{t('absent')}</option>
                <option value="incomplete">{t('incomplete')}</option>
              </Select>
            </Field>
            <Field label={t('lateMinutes')}>
              <Input type="number" value={form.lateMinutes} onChange={(e) => setForm({ ...form, lateMinutes: Number(e.target.value) })} />
            </Field>
            <Field label={t('notes')}>
              <Input value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
            </Field>
          </div>
          <div className="modal-actions">
            <Button onClick={saveEdit} disabled={saving}>{saving ? 'جاري الحفظ...' : t('save')}</Button>
            <Button variant="outline" onClick={() => setEditing(null)}>إلغاء</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
