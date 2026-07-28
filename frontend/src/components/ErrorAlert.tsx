interface ErrorAlertProps {
  message: string;
}

export function ErrorAlert({ message }: ErrorAlertProps) {
  if (!message) {
    return null;
  }
  return (
    <div className="message message-error" role="alert">
      {message}
    </div>
  );
}
