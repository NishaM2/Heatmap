import { Toaster as Sonner, type ToasterProps } from "sonner"
import { HugeiconsIcon } from "@hugeicons/react"
import { CheckmarkCircle02Icon, InformationCircleIcon, Alert02Icon, MultiplicationSignCircleIcon, Loading03Icon } from "@hugeicons/core-free-icons"

const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="light"
      className="toaster group"
      icons={{
        success: (
          <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="size-4" />
        ),
        info: (
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} className="size-4" />
        ),
        warning: (
          <HugeiconsIcon icon={Alert02Icon} strokeWidth={2} className="size-4" />
        ),
        error: (
          <HugeiconsIcon icon={MultiplicationSignCircleIcon} strokeWidth={2} className="size-4" />
        ),
        loading: (
          <HugeiconsIcon icon={Loading03Icon} strokeWidth={2} className="size-4 animate-spin" />
        ),
      }}
      style={
        {
          "--normal-bg": "#ffffff",
          "--normal-text": "#171717",
          "--normal-border": "#e5e5e5",
          "--success-bg": "#ffffff",
          "--success-text": "#171717",
          "--success-border": "#e5e5e5",
          "--error-bg": "#ffffff",
          "--error-text": "#171717",
          "--error-border": "#e5e5e5",
          "--border-radius": "0.5rem",
        } as React.CSSProperties
      }
      toastOptions={{
        classNames: {
          toast:
            "cn-toast !bg-white !text-neutral-900 !border-neutral-200 !shadow-sm !font-sans",
          title: "!text-sm !font-medium !text-neutral-900",
          description: "!text-xs !text-neutral-500",
          icon: "!text-neutral-900",
        },
      }}
      {...props}
    />
  )
}

export { Toaster }
