import clsx from "clsx";

type TCircleProps = {
  isSelected?: boolean;
} & React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;

export function Circle({ isSelected, ...props }: TCircleProps) {
  return (
    <div
      className={clsx({
        "w-5 h-5 bg-stone-800 rounded-full cursor-pointer": true,
        "bg-primary! focus:bg-primary": isSelected,
      })}
      {...props}
    />
  );
}
