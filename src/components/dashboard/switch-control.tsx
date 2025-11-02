
import { BrainCircuit, Loader2, ToggleRight } from 'lucide-react';
import type { SwitchState } from '../../lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../ui/card';
import { Switch } from '../ui/switch';
import { Textarea } from '../ui/textarea';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

const switchIcons: { [key: string]: React.ReactNode } = {
  "Switch 1": <ToggleRight className="h-5 w-5" />,
  "Switch 2": <ToggleRight className="h-5 w-5" />,
  "Switch 3": <ToggleRight className="h-5 w-5" />,
  "Switch 4": <ToggleRight className="h-5 w-5" />,
  "Switch 5": <ToggleRight className="h-5 w-5" />,
};

type SwitchControlProps = {
  switches: SwitchState[];
  userPreferences: string;
  aiReasoning: string;
  isOptimizing: boolean;
  isPredictionAvailable: boolean;
  onSwitchChange: (id: number, checked: boolean) => void;
  onPreferencesChange: (value: string) => void;
  onOptimize: () => void;
};

export function SwitchControl({
  switches,
  userPreferences,
  aiReasoning,
  isOptimizing,
  isPredictionAvailable,
  onSwitchChange,
  onPreferencesChange,
  onOptimize
}: SwitchControlProps) {
  return (
    <Card className="shadow-lg bg-card/50 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="font-headline text-xl">Smart Switch Control</CardTitle>
        <CardDescription>Manage your devices manually or use AI for optimal energy use.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {switches.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 border rounded-lg bg-background/50 hover:bg-muted/50 transition-colors">
              <div className="flex items-center space-x-3">
                <div className="text-primary">{switchIcons[s.name] || <ToggleRight className="h-5 w-5" />}</div>
                <label htmlFor={`switch-${s.id}`} className="text-sm font-medium">{s.name}</label>
              </div>
              <Switch
                id={`switch-${s.id}`}
                checked={s.state}
                onCheckedChange={(checked) => onSwitchChange(s.id, checked)}
                aria-label={s.name}
              />
            </div>
          ))}
        </div>

        {aiReasoning && (
          <div className="p-4 border-l-4 border-primary bg-primary/10 rounded-r-lg animate-in fade-in-0">
            <div className="flex">
              <BrainCircuit className="h-5 w-5 mr-3 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-primary">AI Recommendation</p>
                <p className="text-sm text-foreground/80 mt-1">{aiReasoning}</p>
              </div>
            </div>
          </div>
        )}
        
        <div className="grid gap-2">
          <Label htmlFor="preferences" className="font-semibold">User Preferences</Label>
          <Textarea
            id="preferences"
            value={userPreferences}
            onChange={e => onPreferencesChange(e.target.value)}
            placeholder="e.g., Prioritize battery life, turn off non-essentials at night..."
            className="mt-1 bg-background/50"
            rows={3}
          />
           <p className="text-xs text-muted-foreground">
            Guide the AI's decisions by specifying what's important to you.
          </p>
        </div>
        <Button onClick={onOptimize} disabled={isOptimizing || !isPredictionAvailable} size="lg" className="w-full sm:w-auto">
          {isOptimizing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <BrainCircuit className="mr-2 h-4 w-4" />}
          {isOptimizing ? 'Optimizing...' : 'Optimize with AI'}
        </Button>
      </CardContent>
    </Card>
  );
}
