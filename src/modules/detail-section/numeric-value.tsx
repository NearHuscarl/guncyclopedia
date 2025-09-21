import { memo } from "react";
import clsx from "clsx";

function NumericValueImpl(props: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>) {
  return <span {...props} className={clsx(`text-base font-code font-normal`, props.className)} />;
}

export const NumericValue = memo(NumericValueImpl);
