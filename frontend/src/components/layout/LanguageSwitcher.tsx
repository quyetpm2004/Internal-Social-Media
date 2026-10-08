import { useId } from "react";
import { Check, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "vi", Flag: VietnamFlag },
  { code: "en", Flag: UkFlag },
] as const;

function VietnamFlag({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 30 20" className={className} aria-hidden>
      <rect width="30" height="20" fill="#DA251D" />
      <polygon
        fill="#FFCD00"
        points="15,3.6 16.7,8.8 22.2,8.8 17.8,12 19.4,17.2 15,14 10.6,17.2 12.2,12 7.8,8.8 13.3,8.8"
      />
    </svg>
  );
}

function UkFlag({ className }: { className?: string }) {
  const rawId = useId().replace(/:/g, "");
  const clipId = `${rawId}-clip`;
  const saltireId = `${rawId}-saltire`;

  return (
    <svg viewBox="0 0 60 30" className={className} aria-hidden>
      <defs>
        <clipPath id={clipId}>
          <path d="M0 0v30h60V0z" />
        </clipPath>
        <clipPath id={saltireId}>
          <path d="M30 15h30v15zv15H0zH0V0zV0h30z" />
        </clipPath>
      </defs>
      <g clipPath={`url(#${clipId})`}>
        <path d="M0 0v30h60V0z" fill="#012169" />
        <path d="M0 0l60 30m0-30L0 30" stroke="#fff" strokeWidth="6" />
        <path
          d="M0 0l60 30m0-30L0 30"
          stroke="#C8102E"
          strokeWidth="4"
          clipPath={`url(#${saltireId})`}
        />
        <path d="M30 0v30M0 15h60" stroke="#fff" strokeWidth="10" />
        <path d="M30 0v30M0 15h60" stroke="#C8102E" strokeWidth="6" />
      </g>
    </svg>
  );
}

export default function LanguageSwitcher() {
  const { t, i18n } = useTranslation();
  const currentLanguage = i18n.language.startsWith("en") ? "en" : "vi";
  const CurrentFlag =
    languages.find((language) => language.code === currentLanguage)?.Flag ??
    VietnamFlag;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("nav.languageToggle")}
          className="flex items-center gap-1.5 rounded-full px-2 py-2 outline-none hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <CurrentFlag className="h-5 w-7 overflow-hidden rounded-sm ring-1 ring-slate-200" />
          <ChevronDown className="size-4 text-slate-500" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-44">
        {languages.map(({ code, Flag }) => (
          <DropdownMenuItem
            key={code}
            onSelect={() => i18n.changeLanguage(code)}
          >
            <Flag className="h-4 w-6 overflow-hidden rounded-sm ring-1 ring-slate-200" />
            <span className="flex-1">{t(`languageName.${code}`)}</span>
            {currentLanguage === code && <Check className="size-4" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
