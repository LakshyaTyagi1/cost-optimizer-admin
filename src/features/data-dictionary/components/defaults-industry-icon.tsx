import { Building2 } from "lucide-react";

type DefaultsIndustryIconProps = {
  industryKey: string;
};

const iconClassName = "size-4 flex-none fill-none stroke-current";

export function DefaultsIndustryIcon({ industryKey }: DefaultsIndustryIconProps) {
  const normalizedKey = industryKey.trim().toLowerCase();

  if (normalizedKey === "bank" || normalizedKey === "banking") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 13 13"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M1.63 11.92h9.75" strokeWidth="0.95" />
        <path d="M3.25 9.75V5.96" strokeWidth="0.95" />
        <path d="M5.42 9.75V5.96" strokeWidth="0.95" />
        <path d="M7.58 9.75V5.96" strokeWidth="0.95" />
        <path d="M9.75 9.75V5.96" strokeWidth="0.95" />
        <path d="M6.5 1.08l4.33 2.71H2.17L6.5 1.08Z" strokeWidth="0.95" />
      </svg>
    );
  }

  if (normalizedKey === "healthcare") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 13 13"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M7.1 1.08v1.08" strokeWidth="0.95" />
        <path d="M3.85 1.08v1.08" strokeWidth="0.95" />
        <path
          d="M3.85 1.63h-.54c-.29 0-.56.11-.77.32-.2.2-.32.48-.32.77v2.17a3.25 3.25 0 0 0 6.5 0V2.71c0-.29-.11-.56-.32-.77-.2-.2-.48-.32-.77-.32H7.1"
          strokeWidth="0.95"
        />
        <path d="M5.47 8.13a3.25 3.25 0 0 0 6.5 0V6.5" strokeWidth="0.95" />
        <path d="M11.97 6.5a1.08 1.08 0 1 0 0-2.17 1.08 1.08 0 0 0 0 2.17Z" strokeWidth="0.95" />
      </svg>
    );
  }

  if (normalizedKey === "insurance") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 13 13"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M10.83 7.04c0 2.71-1.9 4.06-4.15 4.85-.12.04-.25.04-.36 0-2.26-.78-4.15-2.14-4.15-4.85V3.25c0-.14.06-.28.16-.38.1-.1.24-.16.38-.16 1.08 0 2.44-.65 3.38-1.47.11-.1.26-.15.41-.15.15 0 .3.05.41.15.95.83 2.3 1.47 3.38 1.47.14 0 .28.06.38.16.1.1.16.24.16.38v3.79Z"
          strokeWidth="0.95"
        />
      </svg>
    );
  }

  if (normalizedKey === "retail") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 13 13"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M3.25 1.08 1.63 3.25v7.58c0 .29.11.56.32.77.2.2.48.32.77.32h7.58c.29 0 .56-.11.77-.32.2-.2.32-.48.32-.77V3.25L9.75 1.08h-6.5Z"
          strokeWidth="0.95"
        />
        <path d="M1.63 3.25h9.75" strokeWidth="0.95" />
        <path d="M8.67 5.42a2.17 2.17 0 0 1-4.33 0" strokeWidth="0.95" />
      </svg>
    );
  }

  if (normalizedKey === "public-sector") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 13 13"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M2.17 11.92V2.17c0-.29.11-.56.32-.77.2-.2.48-.32.77-.32h4.33c.29 0 .56.11.77.32.2.2.32.48.32.77v9.75H2.17Z"
          strokeWidth="0.95"
        />
        <path
          d="M2.17 6.5H1.08c-.29 0-.56.11-.77.32-.2.2-.32.48-.32.77v3.25c0 .29.11.56.32.77.2.2.48.32.77.32h1.08"
          strokeWidth="0.95"
          transform="translate(0.5)"
        />
        <path
          d="M8.67 4.88h1.08c.29 0 .56.11.77.32.2.2.32.48.32.77v4.88c0 .29-.11.56-.32.77-.2.2-.48.32-.77.32H8.67"
          strokeWidth="0.95"
        />
        <path d="M4.33 3.25H6.5" strokeWidth="0.95" />
        <path d="M4.33 5.42H6.5" strokeWidth="0.95" />
        <path d="M4.33 7.58H6.5" strokeWidth="0.95" />
        <path d="M4.33 9.75H6.5" strokeWidth="0.95" />
      </svg>
    );
  }

  if (normalizedKey === "real-estate") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 13 13"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M8.13 11.38V7.04c0-.14-.06-.28-.16-.38-.1-.1-.24-.16-.38-.16H5.42c-.14 0-.28.06-.38.16-.1.1-.16.24-.16.38v4.33"
          strokeWidth="0.95"
        />
        <path
          d="M1.63 5.42c0-.16.03-.31.1-.46.07-.14.16-.27.28-.37l3.79-3.25c.2-.17.44-.26.7-.26.26 0 .5.09.7.26L11 4.59c.12.1.21.23.28.37.07.14.1.3.1.46v4.88c0 .29-.11.56-.32.77-.2.2-.48.32-.77.32H2.71c-.29 0-.56-.11-.77-.32-.2-.2-.32-.48-.32-.77V5.42Z"
          strokeWidth="0.95"
        />
      </svg>
    );
  }

  if (normalizedKey === "automotive") {
    return (
      <svg
        className={iconClassName}
        viewBox="0 0 13 13"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path
          d="M10.83 8.13h1.08c.33 0 .54-.22.54-.54V5.96c0-.49-.38-.92-.81-1.03-.98-.27-2.44-.6-2.44-.6s-.7-.76-1.19-1.25c-.27-.22-.6-.38-.98-.38H3.25c-.33 0-.6.22-.76.49l-.76 1.57c-.07.21-.11.43-.11.65v2.17c0 .33.22.54.54.54h1.08"
          strokeWidth="0.95"
        />
        <path d="M4.33 9.21a1.08 1.08 0 1 0 0-2.17 1.08 1.08 0 0 0 0 2.17Z" strokeWidth="0.95" />
        <path d="M5.42 8.13h3.25" strokeWidth="0.95" />
        <path d="M9.75 9.21a1.08 1.08 0 1 0 0-2.17 1.08 1.08 0 0 0 0 2.17Z" strokeWidth="0.95" />
      </svg>
    );
  }

  return <Building2 size={16} strokeWidth={1.6} aria-hidden="true" />;
}
