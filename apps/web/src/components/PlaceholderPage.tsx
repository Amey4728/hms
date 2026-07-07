import { Construction } from 'lucide-react';
import { PageHeader } from '@/components/PageHeader';
import { Card } from '@/components/ui';

export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <PageHeader title={title} />
      <Card className="flex flex-col items-center justify-center gap-3 p-12 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600">
          <Construction className="h-6 w-6" />
        </div>
        <p className="text-lg font-medium text-slate-800">Coming soon</p>
        <p className="max-w-sm text-sm text-slate-500">
          The <span className="font-medium">{title}</span> module is planned for {phase}. The
          backend permissions already exist — this screen is a placeholder.
        </p>
      </Card>
    </div>
  );
}
