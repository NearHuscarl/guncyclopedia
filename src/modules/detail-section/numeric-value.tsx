import clsx from "clsx";
import { memo, type PropsWithChildren } from "react";

function NumericValueImpl(props: PropsWithChildren<{ className?: string }>) {
  return <span className={clsx(`text-xl font-mono font-normal`, props.className)}>{props.children}</span>;
}

export const NumericValue = memo(NumericValueImpl);
