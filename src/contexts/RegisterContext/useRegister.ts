import { createContext, useContext } from "react";
import type { RegisterData, RegisterField } from "../../types/register";

interface RegisterContextProps {
  registerData: RegisterData;
  setField: (field: RegisterField, value: string) => void;
  resetRegister: () => void;
}

export const RegisterContext =
  createContext<RegisterContextProps | undefined>(undefined);

export function useRegister() {
  const context = useContext(RegisterContext);

  if (!context) {
    throw new Error(
      "useRegister deve ser utilizado dentro de RegisterProvider",
    );
  }

  return context;
}