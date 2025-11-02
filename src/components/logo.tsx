
import { Sun, Zap } from 'lucide-react';

export function Logo() {
  return (
    <div className="flex items-center justify-center space-x-2">
      <div className="relative flex items-center justify-center">
        <Sun className="h-12 w-12 text-yellow-400" />
        <Zap className="absolute h-6 w-6 text-orange-400 animate-pulse" />
      </div>
      <span className="text-2xl font-bold font-headline text-primary">
        Solaris
      </span>
    </div>
  );
}
