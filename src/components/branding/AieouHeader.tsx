import { Brain } from 'lucide-react';

export const AieouHeader = () => {
  return (
    <div className="text-center space-y-2 mb-8">
      <div className="flex items-center justify-center gap-3">
        <div className="p-3 rounded-full gradient-primary shadow-glow">
          <Brain className="h-8 w-8 text-primary-foreground" />
        </div>
        <h1 className="text-4xl font-bold gradient-primary bg-clip-text text-transparent">
          AI-E-O-U
        </h1>
      </div>
      <p className="text-lg text-muted-foreground font-medium">
        AI Enables Operational Utility – Smarter, Faster, Seamless
      </p>
    </div>
  );
};