import {
  ReactNode,
  useReducer,
} from "react";

import type {
  RegisterData,
  RegisterField,
} from "../../types/register";

import { RegisterContext } from "./useRegister";

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
