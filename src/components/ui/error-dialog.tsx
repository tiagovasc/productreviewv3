import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { ApiLog } from "@/types/product";

interface ErrorDialogProps {
  logs: ApiLog[];
}

export function ErrorDialog({ logs }: ErrorDialogProps) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="link" className="text-destructive p-0 h-auto font-semibold">
          here
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-w-3xl">
        <AlertDialogHeader>
          <AlertDialogTitle>Error Details</AlertDialogTitle>
          <AlertDialogDescription>
            Here are the detailed logs of what happened:
          </AlertDialogDescription>
        </AlertDialogHeader>
        <ScrollArea className="h-[400px] w-full rounded-md border p-4">
          <div className="space-y-4">
            {logs.map((log, index) => (
              <div key={index} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">
                    {log.type.toUpperCase()} - {log.endpoint}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </span>
                </div>

                {log.request && (
                  <div className="ml-4">
                    <p className="text-sm font-medium">Request:</p>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                      {JSON.stringify(log.request, null, 2)}
                    </pre>
                  </div>
                )}

                {log.response && (
                  <div className="ml-4">
                    <p className="text-sm font-medium">Response:</p>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                      {JSON.stringify(log.response, null, 2)}
                    </pre>
                  </div>
                )}

                {log.error && (
                  <div className="ml-4">
                    <p className="text-sm font-medium text-destructive">Error:</p>
                    <pre className="text-xs bg-destructive/10 text-destructive p-2 rounded-md overflow-x-auto">
                      {JSON.stringify(log.error, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
        <AlertDialogFooter>
          <AlertDialogAction>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}