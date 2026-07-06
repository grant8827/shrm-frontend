// Form validation utilities
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/[\s\-()]/g, ''));
};

export const validateRequired = (value: string): boolean => {
  return value.trim().length > 0;
};

export const validateDate = (date: string): boolean => {
  const selectedDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return selectedDate >= today;
};

export const validateTime = (time: string): boolean => {
  const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
};

// Form field validation
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export const validateField = (
  fieldName: string,
  value: string,
  rules: string[]
): ValidationResult => {
  for (const rule of rules) {
    switch (rule) {
      case 'required':
        if (!validateRequired(value)) {
          return { isValid: false, error: `${fieldName} is required` };
        }
        break;
      case 'email':
        if (!validateEmail(value)) {
          return { isValid: false, error: 'Please enter a valid email address' };
        }
        break;
      case 'phone':
        if (!validatePhone(value)) {
          return { isValid: false, error: 'Please enter a valid phone number' };
        }
        break;
      case 'date':
        if (!validateDate(value)) {
          return { isValid: false, error: 'Please select a future date' };
        }
        break;
      case 'time':
        if (!validateTime(value)) {
          return { isValid: false, error: 'Please enter a valid time (HH:MM)' };
        }
        break;
    }
  }
  return { isValid: true };
};

// Error handling utilities
export const handleApiError = (error: any): string => {
  if (error.response?.data?.message) {
    return error.response.data.message;
  }
  if (error.response?.data?.error) {
    return error.response.data.error;
  }
  if (error.message) {
    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
};

export const showNotification = (
  message: string,
  type: 'success' | 'error' | 'warning' | 'info' = 'info'
) => {
  // For now, we'll use a simple alert. In a real app, you'd use a toast library
  const emoji = {
    success: '✅',
    error: '❌',
    warning: '⚠️',
    info: 'ℹ️'
  };
  
  console.log(`${emoji[type]} ${message}`);
  alert(`${emoji[type]} ${message}`);
};

// Loading state utilities
export const createLoadingState = () => {
  return {
    isLoading: false,
    error: null as string | null,
    success: false,
  };
};

export const setLoading = (state: any, isLoading: boolean) => {
  state.isLoading = isLoading;
  if (isLoading) {
    state.error = null;
    state.success = false;
  }
};

export const setError = (state: any, error: string) => {
  state.isLoading = false;
  state.error = error;
  state.success = false;
};

export const setSuccess = (state: any) => {
  state.isLoading = false;
  state.error = null;
  state.success = true;
};