/** @type {import('tailwindcss').Config} */
export default {

  safelist: [
    // grid-cols-* (all default Tailwind values)
    ...[
      'none',1,2,3,4,5,6,7,78,9,10,11,12].flatMap(val => [
        `hg:grid-cols-${val}`,
        `hg:sm:grid-cols-${val}`,
        `hg:md:grid-cols-${val}`,
        `hg:lg:grid-cols-${val}`,
        `hg:xl:grid-cols-${val}`,
        `hg:2xl:grid-cols-${val}`,
      ]),
    // gap-*, gap-x-*, gap-y-* (all default Tailwind values)
    ...[
      '0','px','0.5','1','1.5','2','2.5','3','3.5','4','5','6','7','8','9','10','11','12','14','16','20','24','28','32','36','40','44','48','52','56','60','64','72','80','96'
    ].flatMap(val => [
      `hg:gap-${val}`,
      `hg:gap-x-${val}`,
      `hg:gap-y-${val}`,
      `hg:sm:gap-${val}`,
      `hg:sm:gap-x-${val}`,
      `hg:sm:gap-y-${val}`,
      `hg:md:gap-${val}`,
      `hg:md:gap-x-${val}`,
      `hg:md:gap-y-${val}`,
      `hg:lg:gap-${val}`,
      `hg:lg:gap-x-${val}`,
      `hg:lg:gap-y-${val}`,
      `hg:xl:gap-${val}`,
      `hg:xl:gap-x-${val}`,
      `hg:xl:gap-y-${val}`,
      `hg:2xl:gap-${val}`,
      `hg:2xl:gap-x-${val}`,
      `hg:2xl:gap-y-${val}`,
    ]),
    // add any other classes you want to force to keep here
  'hg:lg:max-w-3/4', 'hg:mx-auto',"hg:grid", "hg:grid-flow-col", "hg:auto-cols-[248px]", "hg:sm:auto-cols-[272px]", "hg:overflow-x-auto", "hg:snap-x", "hg:snap-mandatory", "hg:gap-4", "hg:px-4", "hg:lg:grid-cols-3", "hg:lg:auto-cols-auto", "hg:lg:overflow-x-visible", "hg:hg:lg:snap-none", "hg:snap-start", "hg:bg-gray-200", "hg:p-6", "hg:rounded", 'hg:lg:container','hg:ms-5','hg:me-5','hg:ps-6', 'hg:md:ps-8', 'hg:grid-cols-[272px_248px_272px]', 'hg:aspect-4/3', 'hg:aspect-16/9', 'hg:aspect-3/2', 'hg:aspect-2/1', 'hg:aspect-1/1', 'hg:aspect-16/9',
  ],
}