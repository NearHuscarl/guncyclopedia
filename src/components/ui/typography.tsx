import type { PropsWithChildren } from "react";

type TTypographyProps = PropsWithChildren<{
  className?: string;
}>;

export function H1(props: TTypographyProps) {
  return (
    <h1 className={`scroll-m-20 text-3xl font-bold tracking-tight text-balance ${props.className}`}>
      {props.children}
    </h1>
  );
}

export function H2(props: TTypographyProps) {
  return (
    <h2
      className={`scroll-m-20 border-b pb-2 leading-none text-2xl font-semibold tracking-tight first:mt-0 ${props.className}`}
    >
      {props.children}
    </h2>
  );
}

export function H3(props: TTypographyProps) {
  return <h3 className={`scroll-m-20 text-xl font-semibold tracking-tight ${props.className}`}>{props.children}</h3>;
}

export function Large(props: TTypographyProps) {
  return <span className={`text-xl font-semibold ${props.className}`}>{props.children}</span>;
}

export function Muted(props: TTypographyProps) {
  return (
    <p {...props} className={`text-muted-foreground text-sm ${props.className}`}>
      {props.children}
    </p>
  );
}
