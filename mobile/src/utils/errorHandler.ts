import axios from 'axios';

import type { ApiErrorResponse, ValidationErrorItem } from '../types/api';

export interface MappedApiError {
  message: string;
  statusCode?: number;
  fieldErrors: Record<string, string>;
}

const STATUS_MESSAGES: Record<number, string> = {
  400: 'There is a problem with the submitted information. Please review the fields.',
  401: 'Your session has expired. Please sign in again.',
  403: 'You do not have permission to perform this action.',
  404: 'The requested record could not be found.',
  409: 'This action conflicts with the current state. The data may already be up to date.',
};

const FIELD_ALIASES: Record<string, string> = {
  password: 'Password',
  email: 'Email',
  full_name: 'Full name',
  current_password: 'Current password',
  new_password: 'New password',
  confirm_password: 'Confirm password',
  confirm_new_password: 'Confirm new password',
  user_id: 'User ID',
  member_role: 'Membership role',
};

const extractFieldErrors = (errors?: ValidationErrorItem[]) => {
  return (errors || []).reduce<Record<string, string>>((acc, item) => {
    if (item.field) {
      acc[item.field] = item.message;
    }

    return acc;
  }, {});
};

const normalizeValidationMessage = (errors?: ValidationErrorItem[]) => {
  if (!errors?.length) {
    return undefined;
  }

  return errors
    .map((item) => `${FIELD_ALIASES[item.field] || item.field}: ${item.message}`)
    .join('\n');
};

export const handleApiError = (
  error: unknown,
  fallbackMessage = 'Something went wrong. Please try again.'
): MappedApiError => {
  if (axios.isAxiosError<ApiErrorResponse>(error)) {
    const statusCode = error.response?.status;
    const payload = error.response?.data;
    const fieldErrors = extractFieldErrors(payload?.errors);
    const validationMessage = normalizeValidationMessage(payload?.errors);

    return {
      statusCode,
      fieldErrors,
      message:
        validationMessage ||
        payload?.message ||
        (statusCode ? STATUS_MESSAGES[statusCode] : undefined) ||
        error.message ||
        fallbackMessage,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message || fallbackMessage,
      fieldErrors: {},
    };
  }

  return {
    message: fallbackMessage,
    fieldErrors: {},
  };
};

export const mapApiError = handleApiError;
