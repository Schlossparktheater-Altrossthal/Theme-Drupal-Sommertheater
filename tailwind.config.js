/** @type {import('tailwindcss').Config} */
export default {

  safelist: [
    // grid-cols-* (all default Tailwind values)
    ...[
      'none',1,2,3,4,5,6,7,78,9,10,11,12].flatMap(val => [
        `grid-cols-${val}`,
        `sm:grid-cols-${val}`,
        `md:grid-cols-${val}`,
        `lg:grid-cols-${val}`,
        `xl:grid-cols-${val}`,
        `2xl:grid-cols-${val}`,
      ]),
    // gap-*, gap-x-*, gap-y-* (all default Tailwind values)
    ...[
      '0','px','0.5','1','1.5','2','2.5','3','3.5','4','5','6','7','8','9','10','11','12','14','16','20','24','28','32','36','40','44','48','52','56','60','64','72','80','96'
    ].flatMap(val => [
      `gap-${val}`,
      `gap-x-${val}`,
      `gap-y-${val}`,
      `sm:gap-${val}`,
      `sm:gap-x-${val}`,
      `sm:gap-y-${val}`,
      `md:gap-${val}`,
      `md:gap-x-${val}`,
      `md:gap-y-${val}`,
      `lg:gap-${val}`,
      `lg:gap-x-${val}`,
      `lg:gap-y-${val}`,
      `xl:gap-${val}`,
      `xl:gap-x-${val}`,
      `xl:gap-y-${val}`,
      `2xl:gap-${val}`,
      `2xl:gap-x-${val}`,
      `2xl:gap-y-${val}`,
    ]),
    // add any other classes you want to force to keep here
   'mx-auto',"grid", "grid-flow-col", "auto-cols-[248px]", "sm:auto-cols-[272px]", "overflow-x-auto", "snap-x", "snap-mandatory", "gap-4", "px-4", "lg:grid-cols-3", "lg:auto-cols-auto", "lg:overflow-x-visible", "lg:snap-none", "snap-start", "bg-gray-200", "p-6", "rounded",
   'lg:container','ms-5','me-5','ps-6', 'md:ps-8', 'grid-cols-[272px_248px_272px]',
  ],
}