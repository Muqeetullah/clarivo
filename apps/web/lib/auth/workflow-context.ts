export type WorkflowContext = {
  pending: boolean;
  setPending: (pending: boolean) => void;
  setMessage: (message: string) => void;
  setMessageIsError: (error: boolean) => void;
  callbackURL: () => string;
};
