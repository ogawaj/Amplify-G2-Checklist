/**
 * アイコンだけのボタン（44px四方）
 * @param props - プロパティ
 * @returns ボタン
 */
export function IconButton(props: {
  /** 読み上げ用の名前 */
  label: string;
  /** 押せない状態か */
  isDisabled?: boolean;
  /** 押したとき */
  onClick: () => void;
  /** アイコン */
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      disabled={props.isDisabled}
      className="grid size-11 shrink-0 place-items-center rounded-full text-icon transition active:opacity-50 disabled:opacity-30 [&_svg]:size-[22px]"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
