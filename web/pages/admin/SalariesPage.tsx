import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Printer } from 'lucide-react';
import api, { handleApiError } from '../../services/api';
import { Button } from '../../components/Button';
import { Field, Select } from '../../components/Field';
import { Card } from '../../components/Card';
import { EmptyState, LoadingSpinner } from '../../components/ui';
import { t } from '../../i18n';
import type { Employee } from '../../types';
import { formatMoney } from '../../utils/format';

interface SalaryReport {
  employee: {
    fullName: string;
    position: string;
    salaryCurrency: 'USD' | 'SYP';
  };
  monthlySalary: number;
  expectedWorkingDays: number;
  presentDays: number;
  lateDays: number;
  absentDays: number;
  incompleteDays: number;
  lateMinutes: number;
  dailyRate: number;
  hourlyRate: number;
  absenceDeduction: number;
  lateDeduction: number;
  finalSalary: number;
  currency: 'USD' | 'SYP';
  period: { year: number; month: number };
}

export default function SalariesPage() {
  const [params] = useSearchParams();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [employeeId, setEmployeeId] = useState(params.get('employeeId') || '');
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [month, setMonth] = useState(String(new Date().getMonth() + 1));
  const [report, setReport] = useState<SalaryReport | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.get('/employees', { params: { active: 'true' } }).then((res) => {
      setEmployees(res.data.data);
      if (!employeeId && res.data.data[0]) setEmployeeId(res.data.data[0]._id);
    });
  }, []);

  async function loadReport() {
    if (!employeeId) return;
    setLoading(true);
    try {
      const { data } = await api.get(`/salaries/${employeeId}/${year}/${month}`);
      setReport(data.data);
    } catch (error) {
      handleApiError(error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (employeeId) loadReport();
  }, [employeeId, year, month]);

  function handlePrint() {
    window.print();
  }

  return (
    <div className="fade-up">
      <div className="page-header no-print">
        <div>
          <h1>{t('salaries')}</h1>
          <p>حساب الراتب الشهري بناءً على الحضور والغياب والتأخير</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={handlePrint} disabled={!report}>
            <Printer size={16} /> {t('print')} / PDF
          </Button>
        </div>
      </div>

      <Card className="no-print" style={{ marginBottom: 16 } as never}>
        <div className="filters">
          <Field label={t('employee')}>
            <Select value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {employees.map((e) => <option key={e._id} value={e._id}>{e.fullName}</option>)}
            </Select>
          </Field>
          <Field label="الشهر">
            <Select value={month} onChange={(e) => setMonth(e.target.value)}>
              {Array.from({ length: 12 }, (_, i) => (
                <option key={i + 1} value={String(i + 1)}>{i + 1}</option>
              ))}
            </Select>
          </Field>
          <Field label="السنة">
            <Select value={year} onChange={(e) => setYear(e.target.value)}>
              {[2024, 2025, 2026, 2027].map((y) => (
                <option key={y} value={String(y)}>{y}</option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {loading ? (
        <LoadingSpinner />
      ) : !report ? (
        <EmptyState title="اختر موظفاً لعرض تقرير الراتب" />
      ) : (
        <div className="report-sheet">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24, gap: 12, flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontFamily: 'var(--font-en)', fontWeight: 700, letterSpacing: '0.06em' }}>ELYPTEK</div>
              <h2 style={{ margin: '8px 0 4px' }}>تقرير الراتب الشهري</h2>
              <div style={{ color: 'var(--muted)' }}>
                {report.period.year}/{String(report.period.month).padStart(2, '0')}
              </div>
            </div>
            <div style={{ textAlign: 'left' }}>
              <strong>{report.employee.fullName}</strong>
              <div style={{ color: 'var(--muted)' }}>{report.employee.position}</div>
            </div>
          </div>

          <div className="report-row"><span>{t('monthlySalary')}</span><span className="mono">{formatMoney(report.monthlySalary, report.currency)}</span></div>
          <div className="report-row"><span>أيام العمل المتوقعة</span><span>{report.expectedWorkingDays}</span></div>
          <div className="report-row"><span>أيام الحضور</span><span>{report.presentDays}</span></div>
          <div className="report-row"><span>أيام الغياب</span><span>{report.absentDays}</span></div>
          <div className="report-row"><span>أيام غير مكتملة</span><span>{report.incompleteDays}</span></div>
          <div className="report-row"><span>دقائق التأخير</span><span>{report.lateMinutes}</span></div>
          <div className="report-row"><span>الأجر اليومي</span><span className="mono">{formatMoney(report.dailyRate, report.currency)}</span></div>
          <div className="report-row"><span>خصم الغياب</span><span className="mono amount-out">-{formatMoney(report.absenceDeduction, report.currency)}</span></div>
          <div className="report-row"><span>خصم التأخير</span><span className="mono amount-out">-{formatMoney(report.lateDeduction, report.currency)}</span></div>
          <div className="report-row total">
            <span>{t('finalSalary')}</span>
            <span className="mono">{formatMoney(report.finalSalary, report.currency)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
