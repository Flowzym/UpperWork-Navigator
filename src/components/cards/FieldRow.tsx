import { hasText } from '../../lib/ui/guards';

export function FieldRow({label, value}:{label:string; value?:string}) {
  if (!hasText(value)) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="min-w-24 text-gray-500">{label}</div>
      <div className="flex-1">{value}</div>
    </div>
  );
}