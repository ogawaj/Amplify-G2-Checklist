import { Input } from "@/src/lib/shadcn/ui/input";
import { Label } from "@/src/lib/shadcn/ui/label";

/**
 * ラベル付きの入力欄
 * @param props - プロパティ
 * @returns ラベルと入力欄
 */
export function AuthField(props: {
  /** 入力欄のid */
  id: string;
  /** ラベル */
  label: string;
  /** 入力種別 */
  type: "email" | "password" | "text";
  /** 入力値 */
  value: string;
  /** autocomplete 属性 */
  autoComplete: string;
  /** 値の変更通知 */
  onChange: (value: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={props.id}>{props.label}</Label>
      <Input
        id={props.id}
        type={props.type}
        value={props.value}
        autoComplete={props.autoComplete}
        required
        className="h-11 md:h-9"
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}
