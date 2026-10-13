import {
  createContext,
  ReactNode,
  useContext,
  useReducer,
} from "react";

import type {
  RegisterData,
  RegisterField,
} from "../../types/register";

interface RegisterContextProps {
  registerData: RegisterData;
  setField: (field: RegisterField, value: string) => void;
  resetRegister: () => void;
}

interface RegisterProviderProps {
  children: ReactNode;
}

type RegisterAction =
  | {
      type: "SET_FIELD";
      field: RegisterField;
      value: string;
    }
  | {
      type: "RESET";
    };

const initialState: RegisterData = {
  name: "",
  birthDate: "",
  phone: "",
  email: "",
  password: "",
  confirmPassword: "",
};

const RegisterContext =
  createContext<RegisterContextProps | undefined>(undefined);

function registerReducer(
  state: RegisterData,
  action: RegisterAction,
): RegisterData {
  switch (action.type) {
    case "SET_FIELD":
      return {
        ...state,
        [action.field]: action.value,
      };

    case "RESET":
      return initialState;

    default:
      return state;
  }
}

export function RegisterProvider({
  children,
}: RegisterProviderProps) {
  const [registerData, dispatch] = useReducer(
    registerReducer,
    initialState,
  );

  function setField(
    field: RegisterField,
    value: string,
  ) {
    dispatch({
      type: "SET_FIELD",
      field,
      value,
    });
  }

  function resetRegister() {
    dispatch({
      type: "RESET",
    });
  }

  return (
    <RegisterContext.Provider
      value={{
        registerData,
        setField,
        resetRegister,
      }}
    >
      {children}
    </RegisterContext.Provider>
  );
}

export function useRegister() {
  const context = useContext(RegisterContext);

  if (!context) {
    throw new Error(
      "useRegister deve ser utilizado dentro de RegisterProvider",
    );
  }

  return context;
}