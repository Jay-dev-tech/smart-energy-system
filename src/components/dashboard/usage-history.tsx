import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { UsageChart } from './usage-chart';
import { HOURLY_USAGE_DATA } from '../../lib/data';
import { Activity } from 'lucide-react';

export function UsageHistory() {
  return (
    <Card className="shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Activity className="text-primary w-6 h-6" />
          <CardTitle className="font-headline text-xl">Energy Usage History</CardTitle>
        </div>
        <CardDescription>24-hour energy consumption and generation.</CardDescription>
      </CardHeader>
      <CardContent>
        <UsageChart data={HOURLY_USAGE_DATA} />
      </CardContent>
    </Card>
  );
}
