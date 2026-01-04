import { cn } from "@/lib/utils";

const BentoCard = ({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) => (
  <div
    className={cn(
      "relative overflow-hidden rounded-xl border border-border/50 p-6 shadow-sm transition-all hover:shadow-md",
      className
    )}
  >
    {children}
  </div>
);

export default BentoCard;
