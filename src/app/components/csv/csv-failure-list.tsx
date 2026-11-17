import type { CsvParseFailure } from "@/src/app/models/csv";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/lib/shadcn/ui/table";

/**
 * 取り込めなかった行の一覧（行番号と理由）。0件のときは何も描画しない
 * @param props - プロパティ
 * @returns 一覧
 */
export function CsvFailureList(props: {
  /** 取り込めなかった行 */
  failures: CsvParseFailure[];
}) {
  if (props.failures.length === 0) return null;
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold">
        取り込めない行（除外されます）
      </h3>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>行</TableHead>
            <TableHead>識別子</TableHead>
            <TableHead>理由</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {props.failures.map((failure) => (
            <TableRow key={failure.rowNumber}>
              <TableCell>{failure.rowNumber}</TableCell>
              <TableCell>{failure.itemId ?? "—"}</TableCell>
              <TableCell>{failure.reason}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
