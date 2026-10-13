import type { ComponentProps, ReactNode } from "react";
import { CircleAlertIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export function AuthCard({
  title,
  description,
  children,
  footer,
}: {
  title: ReactNode;
  description: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <Card className="auth-card">
      <CardHeader>
        <CardTitle>
          <h1>{title}</h1>
        </CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer && <CardFooter className="justify-center">{footer}</CardFooter>}
    </Card>
  );
}

export function AuthButton({
  className,
  variant = "default",
  ...props
}: ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn("auth-control", className)}
      variant={variant}
      data-auth-variant={variant}
      {...props}
    />
  );
}

export function AuthFeedback({
  message,
  title,
  error = false,
  children,
  id,
}: {
  message: string;
  title: string;
  error?: boolean;
  children?: ReactNode;
  id?: string;
}) {
  if (!message) return null;
  return (
    <Alert
      id={id}
      variant={error ? "destructive" : "default"}
      role={error ? "alert" : "status"}
      data-error={error}
    >
      {error && <CircleAlertIcon aria-hidden="true" />}
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription>
        {message}
        {children}
      </AlertDescription>
    </Alert>
  );
}
