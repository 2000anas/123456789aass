import { useState } from 'react';
import { Printer } from 'lucide-react';
import api, { handleApiError } from '../../services/api';
import { Button } from '../../components/Button';
import { Field, Input, Select } from '../../components/Field';
import { Card } from '../../components/Card';
import { Badge, EmptyState, LoadingSpinner } from '../../components/ui';
import { t } from '../../i18n';
import { categoryName, formatDate, formatMoney, todayInputValue } from '../../utils/format';
import type { Transaction } from '../../types';

type ReportType = 'financial' | 'expenses' | 'transactions';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('financial');
  const [startDate, setStartDate] = useState(todayInputValue().slice(0, 8) + '01');
  const [endDate, setEndDate] = useState(todayInputValue());
  const [currency, setCurrency] = useState('');
  const [loading, setLoading] = useState(false);
  const [financial, setFinancial] = useState<any>(null);
  const [expenses, setExpenses] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  async function load() {
    setLoading(true);
    try {
      const params = {
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        currency: currency || undefined,
      };
      if (reportType === 'financial') {
        const { data } = await api.get('/reports/financial', { params });
        setFinancial(data.data);
      } else if (reportType === 'expenses') {
        const { data } = await api.get('/reports/expenses', { params });
        setExpenses(data.data);
      } else {
        const { data } = await api.get('/reports/transactions', { params });
        setTransactions(data.data.items);
      }
    } catch (error) {
      handleApiError(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fade-up">
      <div className="page-header no-print">
        <div>
          <h1>{t('reports')}</h1>
          <p>تقارير مالية قابلة للطباعة والتصدير</p>
        </div>
        <Button variant="outline" onClick={() => window.print()}>
          <Printer size={16} /> {t('print')} / PDF
        </Button>
      </div>

      <Card className="no-print" style={{ marginBottom: 16 } as never}>
        <div className="filters">
          <Select value={reportType} onChange={(e) => setReportType(e.target.value as ReportType)}>
            <option value="financial">ملخص مالي</option>
            <option value="expenses">تقرير المصروفات</option>
            <option value="transactions">تقرير المعاملات</option>
          </Select>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          <Select value={currency} onChange={(e) => setCurrency(e.target.value)}>
            <option value="">كل العملات</option>
            <option value="USD">USD</option>
            <option value="SYP">SYP</option>
          </Select>
          <Button onClick={load}>إنشاء التقرير</Button>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : (
        <div className="report-sheet">
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-en)', fontWeight: 700 }}>ELYPTEK</div>
            <h2 style={{ margin: '8px 0' }}>
              {reportType === 'financial' ? 'الملخص المالي' : reportType === 'expenses' ? 'تقرير المصروفات' : 'تقرير المعاملات'}
            </h2>
            <div style={{ color: 'var(--muted)' }}>
              من {startDate || '—'} إلى {endDate || '—'}
            </div>
          </div>

          {reportType === 'financial' && financial && (
            <>
              {(['USD', 'SYP'] as const).map((cur) => (
                <div key={cur} style={{ marginBottom: 24 }}>
                  <h3>{cur}</h3>
                  <div className="report-row"><span>{t('totalIn')}</span><span className="amount-in">{formatMoney(financial.summary[cur].totalIn, cur)}</span></div>
                  <div className="report-row"><span>{t('totalOut')}</span><span className="amount-out">{formatMoney(financial.summary[cur].totalOut, cur)}</span></div>
                  <div className="report-row total"><span>صافي الرصيد</span><span className="mono">{formatMoney(financial.summary[cur].net, cur)}</span></div>
                </div>
              ))}
            </>
          )}

          {reportType === 'expenses' && expenses && (
            expenses.items.length === 0 ? <EmptyState title="لا مصروفات في الفترة المحددة" /> : (
              <>
                {expenses.items.map((item: any) => (
                  <div className="report-row" key={`${item.categoryId}-${item.currency}`}>
                    <span>{item.nameAr} ({item.currency})</span>
                    <span className="mono">{formatMoney(item.total, item.currency)}</span>
                  </div>
                ))}
                <div className="report-row total"><span>الإجمالي USD</span><span>{formatMoney(expenses.totals.USD, 'USD')}</span></div>
                <div className="report-row total"><span>الإجمالي SYP</span><span>{formatMoney(expenses.totals.SYP, 'SYP')}</span></div>
              </>
            )
          )}

          {reportType === 'transactions' && (
            transactions.length === 0 ? <EmptyState title="لا معاملات في الفترة المحددة" /> : (
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
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx._id}>
                          <td>{formatDate(tx.date)}</td>
                          <td><Badge tone={tx.type === 'IN' ? 'in' : 'out'}>{tx.type === 'IN' ? t('moneyIn') : t('moneyOut')}</Badge></td>
                          <td>{categoryName(tx.category as never)}</td>
                          <td>{tx.description}</td>
                          <td className={tx.type === 'IN' ? 'amount-in' : 'amount-out'}>{formatMoney(tx.amount, tx.currency)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="mobile-cards">
                  {transactions.map((tx) => (
                    <div className="mobile-card" key={tx._id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
                        <Badge tone={tx.type === 'IN' ? 'in' : 'out'}>{tx.type === 'IN' ? t('moneyIn') : t('moneyOut')}</Badge>
                        <strong className={tx.type === 'IN' ? 'amount-in' : 'amount-out'}>{formatMoney(tx.amount, tx.currency)}</strong>
                      </div>
                      <div className="row"><span>التاريخ</span><span>{formatDate(tx.date)}</span></div>
                      <div className="row"><span>التصنيف</span><span>{categoryName(tx.category as never)}</span></div>
                      <div className="row"><span>الوصف</span><span>{tx.description}</span></div>
                    </div>
                  ))}
                </div>
              </>
            )
          )}

          {!financial && !expenses && transactions.length === 0 && !loading && (
            <EmptyState title="اضغط إنشاء التقرير لعرض النتائج" />
          )}
        </div>
      )}
    </div>
  );
}
