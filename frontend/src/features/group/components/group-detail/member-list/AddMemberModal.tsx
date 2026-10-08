import { useState, type FormEvent } from "react";
import { useTranslation } from "react-i18next";
import Modal from "@/components/shared/Modal";
import Field from "@/components/shared/Field";
import Input from "@/components/shared/Input";

type AddMemberModalProps = {
  open: boolean;
  loading?: boolean;
  onClose: () => void;
  onSubmit: (email: string) => void;
};

const FORM_ID = "add-group-member";

export const AddMemberModal = ({
  open,
  loading = false,
  onClose,
  onSubmit,
}: AddMemberModalProps) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");

  const handleClose = () => {
    setEmail("");
    onClose();
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;
    onSubmit(trimmed);
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={t("pages.groups.addMember")}
      containerClassName="z-60"
      formId={FORM_ID}
      confirmText={loading ? t("pages.chat.adding") : t("pages.groups.addMember")}
      loading={loading}
      confirmDisabled={!email.trim()}
    >
      <form id={FORM_ID} onSubmit={handleSubmit}>
        <Field label={t("pages.groups.memberEmail")} required>
          <Input
            type="email"
            placeholder="name@company.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>
      </form>
    </Modal>
  );
};
