import { memo, type PropsWithChildren } from "react";

function NumericValueImpl(props: PropsWithChildren) {
  return <span className={`text-xl font-mono font-normal`}>{props.children}</span>;
}

export const NumericValue = memo(NumericValueImpl);
