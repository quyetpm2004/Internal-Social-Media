import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";
import Modal from "@/components/shared/Modal";
import Select from "@/components/shared/Select";
import type {
  AddMemberPayload,
  DepartmentMemberItem,
  MemberPosition,
} from "@/features/department/types/department-member.type";

const FORM_ID = "department-member-form";
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type MemberFormModalProps = {
  open: boolean;
  member: DepartmentMemberItem | null;
  positions: MemberPosition[];
  onClose: () => void;
  onSubmit: (payload: AddMemberPayload) => Promise<void>;
};

type FieldErrors = Partial<Record<"email", string>>;

function MemberForm({
  member,
  positions,
  onClose,
  onSubmit,
}: Omit<MemberFormModalProps, "open">) {
  const { t } = useTranslation();
  const [email, setEmail] = useState(member?.email ?? "");
  const [positionId, setPositionId] = useState(
    member?.position ? String(member.position.id) : "",
  );
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!member && !EMAIL_PATTERN.test(trimmedEmail)) {
      setErrors({ email: t("department.memberForm.emailInvalid") });
      return;
    }
    setErrors({});
    await onSubmit({
      email: trimmedEmail,
      positionId: positionId ? Number(positionId) : null,
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      title={t(
        member
          ? "department.memberForm.editTitle"
          : "department.memberForm.addTitle",
      )}
      formId={FORM_ID}
      confirmText={t(member ? "common.save" : "department.members.add")}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <Field
          label={t("department.memberForm.email")}
          htmlFor="department-member-email"
          required
          error={errors.email}
        >
          <Input
            id="department-member-email"
            type="email"
            value={email}
            disabled={member !== null}
            aria-invalid={Boolean(errors.email)}
            onChange={(event) => setEmail(event.target.value)}
          />
        </Field>
        <Field
          label={t("department.memberForm.position")}
          htmlFor="department-member-position"
        >
          <Select
            id="department-member-position"
            value={positionId}
            onChange={(event) => setPositionId(event.target.value)}
          >
            <option value="">{t("department.memberForm.noPosition")}</option>
            {positions.map((position) => (
              <option key={position.id} value={position.id}>
                {position.name}
              </option>
            ))}
          </Select>
        </Field>
      </form>
    </Modal>
  );
}

export default function MemberFormModal({
  open,
  ...rest
}: MemberFormModalProps) {
  if (!open) return null;
  return <MemberForm {...rest} />;
}
