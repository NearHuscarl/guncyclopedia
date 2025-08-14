type TShootStyleItemProps = {
  value?: string;
};

export function UppercasedItem({ value = "None" }: TShootStyleItemProps) {
  return <div className="uppercase">{value}</div>;
}
