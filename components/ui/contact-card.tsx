import type React from "react"
import { cn } from "@/lib/utils"
import { type LucideIcon, PlusIcon } from "lucide-react"
import DotPattern from "@/components/ui/dot-pattern"

type ContactInfoProps = React.ComponentProps<"div"> & {
  icon: LucideIcon
  label: string
  value: string
}

type ContactCardProps = React.ComponentProps<"div"> & {
  title?: string
  description?: string
  contactInfo?: ContactInfoProps[]
  formSectionClassName?: string
}

export function ContactCard({
  title = "Contact With Us",
  description = "If you have any questions regarding our Services or need help, please fill out the form here. We do our best to respond within 1 business day.",
  contactInfo,
  className,
  formSectionClassName,
  children,
  ...props
}: ContactCardProps) {
  return (
    <div
      className={cn(
        "relative grid h-full w-full border-2 border-white/10 bg-white/5 backdrop-blur-sm shadow-lg grid-cols-1 lg:grid-cols-12 rounded-lg",
        className,
      )}
      {...props}
    >
      <DotPattern width={5} height={5} />
      <PlusIcon className="absolute -top-3 -left-3 h-6 w-6 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_60%)]" />
      <PlusIcon className="absolute -top-3 -right-3 h-6 w-6 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_60%)]" />
      <PlusIcon className="absolute -bottom-3 -left-3 h-6 w-6 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_60%)]" />
      <PlusIcon className="absolute -right-3 -bottom-3 h-6 w-6 text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_60%)]" />
      <div className="flex flex-col justify-center lg:col-span-5">
        <div className="relative h-full space-y-4 px-4 py-8 md:p-8">
          <h1 className="text-xl font-bold sm:text-2xl md:text-4xl lg:text-5xl text-white [text-shadow:_0_4px_20px_rgb(0_0_0_/_60%)] font-open-sans-custom">
            {title}
          </h1>
          <p className="max-w-xl text-xs leading-5 sm:text-sm md:text-base lg:text-lg text-gray-300 [text-shadow:_0_2px_10px_rgb(0_0_0_/_50%)] font-open-sans-custom">
            {description}
          </p>
          <div className="grid gap-4 md:grid md:grid-cols-2 lg:grid-cols-3">
            {contactInfo?.map((info, index) => (
              <ContactInfo key={index} {...info} />
            ))}
          </div>
        </div>
      </div>
      <div
        className={cn(
          "flex h-full w-full items-center border-t border-white/10 bg-white/10 p-5 sm:p-8 lg:col-span-7 lg:border-t-0 lg:border-l",
          formSectionClassName,
        )}
      >
        {children}
      </div>
    </div>
  )
}

function ContactInfo({ icon: Icon, label, value, className, ...props }: ContactInfoProps) {
  return (
    <div className={cn("flex items-center gap-3 py-3", className)} {...props}>
      <div className="rounded-lg bg-white/10 p-3">
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div>
        <p className="font-medium text-white [text-shadow:_0_2px_8px_rgb(0_0_0_/_40%)] font-open-sans-custom">
          {label}
        </p>
        <p className="text-xs text-gray-300 [text-shadow:_0_2px_6px_rgb(0_0_0_/_40%)] font-open-sans-custom">{value}</p>
      </div>
    </div>
  )
}
