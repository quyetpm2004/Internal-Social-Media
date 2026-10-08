import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/shared/Table";

export type ColumnDef<T> = {
  key: string;
  label: string;
  render?: (item: T) => ReactNode;
};

type SimpleRecordSectionProps<T extends { id: number }> = {
  title: string;
  records: T[];
  columns: ColumnDef<T>[];
  isDraft: boolean;
  emptyMessage?: string;
  addForm?: ReactNode;
  onDelete?: (id: number) => void;
  onEdit?: (item: T) => void;
};

export default function SimpleRecordSection<T extends { id: number }>({
  title,
  records,
  columns,
  isDraft,
  emptyMessage,
  addForm,
  onDelete,
  onEdit,
}: SimpleRecordSectionProps<T>) {
  const { t } = useTranslation();
  const showActions = isDraft && (onDelete || onEdit);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 mb-4">
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      {isDraft && addForm && (
        <div className="mb-4 rounded-lg border border-gray-100 bg-gray-50 p-3">
          {addForm}
        </div>
      )}
      {records.length === 0 ? (
        <p className="text-sm text-gray-500">
          {emptyMessage ?? t("pages.admin.projectTemplateNoRecords")}
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {columns.map((col) => (
                <TableHead key={col.key}>{col.label}</TableHead>
              ))}
              {showActions && (
                <TableHead className="text-right">{t("common.actions")}</TableHead>
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {records.map((record) => (
              <TableRow key={record.id}>
                {columns.map((col) => (
                  <TableCell key={col.key}>
                    {col.render
                      ? col.render(record)
                      : String(
                          (record as Record<string, unknown>)[col.key] ?? "",
                        )}
                  </TableCell>
                ))}
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {onEdit && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onEdit(record)}
                        >
                          {t("pages.admin.projectTemplateEdit")}
                        </Button>
                      )}
                      {onDelete && (
                        <Button
                          size="sm"
                          variant="locked"
                          onClick={() => onDelete(record.id)}
                        >
                          {t("common.delete")}
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
