import { useEffect, useState } from 'react';
import api, { handleApiError } from '../../services/api';
import { Card } from '../../components/Card';
import { Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { t, statusLabels } from '../../i18n';
import type { Attendance } from '../../types';
import { formatMinutes, formatTime } from '../../utils/format';

export default function EmployeeAttendancePage() {
  const [items, setItems] = useState<Attendance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/attendance/history/me')
      .then((res) => setItems(res.data.data))
      .catch(handleApiError)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{t('myAttendance')}</h1>
          <p>سجل حضورك وانصرافك</p>
        </div>
      </div>

      <Card>
        {loading ? (
          <LoadingSpinner />
        ) : items.length === 0 ? (
          <EmptyState title={t('noAttendance')} />
        ) : (
          <>
            <div className="table-wrap desktop-only">
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
                  {items.map((row) => (
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
              {items.map((row) => (
                <div className="mobile-card" key={row._id}>
                  <strong>{row.date}</strong>
                  <div className="row"><span>الحضور</span><span>{formatTime(row.checkIn)}</span></div>
                  <div className="row"><span>الانصراف</span><span>{formatTime(row.checkOut)}</span></div>
                  <div className="row"><span>الحالة</span><span>{statusLabels[row.status]}</span></div>
                  <div className="row"><span>التأخير</span><span>{row.lateMinutes} د</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
