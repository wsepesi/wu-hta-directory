import { useState, useCallback, useEffect } from 'react';
import { z } from 'zod';
// Remove conflicting import

interface UseFormValidationOptions<T> {
  schema: z.ZodSchema<T>;
  mode?: 'onChange' | 'onBlur' | 'onSubmit';
  revalidateMode?: 'onChange' | 'onBlur';
  debounceTime?: number;
}

interface FieldError {
  message: string;
  type: string;
}

interface UseFormValidationReturn<T> {
  values: Partial<T>;
  errors: Record<keyof T, FieldError | undefined>;
  touched: Record<keyof T, boolean>;
  isValid: boolean;
  isValidating: boolean;
  isDirty: boolean;
  
  // Field handlers
  register: (name: keyof T) => {
    value: any;
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    onBlur: () => void;
    error: FieldError | undefined;
    touched: boolean;
  };
  
  // Form handlers
  handleSubmit: (onValid: (data: T) => void | Promise<void>) => (e: React.FormEvent) => Promise<void>;
  reset: (values?: Partial<T>) => void;
  setValue: (name: keyof T, value: any) => void;
  setError: (name: keyof T, error: FieldError) => void;
  clearErrors: () => void;
  
  // Validation
  validate: () => boolean;
  validateField: (name: keyof T) => Promise<boolean>;
}

export function useFormValidation<T extends Record<string, any>>({
  schema,
  mode = 'onChange',
  revalidateMode = 'onChange',
  debounceTime = 300,
}: UseFormValidationOptions<T>): UseFormValidationReturn<T> {
  const [values, setValues] = useState<Partial<T>>({});
  const [errors, setErrors] = useState<Record<keyof T, FieldError | undefined>>({} as any);
  const [touched, setTouched] = useState<Record<keyof T, boolean>>({} as any);
  const [isValidating, setIsValidating] = useState(false);
  const [initialValues, setInitialValues] = useState<Partial<T>>({});

  // Check if form is dirty
  const isDirty = JSON.stringify(values) !== JSON.stringify(initialValues);

  // Check if form is valid
  const isValid = Object.keys(errors).length === 0 && Object.keys(values).length > 0;

  // Debounced validation function
  const debouncedValidate = useCallback(
    debounce(async (fieldName?: keyof T) => {
      setIsValidating(true);
      
      try {
        if (fieldName) {
          // Validate single field
          const fieldValue = values[fieldName];
          // For individual field validation, we'll validate the entire object
          // and extract the specific field error
          const fieldSchema = (schema as any)._def?.shape?.[fieldName as string];
          
          if (fieldSchema) {
            try {
              await fieldSchema.parseAsync(fieldValue);
              setErrors(prev => {
                const newErrors = { ...prev };
                delete newErrors[fieldName];
                return newErrors;
              });
            } catch (error) {
              if (error instanceof z.ZodError) {
                setErrors(prev => ({
                  ...prev,
                  [fieldName]: {
                    message: error.errors[0].message,
                    type: error.errors[0].code,
                  },
                }));
              }
            }
          }
        } else {
          // Validate entire form
          try {
            await schema.parseAsync(values);
            setErrors({} as any);
          } catch (error) {
            if (error instanceof z.ZodError) {
              const newErrors: Record<keyof T, FieldError | undefined> = {} as any;
              error.errors.forEach(err => {
                const field = err.path[0] as keyof T;
                if (field) {
                  newErrors[field] = {
                    message: err.message,
                    type: err.code,
                  };
                }
              });
              setErrors(newErrors);
            }
          }
        }
      } finally {
        setIsValidating(false);
      }
    }, debounceTime),
    [schema, values, debounceTime]
  );

  // Validate on value changes if mode is onChange
  useEffect(() => {
    if (mode === 'onChange' && Object.keys(touched).length > 0) {
      debouncedValidate();
    }
  }, [values, mode, touched, debouncedValidate]);

  const validateField = useCallback(async (name: keyof T): Promise<boolean> => {
    setIsValidating(true);
    
    try {
      const fieldValue = values[name];
      // For individual field validation, we'll validate the entire object
      // and extract the specific field error
      const fieldSchema = (schema as any)._def?.shape?.[name as string];
      
      if (fieldSchema) {
        try {
          await fieldSchema.parseAsync(fieldValue);
          setErrors(prev => {
            const newErrors = { ...prev };
            delete newErrors[name];
            return newErrors;
          });
          return true;
        } catch (error) {
          if (error instanceof z.ZodError) {
            setErrors(prev => ({
              ...prev,
              [name]: {
                message: error.errors[0].message,
                type: error.errors[0].code,
              },
            }));
          }
          return false;
        }
      }
      return true;
    } finally {
      setIsValidating(false);
    }
  }, [schema, values]);

  const validate = useCallback((): boolean => {
    try {
      schema.parse(values);
      setErrors({} as any);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<keyof T, FieldError | undefined> = {} as any;
        error.errors.forEach(err => {
          const field = err.path[0] as keyof T;
          if (field) {
            newErrors[field] = {
              message: err.message,
              type: err.code,
            };
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  }, [schema, values]);

  const register = useCallback((name: keyof T) => {
    return {
      value: values[name] || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const value = e.target.type === 'checkbox' 
          ? (e.target as HTMLInputElement).checked 
          : e.target.value;
        
        setValues(prev => ({ ...prev, [name]: value }));
        setTouched(prev => ({ ...prev, [name]: true }));
        
        // Clear error on change if revalidateMode is onChange
        if (revalidateMode === 'onChange' && errors[name]) {
          validateField(name);
        }
      },
      onBlur: () => {
        setTouched(prev => ({ ...prev, [name]: true }));
        
        // Validate on blur if mode is onBlur
        if (mode === 'onBlur' || revalidateMode === 'onBlur') {
          validateField(name);
        }
      },
      error: errors[name],
      touched: touched[name] || false,
    };
  }, [values, errors, touched, mode, revalidateMode, validateField]);

  const handleSubmit = useCallback((onValid: (data: T) => void | Promise<void>) => {
    return async (e: React.FormEvent) => {
      e.preventDefault();
      
      // Touch all fields
      const allTouched = Object.keys((schema as any)._def?.shape || {}).reduce((acc, key) => ({
        ...acc,
        [key]: true,
      }), {} as Record<keyof T, boolean>);
      setTouched(allTouched);
      
      // Validate
      if (validate()) {
        await onValid(values as T);
      }
    };
  }, [schema, values, validate]);

  const reset = useCallback((newValues?: Partial<T>) => {
    const resetValues = newValues || initialValues;
    setValues(resetValues);
    setErrors({} as any);
    setTouched({} as any);
    if (newValues) {
      setInitialValues(newValues);
    }
  }, [initialValues]);

  const setValue = useCallback((name: keyof T, value: any) => {
    setValues(prev => ({ ...prev, [name]: value }));
  }, []);

  const setError = useCallback((name: keyof T, error: FieldError) => {
    setErrors(prev => ({ ...prev, [name]: error }));
  }, []);

  const clearErrors = useCallback(() => {
    setErrors({} as any);
  }, []);

  return {
    values,
    errors,
    touched,
    isValid,
    isValidating,
    isDirty,
    register,
    handleSubmit,
    reset,
    setValue,
    setError,
    clearErrors,
    validate,
    validateField,
  };
}

// Utility function for debouncing
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}