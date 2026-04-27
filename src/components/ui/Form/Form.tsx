'use client';

import {
  Children,
  cloneElement,
  createContext,
  isValidElement,
  useContext,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  useState,
} from 'react';
import cn from 'classnames';
import styles from '@/components/ui/Form/Form.module.css';

export type FormValues = Record<string, unknown>;

type FormRule<TValues extends FormValues> = {
  required?: boolean;
  message?: string;
  validator?: (value: unknown, values: TValues) => string | undefined;
};

type FormProps<TValues extends FormValues> = {
  initialValues: TValues;
  form?: FormInstance<TValues>;
  className?: string;
  children: React.ReactNode;
  onValuesChange?: (changedValues: Partial<TValues>, allValues: TValues) => void;
};

type FormItemProps<TValues extends FormValues, TName extends keyof TValues> = {
  name: TName;
  label?: string;
  rules?: Array<FormRule<TValues>>;
  valuePropName?: 'value' | 'checked';
  trigger?: 'onChange';
  getValueFromEvent?: (eventOrValue: unknown) => TValues[TName];
  children: React.ReactElement;
};

type FormContextValue<TValues extends FormValues> = {
  values: TValues;
  errors: Partial<Record<keyof TValues, string>>;
  setFieldValue: <TName extends keyof TValues>(name: TName, value: TValues[TName]) => void;
  setFieldError: <TName extends keyof TValues>(name: TName, error?: string) => void;
  setFieldValidator: <TName extends keyof TValues>(
    name: TName,
    validator?: (value: TValues[TName]) => string | undefined,
  ) => void;
};

type FieldValidator<TValues extends FormValues> = (value: unknown, values: TValues) => string | undefined;

type FormBridge<TValues extends FormValues> = {
  getFieldsValue: () => TValues;
  setFieldsValue: (fields: Partial<TValues>) => void;
  resetFields: () => void;
  validateFields: () => boolean;
};

export type FormInstance<TValues extends FormValues> = {
  getFieldsValue: () => TValues;
  setFieldsValue: (fields: Partial<TValues>) => void;
  resetFields: () => void;
  validateFields: () => boolean;
  _setBridge: (bridge: FormBridge<TValues> | null) => void;
};

const FormContext = createContext<FormContextValue<FormValues> | null>(null);

function useFormContext<TValues extends FormValues>() {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('Form.Item must be used inside Form');
  }
  return context as FormContextValue<TValues>;
}

function createFormInstance<TValues extends FormValues>(): FormInstance<TValues> {
  let bridge: FormBridge<TValues> | null = null;

  return {
    getFieldsValue: () => bridge?.getFieldsValue() ?? ({} as TValues),
    setFieldsValue: (fields) => {
      bridge?.setFieldsValue(fields);
    },
    resetFields: () => {
      bridge?.resetFields();
    },
    validateFields: () => bridge?.validateFields() ?? false,
    _setBridge: (nextBridge) => {
      bridge = nextBridge;
    },
  };
}

function useForm<TValues extends FormValues>() {
  const ref = useRef<FormInstance<TValues> | null>(null);
  if (!ref.current) {
    ref.current = createFormInstance<TValues>();
  }
  return [ref.current] as const;
}

