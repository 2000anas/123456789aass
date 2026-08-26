import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import api, { handleApiError } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { t, statusLabels } from '../../i18n';
import type { Attendance } from '../../types';
import { formatMinutes, formatTime } from '../../utils/format';

interface TodayData {
  date: string;
  isWorkingDay: boolean;
  expectedStartTime: string;
  expectedEndTime: string;
  canCheckIn: boolean;
  canCheckOut: boolean;
  attendance?: Attendance | null;
}

export default function EmployeeDashboardPage() {
  const { user } = useAuth();
  const [today, setToday] = useState<TodayData | null>(null);
  const [history, setHistory] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const [tRes, hRes] = await Promise.all([
        api.get('/attendance/today/me'),
        api.get('/attendance/history/me'),
      ]);
      setToday(tRes.data.data);
      setHistory(hRes.data.data.slice(0, 10));
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function doCheckIn() {
    setActing(true);
    try {
      await api.post('/attendance/check-in');
      toast.success('تم تسجيل الحضور بنجاح');
      await load();
    } catch (error) {
      handleApiError(error);
    } finally {
      setActing(false);
    }
  }

  async function doCheckOut() {
    setActing(true);
    try {
      await api.post('/attendance/check-out');
      toast.success('تم تسجيل الانصراف بنجاح');
      await load();
    } catch (error) {
      handleApiError(error);
    } finally {
      setActing(false);
    }
  }

  if (loading) return <LoadingSpinner />;
  if (!today) return <EmptyState title="تعذر تحميل بيانات اليوم" />;

  const att = today.attendance;
  const status = att?.status || (today.isWorkingDay ? 'not_checked_in' : 'absent');

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{t('welcome')}، {user?.name}</h1>
          <p>حضور اليوم · {today.date}</p>
        </div>
      </div>

      <Card className="status-hero" style={{ marginBottom: 16 } as never}>
        <div style={{ color: 'var(--muted)' }}>حالة اليوم</div>
        <div className="big-status">
          <Badge tone={(status === 'not_checked_in' ? 'neutral' : status) as never}>
            {statusLabels[status] || status}
          </Badge>
        </div>

        <div className="grid grid-2" style={{ textAlign: 'right', maxWidth: 520, margin: '0 auto' }}>
          <div className="report-row"><span>{t('expectedStart')}</span><strong>{today.expectedStartTime}</strong></div>
          <div className="report-row"><span>{t('checkIn')}</span><strong>{formatTime(att?.checkIn)}</strong></div>
          <div className="report-row"><span>{t('expectedEnd')}</span><strong>{today.expectedEndTime}</strong></div>
          <div className="report-row"><span>{t('checkOut')}</span><strong>{formatTime(att?.checkOut)}</strong></div>
          <div className="report-row"><span>{t('workedHours')}</span><strong>{formatMinutes(att?.workedMinutes)}</strong></div>
          <div className="report-row"><span>{t('lateMinutes')}</span><strong>{att?.lateMinutes ?? 0}</strong></div>
        </div>

        <div className="check-actions" style={{ justifyContent: 'center' }}>
          {today.canCheckIn && (
            <Button size="lg" onClick={doCheckIn} disabled={acting}>
              {t('checkIn')}
            </Button>
          )}
          {today.canCheckOut && (
            <Button size="lg" variant="secondary" onClick={doCheckOut} disabled={acting}>
              {t('checkOut')}
            </Button>
          )}
          {!today.isWorkingDay && (
            <p style={{ color: 'var(--muted)' }}>اليوم ليس من أيام عملك المحددة</p>
          )}
          {today.isWorkingDay && !today.canCheckIn && !today.canCheckOut && att?.checkOut && (
            <p style={{ color: 'var(--success)', fontWeight: 600 }}>تم إكمال حضور اليوم بنجاح</p>
          )}
        </div>
      </Card>

      <Card title="آخر سجلات الحضور">
        {history.length === 0 ? (
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
                    <th>{t('status')}</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row._id}>
                      <td>{row.date}</td>
                      <td>{formatTime(row.checkIn)}</td>
                      <td>{formatTime(row.checkOut)}</td>
                      <td>{formatMinutes(row.workedMinutes)}</td>
                      <td><Badge tone={row.status as never}>{statusLabels[row.status]}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards">
              {history.map((row) => (
                <div className="mobile-card" key={row._id}>
                  <strong>{row.date}</strong>
                  <div className="row"><span>الحضور</span><span>{formatTime(row.checkIn)}</span></div>
                  <div className="row"><span>الانصراف</span><span>{formatTime(row.checkOut)}</span></div>
                  <div className="row"><span>الحالة</span><span>{statusLabels[row.status]}</span></div>
                  <div className="row"><span>ساعات العمل</span><span>{formatMinutes(row.workedMinutes)}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
