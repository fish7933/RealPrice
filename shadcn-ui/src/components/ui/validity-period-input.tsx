import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Calendar, AlertCircle } from 'lucide-react';
import { getValidityStatus, formatValidityDate } from '@/utils/validityHelper';

interface ValidityPeriodInputProps {
  validFrom: string;
  validTo: string;
  onChange: (validFrom: string, validTo: string) => void;
  showStatus?: boolean;
  disabled?: boolean;
}

export function ValidityPeriodInput({
  validFrom,
  validTo,
  onChange,
  showStatus = true,
  disabled = false,
}: ValidityPeriodInputProps) {
  const status = showStatus ? getValidityStatus(validFrom, validTo) : null;

  const handleValidFromChange = (newValidFrom: string) => {
    onChange(newValidFrom, validTo);
  };

  const handleValidToChange = (newValidTo: string) => {
    onChange(validFrom, newValidTo);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Calendar className="h-4 w-4 text-gray-600" />
        <Label className="font-semibold">유효기간</Label>
        {status && (
          <Badge variant={status.variant}>
            {status.label}
          </Badge>
        )}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="validFrom">시작일</Label>
          <Input
            id="validFrom"
            type="date"
            value={validFrom}
            onChange={(e) => handleValidFromChange(e.target.value)}
            disabled={disabled}
            className="w-full"
          />
          {validFrom && (
            <p className="text-xs text-gray-500">
              {formatValidityDate(validFrom)}
            </p>
          )}
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="validTo">종료일</Label>
          <Input
            id="validTo"
            type="date"
            value={validTo}
            onChange={(e) => handleValidToChange(e.target.value)}
            disabled={disabled}
            min={validFrom}
            className="w-full"
          />
          {validTo && (
            <p className="text-xs text-gray-500">
              {formatValidityDate(validTo)}
            </p>
          )}
        </div>
      </div>
      
      {validFrom && validTo && validFrom > validTo && (
        <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          <AlertCircle className="h-4 w-4" />
          <span>종료일은 시작일보다 늦어야 합니다</span>
        </div>
      )}
    </div>
  );
}