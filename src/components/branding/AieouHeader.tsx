import { Brain } from 'lucide-react';

export const AieouHeader = () => {
  return (
    <div className="text-center space-y-3 mb-12">
      <div className="flex items-center justify-center gap-4">
        <div className="p-4 rounded-2xl gradient-primary shadow-glow animate-pulse">
          <Brain className="h-10 w-10 text-primary-foreground" />
        </div>
        <h1 className="text-5xl font-bold gradient-primary bg-clip-text text-transparent tracking-wide">
          AIEOU
        </h1>
      </div>
      <p className="text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
        AI Enables Operational Utility – Smarter, Faster, Seamless
      </p>
    </div>
  );
};