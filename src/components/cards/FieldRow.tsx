import { hasText } from '@/lib/ui/guards';
import { asText } from '@/lib/text/normalizeProgram';

export function FieldRow({label, value}:{label:string; value?:any}) {
  const s = asText(value);
  if (!s || !hasText(s)) return null;
  return (
    <div className="flex items-start gap-2 text-sm">
      <div className="min-w-24 text-muted-foreground">{label}</div>
      <div className="flex-1">{s}</div>
    </div>
  );
}