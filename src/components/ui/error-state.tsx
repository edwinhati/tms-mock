import { AlertCircle, RefreshCw, ServerOff, WifiOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  variant?: "default" | "network" | "server";
}

export function ErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading the data. Please try again.",
  onRetry,
  variant = "default",
}: ErrorStateProps) {
  const icons = {
    default: AlertCircle,
    network: WifiOff,
    server: ServerOff,
  };

  const Icon = icons[variant];

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-destructive" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-sm mb-6">{message}</p>
      {onRetry && (
        <Button onClick={onRetry} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      )}
    </div>
  );
}

interface TableErrorStateProps {
  onRetry: () => void;
  message?: string;
}

export function TableErrorState({
  onRetry,
  message = "Failed to load data. Please try again.",
}: TableErrorStateProps) {
  return (
    <ErrorState
      title="Failed to load data"
      message={message}
      onRetry={onRetry}
    />
  );
}

interface PageErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
  onBack?: () => void;
  backLabel?: string;
}

export function PageErrorState({
  title = "Something went wrong",
  message = "An error occurred while loading this page. Please try again.",
  onRetry,
  onBack,
  backLabel = "Go Back",
}: PageErrorStateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-destructive" />
      </div>
      <h1 className="text-2xl font-bold text-foreground mb-3">{title}</h1>
      <p className="text-muted-foreground max-w-md mb-8">{message}</p>
      <div className="flex flex-col sm:flex-row gap-3">
        {onRetry && (
          <Button onClick={onRetry}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        )}
        {onBack && (
          <Button variant="outline" onClick={onBack}>
            {backLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
