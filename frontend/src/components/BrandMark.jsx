const BrandMark = ({ className = "h-9 w-9" }) => (
  <img
    src="/veloop-mark.svg"
    alt=""
    aria-hidden="true"
    className={`shrink-0 rounded-xl bg-neutral-950 object-cover ${className}`}
  />
);

export default BrandMark;