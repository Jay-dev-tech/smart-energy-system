import type { PredictEnergyConsumptionOutput } from '../../ai/flows/predict-energy-consumption';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Button } from '../ui/button';
import { Loader2, Zap, BrainCircuit, Sparkles } from 'lucide-react';
import { Separator } from '../ui/separator';

type PredictionAnalyticsProps = {
  prediction: PredictEnergyConsumptionOutput | null;
  isLoading: boolean;
  onPredict: () => void;
};

export function PredictionAnalytics({ prediction, isLoading, onPredict }: PredictionAnalyticsProps) {
  return (
    <Card className="shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader className="pb-4">
        <div className="flex items-center gap-3">
          <Sparkles className="text-primary w-6 h-6" />
          <CardTitle className="font-headline text-xl">Predictive Analytics</CardTitle>
        </div>
        <CardDescription>Forecast future consumption to make smarter decisions.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
         <Button onClick={onPredict} disabled={isLoading} className="w-full">
          {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
          {isLoading ? 'Forecasting...' : 'Run New Forecast'}
        </Button>
        <Separator />
        {prediction ? (
          <div className="space-y-4 text-sm animate-in fade-in-0">
            <div>
              <p className="font-semibold text-muted-foreground">Predicted Consumption</p>
              <p className="text-2xl font-bold text-primary">{prediction.predictedConsumption.toFixed(2)} kWh</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">Confidence Interval</p>
              <p className="text-foreground/80">&plusmn;{prediction.confidenceInterval.toFixed(2)} kWh</p>
            </div>
             <div>
              <p className="font-semibold text-muted-foreground">User Usage Patterns</p>
              <p className="text-foreground/80 italic">"{prediction.userUsagePatterns}"</p>
            </div>
            <div>
              <p className="font-semibold text-muted-foreground">AI Analysis</p>
              <p className="text-foreground/80 italic">"{prediction.analysis}"</p>
            </div>
          </div>
        ) : (
          <div className="text-center text-muted-foreground py-8">
             <Zap className="mx-auto h-12 w-12 text-gray-500" />
            <p className="mt-4">Run a forecast to see energy predictions.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
