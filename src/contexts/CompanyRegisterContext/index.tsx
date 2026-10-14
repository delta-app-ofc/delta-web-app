import {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useReducer,
} from "react";

import type {
  CompanyRegisterData,
  CompanyTextField,
  IndustryClassification,
  WaterSource,
  WaterUse,
  WeekDay,
} from "../../types/companyRegister";

interface CompanyRegisterContextProps {
  companyData: CompanyRegisterData;
  setTextField: (field: CompanyTextField, value: string) => void;
  setClassification: (value: IndustryClassification) => void;
  toggleOperationDay: (value: WeekDay) => void;
  setShiftCount: (value: 1 | 2 | 3 | 4) => void;
  setShiftTime: (id: string, field: "start" | "end", value: string) => void;
  toggleWaterUse: (value: WaterUse) => void;
  setWaterSource: (value: WaterSource) => void;
  resetCompanyRegister: () => void;
}

interface CompanyRegisterProviderProps {
  children: ReactNode;
}

type CompanyRegisterAction =
  | { type: "SET_TEXT_FIELD"; field: CompanyTextField; value: string }
  | { type: "SET_CLASSIFICATION"; value: IndustryClassification }
  | { type: "TOGGLE_OPERATION_DAY"; value: WeekDay }
  | { type: "SET_SHIFT_COUNT"; value: 1 | 2 | 3 | 4 }
  | { type: "SET_SHIFT_TIME"; id: string; field: "start" | "end"; value: string }
  | { type: "TOGGLE_WATER_USE"; value: WaterUse }
  | { type: "SET_WATER_SOURCE"; value: WaterSource }
  | { type: "RESET" };

interface StoredCompanyRegister {
  _versao: 1 | 2;
  data: CompanyRegisterData;
}

const STORAGE_KEY = "gota-por-gota:cadastro-empresa:v1";

const initialState: CompanyRegisterData = {
  legalName: "",
  tradeName: "",
  cnpj: "",
  industrySegment: "",
  companySize: "",
  unitName: "",
  postalCode: "",
  state: "",
  city: "",
  streetDistrict: "",
  number: "",
  classification: "",
  operationDays: [],
  operationStart: "",
  operationEnd: "",
  shiftCount: null,
  shifts: [],
  waterUses: [],
  waterSource: "",
  averageMonthlyConsumption: "",
  deviceId: "",
};

function readStoredState(): CompanyRegisterData {
  const storedValue = localStorage.getItem(STORAGE_KEY);

  if (!storedValue) {
    return initialState;
  }

  try {
    const storedData = JSON.parse(storedValue) as StoredCompanyRegister;

    if (storedData._versao === 1 || storedData._versao === 2) {
      return {
        ...initialState,
        ...storedData.data,
      };
    }

    return initialState;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return initialState;
  }
}

function toggleItem<T>(items: T[], value: T) {
  return items.includes(value)
    ? items.filter((item) => item !== value)
    : [...items, value];
}

function companyRegisterReducer(
  state: CompanyRegisterData,
  action: CompanyRegisterAction,
): CompanyRegisterData {
  switch (action.type) {
    case "SET_TEXT_FIELD":
      return { ...state, [action.field]: action.value };
    case "SET_CLASSIFICATION":
      return { ...state, classification: action.value };
    case "TOGGLE_OPERATION_DAY":
      return {
        ...state,
        operationDays: toggleItem(state.operationDays, action.value),
      };
    case "SET_SHIFT_COUNT":
      return {
        ...state,
        shiftCount: action.value,
        shifts: Array.from({ length: action.value }, (_, position) => {
          const currentShift = state.shifts[position];
          return currentShift ?? {
            id: `turno-${position + 1}`,
            start: "",
            end: "",
          };
        }),
      };
    case "SET_SHIFT_TIME":
      return {
        ...state,
        shifts: state.shifts.map((shift) =>
          shift.id === action.id
            ? { ...shift, [action.field]: action.value }
            : shift,
        ),
      };
    case "TOGGLE_WATER_USE":
      return {
        ...state,
        waterUses: toggleItem(state.waterUses, action.value),
      };
    case "SET_WATER_SOURCE":
      return { ...state, waterSource: action.value };
    case "RESET":
      return initialState;
    default:
      return state;
  }
}

const CompanyRegisterContext =
  createContext<CompanyRegisterContextProps | undefined>(undefined);

export function CompanyRegisterProvider({
  children,
}: CompanyRegisterProviderProps) {
  const [companyData, dispatch] = useReducer(
    companyRegisterReducer,
    initialState,
    readStoredState,
  );

  useEffect(() => {
    const storedData: StoredCompanyRegister = {
      _versao: 2,
      data: companyData,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(storedData));
  }, [companyData]);

  return (
    <CompanyRegisterContext.Provider
      value={{
        companyData,
        setTextField: (field, value) =>
          dispatch({ type: "SET_TEXT_FIELD", field, value }),
        setClassification: (value) =>
          dispatch({ type: "SET_CLASSIFICATION", value }),
        toggleOperationDay: (value) =>
          dispatch({ type: "TOGGLE_OPERATION_DAY", value }),
        setShiftCount: (value) =>
          dispatch({ type: "SET_SHIFT_COUNT", value }),
        setShiftTime: (id, field, value) =>
          dispatch({ type: "SET_SHIFT_TIME", id, field, value }),
        toggleWaterUse: (value) =>
          dispatch({ type: "TOGGLE_WATER_USE", value }),
        setWaterSource: (value) =>
          dispatch({ type: "SET_WATER_SOURCE", value }),
        resetCompanyRegister: () => dispatch({ type: "RESET" }),
      }}
    >
      {children}
    </CompanyRegisterContext.Provider>
  );
}

// O hook fica junto do Provider para manter a API pública do contexto coesa.
// eslint-disable-next-line react-refresh/only-export-components
export function useCompanyRegister() {
  const context = useContext(CompanyRegisterContext);

  if (!context) {
    throw new Error(
      "useCompanyRegister deve ser utilizado dentro de CompanyRegisterProvider",
    );
  }

  return context;
}