function FormRoot<TValues extends FormValues>({
  initialValues,
  form,
  className,
  children,
  onValuesChange,
}: FormProps<TValues>) {
  const [internalForm] = useForm<TValues>();
  const formInstance = form ?? internalForm;
  const [values, setValues] = useState<TValues>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof TValues, string>>>({});
  const validatorsRef = useRef<Partial<Record<keyof TValues, FieldValidator<TValues>>>>({});
  const initialValuesRef = useRef(initialValues);
  const valuesRef = useRef(values);
  valuesRef.current = values;

  const validateAllFields = useCallback(() => {
    const currentValues = valuesRef.current;
    const nextErrors: Partial<Record<keyof TValues, string>> = {};

    (Object.keys(validatorsRef.current) as Array<keyof TValues>).forEach((key) => {
      const validator = validatorsRef.current[key];
      if (!validator) {
        return;
      }
      const validationError = validator(currentValues[key], currentValues);
      if (validationError) {
        nextErrors[key] = validationError;
      }
    });

    setErrors(nextErrors);
    return !Object.keys(nextErrors).length;
  }, []);

  const applyPartialValues = useCallback((previous: TValues, fields: Partial<TValues>) => {
    let changed = false;
    const changedValues: Partial<TValues> = {};
    const nextValues = { ...previous } as TValues;

    (Object.keys(fields) as Array<keyof TValues>).forEach((key) => {
      const nextValue = fields[key];
      if (typeof nextValue === 'undefined') {
        return;
      }
      if (Object.is(previous[key], nextValue)) {
        return;
      }
      changed = true;
      nextValues[key] = nextValue as TValues[typeof key];
      changedValues[key] = nextValue as TValues[typeof key];
    });

    return {
      changed,
      changedValues,
      nextValues,
    };
  }, []);

  useEffect(() => {
    initialValuesRef.current = initialValues;
    const keys = Object.keys(initialValues) as Array<keyof TValues>;
    const current = valuesRef.current;
    const same = keys.every((key) => Object.is(current[key], initialValues[key]));
    if (same) {
      return;
    }
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  useEffect(() => {
    formInstance._setBridge({
      getFieldsValue: () => values,
      setFieldsValue: (fields) => {
        setValues((previous) => {
          const result = applyPartialValues(previous, fields);
          if (!result.changed) {
            return previous;
          }
          const { changedValues, nextValues } = result;
          queueMicrotask(() => {
            onValuesChange?.(changedValues, nextValues);
          });
          return result.nextValues;
        });
      },
      resetFields: () => {
        setValues(initialValuesRef.current);
        setErrors({});
      },
      validateFields: () => validateAllFields(),
    });

    return () => {
      formInstance._setBridge(null);
    };
  }, [applyPartialValues, formInstance, onValuesChange, validateAllFields, values]);

  const contextValue = useMemo<FormContextValue<TValues>>(
    () => ({
      values,
      errors,
      setFieldValue: (name, value) => {
        setValues((previous) => {
          const partialField = { [name]: value } as unknown as Partial<TValues>;
          const result = applyPartialValues(previous, partialField);
          if (!result.changed) {
            return previous;
          }
          const { changedValues, nextValues } = result;
          queueMicrotask(() => {
            onValuesChange?.(changedValues, nextValues);
          });
          return result.nextValues;
        });
      },
      setFieldError: (name, error) => {
        setErrors((previous) => {
          if (previous[name] === error) {
            return previous;
          }
          return {
            ...previous,
            [name]: error,
          };
        });
      },
      setFieldValidator: (name, validator) => {
        validatorsRef.current[name] = validator as FieldValidator<TValues> | undefined;
      },
    }),
    [applyPartialValues, errors, onValuesChange, values],
  );

  return (
    <FormContext.Provider value={contextValue as FormContextValue<FormValues>}>
      <form className={cn(styles.form, className)} onSubmit={(event) => event.preventDefault()}>
        {children}
      </form>
    </FormContext.Provider>
  );
}

function FormItem<TValues extends FormValues, TName extends keyof TValues>({
  name,
  label,
  rules,
  valuePropName = 'value',
  trigger = 'onChange',
  getValueFromEvent,
  children,
}: FormItemProps<TValues, TName>) {
  const { values, errors, setFieldError, setFieldValue, setFieldValidator } = useFormContext<TValues>();
  const fieldId = String(name);
  const fieldValue = values[name];
  const fieldError = errors[name];

  const validateField = useCallback(
    (nextValue: TValues[TName]) => {
      if (!rules?.length) {
        return undefined;
      }

      for (const rule of rules) {
        if (rule.required) {
          const isEmptyString = typeof nextValue === 'string' && !nextValue.trim();
          const isEmptyValue = nextValue === null || nextValue === undefined;
          if (isEmptyString || isEmptyValue) {
            return rule.message ?? 'Field is required';
          }
        }

        const validationError = rule.validator?.(nextValue, values);
        if (validationError) {
          return validationError;
        }
      }

      return undefined;
    },
    [rules, values],
  );

  useEffect(() => {
    setFieldValidator(name, (value) => validateField(value as TValues[TName]));
    return () => {
      setFieldValidator(name, undefined);
    };
  }, [name, setFieldValidator, validateField]);

  const child = Children.only(children);
  if (!isValidElement(child)) {
    return null;
  }

  const typedChild = child as React.ReactElement<{ onChange?: (value: unknown) => void }>;
  const originalOnChange = typedChild.props.onChange;

  const extractValue = (eventOrValue: unknown): TValues[TName] => {
    if (getValueFromEvent) {
      return getValueFromEvent(eventOrValue);
    }

    if (eventOrValue && typeof eventOrValue === 'object' && 'target' in eventOrValue) {
      const target = (eventOrValue as { target?: { value?: unknown; checked?: unknown } }).target;
      if (valuePropName === 'checked') {
        return Boolean(target?.checked) as TValues[TName];
      }
      return (target?.value ?? '') as TValues[TName];
    }

    return eventOrValue as TValues[TName];
  };

  const controlProps: Record<string, unknown> = {
    id: fieldId,
    hasError: Boolean(fieldError),
    [valuePropName]: valuePropName === 'checked' ? Boolean(fieldValue) : (fieldValue ?? ''),
    [trigger]: (eventOrValue: unknown) => {
      const nextValue = extractValue(eventOrValue);
      const nextError = validateField(nextValue);
      setFieldError(name, nextError);
      setFieldValue(name, nextValue);
      originalOnChange?.(eventOrValue);
    },
  };

  return (
    <div className={styles.item}>
      {label ? (
        <label htmlFor={fieldId} className={styles.label}>
          {label}
        </label>
      ) : null}
      {cloneElement(child, controlProps)}
      {fieldError ? <span className={styles.errorText}>{fieldError}</span> : null}
    </div>
  );
}

type FormComponent = typeof FormRoot & {
  Item: typeof FormItem;
  useForm: typeof useForm;
};

export const Form = FormRoot as FormComponent;
Form.Item = FormItem;
Form.useForm = useForm;
