/**
 * シートのメニュー行（灰色のまとまりとして並べる）
 * @param props - プロパティ
 * @returns メニュー行
 */
export function MenuRow(props: {
  /** 押したとき */
  onClick: () => void;
  /** 表示 */
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      className="flex min-h-12 w-full items-center bg-fill px-4 py-2 text-left text-[17px] first:rounded-t-xl last:rounded-b-xl active:bg-fill-strong"
      onClick={props.onClick}
    >
      {props.children}
    </button>
  );
}
