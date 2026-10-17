import React, { useState } from 'react';
import { FormTemplate } from '../types';
import { AlertCircle, FileText } from 'lucide-react';

interface FormRendererProps {
  template: FormTemplate;
  onSubmit: (values: Record<string, any>) => Promise<void>;
  isSubmitting?: boolean;
}

export const FormRenderer: React.FC<FormRendererProps> = ({ 
  template, 
  onSubmit, 
  isSubmitting = false 
}) => {
  const [values, setValues] = useState<Record<string, any>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleFieldChange = (fieldId: string, val: any) => {
    setValues({ ...values, [fieldId]: val });
    // Clear error for this field
    if (errors[fieldId]) {
      const newErrors = { ...errors };
      delete newErrors[fieldId];
      setErrors(newErrors);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    template.fields.forEach(field => {
      const val = values[field.id];

      // Required check
      if (field.required && (val === undefined || val === null || val === '' || val === false)) {
        newErrors[field.id] = `Vui lòng điền trường này.`;
        return;
      }

      // Skip validation if empty and not required
      if (val === undefined || val === null || val === '') return;

      // Type-specific validations
      if (field.type === 'number') {
        const numVal = Number(val);
        if (isNaN(numVal)) {
          newErrors[field.id] = `Vui lòng nhập định dạng số.`;
        } else {
          if (field.validationMin !== undefined && numVal < field.validationMin) {
            newErrors[field.id] = `Giá trị tối thiểu là ${field.validationMin}.`;
          }
          if (field.validationMax !== undefined && numVal > field.validationMax) {
            newErrors[field.id] = `Giá trị tối đa là ${field.validationMax}.`;
          }
        }
      }

      if (field.type === 'text' || field.type === 'textarea') {
        const strVal = String(val);
        if (field.validationMin !== undefined && strVal.length < field.validationMin) {
          newErrors[field.id] = `Phải nhập ít nhất ${field.validationMin} ký tự (Hiện tại: ${strVal.length}).`;
        }
        if (field.validationMax !== undefined && strVal.length > field.validationMax) {
          newErrors[field.id] = `Không vượt quá ${field.validationMax} ký tự (Hiện tại: ${strVal.length}).`;
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(values);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="bg-slate-50 border border-slate-100 rounded-lg p-4 mb-4 flex items-start space-x-3">
        <FileText className="text-indigo-600 mt-0.5 shrink-0" size={18} />
        <div>
          <h3 className="text-xs font-bold text-slate-800">{template.title}</h3>
          <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">{template.description}</p>
        </div>
      </div>

      <div className="space-y-4">
        {template.fields.map((field) => {
          const hasError = !!errors[field.id];
          return (
            <div key={field.id} className="space-y-1">
              <label className="block text-xs font-semibold text-slate-700">
                {field.label}
                {field.required && <span className="text-rose-500 ml-0.5">*</span>}
              </label>

              {/* Text / Input Type */}
              {field.type === 'text' && (
                <input
                  type="text"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className={`w-full text-xs rounded border bg-white py-2 px-3 focus:ring-1 focus:outline-none transition-all ${
                    hasError 
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/10' 
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                />
              )}

              {/* Number Type */}
              {field.type === 'number' && (
                <input
                  type="number"
                  step="any"
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className={`w-full text-xs rounded border bg-white py-2 px-3 focus:ring-1 focus:outline-none transition-all ${
                    hasError 
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/10' 
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                />
              )}

              {/* Date Type */}
              {field.type === 'date' && (
                <input
                  type="date"
                  value={values[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className={`w-full text-xs rounded border bg-white py-2 px-3 focus:ring-1 focus:outline-none transition-all ${
                    hasError 
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/10' 
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                />
              )}

              {/* Select Type */}
              {field.type === 'select' && (
                <select
                  value={values[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className={`w-full text-xs rounded border bg-white py-2 px-3 focus:ring-1 focus:outline-none transition-all ${
                    hasError 
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/10' 
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                >
                  <option value="">{field.placeholder || 'Chọn tùy chọn...'}</option>
                  {field.options?.map((opt, i) => (
                    <option key={i} value={opt}>{opt}</option>
                  ))}
                </select>
              )}

              {/* Textarea Type */}
              {field.type === 'textarea' && (
                <textarea
                  rows={4}
                  placeholder={field.placeholder}
                  value={values[field.id] || ''}
                  onChange={(e) => handleFieldChange(field.id, e.target.value)}
                  className={`w-full text-xs rounded border bg-white py-2 px-3 focus:ring-1 focus:outline-none transition-all ${
                    hasError 
                      ? 'border-rose-400 focus:ring-rose-500 bg-rose-50/10' 
                      : 'border-slate-200 focus:ring-indigo-500'
                  }`}
                />
              )}

              {/* Checkbox Type */}
              {field.type === 'checkbox' && (
                <div className="flex items-start space-x-2.5 py-1">
                  <input
                    type="checkbox"
                    id={field.id}
                    checked={!!values[field.id]}
                    onChange={(e) => handleFieldChange(field.id, e.target.checked)}
                    className={`mt-0.5 w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 ${
                      hasError ? 'border-rose-400' : 'border-slate-300'
                    }`}
                  />
                  <label htmlFor={field.id} className="text-xs text-slate-600 font-medium select-none">
                    {field.placeholder || field.label}
                  </label>
                </div>
              )}

              {/* Error label */}
              {hasError && (
                <div className="flex items-center space-x-1 text-rose-500 text-[10px] font-semibold mt-1">
                  <AlertCircle size={12} />
                  <span>{errors[field.id]}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end pt-3 border-t border-slate-100">
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold shadow-sm shadow-indigo-600/10 disabled:opacity-50 transition-colors"
        >
          {isSubmitting ? 'Đang gửi yêu cầu...' : 'Nộp Đơn Lên Cấp Duyệt'}
        </button>
      </div>
    </form>
  );
};
