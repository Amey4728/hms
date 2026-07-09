import { AlertTriangle, CalendarX } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Badge, Card, PageSpinner } from '@/components/ui';
import { formatDate } from '@/lib/format';
import { PharmacySubnav } from './PharmacySubnav';
import { useExpiring, useLowStock, useStock } from './hooks';

export function StockPage() {
  const stock = useStock({ limit: 100 });
  const low = useLowStock();
  const expiring = useExpiring(60);

  return (
    <div>
      <PageHeader title="Pharmacy" />
      <PharmacySubnav />

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Low stock</h3>
            <Badge tone="warning">{low.data?.length ?? 0}</Badge>
          </div>
          {(low.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">Everything is above reorder level.</p>
          ) : (
            <ul className="space-y-2">
              {low.data?.map((r) => (
                <li key={r.medicineId} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">{r.name}</span>
                  <span className="text-amber-600">
                    {r.stock} / reorder {r.reorderLevel}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2">
            <CalendarX className="h-5 w-5 text-red-500" />
            <h3 className="font-semibold text-slate-800 dark:text-slate-200">Expiring within 60 days</h3>
            <Badge tone="danger">{expiring.data?.length ?? 0}</Badge>
          </div>
          {(expiring.data?.length ?? 0) === 0 ? (
            <p className="text-sm text-slate-400 dark:text-slate-500">No batches expiring soon.</p>
          ) : (
            <ul className="space-y-2">
              {expiring.data?.map((b) => (
                <li key={b.batchId} className="flex justify-between text-sm">
                  <span className="text-slate-700 dark:text-slate-300">
                    {b.medicineName} <span className="text-xs text-slate-400 dark:text-slate-500">· {b.batchNumber}</span>
                  </span>
                  <span className="text-red-600">
                    {b.quantity} · {formatDate(b.expiryDate)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card>
        <div className="border-b border-slate-100 dark:border-slate-800 px-4 py-3 text-sm font-semibold text-slate-700 dark:text-slate-300">On-hand stock</div>
        {stock.isLoading ? (
          <PageSpinner />
        ) : (stock.data?.data.length ?? 0) === 0 ? (
          <div className="p-12 text-center text-sm text-slate-500 dark:text-slate-400">No medicines.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-left text-xs uppercase text-slate-500 dark:text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Batches</th>
                  <th className="px-4 py-3 text-right font-medium">On hand</th>
                  <th className="px-4 py-3 text-right font-medium">Reorder</th>
                  <th className="px-4 py-3 text-right font-medium">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {stock.data?.data.map((r) => (
                  <tr key={r.medicineId} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-mono text-xs text-slate-600 dark:text-slate-300">{r.code}</td>
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-slate-100">{r.name}</td>
                    <td className="px-4 py-3 text-slate-600 dark:text-slate-300">{r.batches}</td>
                    <td className="px-4 py-3 text-right font-medium text-slate-900 dark:text-slate-100">{r.stock}</td>
                    <td className="px-4 py-3 text-right text-slate-600 dark:text-slate-300">{r.reorderLevel}</td>
                    <td className="px-4 py-3 text-right">
                      <Badge tone={r.isLow ? 'danger' : 'success'}>{r.isLow ? 'Low' : 'OK'}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
