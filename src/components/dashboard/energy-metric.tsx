import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { cn } from '../../lib/utils';
import { BatteryCharging, Zap, Power, Thermometer, Droplets, Sigma, Hourglass, Gauge } from 'lucide-react';

interface EnergyMetricProps {
  label: 'Voltage' | 'Current' | 'Power' | 'Battery' | 'Temperature' | 'Humidity' | 'Total Consumption' | 'Energy Remain';
  value: string;
  batteryLevel?: number;
}

const getBatteryColor = (level: number) => {
  if (level > 50) return 'text-green-500';
  if (level > 20) return 'text-yellow-500';
  return 'text-red-500';
};

export function EnergyMetric({ label, value, batteryLevel }: EnergyMetricProps) {
  const Icon = () => {
    switch(label) {
      case 'Voltage': return <Gauge className="h-6 w-6 text-muted-foreground" />;
      case 'Current': return <Zap className="h-6 w-6 text-muted-foreground" />;
      case 'Power': return <Power className="h-6 w-6 text-muted-foreground" />;
      case 'Battery': return <BatteryCharging className={cn("h-6 w-6", batteryLevel !== undefined ? getBatteryColor(batteryLevel) : 'text-muted-foreground')} />;
      case 'Temperature': return <Thermometer className="h-6 w-6 text-muted-foreground" />;
      case 'Humidity': return <Droplets className="h-6 w-6 text-muted-foreground" />;
      case 'Total Consumption': return <Sigma className="h-6 w-6 text-muted-foreground" />;
      case 'Energy Remain': return <Hourglass className="h-6 w-6 text-muted-foreground" />;
      default: return null;
    }
  }

  return (
    <Card className="shadow-lg hover:shadow-primary/20 transition-shadow duration-300 bg-card/50 backdrop-blur-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon />
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-2xl font-bold",
          label === 'Battery' && batteryLevel !== undefined && getBatteryColor(batteryLevel)
        )}>
          {value}
        </div>
      </CardContent>
    </Card>
  );
}
