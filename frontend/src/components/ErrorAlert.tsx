import { AlertCircle, RefreshCw } from "lucide-react";

import { useLanguage } from "../hooks/useLanguage";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Button } from "./ui/button";

interface ErrorAlertProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorAlert({ message, onRetry }: ErrorAlertProps) {
  const { t } = useLanguage();
  if (!message) return null;

  return (
    <Alert variant="destructive" role="alert">
      <AlertCircle aria-hidden="true" />
      <AlertTitle>{t("common:errors.title")}</AlertTitle>
      <AlertDescription className="flex flex-col items-start gap-3">
        <span>{message}</span>
        {onRetry ? (
          <Button type="button" variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw aria-hidden="true" />
            {t("common:actions.retry")}
          </Button>
        ) : null}
      </AlertDescription>
    </Alert>
  );
}
