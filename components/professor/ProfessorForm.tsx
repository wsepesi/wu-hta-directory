'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ErrorMessage } from '@/components/ui/ErrorMessage';
import { apiClient } from '@/lib/api-client';
import type { CreateProfessorInput, Professor } from '@/lib/types';

interface ProfessorFormProps {
  professor?: Professor;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function ProfessorForm({ professor, onSuccess, onCancel }: ProfessorFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<CreateProfessorInput>({
    firstName: professor?.firstName || '',
    lastName: professor?.lastName || '',
    email: professor?.email || '',
  });
  
  const [validationErrors, setValidationErrors] = useState<Partial<CreateProfessorInput>>({});

  const validateForm = (): boolean => {
    const errors: Partial<CreateProfessorInput> = {};
    
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    }
    
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Invalid email format';
    } else if (!formData.email.endsWith('@wustl.edu')) {
      errors.email = 'Email must be a @wustl.edu address';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const url = professor ? `/professors/${professor.id}` : '/professors';
      const method = professor ? 'PUT' : 'POST';
      
      const response = await apiClient[method.toLowerCase() as 'put' | 'post']<Professor>(url, {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim().toLowerCase(),
      });

      if (response.error) {
        setError(response.error);
      } else {
        if (onSuccess) {
          onSuccess();
        } else {
          router.push('/professors');
          router.refresh();
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save professor');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear validation error when user types
    if (validationErrors[name as keyof CreateProfessorInput]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && <ErrorMessage message={error} />}
      
      <div>
        <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
          First Name
        </label>
        <Input
          type="text"
          name="firstName"
          id="firstName"
          value={formData.firstName}
          onChange={handleChange}
          placeholder="John"
          disabled={loading}
          error={validationErrors.firstName}
        />
        {validationErrors.firstName && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.firstName}</p>
        )}
      </div>

      <div>
        <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
          Last Name
        </label>
        <Input
          type="text"
          name="lastName"
          id="lastName"
          value={formData.lastName}
          onChange={handleChange}
          placeholder="Doe"
          disabled={loading}
          error={validationErrors.lastName}
        />
        {validationErrors.lastName && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.lastName}</p>
        )}
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
          Email
        </label>
        <Input
          type="email"
          name="email"
          id="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="professor@wustl.edu"
          disabled={loading || !!professor} // Don't allow email changes for existing professors
          error={validationErrors.email}
        />
        {validationErrors.email && (
          <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
        )}
        {professor && (
          <p className="mt-1 text-xs text-gray-500">Email cannot be changed for existing professors</p>
        )}
      </div>

      <div className="flex justify-end space-x-3">
        {onCancel && (
          <Button
            type="button"
            variant="secondary"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </Button>
        )}
        <Button type="submit" disabled={loading}>
          {loading ? 'Saving...' : professor ? 'Update Professor' : 'Add Professor'}
        </Button>
      </div>
    </form>
  );
}