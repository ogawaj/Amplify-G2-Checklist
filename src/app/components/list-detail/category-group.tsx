/**
 * カテゴリのまとまり（見出しと、その配下の行の並び）
 * @param props - プロパティ
 * @returns まとまり
 */
export function CategoryGroup(props: {
  /** カテゴリ名 */
  name: string;
  /** 配下の行 */
  children: React.ReactNode;
}) {
  return (
    <section>
      <h2 className="pb-0.5 text-[20px] font-bold break-words">{props.name}</h2>
      <div>{props.children}</div>
    </section>
  );
}
