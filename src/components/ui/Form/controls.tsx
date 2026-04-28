"use client";

import cn from "classnames";
import styles from "@/components/ui/Form/controls.module.css";

type BaseControlProps = {
  id?: string;
  className?: string;
  hasError?: boolean;
};

type InputProps = BaseControlProps & {
  value?: string;
  type?: "text" | "number";
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  disabled?: boolean;
  readOnly?: boolean;
  onChange?: (value: string) => void;
};

type TextAreaProps = BaseControlProps & {
  value?: string;
  placeholder?: string;
  rows?: number;
  onChange?: (value: string) => void;
};

type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

type SelectProps = BaseControlProps & {
  value?: string;
  options: SelectOption[];
  onChange?: (value: string) => void;
};

type CheckboxProps = {
  id?: string;
  checked?: boolean;
  children: React.ReactNode;
  onChange?: (checked: boolean) => void;
};

function BaseInput({
  id,
  value,
  type = "text",
  min,
  max,
  step,
  placeholder,
  disabled,
  readOnly,
  className,
  hasError,
  onChange,
}: InputProps) {
  return (
    <input
      id={id}
      type={type}
      min={min}
      max={max}
      step={step}
      value={value ?? ""}
      placeholder={placeholder}
      disabled={disabled}
      readOnly={readOnly}
      onChange={(event) => onChange?.(event.target.value)}
      className={cn(styles.control, className, { [styles.error]: hasError })}
    />
  );
}

function TextArea({ id, value, placeholder, rows = 4, className, hasError, onChange }: TextAreaProps) {
  return (
    <textarea
      id={id}
      value={value ?? ""}
      placeholder={placeholder}
      rows={rows}
      onChange={(event) => onChange?.(event.target.value)}
      className={cn(styles.control, styles.textArea, className, { [styles.error]: hasError })}
    />
  );
}

export function Select({ id, value, options, className, hasError, onChange }: SelectProps) {
  return (
    <select
      id={id}
      value={value ?? ""}
      onChange={(event) => onChange?.(event.target.value)}
      className={cn(styles.control, className, { [styles.error]: hasError })}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value} disabled={option.disabled}>
          {option.label}
        </option>
      ))}
    </select>
  );
}

export function Checkbox({ id, checked, children, onChange }: CheckboxProps) {
  return (
    <label htmlFor={id} className={styles.checkboxWrap}>
      <input
        id={id}
        type="checkbox"
        checked={Boolean(checked)}
        onChange={(event) => onChange?.(event.target.checked)}
        className={styles.checkbox}
      />
      {children}
    </label>
  );
}

type InputCompound = typeof BaseInput & {
  TextArea: typeof TextArea;
};

export const Input = BaseInput as InputCompound;
Input.TextArea = TextArea;
