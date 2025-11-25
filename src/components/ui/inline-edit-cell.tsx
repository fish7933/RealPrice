import { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input';

interface InlineEditCellProps {
  value: string | number;
  onSave: (value: string | number) => void;
  type?: 'text' | 'number';
  prefix?: string;
  isAdmin?: boolean;
}

export function InlineEditCell({ value, onSave, type = 'text', prefix = '', isAdmin = true }: InlineEditCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value.toString());
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    const newValue = type === 'number' ? Number(editValue) : editValue;
    if (newValue !== value && editValue.trim() !== '') {
      onSave(newValue);
    } else {
      setEditValue(value.toString());
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleBlur();
    } else if (e.key === 'Escape') {
      setEditValue(value.toString());
      setIsEditing(false);
    }
  };

  if (!isAdmin) {
    return <span>{prefix}{value}</span>;
  }

  if (isEditing) {
    return (
      <Input
        ref={inputRef}
        type={type}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        className="h-8 w-full"
      />
    );
  }

  return (
    <span
      onClick={() => setIsEditing(true)}
      className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded inline-block min-w-[60px]"
      title="클릭하여 수정"
    >
      {prefix}{value}
    </span>
  );
}