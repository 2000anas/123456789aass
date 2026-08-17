import { useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import api, { handleApiError } from '../../services/api';
import { Card, StatCard } from '../../components/Card';
import { Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { t, statusLabels } from '../../i18n';
import type { Balances, Transaction } from '../../types';
import { categoryName, formatDate, formatMinutes, formatMoney } from '../../utils/format';

interface DashboardData {
  balances: Balances;
  employeeCount: number;
  todayAttendance: {
    summary: { present: number; late: number; absent: number; notCheckedIn: number };
    items: Array<{
      employeeId: string;
      fullName: string;
      checkIn: string | null;
      checkOut: string | null;
      status: string;
      workedMinutes: number;
    }>;
  };
  recentTransactions: Transaction[];
  charts: {
    monthlyCashFlow: Array<{
      _id: { year: number; month: number; currency: string; type: string };
      total: number;
    }>;
    expensesByCategory: Array<{ nameAr: string; total: number; currency: string }>;
  };
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard')
      .then((res) => setData(res.data.data))
      .catch(handleApiError)
      .finally(() => setLoading(false));
  }, []);

  const cashFlowChart = useMemo(() => {
    if (!data) return [];
    const map = new Map<string, { label: string; in: number; out: number }>();
    for (const row of data.charts.monthlyCashFlow) {
      if (row._id.currency !== 'USD') continue;
      const label = `${row._id.year}-${String(row._id.month).padStart(2, '0')}`;
      const current = map.get(label) || { label, in: 0, out: 0 };
      if (row._id.type === 'IN') current.in = row.total;
      if (row._id.type === 'OUT') current.out = row.total;
      map.set(label, current);
    }
    return Array.from(map.values());
  }, [data]);

  if (loading) return <LoadingSpinner />;
  if (!data) return <EmptyState title="تعذر تحميل لوحة التحكم" />;

  const { balances, todayAttendance } = data;

  return (
    <div className="fade-up">
      <div className="page-header">
        <div>
          <h1>{t('dashboard')}</h1>
          <p>نظرة سريعة على المالية وحضور الفريق اليوم</p>
        </div>
      </div>

      <div className="grid grid-4" style={{ marginBottom: 16 }}>
        <StatCard
          label={`${t('currentBalance')} (USD)`}
          value={formatMoney(balances.USD.balance, 'USD')}
          sub={`${t('moneyIn')} ${formatMoney(balances.USD.totalIn, 'USD')} — ${t('moneyOut')} ${formatMoney(balances.USD.totalOut, 'USD')}`}
        />
        <StatCard
          label={`${t('currentBalance')} (SYP)`}
          value={formatMoney(balances.SYP.balance, 'SYP')}
          sub={`${t('moneyIn')} ${formatMoney(balances.SYP.totalIn, 'SYP')} — ${t('moneyOut')} ${formatMoney(balances.SYP.totalOut, 'SYP')}`}
          accent="#2563eb"
        />
        <StatCard label={t('employeesCount')} value={data.employeeCount} />
        <StatCard
          label={t('todayAttendance')}
          value={`${todayAttendance.summary.present + todayAttendance.summary.late}`}
          sub={`حاضر ${todayAttendance.summary.present} · متأخر ${todayAttendance.summary.late} · غائب ${todayAttendance.summary.absent} · لم يسجل ${todayAttendance.summary.notCheckedIn}`}
          accent="#1f9d6a"
        />
      </div>

      <div className="grid grid-2" style={{ marginBottom: 16 }}>
        <Card title="التدفق النقدي الشهري (USD)">
          <div className="chart-box">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowChart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                <YAxis width={48} tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="in" name={t('moneyIn')} fill="#1f9d6a" radius={[6, 6, 0, 0]} />
                <Bar dataKey="out" name={t('moneyOut')} fill="#d64545" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card title="توزيع المصروفات">
          {data.charts.expensesByCategory.length === 0 ? (
            <EmptyState title="لا مصروفات بعد" />
          ) : (
            <div>
              {data.charts.expensesByCategory.map((item) => (
                <div className="report-row" key={`${item.nameAr}-${item.currency}`}>
                  <span>{item.nameAr}</span>
                  <strong className="mono">{formatMoney(item.total, item.currency as 'USD' | 'SYP')}</strong>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title={t('recentTransactions')} style={{ marginBottom: 16 }}>
        {data.recentTransactions.length === 0 ? (
          <EmptyState title="لا معاملات" description={t('noTransactions')} />
        ) : (
          <>
            <div className="table-wrap desktop-only" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('date')}</th>
                    <th>{t('type')}</th>
                    <th>{t('category')}</th>
                    <th>{t('description')}</th>
                    <th>{t('amount')}</th>
                    <th>{t('balanceAfter')}</th>
                  </tr>
                </thead>
                <tbody>
                  {data.recentTransactions.map((tx) => (
                    <tr key={tx._id}>
                      <td>{formatDate(tx.date)}</td>
                      <td>
                        <Badge tone={tx.type === 'IN' ? 'in' : 'out'}>
                          {tx.type === 'IN' ? t('moneyIn') : t('moneyOut')}
                        </Badge>
                      </td>
                      <td>{categoryName(tx.category as never)}</td>
                      <td>{tx.description}</td>
                      <td className={tx.type === 'IN' ? 'amount-in' : 'amount-out'}>
                        {tx.type === 'IN' ? '+' : '-'}
                        {formatMoney(tx.amount, tx.currency)}
                      </td>
                      <td className="mono">
                        {tx.balanceAfter != null ? formatMoney(tx.balanceAfter, tx.currency) : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards">
              {data.recentTransactions.map((tx) => (
                <div className="mobile-card" key={tx._id}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                    <Badge tone={tx.type === 'IN' ? 'in' : 'out'}>
                      {tx.type === 'IN' ? t('moneyIn') : t('moneyOut')}
                    </Badge>
                    <strong className={tx.type === 'IN' ? 'amount-in' : 'amount-out'}>
                      {formatMoney(tx.amount, tx.currency)}
                    </strong>
                  </div>
                  <div className="row"><span>التاريخ</span><span>{formatDate(tx.date)}</span></div>
                  <div className="row"><span>التصنيف</span><span>{categoryName(tx.category as never)}</span></div>
                  <div className="row"><span>الوصف</span><span>{tx.description}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>

      <Card title={t('todayAttendance')}>
        {todayAttendance.items.length === 0 ? (
          <EmptyState title={t('noAttendance')} />
        ) : (
          <>
            <div className="table-wrap desktop-only" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>{t('employee')}</th>
                    <th>{t('checkIn')}</th>
                    <th>{t('checkOut')}</th>
                    <th>{t('status')}</th>
                    <th>{t('workedHours')}</th>
                  </tr>
                </thead>
                <tbody>
                  {todayAttendance.items.map((row) => (
                    <tr key={row.employeeId}>
                      <td>{row.fullName}</td>
                      <td>{row.checkIn || '—'}</td>
                      <td>{row.checkOut || '—'}</td>
                      <td>
                        <Badge
                          tone={
                            row.status === 'late'
                              ? 'late'
                              : row.status === 'absent'
                                ? 'absent'
                                : row.status === 'not_checked_in'
                                  ? 'neutral'
                                  : 'present'
                          }
                        >
                          {statusLabels[row.status] || row.status}
                        </Badge>
                      </td>
                      <td>{formatMinutes(row.workedMinutes)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mobile-cards">
              {todayAttendance.items.map((row) => (
                <div className="mobile-card" key={row.employeeId}>
                  <strong>{row.fullName}</strong>
                  <div className="row"><span>الحضور</span><span>{row.checkIn || '—'}</span></div>
                  <div className="row"><span>الانصراف</span><span>{row.checkOut || '—'}</span></div>
                  <div className="row"><span>الحالة</span><span>{statusLabels[row.status]}</span></div>
                </div>
              ))}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
